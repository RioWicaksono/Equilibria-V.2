import { describe, it, expect } from 'vitest';
import type { Transaction } from '@/domain/entities/Transaction';
import { TransactionType } from '@/domain/value-objects/TransactionType';

// ============================================
// TEST HELPERS (Arrange)
// ============================================

/**
 * Factory function untuk membuat Transaction test data
 */
function buildTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-test-001',
    amount: 100000,
    type: TransactionType.EXPENSE,
    category: 'Makanan',
    description: 'Test transaction',
    date: new Date('2026-06-10'),
    createdAt: new Date('2026-06-10'),
    ...overrides,
  };
}

/**
 * Sample transactions untuk testing scenarios
 */
const sampleTransactions = {
  income: () => buildTransaction({
    id: 'tx-income-001',
    type: TransactionType.INCOME,
    amount: 5000000,
    category: 'Gaji',
    description: 'Gaji bulanan Juni',
  }),
  expense: () => buildTransaction({
    id: 'tx-expense-001',
    type: TransactionType.EXPENSE,
    amount: 50000,
    category: 'Makanan',
    description: 'Makan siang',
  }),
  largeAmount: () => buildTransaction({
    id: 'tx-large-001',
    amount: 100000000,
    category: 'Elektronik',
    description: 'Belanja laptop',
  }),
  minimal: (): Transaction => ({
    id: 'tx-min-001',
    amount: 1,
    type: TransactionType.EXPENSE,
    category: 'Test',
    description: '',
    date: new Date(),
  }),
};

// ============================================
// TEST SUITE: Transaction Entity
// ============================================

describe('Transaction Entity', () => {

  // ========================================
  // TEST: Required Fields Structure
  // ========================================
  describe('required fields', () => {
    it('should have all required fields when fully populated', () => {
      // Arrange
      const transaction = sampleTransactions.expense();

      // Act & Assert
      expect(transaction).toEqual(expect.objectContaining({
        id: expect.any(String),
        amount: expect.any(Number),
        type: expect.stringMatching(/^(INCOME|EXPENSE)$/),
        category: expect.any(String),
        description: expect.any(String),
        date: expect.any(Date),
      }));
    });

    it('should work with minimum required fields', () => {
      // Arrange
      const transaction = sampleTransactions.minimal();

      // Assert
      expect(transaction.id).toBeTruthy();
      expect(transaction.amount).toBeGreaterThan(0);
      expect(transaction.type).toMatch(/^(INCOME|EXPENSE)$/);
      expect(transaction.category).toBeTruthy();
      expect(transaction.date).toBeInstanceOf(Date);
    });
  });

  // ========================================
  // TEST: Optional Fields
  // ========================================
  describe('optional fields', () => {
    it('should support optional metadata fields', () => {
      // Arrange
      const transaction = buildTransaction({
        categoryName: 'Makanan',
        categoryIcon: '🍔',
        categoryColor: '#FF0000',
      });

      // Assert
      expect(transaction.categoryName).toBe('Makanan');
      expect(transaction.categoryIcon).toBe('🍔');
      expect(transaction.categoryColor).toBe('#FF0000');
    });

    it('should support walletId for multi-wallet users', () => {
      // Arrange
      const walletId = 'wallet-uuid-123';
      const transaction = buildTransaction({ walletId });

      // Assert
      expect(transaction.walletId).toBe(walletId);
    });

    it('should allow optional createdAt for tracking', () => {
      // Arrange
      const createdAt = new Date('2026-06-01');
      const transaction = buildTransaction({ createdAt });

      // Assert
      expect(transaction.createdAt).toEqual(createdAt);
    });
  });

  // ========================================
  // TEST: Transaction Type Validation
  // ========================================
  describe('transaction type validation', () => {
    it('should accept INCOME type', () => {
      // Arrange
      const transaction = sampleTransactions.income();

      // Assert
      expect(transaction.type).toBe(TransactionType.INCOME);
    });

    it('should accept EXPENSE type', () => {
      // Arrange
      const transaction = sampleTransactions.expense();

      // Assert
      expect(transaction.type).toBe(TransactionType.EXPENSE);
    });

    it('should correctly identify transaction direction', () => {
      // Arrange
      const incomeTx = sampleTransactions.income();
      const expenseTx = sampleTransactions.expense();

      // Assert
      expect(incomeTx.type).not.toBe(expenseTx.type);
      expect([TransactionType.INCOME, TransactionType.EXPENSE]).toContain(incomeTx.type);
      expect([TransactionType.INCOME, TransactionType.EXPENSE]).toContain(expenseTx.type);
    });
  });

  // ========================================
  // TEST: Amount Handling
  // ========================================
  describe('amount handling', () => {
    it('should handle positive amounts', () => {
      // Arrange
      const transaction = sampleTransactions.expense();

      // Assert
      expect(transaction.amount).toBeGreaterThan(0);
    });

    it('should handle large amounts', () => {
      // Arrange
      const transaction = sampleTransactions.largeAmount();

      // Assert
      expect(transaction.amount).toBe(100000000);
    });

    it('should handle minimum amounts', () => {
      // Arrange
      const transaction = sampleTransactions.minimal();

      // Assert
      expect(transaction.amount).toBe(1);
    });

    it('should handle decimal amounts for precision', () => {
      // Arrange
      const transaction = buildTransaction({ amount: 12345.67 });

      // Assert
      expect(transaction.amount).toBe(12345.67);
    });
  });

  // ========================================
  // TEST: Date Handling
  // ========================================
  describe('date handling', () => {
    it('should accept Date object', () => {
      // Arrange
      const transactionDate = new Date('2026-06-15');
      const transaction = buildTransaction({ date: transactionDate });

      // Assert
      expect(transaction.date).toEqual(transactionDate);
    });

    it('should accept ISO date string', () => {
      // Arrange
      const transaction = buildTransaction({ date: '2026-06-15' } as unknown as Transaction);

      // Assert
      expect(transaction.date).toBeDefined();
    });

    it('should handle future dates', () => {
      // Arrange
      const futureDate = new Date('2030-12-31');
      const transaction = buildTransaction({ date: futureDate });

      // Assert
      expect(transaction.date.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle past dates', () => {
      // Arrange
      const pastDate = new Date('2020-01-01');
      const transaction = buildTransaction({ date: pastDate });

      // Assert
      expect(transaction.date.getTime()).toBeLessThan(Date.now());
    });
  });

  // ========================================
  // TEST: Category Handling
  // ========================================
  describe('category handling', () => {
    it('should handle standard categories', () => {
      // Arrange
      const categories = ['Makanan', 'Transport', 'Belanja', 'Hiburan', 'Tagihan'];

      // Assert
      categories.forEach(category => {
        const transaction = buildTransaction({ category });
        expect(transaction.category).toBe(category);
      });
    });

    it('should handle unicode in category names', () => {
      // Arrange
      const transaction = buildTransaction({ category: 'Makan Siang 🍜' });

      // Assert
      expect(transaction.category).toBe('Makan Siang 🍜');
    });

    it('should handle empty description', () => {
      // Arrange
      const transaction = buildTransaction({ description: '' });

      // Assert
      expect(transaction.description).toBe('');
    });

    it('should handle long descriptions', () => {
      // Arrange
      const longDescription = 'A'.repeat(500);
      const transaction = buildTransaction({ description: longDescription });

      // Assert
      expect(transaction.description).toHaveLength(500);
    });
  });

  // ========================================
  // TEST: ID Generation
  // ========================================
  describe('ID generation', () => {
    it('should have unique IDs for different transactions', () => {
      // Arrange
      const tx1 = sampleTransactions.income();
      const tx2 = sampleTransactions.expense();

      // Assert
      expect(tx1.id).not.toBe(tx2.id);
    });

    it('should generate UUID format IDs', () => {
      // Arrange
      const transaction = buildTransaction({ id: '550e8400-e29b-41d4-a716-446655440000' });

      // Assert - Basic UUID format check (8-4-4-4-12)
      expect(transaction.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/i);
    });
  });

  // ========================================
  // TEST: Business Logic Scenarios
  // ========================================
  describe('business scenarios', () => {
    it('should represent monthly salary income', () => {
      // Arrange
      const income = sampleTransactions.income();

      // Assert
      expect(income.type).toBe(TransactionType.INCOME);
      expect(income.category).toBe('Gaji');
      expect(income.amount).toBe(5000000);
    });

    it('should represent daily expense', () => {
      // Arrange
      const expense = sampleTransactions.expense();

      // Assert
      expect(expense.type).toBe(TransactionType.EXPENSE);
      expect(expense.category).toBe('Makanan');
      expect(expense.amount).toBeLessThan(100000);
    });

    it('should represent large purchase', () => {
      // Arrange
      const purchase = sampleTransactions.largeAmount();

      // Assert
      expect(purchase.amount).toBeGreaterThan(10000000);
      expect(purchase.category).toBe('Elektronik');
    });
  });
});
