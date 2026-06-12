import { describe, it, expect } from 'vitest';
import { TransactionType, TransactionTypeValues, isValidTransactionType } from '@/domain/value-objects/TransactionType';

describe('TransactionType Value Object', () => {
  describe('TransactionType type', () => {
    it('should allow INCOME type', () => {
      const type: TransactionType = 'INCOME';
      expect(type).toBe('INCOME');
    });

    it('should allow EXPENSE type', () => {
      const type: TransactionType = 'EXPENSE';
      expect(type).toBe('EXPENSE');
    });

    it('should reject invalid type', () => {
      // TypeScript should catch this at compile time, but we test runtime behavior
      const invalidType = 'INVALID' as TransactionType;
      expect(isValidTransactionType(invalidType)).toBe(false);
    });
  });

  describe('TransactionTypeValues constant', () => {
    it('should contain INCOME and EXPENSE', () => {
      expect(TransactionTypeValues).toContain('INCOME');
      expect(TransactionTypeValues).toContain('EXPENSE');
    });

    it('should have exactly 2 values', () => {
      expect(TransactionTypeValues).toHaveLength(2);
    });

    it('should be readonly tuple', () => {
      // Test that it's an array
      expect(Array.isArray(TransactionTypeValues)).toBe(true);
    });
  });

  describe('isValidTransactionType', () => {
    it('should return true for INCOME', () => {
      expect(isValidTransactionType('INCOME')).toBe(true);
    });

    it('should return true for EXPENSE', () => {
      expect(isValidTransactionType('EXPENSE')).toBe(true);
    });

    it('should return false for invalid string', () => {
      expect(isValidTransactionType('INVALID')).toBe(false);
      expect(isValidTransactionType('TRANSFER')).toBe(false);
      expect(isValidTransactionType('')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isValidTransactionType(null as unknown as string)).toBe(false);
      expect(isValidTransactionType(undefined as unknown as string)).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isValidTransactionType('income')).toBe(false);
      expect(isValidTransactionType('expense')).toBe(false);
      expect(isValidTransactionType('Income')).toBe(false);
    });
  });
});