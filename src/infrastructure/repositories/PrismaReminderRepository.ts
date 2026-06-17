import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';
import { Prisma } from '@prisma/client';

export type Reminder = Prisma.ReminderGetPayload<object>;
export type ReminderCreateInput = Prisma.ReminderCreateInput;
export type ReminderUpdateInput = Prisma.ReminderUpdateInput;

export class PrismaReminderRepository {
  async findAll(): Promise<Reminder[]> {
    const prisma = await getPrismaAsync();
    return prisma.reminder.findMany({
      orderBy: { date: 'asc' }
    });
  }

  async findByStatus(status: string): Promise<Reminder[]> {
    const prisma = await getPrismaAsync();
    return prisma.reminder.findMany({
      where: { status },
      orderBy: { date: 'asc' }
    });
  }

  async findByPriority(priority: string): Promise<Reminder[]> {
    const prisma = await getPrismaAsync();
    return prisma.reminder.findMany({
      where: { priority },
      orderBy: { date: 'asc' }
    });
  }

  async save(data: ReminderCreateInput): Promise<Reminder> {
    const prisma = await getPrismaAsync();
    return prisma.reminder.create({ data });
  }

  async update(id: string, data: ReminderUpdateInput): Promise<Reminder> {
    const prisma = await getPrismaAsync();
    return prisma.reminder.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<void> {
    const prisma = await getPrismaAsync();
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
        status: 'PENDING' as const,
        priority: 'HIGH' as const,
        frequency: 'MONTHLY' as const,
        urgent: true
      },
      {
        title: 'Tagihan Internet',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
        amount: 350000,
        status: 'PENDING' as const,
        priority: 'MEDIUM' as const,
        frequency: 'MONTHLY' as const,
        urgent: false
      },
      {
        title: 'Iuran Warga',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
        amount: 50000,
        status: 'PENDING' as const,
        priority: 'LOW' as const,
        frequency: 'MONTHLY' as const,
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
