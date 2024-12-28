import { PrismaService } from '../../database/database.service';
import { User } from 'prisma/prisma-client';
import { ICreateUser } from '../../common/interfaces/create.interface';

export class UserRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    public async getOne(id: string): Promise<User | null> {
        return this.prisma.user.findFirst({ where: { tgId: id }});
    }

    public async create(user: ICreateUser): Promise<User> {
        return this.prisma.user.create({ data: user });
    }

    public async updateBalance(id: string, amount: number): Promise<User> {
        const user = await this.prisma.user.findFirst({ where: { tgId: id } });
        if (!user) {
            throw new Error(`Пользователь с tgId ${id} не найден`);
        }
        return this.prisma.user.update({
            where: { id: user.id },
            data: {
                balance: user.balance.add(amount),
            },
        });

    }

    public async processReferralBonus(refererId: string, userId: string, amount: number) {
        const referer = await this.getOne(refererId);
        if (!referer) return null;
        await this.updateBalance(refererId, amount);
        await this.updateBalance(userId, amount);
        
        return referer;
    }
    
}