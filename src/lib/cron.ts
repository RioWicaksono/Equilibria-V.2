// Cron utility functions for scheduled tasks
import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';
import { logger } from '@/lib/logger';

interface ProcessResult {
  processed: number;
  errors: string[];
  createdTransactions: Array<{
    id: string;
    recurringId: string;
    amount: number;
    type: string;
    category: string;
  }>;
}

export async function processRecurringTransactions(): Promise<ProcessResult> {
  const errors: string[] = [];
  const createdTransactions: ProcessResult['createdTransactions'] = [];
  let processed = 0;

  try {
    const prisma = await getPrismaAsync();

    // Get all recurring transactions that are due
    const now = new Date();
    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: {
        nextDate: { lte: now },
      },
      orderBy: { nextDate: 'asc' },
    });

    logger.info(`[Cron] Found ${recurringTransactions.length} recurring transactions to process`);

    for (const recurring of recurringTransactions) {
      try {
        // Calculate next date based on frequency
        const nextDate = calculateNextDate(recurring.nextDate, recurring.frequency);

        // Get first wallet for balance update
        const wallet = await prisma.wallet.findFirst();
        if (!wallet) {
          errors.push(`No wallet found for recurring transaction ${recurring.id}`);
          continue;
        }

        // Wrap all operations in a transaction for atomicity
        const transaction = await prisma.$transaction(async (tx) => {
          // Create the actual transaction
          const newTransaction = await tx.transaction.create({
            data: {
              amount: recurring.amount,
              type: recurring.type,
              category: recurring.category,
              description: `[Auto] ${recurring.description}`,
              date: recurring.nextDate,
              walletId: wallet.id,
            },
          });

          // Update wallet balance
          const balanceUpdate = recurring.type === 'EXPENSE'
            ? { decrement: recurring.amount }
            : { increment: recurring.amount };

          await tx.wallet.update({
            where: { id: wallet.id },
            data: balanceUpdate,
          });

          // Update next date for the recurring transaction
          await tx.recurringTransaction.update({
            where: { id: recurring.id },
            data: { nextDate },
          });

          return newTransaction;
        });

        createdTransactions.push({
          id: transaction.id,
          recurringId: recurring.id,
          amount: recurring.amount,
          type: recurring.type,
          category: recurring.category,
        });

        processed++;
        logger.info(`[Cron] Created transaction ${transaction.id} from recurring ${recurring.id}`);

      } catch (err) {
        const errorMsg = `Failed to process recurring ${recurring.id}: ${err instanceof Error ? err.message : 'Unknown error'}`;
        errors.push(errorMsg);
        logger.error(`[Cron] ${errorMsg}`);
      }
    }

    logger.info(`[Cron] Completed: ${processed} processed, ${errors.length} errors`);

  } catch (error) {
    const errorMsg = `Cron job failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMsg);
    logger.error(`[Cron] ${errorMsg}`);
  }

  return { processed, errors, createdTransactions };
}

/**
 * Calculate next occurrence date based on frequency
 */
export function calculateNextDate(currentDate: Date, frequency: string): Date {
  const next = new Date(currentDate);

  switch (frequency.toUpperCase()) {
    case 'DAILY':
    case 'HARIAN':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
    case 'MINGGUAN':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
    case 'BULANAN':
      // Add one month, keeping the same day
      next.setMonth(next.getMonth() + 1);
      break;
    case 'YEARLY':
    case 'TAHUNAN':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      // Default to monthly
      next.setMonth(next.getMonth() + 1);
  }

  return next;
}

export async function getUpcomingReminders(days: number = 7): Promise<{
  reminders: Array<{
    id: string;
    title: string;
    date: string;
    amount?: number;
    priority: string;
    frequency: string;
  }>;
}> {
  try {
    const prisma = await getPrismaAsync();
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const reminders = await prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        date: {
          gte: now,
          lte: futureDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return {
      reminders: reminders.map(r => ({
        id: r.id,
        title: r.title,
        date: r.date.toISOString(),
        amount: r.amount || undefined,
        priority: r.priority,
        frequency: r.frequency,
      })),
    };
  } catch (error) {
    logger.error('[Cron] Failed to get reminders:', error);
    return { reminders: [] };
  }
}

export async function checkOverdueDebts(): Promise<{
  overdueDebts: Array<{
    id: string;
    name: string;
    amount: number;
    paidAmount: number;
    dueDate: string;
    type: string;
  }>;
}> {
  try {
    const prisma = await getPrismaAsync();
    const now = new Date();

    const debts = await prisma.debt.findMany({
      where: {
        status: 'UNPAID',
        dueDate: {
          lte: now,
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return {
      overdueDebts: debts.map(d => ({
        id: d.id,
        name: d.name,
        amount: d.amount,
        paidAmount: d.paidAmount,
        dueDate: d.dueDate?.toISOString() || '',
        type: d.type,
      })),
    };
  } catch (error) {
    logger.error('[Cron] Failed to check overdue debts:', error);
    return { overdueDebts: [] };
  }
}

/**
 * Mark reminder as completed (for recurring reminders, creates next occurrence)
 */
export async function completeReminder(reminderId: string): Promise<{
  success: boolean;
  nextOccurrence?: Date;
  error?: string;
}> {
  try {
    const prisma = await getPrismaAsync();
    const reminder = await prisma.reminder.findUnique({ where: { id: reminderId } });

    if (!reminder) {
      return { success: false, error: 'Reminder not found' };
    }

    // Calculate next occurrence for recurring reminders
    let nextOccurrence: Date | null = null;

    if (reminder.frequency !== 'ONCE') {
      nextOccurrence = calculateNextDate(reminder.date, reminder.frequency);

      // Update reminder with new date and keep status
      await prisma.reminder.update({
        where: { id: reminderId },
        data: {
          date: nextOccurrence,
          status: 'PENDING',
        },
      });
    } else {
      // Mark as completed for non-recurring
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: 'COMPLETED' },
      });
    }

    return { success: true, nextOccurrence: nextOccurrence || undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
