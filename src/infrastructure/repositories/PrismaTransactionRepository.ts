import { Transaction, TransactionType } from '../../domain/models/Transaction';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { PrismaClient } from '@prisma/client';

let prismaClientInstance: PrismaClient | undefined;

const getPrisma = (): PrismaClient => {
  if (!prismaClientInstance) {
    const globalForPrisma = globalThis as unknown as {
      prisma: PrismaClient | undefined;
    };
    prismaClientInstance = globalForPrisma.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClientInstance;
  }
  return prismaClientInstance;
};

export class PrismaTransactionRepository implements ITransactionRepository {
  async save(transaction: Transaction): Promise<void> {
    await getPrisma().transaction.upsert({
      where: { id: transaction.id },
      update: {
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        description: transaction.description,
      },
      create: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
    });
  }

  async findAll(): Promise<Transaction[]> {
    const data = await getPrisma().transaction.findMany({
      orderBy: { date: 'desc' },
    });
    return data.map((t) => ({
      ...t,
      type: t.type as TransactionType
    }));
  }

  async findById(id: string): Promise<Transaction | null> {
    const data = await getPrisma().transaction.findUnique({
      where: { id },
    });
    if (!data) return null;
    return {
      ...data,
      type: data.type as TransactionType
    };
  }

  async delete(id: string): Promise<void> {
    await getPrisma().transaction.delete({
      where: { id },
    });
  }
}
