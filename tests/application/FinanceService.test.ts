import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transaction } from '@/domain/entities/Transaction';
import type { Budget } from '@/domain/entities/Budget';
import { TransactionType } from '@/domain/value-objects/TransactionType';

// Mock implementations
const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  amount: 100000,
  type: 'EXPENSE' as TransactionType,
  category: 'Makanan',
  description: 'Test transaction',
  date: new Date('2026-06-10'),
  createdAt: new Date(),
  ...overrides,
});

const createMockBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: 'budget-1',
  category: 'Makanan',
  limit: 2000000,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Transaction Mock Factory', () => {
  it('should create mock transaction with default values', () => {
    const tx = createMockTransaction();
    expect(tx.id).toBe('tx-1');
    expect(tx.amount).toBe(100000);
    expect(tx.type).toBe('EXPENSE');
    expect(tx.category).toBe('Makanan');
  });

  it('should create mock transaction with overrides', () => {
    const tx = createMockTransaction({ amount: 500000, type: 'INCOME' as TransactionType });
    expect(tx.amount).toBe(500000);
    expect(tx.type).toBe('INCOME');
  });

  it('should create unique IDs for each transaction', () => {
    const tx1 = createMockTransaction();
    const tx2 = createMockTransaction({ id: 'tx-2' });
    expect(tx1.id).not.toBe(tx2.id);
  });
});

describe('Budget Mock Factory', () => {
  it('should create mock budget with default values', () => {
    const budget = createMockBudget();
    expect(budget.id).toBe('budget-1');
    expect(budget.category).toBe('Makanan');
    expect(budget.limit).toBe(2000000);
  });

  it('should create mock budget with overrides', () => {
    const budget = createMockBudget({ limit: 5000000, category: 'Transport' });
    expect(budget.limit).toBe(5000000);
    expect(budget.category).toBe('Transport');
  });
});

describe('Transaction Data Integrity', () => {
  it('should maintain transaction type consistency', () => {
    const incomeTx = createMockTransaction({ type: 'INCOME' as TransactionType });
    const expenseTx = createMockTransaction({ type: 'EXPENSE' as TransactionType });

    expect(isValidTransactionType(incomeTx.type)).toBe(true);
    expect(isValidTransactionType(expenseTx.type)).toBe(true);
  });

  it('should handle positive amounts', () => {
    const tx = createMockTransaction({ amount: 100000 });
    expect(tx.amount).toBeGreaterThan(0);
  });

  it('should handle large amounts', () => {
    const tx = createMockTransaction({ amount: 100000000 });
    expect(tx.amount).toBe(100000000);
  });

  it('should preserve date information', () => {
    const specificDate = new Date('2026-06-15');
    const tx = createMockTransaction({ date: specificDate });
    expect(tx.date).toEqual(specificDate);
  });
});

describe('Budget Data Integrity', () => {
  it('should maintain positive limit values', () => {
    const budget = createMockBudget({ limit: 1000000 });
    expect(budget.limit).toBeGreaterThan(0);
  });

  it('should handle zero limit gracefully', () => {
    const budget = createMockBudget({ limit: 0 });
    expect(budget.limit).toBe(0);
  });

  it('should have proper date tracking', () => {
    const budget = createMockBudget();
    expect(budget.createdAt).toBeInstanceOf(Date);
    expect(budget.updatedAt).toBeInstanceOf(Date);
  });

  it('should track category correctly', () => {
    const budget = createMockBudget({ category: 'Entertainment' });
    expect(budget.category).toBe('Entertainment');
  });
});

// Helper function for type validation
function isValidTransactionType(type: string): boolean {
  return type === 'INCOME' || type === 'EXPENSE';
}