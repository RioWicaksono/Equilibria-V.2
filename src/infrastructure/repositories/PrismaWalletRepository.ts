import { PrismaClient } from '@prisma/client';
import { Wallet } from '@/domain/entities/Wallet';

let prismaClientInstance: PrismaClient | undefined;

const getPrisma = (): PrismaClient => {
  if (!prismaClientInstance) {
    const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
    prismaClientInstance = globalForPrisma.prisma ?? new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL,
    });
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClientInstance;
  }
  return prismaClientInstance;
};

export interface IWalletRepository {
  save(wallet: Wallet): Promise<void>;
  findAll(): Promise<Wallet[]>;
  findById(id: string): Promise<Wallet | null>;
  updateBalance(id: string, balance: number): Promise<void>;
  delete(id: string): Promise<void>;
}

export class PrismaWalletRepository implements IWalletRepository {
  async save(wallet: Wallet): Promise<void> {
    await getPrisma().wallet.upsert({
      where: { id: wallet.id },
      update: {
        name: wallet.name,
        balance: wallet.balance,
      },
      create: {
        id: wallet.id,
        name: wallet.name,
        balance: wallet.balance,
        createdAt: wallet.createdAt || new Date(),
      },
    });
  }

  async findAll(): Promise<Wallet[]> {
    const data = await getPrisma().wallet.findMany({
      orderBy: { name: 'asc' },
    });
    return data.map(w => ({
      id: w.id,
      name: w.name,
      balance: w.balance,
      createdAt: w.createdAt,
    }));
  }

  async findById(id: string): Promise<Wallet | null> {
    const w = await getPrisma().wallet.findUnique({ where: { id } });
    if (!w) return null;
    return {
      id: w.id,
      name: w.name,
      balance: w.balance,
      createdAt: w.createdAt,
    };
  }

  async updateBalance(id: string, balance: number): Promise<void> {
    await getPrisma().wallet.update({
      where: { id },
      data: { balance },
    });
  }

  async delete(id: string): Promise<void> {
    await getPrisma().wallet.delete({ where: { id } });
  }
}