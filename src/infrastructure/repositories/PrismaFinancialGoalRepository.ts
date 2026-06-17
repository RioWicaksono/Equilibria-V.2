import { FinancialGoal } from '@/domain/entities/FinancialGoal';
import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';

export interface IFinancialGoalRepository {
  save(goal: FinancialGoal): Promise<void>;
  findAll(): Promise<FinancialGoal[]>;
  findById(id: string): Promise<FinancialGoal | null>;
  updateProgress(id: string, currentAmount: number): Promise<void>;
  delete(id: string): Promise<void>;
}

export class PrismaFinancialGoalRepository implements IFinancialGoalRepository {
  async save(goal: FinancialGoal): Promise<void> {
    const prisma = await getPrismaAsync();
    await prisma.financialGoal.upsert({
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
    const prisma = await getPrismaAsync();
    const data = await prisma.financialGoal.findMany({
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
    const prisma = await getPrismaAsync();
    const g = await prisma.financialGoal.findUnique({ where: { id } });
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
    const prisma = await getPrismaAsync();
    await prisma.financialGoal.update({
      where: { id },
      data: { currentAmount, updatedAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    const prisma = await getPrismaAsync();
    await prisma.financialGoal.delete({ where: { id } });
  }
}
