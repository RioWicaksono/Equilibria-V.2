import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';

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
    const prisma = await getPrismaAsync();
    return prisma.customCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByType(type: string): Promise<CustomCategory[]> {
    const prisma = await getPrismaAsync();
    return prisma.customCategory.findMany({
      where: { type },
      orderBy: { createdAt: 'asc' },
    });
  }

  async save(category: Omit<CustomCategory, 'id' | 'createdAt'>): Promise<CustomCategory> {
    const prisma = await getPrismaAsync();
    return prisma.customCategory.create({
      data: category,
    });
  }

  async delete(id: string): Promise<void> {
    const prisma = await getPrismaAsync();
    await prisma.customCategory.delete({
      where: { id },
    });
  }
}
