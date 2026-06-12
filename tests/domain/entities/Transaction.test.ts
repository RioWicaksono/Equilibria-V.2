import { describe, it, expect } from 'vitest';
import type { Transaction } from '@/domain/entities/Transaction';

describe('Transaction Entity', () => {
  describe('Transaction interface', () => {
    it('should have correct structure', () => {
      const transaction: Transaction = {
        id: 'tx-123',
        amount: 150000,
        type: 'INCOME',
        category: 'Gaji',
        description: 'Gaji bulanan',
        date: new Date('2026-06-10'),
      };

      expect(transaction.id).toBe('tx-123');
      expect(transaction.amount).toBe(150000);
      expect(transaction.type).toBe('INCOME');
      expect(transaction.category).toBe('Gaji');
      expect(transaction.description).toBe('Gaji bulanan');
      expect(transaction.date).toBeInstanceOf(Date);
    });

    it('should support optional fields', () => {
      const transaction: Transaction = {
        id: 'tx-123',
        amount: 150000,
        type: 'EXPENSE',
        category: 'Makanan',
        description: 'Makan siang',
        date: new Date('2026-06-10'),
        createdAt: new Date(),
        categoryName: 'Makanan',
        categoryIcon: '🍔',
        categoryColor: '#FF0000',
      };

      expect(transaction.createdAt).toBeDefined();
      expect(transaction.categoryName).toBe('Makanan');
      expect(transaction.categoryIcon).toBe('🍔');
      expect(transaction.categoryColor).toBe('#FF0000');
    });

    it('should work with minimum required fields', () => {
      const transaction: Transaction = {
        id: 'tx-min',
        amount: 1000,
        type: 'EXPENSE',
        category: 'Test',
        description: 'Minimal transaction',
        date: new Date(),
      };

      expect(transaction.id).toBeDefined();
      expect(transaction.amount).toBeGreaterThan(0);
    });
  });

  describe('Transaction type guard', () => {
    it('should correctly identify INCOME transactions', () => {
      const incomeTransaction: Transaction = {
        id: 'tx-1',
        amount: 5000000,
        type: 'INCOME',
        category: 'Gaji',
        description: 'Gaji bulanan',
        date: new Date(),
      };

      expect(incomeTransaction.type).toBe('INCOME');
    });

    it('should correctly identify EXPENSE transactions', () => {
      const expenseTransaction: Transaction = {
        id: 'tx-2',
        amount: 50000,
        type: 'EXPENSE',
        category: 'Makanan',
        description: 'Makan siang',
        date: new Date(),
      };

      expect(expenseTransaction.type).toBe('EXPENSE');
    });
  });

  describe('Transaction date handling', () => {
    it('should handle ISO date string', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        amount: 100000,
        type: 'EXPENSE',
        category: 'Transport',
        description: 'Bensin',
        date: '2026-06-10',
      } as unknown as Transaction;

      const date = new Date(transaction.date);
      expect(date).toBeInstanceOf(Date);
    });

    it('should handle Date object', () => {
      const transactionDate = new Date('2026-06-10');
      const transaction: Transaction = {
        id: 'tx-1',
        amount: 100000,
        type: 'EXPENSE',
        category: 'Transport',
        description: 'Bensin',
        date: transactionDate,
      };

      expect(transaction.date).toBe(transactionDate);
    });
  });
});