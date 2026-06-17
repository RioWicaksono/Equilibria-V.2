import { RecurringTransaction } from '@/domain/entities/RecurringTransaction';
import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';

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
    const prisma = await getPrismaAsync();
    await prisma.recurringTransaction.upsert({
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
    const prisma = await getPrismaAsync();
    const data = await prisma.recurringTransaction.findMany({
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
    const prisma = await getPrismaAsync();
    const r = await prisma.recurringTransaction.findUnique({ where: { id } });
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
    const prisma = await getPrismaAsync();
    const now = new Date();
    const data = await prisma.recurringTransaction.findMany({
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
    const prisma = await getPrismaAsync();
    await prisma.recurringTransaction.update({
      where: { id },
      data: { nextDate },
    });
  }

  async delete(id: string): Promise<void> {
    const prisma = await getPrismaAsync();
    await prisma.recurringTransaction.delete({ where: { id } });
  }
}
