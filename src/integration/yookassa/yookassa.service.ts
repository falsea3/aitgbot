import axios from 'axios';
import dotenv from 'dotenv';
import { Bot } from 'grammy';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const shopId = process.env.YOOKASSA_SHOP_ID;
const secretKey = process.env.YOOKASSA_SECRET_KEY;

const authHeader = `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`;

export class YookassaService {
    async createPaymentLink(amount: number, userId: string) {
        try {
            const response = await axios.post(
                'https://api.yookassa.ru/v3/payments',
                {
                    amount: {
                        value: amount,
                        currency: 'RUB'
                    },
                    capture: true,
                    confirmation: {
                        type: 'redirect',
                        return_url: 'tg://resolve?domain=' + process.env.TELEGRAM_BOT_NAME
                    },
                    metadata: {
                        user_id: userId
                    },
                    description: `Пополнение баланса ${userId}`
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authHeader,
                        'Idempotence-Key': uuidv4()
                    }
                }
            );

            return {
                paymentId: response.data.id,
                paymentUrl: response.data.confirmation.confirmation_url
            };
        } catch (error) {
            console.error('ошибка создания ссылки', error);
            throw error;
        }
    }

    async acceptPayment(paymentId: string, amount: number) {
        try {
            const response = await axios.post(
                `https://api.yookassa.ru/v3/payments/${paymentId}/capture`,
                {
                    amount: {
                        value: amount,
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
            return response.data;
        } catch (error) {
            console.error('ошибка подтверждения платежа', error);
            throw error;
        }
    }

    // async notifySuccessfulPayment(userId: string, amount: number) {
    //     await this.bot.api.sendMessage(
    //         userId, 
    //         `✅ Баланс пополнен на ${amount} руб.`
    //     );
    // }

}