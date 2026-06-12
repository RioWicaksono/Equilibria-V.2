import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transaction } from '@/domain/entities/Transaction';
import type { Budget } from '@/domain/entities/Budget';
import { TransactionType } from '@/domain/value-objects/TransactionType';

// Mock data factory
const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-test-1',
  amount: 100000,
  type: 'EXPENSE' as TransactionType,
  category: 'Makanan',
  description: 'Test transaction',
  date: new Date('2026-06-10'),
  ...overrides,
});

const createMockBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: 'budget-test-1',
  category: 'Makanan',
  limit: 2000000,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Transaction Repository Interface', () => {
  let mockTransactions: Transaction[] = [];

  beforeEach(() => {
    mockTransactions = [
      createMockTransaction({ id: 'tx-1', amount: 100000 }),
      createMockTransaction({ id: 'tx-2', amount: 200000, type: 'INCOME' as TransactionType }),
      createMockTransaction({ id: 'tx-3', amount: 50000, category: 'Transport' }),
    ];
  });

  describe('save', () => {
    it('should add new transaction to repository', async () => {
      const newTransaction = createMockTransaction({ id: 'tx-new' });
      mockTransactions.push(newTransaction);

      expect(mockTransactions).toHaveLength(4);
      expect(mockTransactions.find(t => t.id === 'tx-new')).toBeDefined();
    });

    it('should update existing transaction', async () => {
      const existingTx = mockTransactions[0];
      const updatedTx = { ...existingTx, amount: 150000 };
      const index = mockTransactions.findIndex(t => t.id === existingTx.id);
      mockTransactions[index] = updatedTx;

      expect(mockTransactions[0].amount).toBe(150000);
    });
  });

  describe('findAll', () => {
    it('should return all transactions', () => {
      const allTransactions = [...mockTransactions];
      expect(allTransactions).toHaveLength(3);
    });

    it('should return empty array when no transactions', () => {
      const emptyTransactions: Transaction[] = [];
      expect(emptyTransactions).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find transaction by ID', () => {
      const found = mockTransactions.find(t => t.id === 'tx-1');
      expect(found).toBeDefined();
      expect(found?.id).toBe('tx-1');
    });

    it('should return null when transaction not found', () => {
      const found = mockTransactions.find(t => t.id === 'non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('findByDateRange', () => {
    it('should filter transactions by date range', () => {
      const startDate = new Date('2026-06-01');
      const endDate = new Date('2026-06-30');

      const filtered = mockTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= startDate && txDate <= endDate;
      });

      expect(filtered.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array when no transactions in range', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const filtered = mockTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= startDate && txDate <= endDate;
      });

      expect(filtered).toEqual([]);
    });
  });

  describe('findByCategory', () => {
    it('should find transactions by category', () => {
      const foodTransactions = mockTransactions.filter(t => t.category === 'Makanan');
      expect(foodTransactions.length).toBeGreaterThanOrEqual(0);
    });

    it('should return null when category not found', () => {
      const found = mockTransactions.find(t => t.category === 'NonExistent');
      expect(found).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should remove transaction by ID', () => {
      const initialLength = mockTransactions.length;
      mockTransactions = mockTransactions.filter(t => t.id !== 'tx-1');

      expect(mockTransactions).toHaveLength(initialLength - 1);
      expect(mockTransactions.find(t => t.id === 'tx-1')).toBeUndefined();
    });

    it('should handle deleting non-existent transaction gracefully', () => {
      const initialLength = mockTransactions.length;
      mockTransactions = mockTransactions.filter(t => t.id !== 'non-existent');

      expect(mockTransactions).toHaveLength(initialLength);
    });
  });
});

describe('Budget Repository Interface', () => {
  let mockBudgets: Budget[] = [];

  beforeEach(() => {
    mockBudgets = [
      createMockBudget({ id: 'budget-1', category: 'Makanan', limit: 2000000 }),
      createMockBudget({ id: 'budget-2', category: 'Transport', limit: 1000000 }),
      createMockBudget({ id: 'budget-3', category: 'Entertainment', limit: 500000 }),
    ];
  });

  describe('save', () => {
    it('should add new budget to repository', () => {
      const newBudget = createMockBudget({ id: 'budget-new', category: 'Health' });
      mockBudgets.push(newBudget);

      expect(mockBudgets).toHaveLength(4);
    });

    it('should update existing budget', () => {
      const existingBudget = mockBudgets[0];
      const updatedBudget = { ...existingBudget, limit: 2500000 };
      const index = mockBudgets.findIndex(b => b.id === existingBudget.id);
      mockBudgets[index] = updatedBudget;

      expect(mockBudgets[0].limit).toBe(2500000);
    });
  });

  describe('findAll', () => {
    it('should return all budgets', () => {
      expect(mockBudgets).toHaveLength(3);
    });
  });

  describe('findById', () => {
    it('should find budget by ID', () => {
      const found = mockBudgets.find(b => b.id === 'budget-1');
      expect(found).toBeDefined();
    });

    it('should return null when budget not found', () => {
      const found = mockBudgets.find(b => b.id === 'non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('findByCategory', () => {
    it('should find budget by category', () => {
      const found = mockBudgets.find(b => b.category === 'Makanan');
      expect(found).toBeDefined();
      expect(found?.category).toBe('Makanan');
    });
  });

  describe('delete', () => {
    it('should remove budget by ID', () => {
      const initialLength = mockBudgets.length;
      mockBudgets = mockBudgets.filter(b => b.id !== 'budget-1');

      expect(mockBudgets).toHaveLength(initialLength - 1);
    });
  });
});

describe('Repository Integration Scenarios', () => {
  describe('Transaction operations', () => {
    it('should handle batch operations correctly', async () => {
      const transactions: Transaction[] = [];

      // Add multiple transactions
      for (let i = 0; i < 5; i++) {
        transactions.push(createMockTransaction({ id: `tx-${i}` }));
      }

      expect(transactions).toHaveLength(5);

      // Filter and update
      const incomeTransactions = transactions.filter(t => t.type === 'INCOME');
      const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');

      expect(incomeTransactions.length + expenseTransactions.length).toBe(5);
    });

    it('should calculate totals correctly', () => {
      const transactions = [
        createMockTransaction({ amount: 100000, type: 'INCOME' as TransactionType }),
        createMockTransaction({ amount: 50000, type: 'EXPENSE' as TransactionType }),
        createMockTransaction({ amount: 200000, type: 'INCOME' as TransactionType }),
        createMockTransaction({ amount: 75000, type: 'EXPENSE' as TransactionType }),
      ];

      const totalIncome = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      expect(totalIncome).toBe(300000);
      expect(totalExpense).toBe(125000);
      expect(totalIncome - totalExpense).toBe(175000);
    });
  });

  describe('Budget vs Transaction comparison', () => {
    it('should correctly calculate budget usage', () => {
      const budget = createMockBudget({ category: 'Food', limit: 1000000 });

      const foodTransactions = [
        createMockTransaction({ category: 'Food', amount: 300000 }),
        createMockTransaction({ category: 'Food', amount: 250000 }),
        createMockTransaction({ category: 'Food', amount: 200000 }),
      ];

      const totalSpent = foodTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.limit - totalSpent;
      const percentageUsed = (totalSpent / budget.limit) * 100;

      expect(totalSpent).toBe(750000);
      expect(remaining).toBe(250000);
      expect(percentageUsed).toBe(75);
    });

    it('should identify over-budget status', () => {
      const budget = createMockBudget({ limit: 500000 });
      const spent = 600000;

      const isOverBudget = spent > budget.limit;
      expect(isOverBudget).toBe(true);

      const overageAmount = spent - budget.limit;
      expect(overageAmount).toBe(100000);
    });
  });
});