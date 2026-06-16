import { describe, it, expect } from 'vitest';
import type { RecurringTransaction } from '@/domain/entities/RecurringTransaction';

describe('RecurringTransaction Entity', () => {
  describe('RecurringTransaction interface structure', () => {
    it('should have correct structure', () => {
      const recurring: RecurringTransaction = {
        id: 'rec-123',
        amount: 500000,
        type: 'EXPENSE',
        category: 'Sewa',
        description: 'Sewa kantor bulanan',
        frequency: 'MONTHLY',
        nextDate: new Date('2026-07-01'),
        createdAt: new Date(),
      };

      expect(recurring.id).toBe('rec-123');
      expect(recurring.amount).toBe(500000);
      expect(recurring.type).toBe('EXPENSE');
      expect(recurring.category).toBe('Sewa');
      expect(recurring.description).toBe('Sewa kantor bulanan');
      expect(recurring.frequency).toBe('MONTHLY');
      expect(recurring.nextDate).toBeInstanceOf(Date);
    });

    it('should work with minimum required fields', () => {
      const recurring: RecurringTransaction = {
        id: 'rec-min',
        amount: 100000,
        type: 'INCOME',
        category: 'Gaji',
        description: 'Gaji bulanan',
        frequency: 'MONTHLY',
        nextDate: new Date(),
        createdAt: new Date(),
      };

      expect(recurring.id).toBeDefined();
      expect(recurring.amount).toBeGreaterThan(0);
      expect(recurring.frequency).toBeDefined();
    });
  });

  describe('Frequency validation', () => {
    it('should correctly identify DAILY frequency', () => {
      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 50000,
        type: 'EXPENSE',
        category: 'Makanan',
        description: 'Uang makan harian',
        frequency: 'DAILY',
        nextDate: new Date(),
        createdAt: new Date(),
      };

      expect(recurring.frequency).toBe('DAILY');
    });

    it('should correctly identify WEEKLY frequency', () => {
      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 200000,
        type: 'EXPENSE',
        category: 'Transport',
        description: 'Bensin mingguan',
        frequency: 'WEEKLY',
        nextDate: new Date(),
        createdAt: new Date(),
      };

      expect(recurring.frequency).toBe('WEEKLY');
    });

    it('should correctly identify MONTHLY frequency', () => {
      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 3000000,
        type: 'EXPENSE',
        category: 'Sewa',
        description: 'Sewa kontrakan',
        frequency: 'MONTHLY',
        nextDate: new Date(),
        createdAt: new Date(),
      };

      expect(recurring.frequency).toBe('MONTHLY');
    });

    it('should correctly identify YEARLY frequency', () => {
      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 12000000,
        type: 'EXPENSE',
        category: 'Asuransi',
        description: 'Premi asuransi tahunan',
        frequency: 'YEARLY',
        nextDate: new Date(),
        createdAt: new Date(),
      };

      expect(recurring.frequency).toBe('YEARLY');
    });
  });

  describe('Transaction type validation', () => {
    it('should correctly identify INCOME recurring transaction', () => {
      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 1000000,
        type: 'INCOME',
        category: 'Gaji',
        description: 'Gaji bulanan',
        frequency: 'MONTHLY',
        nextDate: new Date(),
        createdAt: new Date(),
      };

      expect(recurring.type).toBe('INCOME');
    });

    it('should correctly identify EXPENSE recurring transaction', () => {
      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 500000,
        type: 'EXPENSE',
        category: 'Langganan',
        description: 'Netflix bulanan',
        frequency: 'MONTHLY',
        nextDate: new Date(),
        createdAt: new Date(),
      };

      expect(recurring.type).toBe('EXPENSE');
    });
  });

  describe('Next date calculations', () => {
    it('should calculate next date for DAILY frequency', () => {
      const today = new Date('2026-06-15');
      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 50000,
        type: 'EXPENSE',
        category: 'Test',
        description: 'Daily expense',
        frequency: 'DAILY',
        nextDate: today,
        createdAt: new Date(),
      };

      const nextDate = new Date(recurring.nextDate);
      nextDate.setDate(nextDate.getDate() + 1);
      expect(nextDate.getDate()).toBe(16);
    });

    it('should calculate next date for WEEKLY frequency', () => {
      const today = new Date('2026-06-15');
      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 100000,
        type: 'EXPENSE',
        category: 'Test',
        description: 'Weekly expense',
        frequency: 'WEEKLY',
        nextDate: today,
        createdAt: new Date(),
      };

      const nextDate = new Date(recurring.nextDate);
      nextDate.setDate(nextDate.getDate() + 7);
      expect(nextDate.getDate()).toBe(22);
    });

    it('should calculate next date for MONTHLY frequency', () => {
      const today = new Date('2026-06-15');
      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 2000000,
        type: 'EXPENSE',
        category: 'Test',
        description: 'Monthly expense',
        frequency: 'MONTHLY',
        nextDate: today,
        createdAt: new Date(),
      };

      const nextDate = new Date(recurring.nextDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      expect(nextDate.getMonth()).toBe(6); // July
    });

    it('should calculate next date for YEARLY frequency', () => {
      const today = new Date('2026-06-15');
      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 5000000,
        type: 'EXPENSE',
        category: 'Test',
        description: 'Yearly expense',
        frequency: 'YEARLY',
        nextDate: today,
        createdAt: new Date(),
      };

      const nextDate = new Date(recurring.nextDate);
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      expect(nextDate.getFullYear()).toBe(2027);
    });

    it('should handle month-end edge case for MONTHLY', () => {
      const jan31 = new Date('2026-01-31');
      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 100000,
        type: 'EXPENSE',
        category: 'Test',
        description: 'Monthly on 31st',
        frequency: 'MONTHLY',
        nextDate: jan31,
        createdAt: new Date(),
      };

      // When adding a month to Jan 31, it becomes Feb 28
      const nextDate = new Date(recurring.nextDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      // Feb doesn't have 31 days, so it rolls over to March
      expect(nextDate.getMonth()).toBe(2); // March
    });
  });

  describe('Next date comparison', () => {
    it('should identify upcoming transaction', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 100000,
        type: 'EXPENSE',
        category: 'Test',
        description: 'Upcoming',
        frequency: 'MONTHLY',
        nextDate: futureDate,
        createdAt: new Date(),
      };

      const isUpcoming = recurring.nextDate > new Date();
      expect(isUpcoming).toBe(true);
    });

    it('should identify overdue transaction', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 100000,
        type: 'EXPENSE',
        category: 'Test',
        description: 'Overdue',
        frequency: 'MONTHLY',
        nextDate: pastDate,
        createdAt: new Date(),
      };

      const isOverdue = recurring.nextDate < new Date();
      expect(isOverdue).toBe(true);
    });

    it('should identify transaction due today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const recurring: RecurringTransaction = {
        id: 'r1',
        amount: 100000,
        type: 'EXPENSE',
        category: 'Test',
        description: 'Due today',
        frequency: 'MONTHLY',
        nextDate: today,
        createdAt: new Date(),
      };

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const isDueToday = recurring.nextDate.toDateString() === now.toDateString();
      expect(isDueToday).toBe(true);
    });
  });
});
