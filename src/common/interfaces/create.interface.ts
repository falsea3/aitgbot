import { Prisma } from '@prisma/client';

export interface ICreateUser {
    tgId: string;
    name: string;
    balance: Prisma.Decimal;
    refererId: string | null;
}

export interface ICreateUserPrompt {
    userId: string;
    prompt: string;
}