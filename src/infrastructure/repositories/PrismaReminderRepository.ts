import { prisma } from '../database/PrismaClient';

export interface Reminder {
  id: string;
  title: string;
  date: Date;
  amount: number | null;
  status: 'PENDING' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  urgent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaReminderRepository {
  async findAll(): Promise<Reminder[]> {
    return prisma.reminder.findMany({
      orderBy: { date: 'asc' }
    });
  }

  async findByStatus(status: string): Promise<Reminder[]> {
    return prisma.reminder.findMany({
      where: { status },
      orderBy: { date: 'asc' }
    });
  }

  async findByPriority(priority: string): Promise<Reminder[]> {
    return prisma.reminder.findMany({
      where: { priority },
      orderBy: { date: 'asc' }
    });
  }

  async save(reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reminder> {
    return prisma.reminder.create({
      data: reminder as Record<string, unknown>
    });
  }

  async update(id: string, data: Partial<Reminder>): Promise<Reminder> {
    return prisma.reminder.update({
      where: { id },
      data: data as Record<string, unknown>
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.reminder.delete({
      where: { id }
    });
  }

  async createDefaults(): Promise<Reminder[]> {
    const existing = await this.findAll();
    if (existing.length > 0) return existing;

    const defaults = [
      {
        title: 'Bayar Listrik',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 5),
        amount: 500000,
        status: 'PENDING',
        priority: 'HIGH',
        frequency: 'MONTHLY',
        urgent: true
      },
      {
        title: 'Tagihan Internet',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
        amount: 350000,
        status: 'PENDING',
        priority: 'MEDIUM',
        frequency: 'MONTHLY',
        urgent: false
      },
      {
        title: 'Iuran Warga',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
        amount: 50000,
        status: 'PENDING',
        priority: 'LOW',
        frequency: 'MONTHLY',
        urgent: false
      }
    ];

    const results = [];
    for (const d of defaults) {
      const created = await this.save(d);
      results.push(created);
    }
    return results;
  }
}
