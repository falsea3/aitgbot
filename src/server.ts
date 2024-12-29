import fastify from 'fastify';
import cors from '@fastify/cors';
import { YookassaService } from './integration/yookassa/yookassa.service';
import { UserService } from './modules/user/user.service';
import { YookassaController } from './integration/yookassa/yookassa.controller';

export async function startWebhookServer(
    userService: UserService, 
    yookassaService: YookassaService, 
    port: number = 5000,
) {
    const server = fastify({ 
        logger: {
            level: 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname'
                }
            }
        }
    });

    await server.register(cors, {
        origin: '*',
        methods: ['POST']
    });

    const yookassaController = new YookassaController(userService, yookassaService);

    server.post('/', async (request, reply) => {
        await yookassaController.handleWebhook(request, reply);
    });

    try {
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`ВЕБХУКЕР ЗАПУЩЕН НА ПОРТУ ${port}`);
    } catch (err) {
        console.error('ошибка вебхурера', err);
        process.exit(1);
    }

    return server;
}