import { Wallet } from '@/domain/entities/Wallet';
import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';

export interface IWalletRepository {
  save(wallet: Wallet): Promise<void>;
  findAll(): Promise<Wallet[]>;
  findById(id: string): Promise<Wallet | null>;
  updateBalance(id: string, balance: number): Promise<void>;
  delete(id: string): Promise<void>;
}

export class PrismaWalletRepository implements IWalletRepository {
  async save(wallet: Wallet): Promise<void> {
    const prisma = await getPrismaAsync();
    await prisma.wallet.upsert({
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
    const prisma = await getPrismaAsync();
    const data = await prisma.wallet.findMany({
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
    const prisma = await getPrismaAsync();
    const w = await prisma.wallet.findUnique({ where: { id } });
    if (!w) return null;
    return {
      id: w.id,
      name: w.name,
      balance: w.balance,
      createdAt: w.createdAt,
    };
  }

  async updateBalance(id: string, balance: number): Promise<void> {
    const prisma = await getPrismaAsync();
    await prisma.wallet.update({
      where: { id },
      data: { balance },
    });
  }

  async delete(id: string): Promise<void> {
    const prisma = await getPrismaAsync();
    await prisma.wallet.delete({ where: { id } });
  }
}
