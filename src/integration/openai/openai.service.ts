import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

export class OpenAiService {
    chat: OpenAI
    constructor() {
        this.chat = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async getTextResponse(prompt:string, maxTokens = 500, model:string, context:any) {
        try {
            const systemMessage = `
You are a Telegram bot called PivoMoster. Here are your instructions:
- You are primarily a text-based assistant. Your main task is to help users with their questions and provide information in a friendly and concise manner.
- If a user wants to generate an image, you should:
  - Once the user provides the description, you should reply with 'Generating image: [user's description]' and initiate the image generation process using DALL·E.
- Always respond politely, with a friendly tone, and ask for clarification if the user's request is unclear.
`;
            const messageHistory = context
                .map((msg: { prompt: string }) => ({
                    role: 'user',
                    content: msg.prompt,
                }))
                .reverse();

            messageHistory.unshift({ role: 'system', content: systemMessage });
            messageHistory.push({ role: 'user', content: prompt });

            const completion = await this.chat.chat.completions.create({
                model: model || "gpt-4o-mini",
                messages: messageHistory,
                max_completion_tokens: maxTokens,
            });

            const usageTokens = completion.usage?.total_tokens;
            const tokenCost = 0.001;
            const cost = usageTokens ? usageTokens * tokenCost : 0;

            const botResponse = completion.choices[0].message.content!;
            console.log(botResponse);
            
            if (botResponse.toLowerCase().includes("генерирую изображение") || botResponse.toLowerCase().includes("generating image")) {
                const cost = 10;
                const imageUrl = await this.getImageResponse(botResponse);
                return {
                    text: completion.choices[0]?.message?.content || "Текст не сгенерирован.",
                    imageUrl: imageUrl,
                    cost: cost,
                };
            }

            return {
                imageUrl: null,
                text: completion.choices[0]?.message?.content || "Текст не сгенерирован.",
                cost: cost,
            };
        } catch (error:any) {
            console.error("Ошибка при запросе к OpenAI:", error.message);
            throw new Error("Ошибка при взаимодействии с OpenAI.");
        }
    }

    async getImageResponse(prompt:string) {
        try {
            const result = await this.chat.images.generate({
                model: "dall-e-3",
                size: "1024x1024",
                quality: "standard",
                prompt: prompt,
            });
            console.log(result);
            return result.data[0].url || "Изображение не сгенерировано.";
        } catch (error:any) {
            console.error("Ошибка при запросе к OpenAI:", error.message);
            throw new Error("Ошибка при взаимодействии с OpenAI.");
        }
    }
}