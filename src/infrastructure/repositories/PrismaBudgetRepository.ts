import { Budget } from '../../domain/entities/Budget';
import { IBudgetRepository } from '../../domain/repositories/IBudgetRepository';
import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';

export class PrismaBudgetRepository implements IBudgetRepository {
  async save(budget: Budget): Promise<void> {
    const prisma = await getPrismaAsync();
    await prisma.budget.upsert({
      where: { id: budget.id },
      update: {
        category: budget.category,
        limit: budget.limit,
      },
      create: {
        id: budget.id,
        category: budget.category,
        limit: budget.limit,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      },
    });
  }

  async findAll(): Promise<Budget[]> {
    const prisma = await getPrismaAsync();
    return prisma.budget.findMany({
      orderBy: { category: 'asc' },
    });
  }

  async findById(id: string): Promise<Budget | null> {
    const prisma = await getPrismaAsync();
    return prisma.budget.findUnique({
      where: { id },
    });
  }

  async findByCategory(category: string): Promise<Budget | null> {
    const prisma = await getPrismaAsync();
    return prisma.budget.findUnique({
      where: { category },
    });
  }

  async delete(id: string): Promise<void> {
    const prisma = await getPrismaAsync();
    await prisma.budget.delete({
      where: { id },
    });
  }
}
