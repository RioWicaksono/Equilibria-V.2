import { PrismaClient } from '@prisma/client';
import { RecurringTransaction } from '@/domain/entities/RecurringTransaction';

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

export interface IRecurringTransactionRepository {
  save(recurring: RecurringTransaction): Promise<void>;
  findAll(): Promise<RecurringTransaction[]>;
  findById(id: string): Promise<RecurringTransaction | null>;
  findDueRecurring(): Promise<RecurringTransaction[]>;
  updateNextDate(id: string, nextDate: Date): Promise<void>;
  delete(id: string): Promise<void>;
}

export class PrismaRecurringTransactionRepository implements IRecurringTransactionRepository {
  async save(recurring: RecurringTransaction): Promise<void> {
    await getPrisma().recurringTransaction.upsert({
      where: { id: recurring.id },
      update: {
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        description: recurring.description,
        frequency: recurring.frequency,
        nextDate: recurring.nextDate,
      },
      create: {
        id: recurring.id,
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        description: recurring.description,
        frequency: recurring.frequency,
        nextDate: recurring.nextDate,
        createdAt: recurring.createdAt || new Date(),
      },
    });
  }

  async findAll(): Promise<RecurringTransaction[]> {
    const data = await getPrisma().recurringTransaction.findMany({
      orderBy: { nextDate: 'asc' },
    });
    return data.map(r => ({
      id: r.id,
      amount: r.amount,
      type: r.type as 'INCOME' | 'EXPENSE',
      category: r.category,
      description: r.description,
      frequency: r.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
      nextDate: r.nextDate,
      createdAt: r.createdAt,
    }));
  }

  async findById(id: string): Promise<RecurringTransaction | null> {
    const r = await getPrisma().recurringTransaction.findUnique({ where: { id } });
    if (!r) return null;
    return {
      id: r.id,
      amount: r.amount,
      type: r.type as 'INCOME' | 'EXPENSE',
      category: r.category,
      description: r.description,
      frequency: r.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
      nextDate: r.nextDate,
      createdAt: r.createdAt,
    };
  }

  async findDueRecurring(): Promise<RecurringTransaction[]> {
    const now = new Date();
    const data = await getPrisma().recurringTransaction.findMany({
      where: { nextDate: { lte: now } },
      orderBy: { nextDate: 'asc' },
    });
    return data.map(r => ({
      id: r.id,
      amount: r.amount,
      type: r.type as 'INCOME' | 'EXPENSE',
      category: r.category,
      description: r.description,
      frequency: r.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
      nextDate: r.nextDate,
      createdAt: r.createdAt,
    }));
  }

  async updateNextDate(id: string, nextDate: Date): Promise<void> {
    await getPrisma().recurringTransaction.update({
      where: { id },
      data: { nextDate },
    });
  }

  async delete(id: string): Promise<void> {
    await getPrisma().recurringTransaction.delete({ where: { id } });
  }
}