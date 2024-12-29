import { Conversation } from '@grammyjs/conversations';
import { Context, InlineKeyboard } from 'grammy';
import { UserService } from '../../user/user.service';
import { YookassaService } from '../../../integration/yookassa/yookassa.service';
import { handlePrices } from '../commands/commands';

const keyboard = new InlineKeyboard().text('Сколько стоит?', 'button_prices');

export async function paymentConversation(
    conversation: Conversation<Context>, 
    ctx: Context,
    userService: UserService,
    yookassaService: YookassaService
) {
    try {
        await ctx.reply("На какую сумму вы хотите пополнить? (в рублях)", { reply_markup: keyboard });
        const { message, callbackQuery } = await conversation.wait();
        
        if (callbackQuery?.data === 'button_prices') {
            await handlePrices(ctx);
            return 
        }

        const amount = parseInt(message?.text || "", 10);
        
        if (isNaN(amount) || amount <= 0) {
            await ctx.reply("Некорректная сумма. Попробуйте снова.");
            return 
        }

        const userId = ctx.from?.id.toString()!;
        const payment = await yookassaService.createPaymentLink(amount, userId);

        await ctx.reply(`Ссылка на оплату: ${payment.paymentUrl}`);
        
    } catch (error) {
        console.error('Ошибка', error);
        await ctx.reply("Не удалось создать платеж. Попробуйте позже.");
    }
}