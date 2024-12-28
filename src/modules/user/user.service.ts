import { UserRepository } from './user.repository';
import { PrismaService } from '../../database/database.service';
import { User } from 'prisma/prisma-client';
import { ICreateUser } from '../../common/interfaces/create.interface';

export class UserService {
    constructor(private readonly userRepository: UserRepository) {
        this.userRepository = new UserRepository(new PrismaService());
    }

    public async getOne(id: string): Promise<User | null> {
        return this.userRepository.getOne(id);
    }

    public async create(user: ICreateUser): Promise<User | null> {
        return this.userRepository.create(user);
    }

    public async updateBalance(id: string, amount: number): Promise<User | null> {
        return this.userRepository.updateBalance(id, amount);
    }

    public async processReferralBonus(refererId: string, userId: string, amount: number) {
        return this.userRepository.processReferralBonus(refererId, userId, amount);
    }
}