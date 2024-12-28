import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { YookassaService } from '../integration/yookassa/yookassa.service';
import { UserService } from '../modules/user/user.service';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

interface WebhookData {
    userId: string;
    amount: string;
    paymentId: string;
}

const shopId = process.env.YOOKASSA_SHOP_ID;
const secretKey = process.env.YOOKASSA_SECRET_KEY;

const authHeader = `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`;

export function startWebhookServer(userService: UserService) {
    const server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Обработка preflight запросов
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Принимаем только POST-запросы
        if (req.method === 'POST') {
            let body = '';

            req.on('data', chunk => {
                body += chunk.toString();
                console.log('Receiving chunk:', chunk.toString());
            });

            req.on('end', () => {
                console.log('FULL REQUEST BODY:', body);

                try {
                    // Попробуем распарсить разными способами
                    let webhookData: WebhookData;
                    
                    try {
                        webhookData = JSON.parse(body);
                    } catch (jsonError) {
                        try {
                            webhookData = JSON.parse(body.trim());
                        } catch (trimError) {
                            console.error('JSON Parse Errors:', jsonError, trimError);
                            
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ 
                                status: 'error', 
                                message: 'Cannot parse JSON',
                                receivedBody: body
                            }));
                            return;
                        }
                    }

                    console.log('Parsed webhook data:', JSON.stringify(webhookData, null, 2));

                    processPaymentWaiting(webhookData, userService);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'success',
                        receivedData: webhookData 
                    }));
                } catch (error) {
                    console.error('CRITICAL WEBHOOK ERROR:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'error', 
                        message: 'Unhandled error processing webhook',
                        receivedBody: body
                    }));
                }
            });
        } else {
            console.log('Received non-POST request');
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'error', 
                message: 'Method Not Allowed' 
            }));
        }
    });

    const PORT = process.env.WEBHOOK_PORT ? parseInt(process.env.WEBHOOK_PORT) : 5000;

    server.listen(PORT, () => {
        console.log(`Webhook server running on port ${PORT}`);
    });
}

async function processPaymentWaiting(data: WebhookData, userService: UserService) {
    console.log(`PROCESSING PAYMENT:`, JSON.stringify(data, null, 2));
    try {
        const response = await axios.post(
            `https://api.yookassa.ru/v3/payments/${data.paymentId}/capture`,
            {
                amount: {
                    value: data.amount,
                    currency: 'RUB',
                },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                    'Idempotence-Key': uuidv4(),
                }
            }
        );

        console.log('Capture payment response:', response.data);

        if (response.data.status === 'succeeded') {
            try {
                await userService.updateBalance(data.userId, parseFloat(data.amount));
                console.log(`Successfully updated balance for user ${data.userId}`);
            } catch (balanceError) {
                console.error('Error updating balance:', balanceError);
            }
        }
    } catch (error) {
        console.error('Error capturing payment:', error);
    }
}