import { PrismaService } from '../../database/database.service';
import { AiModel } from '@prisma/client';

export class AiModelRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    public async getOne(id: string): Promise<AiModel | null> {
        return this.prisma.aiModel.findFirst({ where: { id } });
    }

}