import dotenv from 'dotenv';
import { Context, InlineKeyboard } from 'grammy';
import { UserService } from '../../user/user.service';
import { UserPromptService } from '../../user-prompt/user-prompt.service';
import { OpenAiService } from '../../../integration/openai/openai.service';
import { Prisma } from '@prisma/client';
import { AiModelService } from '../../ai-model/ai-model.service';

dotenv.config();

export async function handleStart(ctx: Context, userService: UserService) {
    const tgUser = ctx.from;
    let user = await userService.getOne(String(tgUser!.id));

    const refererId = typeof ctx.match === 'string' && ctx.match !== String(tgUser!.id)
        ? ctx.match
        : null;

    if (!user) {
        await userService.create({
            tgId: String(tgUser!.id),
            name: tgUser!.first_name,
            balance: new Prisma.Decimal(5),
            refererId,
        });

        await ctx.reply(`
Привет, ${tgUser!.first_name}! 👋 Я — бот-ассистент, готов помочь вам с вопросами и задачами. 

Могу подсказать по любой теме, ответить на вопросы или просто поболтать! 😊

Просто напишите мне, и я постараюсь помочь. Если хотите узнать, как я могу помочь, напишите "Что ты можешь?".

Также, если у вас есть запросы, не стесняйтесь делиться ими.
        `);

        if (refererId) {
            const amount = Number(process.env.REFERRAL_BONUS_AMOUNT || 50);
            const referer = await userService.getOne(refererId);

            if (referer) {
                await userService.processReferralBonus(refererId, String(tgUser!.id), amount);
                await ctx.api.sendMessage(
                    refererId,
                    `🎉 Пользователь ${tgUser!.first_name} зарегистрировался по вашей реферальной ссылке. Вам начислено ${amount} рублей!`
                );
                await ctx.reply(`🎉 Вы зарегистрировались по реферальной ссылке пользователя ${referer.name}. Вам начислено ${amount} рублей!`);
            }
        }

        return
    }

    if (user?.isBlocked) {
        return ctx.reply('Ваш аккаунт заблокирован. Обратитесь к администратору.');
    }

    if (+user?.balance <= 0) {
        return ctx.reply('У вас закончились деньги. Пополните баланс.');
    }

    await ctx.reply(`
Привет, ${tgUser!.first_name}! 👋 Я рад снова вас видеть. Напомню, что могу помочь вам с вопросами, задачами или просто поговорить. Напишите мне, и я постараюсь помочь!
    `);
}

export async function handleBalance(ctx: Context, userService: UserService) {
    const tgUser = ctx.from;
    const user = await userService.getOne(String(tgUser!.id));

    if (!user) {
        return handleStart(ctx, userService);
    }

    await ctx.reply(`Ваш баланс: ${user.balance.toFixed(2)} руб.`);

    if (+user.balance <= 5) {
        return ctx.reply('Баланс скоро закончится. Пополните баланс.');
    }

    if (+user.balance <= 0) {
        return ctx.reply('У вас закончились деньги. Пополните баланс.');
    }
}

export async function handleRef(ctx: Context, userService: UserService) {
    const tgUser = ctx.from;
    const user = await userService.getOne(String(tgUser!.id));

    if (!user) {
        return handleStart(ctx, userService);
    }

    await ctx.reply(`Ваша реферальная ссылка: https://t.me/${process.env.TELEGRAM_BOT_NAME}?start=${user.tgId} \n\nПриглашайте друзей и получайте бонусы!`);

}

export async function handleMessage(ctx: Context, userService: UserService, userPromptService: UserPromptService, OpenAiService: OpenAiService, aiModelService: AiModelService) {
    const message = ctx.message?.text;
    const tgUser = ctx.from;
    const user = await userService.getOne(String(tgUser!.id));

    if (!user) {
        return handleStart(ctx, userService);
    }

    let context = await userPromptService.getLast(user!.id, 3);


    if (+user.balance <= 0) {
        return ctx.reply('У вас закончились деньги. Пополните баланс.');
    }

    if (message && +user.balance > 0) {
        // const aiModel = await aiModelService.getOne(user.aiModelId);
        await userPromptService.create({ userId: user.id, prompt: message });
        const { text, cost, imageUrl } = await OpenAiService.getTextResponse(message, 2000, 'gpt-4o-mini', context);
        const newBalance = user.balance.add(-cost);

        if (imageUrl) {
            await ctx.replyWithPhoto(imageUrl) || await ctx.reply(text);
            // await ctx.reply(`Текущий баланс: ${newBalance.toFixed(2)} руб. Потрачено: ${cost.toFixed(2)} руб.`);
        } else {
            await ctx.reply(text);
            // await ctx.reply(`Текущий баланс: ${newBalance.toFixed(2)} руб. Потрачено: ${cost.toFixed(2)} руб.`);
        }

        await userService.updateBalance(String(tgUser!.id), -cost);
    }

}
export async function handlePrices(ctx: Context) {
    const keyboard = new InlineKeyboard().text('Продолжить пополнение', 'button_payment');
    const message = `
💰 *Стоимость услуг в боте*:
- Генерация изображения: *10 руб.*
- Отправка сообщения: *от 1 до 3 копеек* (зависит от объема текста и контекста).
    
💡 Пополнение баланса необходимо для оплаты этих действий. Стоимость сообщений рассчитывается на основе текущих тарифов OpenAI.

❗ *Важно:*
- Средства, потраченные на услуги, не подлежат возврату.
- Перед пополнением баланса убедитесь, что согласны с условиями.
    `;
    await ctx.reply(message, { parse_mode: "Markdown", reply_markup: keyboard });
    return
}