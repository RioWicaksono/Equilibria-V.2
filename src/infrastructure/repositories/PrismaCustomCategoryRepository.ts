import prisma from '../database/PrismaClient';

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  createdAt: Date;
}

export class PrismaCustomCategoryRepository {
  async findAll(): Promise<CustomCategory[]> {
    return prisma.customCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByType(type: string): Promise<CustomCategory[]> {
    return prisma.customCategory.findMany({
      where: { type },
      orderBy: { createdAt: 'asc' },
    });
  }

  async save(category: Omit<CustomCategory, 'id' | 'createdAt'>): Promise<CustomCategory> {
    return prisma.customCategory.create({
      data: category,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.customCategory.delete({
      where: { id },
    });
  }
}