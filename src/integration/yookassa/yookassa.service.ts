// src/integration/yookassa/yookassa.service.ts
import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
// import updateBalance from '../../modules/user/user.service';

dotenv.config();

const shopId = process.env.YOOKASSA_SHOP_ID;
const secretKey = process.env.YOOKASSA_SECRET_KEY;

const authHeader = `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`;

export class YookassaService {
    async createPaymentLink(amount: number, userId: string) {
        // console.log('Creating payment link', { amount, userId });
        try {
            const response = await axios.post(
                'https://api.yookassa.ru/v3/payments',
                {
                    amount: {
                        value: amount,
                        currency: 'RUB'
                    },
                    confirmation: {
                        type: 'redirect',
                        return_url: 'https://your-site.com'
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
            // console.log('Payment link created', response.data);
            return {
                paymentId: response.data.id,
                paymentUrl: response.data.confirmation.confirmation_url
            };
        } catch (error) {
            console.error('Error creating payment link', error);
            throw error;
        }
    }

    async checkPaymentStatus(paymentId: string) {
        // console.log('Checking payment status', { paymentId });
        try {
            const response = await axios.get(
                `https://api.yookassa.ru/v3/payments/${paymentId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authHeader
                    }
                }
            );
            // console.log('Payment status', response.data.status);
            return response;
        } catch (error) {
            console.error('Error checking payment status', error);
            throw error;
        }
    }

    async acceptPayment(paymentId: string, amount: number) {
        // console.log('Accepting payment', { paymentId });
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
            // console.log('Payment accepted', response.data);
            return response.data;
        } catch (error) {
            console.error('Error accepting payment', error);
            throw error;
        }
    }

}

// user.service.ts
// export class UserService {
//     constructor(private userRepository: UserRepository) {}

//     async updateBalance(userId: string, amount: number) {
//         console.log('Updating balance', { userId, amount });
//         try {
//             const result = await this.userRepository.updateUserBalance(userId, amount);
//             console.log('Balance updated', result);
//             return result;
//         } catch (error) {
//             console.error('Error updating balance', error);
//             throw error;
//         }
//     }
// }