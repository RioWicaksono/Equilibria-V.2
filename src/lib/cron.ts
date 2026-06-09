// Cron utility functions for scheduled tasks

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function processRecurringTransactions(): Promise<{
  processed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;

  // Cron functionality placeholder - will be implemented with proper recurring module
  // For now, return empty result

  return { processed, errors };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getUpcomingReminders(days: number = 7): Promise<{
  reminders: Array<{
    id: string;
    title: string;
    date: string;
    amount?: number;
    priority: string;
  }>;
}> {
  return { reminders: [] };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function checkOverdueDebts(): Promise<{
  overdueDebts: Array<{
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    type: string;
  }>;
}> {
  return { overdueDebts: [] };
}