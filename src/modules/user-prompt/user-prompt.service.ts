import { UserPromptRepository } from './user-prompt.repository';
import { PrismaService } from '../../database/database.service';
import { UserPrompt } from '@prisma/client';
import { ICreateUserPrompt } from '../../common/interfaces/create.interface';

export class UserPromptService {
    constructor(readonly userPromptRepository: UserPromptRepository) {
        this.userPromptRepository = new UserPromptRepository(new PrismaService());
    }

    public async create(prompt: ICreateUserPrompt): Promise<UserPrompt | null> {
        return this.userPromptRepository.create(prompt);
    }

    public async getLast(id: string, limit: number = 3): Promise<UserPrompt[]> {
        return this.userPromptRepository.getLast(id, limit);
    }
}