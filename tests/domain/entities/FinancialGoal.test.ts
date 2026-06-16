import { describe, it, expect } from 'vitest';
import type { FinancialGoal } from '@/domain/entities/FinancialGoal';

describe('FinancialGoal Entity', () => {
  describe('FinancialGoal interface structure', () => {
    it('should have correct structure', () => {
      const goal: FinancialGoal = {
        id: 'goal-123',
        name: 'Tabungan Liburan',
        targetAmount: 10000000,
        currentAmount: 5000000,
        deadline: new Date('2026-12-31'),
        description: 'Tabungan untuk liburan tahun baru',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(goal.id).toBe('goal-123');
      expect(goal.name).toBe('Tabungan Liburan');
      expect(goal.targetAmount).toBe(10000000);
      expect(goal.currentAmount).toBe(5000000);
      expect(goal.deadline).toBeInstanceOf(Date);
    });

    it('should work with minimum required fields', () => {
      const goal: FinancialGoal = {
        id: 'goal-min',
        name: 'Test Goal',
        targetAmount: 1000000,
        currentAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(goal.id).toBeDefined();
      expect(goal.name).toBeDefined();
      expect(goal.targetAmount).toBeGreaterThan(0);
      expect(goal.currentAmount).toBe(0);
      expect(goal.deadline).toBeUndefined();
    });

    it('should support optional fields', () => {
      const goal: FinancialGoal = {
        id: 'goal-1',
        name: 'Emergency Fund',
        targetAmount: 50000000,
        currentAmount: 10000000,
        description: 'Dana darurat 6 bulan pengeluaran',
        deadline: new Date('2027-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(goal.description).toBe('Dana darurat 6 bulan pengeluaran');
      expect(goal.deadline).toBeInstanceOf(Date);
    });
  });

  describe('Goal progress calculations', () => {
    it('should calculate progress percentage correctly', () => {
      const goal: FinancialGoal = {
        id: 'g1',
        name: 'Test',
        targetAmount: 10000000,
        currentAmount: 2500000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
      expect(progressPercentage).toBe(25);
    });

    it('should handle 0% progress', () => {
      const goal: FinancialGoal = {
        id: 'g1',
        name: 'Test',
        targetAmount: 10000000,
        currentAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
      expect(progressPercentage).toBe(0);
    });

    it('should handle 100% progress', () => {
      const goal: FinancialGoal = {
        id: 'g1',
        name: 'Test',
        targetAmount: 5000000,
        currentAmount: 5000000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
      expect(progressPercentage).toBe(100);
    });

    it('should calculate remaining amount correctly', () => {
      const goal: FinancialGoal = {
        id: 'g1',
        name: 'Test',
        targetAmount: 10000000,
        currentAmount: 3500000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const remainingAmount = goal.targetAmount - goal.currentAmount;
      expect(remainingAmount).toBe(6500000);
    });

    it('should identify completed goal', () => {
      const goal: FinancialGoal = {
        id: 'g1',
        name: 'Test',
        targetAmount: 5000000,
        currentAmount: 5000000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const isCompleted = goal.currentAmount >= goal.targetAmount;
      expect(isCompleted).toBe(true);
    });

    it('should identify incomplete goal', () => {
      const goal: FinancialGoal = {
        id: 'g1',
        name: 'Test',
        targetAmount: 5000000,
        currentAmount: 4999999,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const isCompleted = goal.currentAmount >= goal.targetAmount;
      expect(isCompleted).toBe(false);
    });
  });

  describe('Deadline validation', () => {
    it('should identify goal with future deadline', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const goal: FinancialGoal = {
        id: 'g1',
        name: 'Test',
        targetAmount: 10000000,
        currentAmount: 0,
        deadline: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (goal.deadline) {
        const isOverdue = goal.deadline < new Date();
        expect(isOverdue).toBe(false);
      }
    });

    it('should identify overdue goal', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const goal: FinancialGoal = {
        id: 'g1',
        name: 'Test',
        targetAmount: 10000000,
        currentAmount: 5000000,
        deadline: pastDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (goal.deadline) {
        const isOverdue = goal.deadline < new Date();
        expect(isOverdue).toBe(true);
      }
    });

    it('should handle goal without deadline', () => {
      const goal: FinancialGoal = {
        id: 'g1',
        name: 'Test',
        targetAmount: 10000000,
        currentAmount: 5000000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(goal.deadline).toBeUndefined();
    });
  });

  describe('Amount validation', () => {
    it('should handle valid positive amounts', () => {
      const goal: FinancialGoal = {
        id: 'g1',
        name: 'Test',
        targetAmount: 1000000,
        currentAmount: 500000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(goal.targetAmount).toBeGreaterThan(0);
      expect(goal.currentAmount).toBeGreaterThanOrEqual(0);
      expect(goal.currentAmount).toBeLessThanOrEqual(goal.targetAmount);
    });

    it('should handle overflow current amount', () => {
      const goal: FinancialGoal = {
        id: 'g1',
        name: 'Test',
        targetAmount: 1000000,
        currentAmount: 1500000, // More than target
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(goal.currentAmount).toBeGreaterThan(goal.targetAmount);
      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
      expect(progressPercentage).toBe(150);
    });
  });
});
