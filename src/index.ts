import { Bot, Context, session, SessionFlavor } from 'grammy';
import dotenv from 'dotenv';
import {
    handleBalance,
    handleMessage,
    handleRef,
    handleStart,
} from './modules/external/commands/commands';
import { PrismaService } from './database/database.service';
import { UserRepository } from './modules/user/user.repository';
import { UserService } from './modules/user/user.service';
import { UserPromptRepository } from './modules/user-prompt/user-prompt.repository';
import { UserPromptService } from './modules/user-prompt/user-prompt.service';
import { OpenAiService } from './integration/openai/openai.service';
import { AiModelService } from './modules/ai-model/ai-model.service';
import { AiModelRepository } from './modules/ai-model/ai-model.repository';
import { paymentConversation } from './modules/external/conversations/payment.conversation';
import { YookassaService } from './integration/yookassa/yookassa.service';
import { startWebhookServer } from './server';

import {
    type Conversation,
    type ConversationFlavor,
    conversations,
    createConversation,
} from "@grammyjs/conversations";

const prismaService = new PrismaService();
const userRepository = new UserRepository(prismaService);
const userService = new UserService(userRepository);
const userPromptRepository = new UserPromptRepository(prismaService);
const userPromptService = new UserPromptService(userPromptRepository);
const aiModelRepository = new AiModelRepository(prismaService);
const aiModelService = new AiModelService(aiModelRepository);
const openAiService = new OpenAiService();
const yookassaService = new YookassaService();

dotenv.config();

interface SessionData {
    [key: string]: any;
}

type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor<Context>;

const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN as string);

bot.command('start', (ctx) => handleStart(ctx, userService));
bot.command('balance', (ctx) => handleBalance(ctx, userService));
bot.command('referral', (ctx) => handleRef(ctx, userService));

bot.use(session({
    initial: (): SessionData => ({})
}));

bot.use(conversations());

bot.use(
    createConversation(
        async (conversation, ctx) => {
            await paymentConversation(conversation, ctx, userService, yookassaService);
        }, 
        "paymentConversation"
    )
);

bot.command("payment", async (ctx) => { await ctx.conversation.enter("paymentConversation"); });

bot.on('message', (ctx) => handleMessage(ctx, userService, userPromptService, openAiService, aiModelService));

bot.start().then(r => console.log(r));

setInterval(async () => {
    console.log('не спать');
}, 45000);

startWebhookServer(userService, yookassaService);