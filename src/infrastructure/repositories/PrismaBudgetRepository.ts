import { Budget } from '../../domain/entities/Budget';
import { IBudgetRepository } from '../../domain/repositories/IBudgetRepository';
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

export class PrismaBudgetRepository implements IBudgetRepository {
  async save(budget: Budget): Promise<void> {
    await getPrisma().budget.upsert({
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
    return getPrisma().budget.findMany({
      orderBy: { category: 'asc' },
    });
  }

  async findById(id: string): Promise<Budget | null> {
    return getPrisma().budget.findUnique({
      where: { id },
    });
  }

  async findByCategory(category: string): Promise<Budget | null> {
    return getPrisma().budget.findUnique({
      where: { category },
    });
  }

  async delete(id: string): Promise<void> {
    await getPrisma().budget.delete({
      where: { id },
    });
  }
}