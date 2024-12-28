import { PrismaService } from '../../database/database.service';
import { UserPrompt } from '@prisma/client';
import { ICreateUserPrompt } from '../../common/interfaces/create.interface';

export class UserPromptRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    public async create(userPrompt: ICreateUserPrompt): Promise<UserPrompt> {
        return this.prisma.userPrompt.create({ data: { userId: userPrompt.userId, prompt: userPrompt.prompt, } });
    }
    public async getLast(id: string, limit: number = 3): Promise<UserPrompt[]> {
        return this.prisma.userPrompt.findMany({
            where: { userId: id },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }
}