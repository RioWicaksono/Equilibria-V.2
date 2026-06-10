import { Transaction } from '../../domain/entities/Transaction';
import { ITransactionRepository, TransactionFilter } from '../../domain/repositories/ITransactionRepository';
import { TransactionType } from '../../domain/value-objects/TransactionType';
import { PrismaClient } from '@prisma/client';

let prismaClientInstance: PrismaClient | undefined;

const getPrisma = (): PrismaClient => {
  if (!prismaClientInstance) {
    const globalForPrisma = globalThis as unknown as {
      prisma: PrismaClient | undefined;
    };
    prismaClientInstance = globalForPrisma.prisma ?? new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL || process.env.RAILWAY_DATABASE_URL,
    });
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClientInstance;
  }
  return prismaClientInstance;
};

interface PrismaTransactionResult {
  id: string;
  amount: number;
  type: string;
  category: string;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt?: Date;
  walletId?: string | null;
}

function mapPrismaTransaction(t: PrismaTransactionResult): Transaction {
  return {
    id: t.id,
    amount: t.amount,
    type: t.type as TransactionType,
    category: t.category,
    date: t.date instanceof Date ? t.date.toISOString() : String(t.date),
    description: t.description,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
  };
}

export class PrismaTransactionRepository implements ITransactionRepository {
  async save(transaction: Transaction): Promise<void> {
    const dateValue = new Date(transaction.date);
    const createdAtValue = transaction.createdAt ? new Date(transaction.createdAt) : new Date();

    await getPrisma().transaction.upsert({
      where: { id: transaction.id },
      update: {
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: dateValue,
        description: transaction.description,
      },
      create: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: dateValue,
        description: transaction.description,
        createdAt: createdAtValue,
      },
    });
  }

  async findAll(): Promise<Transaction[]> {
    const data = await getPrisma().transaction.findMany({
      orderBy: { date: 'desc' },
    });
    return data.map((item: PrismaTransactionResult) => mapPrismaTransaction(item));
  }

  async findById(id: string): Promise<Transaction | null> {
    const data = await getPrisma().transaction.findUnique({
      where: { id },
    });
    if (!data) return null;
    return mapPrismaTransaction(data as PrismaTransactionResult);
  }

  async findByFilter(filter: TransactionFilter): Promise<Transaction[]> {
    const where: Record<string, unknown> = {};
    if (filter.type) where.type = filter.type;
    if (filter.category) where.category = filter.category;
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) (where.date as Record<string, Date>).gte = filter.startDate;
      if (filter.endDate) (where.date as Record<string, Date>).lte = filter.endDate;
    }

    const data = await getPrisma().transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    return data.map((item: PrismaTransactionResult) => mapPrismaTransaction(item));
  }

  async delete(id: string): Promise<void> {
    await getPrisma().transaction.delete({
      where: { id },
    });
  }
}
