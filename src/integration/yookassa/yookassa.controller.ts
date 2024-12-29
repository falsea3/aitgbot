import { FastifyRequest, FastifyReply } from 'fastify';
import { YookassaService } from './yookassa.service';
import { UserService } from '../../modules/user/user.service';

interface WebhookData {
    type: 'notification';
    event: string;
    object: {
        id: string;
        status: string;
        amount: {
            value: string;
            currency: string;
        };
        metadata?: {
            user_id?: string;
        };
    };
}

export class YookassaController {
    constructor(
        private userService: UserService,
        private yookassaService: YookassaService,
        private bot: any
    ) {}

    async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
        try {
            const body = request.body as WebhookData;
            console.log('вебхук:', body);
            switch (body.event) {
                case 'payment.waiting_for_capture': {
                    const paymentId = body.object.id;
                    const amount = body.object.amount.value;
                    const userId = body.object.metadata?.user_id;

                    if (userId) {
                        await this.yookassaService.acceptPayment(paymentId, +amount);
                    } else {
                        console.warn(`нет юзерайди (${paymentId})`);
                    }

                    break;
                }

                case 'payment.succeeded': {
                    const userId = body.object.metadata?.user_id;
                    const amount = body.object.amount.value;

                    if (userId) {
                        await this.userService.updateBalance(userId, +amount);
                        await this.bot.api.sendMessage( 
                            userId, 
                            `Пополнение баланса на ${amount} руб.`
                        );
                    }

                    break;
                }
                case 'payment.canceled':
                    console.log('галя, у нас отмена:', body.object);
                    break;
                default:
                    console.log('ивента нет такого:', body.event);
            }

            reply.status(200).send({ status: 'ok' });
        } catch (error) {
            console.error('ошибка:', error);
            reply.status(500).send({ error: 'ошибка' });
        }
    }
}