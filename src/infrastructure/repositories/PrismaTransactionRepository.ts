import { Transaction } from '../../domain/entities/Transaction';
import { ITransactionRepository, TransactionFilter } from '../../domain/repositories/ITransactionRepository';
import { TransactionType } from '../../domain/value-objects/TransactionType';
import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';

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
    const prisma = await getPrismaAsync();
    const dateValue = new Date(transaction.date);
    const createdAtValue = transaction.createdAt ? new Date(transaction.createdAt) : new Date();

    await prisma.transaction.upsert({
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
    const prisma = await getPrismaAsync();
    const data = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
    });
    return data.map((item: PrismaTransactionResult) => mapPrismaTransaction(item));
  }

  async findById(id: string): Promise<Transaction | null> {
    const prisma = await getPrismaAsync();
    const data = await prisma.transaction.findUnique({
      where: { id },
    });
    if (!data) return null;
    return mapPrismaTransaction(data as PrismaTransactionResult);
  }

  async findByFilter(filter: TransactionFilter): Promise<Transaction[]> {
    const prisma = await getPrismaAsync();
    const where: Record<string, unknown> = {};
    if (filter.type) where.type = filter.type;
    if (filter.category) where.category = filter.category;
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) (where.date as Record<string, Date>).gte = filter.startDate;
      if (filter.endDate) (where.date as Record<string, Date>).lte = filter.endDate;
    }

    const data = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    return data.map((item: PrismaTransactionResult) => mapPrismaTransaction(item));
  }

  async delete(id: string): Promise<void> {
    const prisma = await getPrismaAsync();
    await prisma.transaction.delete({
      where: { id },
    });
  }
}
