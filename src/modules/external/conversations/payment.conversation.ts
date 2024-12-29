import { Conversation } from '@grammyjs/conversations';
import { Context } from 'grammy';
import { UserService } from '../../user/user.service';
import { YookassaService } from '../../../integration/yookassa/yookassa.service';

export async function paymentConversation(
    conversation: Conversation<Context>, 
    ctx: Context,
    userService: UserService,
    yookassaService: YookassaService
) {
    try {
        await ctx.reply("На какую сумму вы хотите пополнить? (в рублях)");
        const { message } = await conversation.wait();
        const amount = parseInt(message?.text || "", 10);

        if (isNaN(amount) || amount <= 0) {
            await ctx.reply("Некорректная сумма. Попробуйте снова.");
            return;
        }

        const userId = ctx.from?.id.toString()!;
        const payment = await yookassaService.createPaymentLink(amount, userId);

        await ctx.reply(`Ссылка на оплату: ${payment.paymentUrl}`);
        
    } catch (error) {
        console.error('Ошибка', error);
        await ctx.reply("Не удалось создать платеж. Попробуйте позже.");
    }
}