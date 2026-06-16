import { PrismaClient } from '@prisma/client';
import { FinancialGoal } from '@/domain/entities/FinancialGoal';

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

export interface IFinancialGoalRepository {
  save(goal: FinancialGoal): Promise<void>;
  findAll(): Promise<FinancialGoal[]>;
  findById(id: string): Promise<FinancialGoal | null>;
  updateProgress(id: string, currentAmount: number): Promise<void>;
  delete(id: string): Promise<void>;
}

export class PrismaFinancialGoalRepository implements IFinancialGoalRepository {
  async save(goal: FinancialGoal): Promise<void> {
    await getPrisma().financialGoal.upsert({
      where: { id: goal.id },
      update: {
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
        description: goal.description,
      },
      create: {
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
        description: goal.description,
        createdAt: goal.createdAt || new Date(),
        updatedAt: goal.updatedAt || new Date(),
      },
    });
  }

  async findAll(): Promise<FinancialGoal[]> {
    const data = await getPrisma().financialGoal.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return data.map(g => ({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: g.deadline || undefined,
      description: g.description || undefined,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }));
  }

  async findById(id: string): Promise<FinancialGoal | null> {
    const g = await getPrisma().financialGoal.findUnique({ where: { id } });
    if (!g) return null;
    return {
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: g.deadline || undefined,
      description: g.description || undefined,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  }

  async updateProgress(id: string, currentAmount: number): Promise<void> {
    await getPrisma().financialGoal.update({
      where: { id },
      data: { currentAmount, updatedAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await getPrisma().financialGoal.delete({ where: { id } });
  }
}