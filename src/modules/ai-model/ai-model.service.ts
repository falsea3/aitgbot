import { AiModelRepository } from './ai-model.repository';
import { PrismaService } from '../../database/database.service';
import { AiModel } from '@prisma/client';

export class AiModelService {
    constructor(private readonly aiModelRepository: AiModelRepository) {
        this.aiModelRepository = new AiModelRepository(new PrismaService());
    }

    public async getOne(id: string): Promise<AiModel |  null> {
        return this.aiModelRepository.getOne(id);
    }

}