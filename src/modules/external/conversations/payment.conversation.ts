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
        // console.log('User ID:', userId);
        
        const payment = await yookassaService.createPaymentLink(amount, userId);
        // console.log('Payment created:', payment);

        await ctx.reply(`Ссылка на оплату: ${payment.paymentUrl}`);

        // const startTime = Date.now();
        // const maxWaitTime = 60000;
        // const checkInterval = 5000;

        // while (Date.now() - startTime < maxWaitTime) {
        //     // const res = await yookassaService.checkPaymentStatus(payment.paymentId);
        //     // const status = res.data.status;
        //     // // console.log('Payment status:', status);
        //     // const amount = res.data.amount.value;

        //     // if (status === 'waiting_for_capture') {
        //     //     const res = await yookassaService.acceptPayment(payment.paymentId, amount);

        //     //     if (res.status === 'succeeded') {
        //     //         await userService.updateBalance(userId, res.amount.value);
        //     //         await ctx.reply(`✅ Платеж на ${res.amount.value} руб. успешно зачислен`);
        //     //         return;
        //     //     }
        //     // }

        //     if (status === 'canceled') {
        //         await ctx.reply('Платеж отменен');
        //         return;
        //     }

        //     await new Promise(resolve => setTimeout(resolve, checkInterval));
        // }

        await ctx.reply('Время ожидания платежа истекло');
    } catch (error) {
        console.error('Error in payment conversation:', error);
        await ctx.reply("Не удалось создать платеж. Попробуйте позже.");
    }
}