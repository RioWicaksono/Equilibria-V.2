import { PrismaClient } from '@prisma/client';
import { Debt } from '@/domain/entities/Debt';

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

export interface IDebtRepository {
  save(debt: Debt): Promise<void>;
  findAll(): Promise<Debt[]>;
  findById(id: string): Promise<Debt | null>;
  updatePaidAmount(id: string, paidAmount: number): Promise<void>;
  markAsPaid(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export class PrismaDebtRepository implements IDebtRepository {
  async save(debt: Debt): Promise<void> {
    await getPrisma().debt.upsert({
      where: { id: debt.id },
      update: {
        name: debt.name,
        amount: debt.amount,
        paidAmount: debt.paidAmount,
        type: debt.type,
        status: debt.status,
        description: debt.description,
        dueDate: debt.dueDate,
      },
      create: {
        id: debt.id,
        name: debt.name,
        amount: debt.amount,
        paidAmount: debt.paidAmount,
        type: debt.type,
        status: debt.status,
        description: debt.description,
        dueDate: debt.dueDate,
        createdAt: debt.createdAt || new Date(),
        updatedAt: debt.updatedAt || new Date(),
      },
    });
  }

  async findAll(): Promise<Debt[]> {
    const data = await getPrisma().debt.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return data.map(d => ({
      id: d.id,
      name: d.name,
      amount: d.amount,
      paidAmount: d.paidAmount,
      type: d.type as 'DEBT' | 'LOAN',
      status: d.status as 'UNPAID' | 'PAID',
      description: d.description || undefined,
      dueDate: d.dueDate || undefined,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }

  async findById(id: string): Promise<Debt | null> {
    const d = await getPrisma().debt.findUnique({ where: { id } });
    if (!d) return null;
    return {
      id: d.id,
      name: d.name,
      amount: d.amount,
      paidAmount: d.paidAmount,
      type: d.type as 'DEBT' | 'LOAN',
      status: d.status as 'UNPAID' | 'PAID',
      description: d.description || undefined,
      dueDate: d.dueDate || undefined,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  async updatePaidAmount(id: string, paidAmount: number): Promise<void> {
    await getPrisma().debt.update({
      where: { id },
      data: { paidAmount, updatedAt: new Date() },
    });
  }

  async markAsPaid(id: string): Promise<void> {
    await getPrisma().debt.update({
      where: { id },
      data: { status: 'PAID', updatedAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await getPrisma().debt.delete({ where: { id } });
  }
}