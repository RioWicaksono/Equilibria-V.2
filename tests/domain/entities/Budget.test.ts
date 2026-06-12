import { describe, it, expect, beforeEach } from 'vitest';
import { createBudget, isOverBudget, getBudgetPercentage, getRemainingAmount, type Budget } from '@/domain/entities/Budget';

describe('Budget Entity', () => {
  let mockBudget: Budget;

  beforeEach(() => {
    mockBudget = createBudget({
      category: 'Makanan',
      limit: 2000000,
    });
  });

  describe('createBudget', () => {
    it('should create a budget with valid data', () => {
      expect(mockBudget.id).toBeDefined();
      expect(mockBudget.category).toBe('Makanan');
      expect(mockBudget.limit).toBe(2000000);
      expect(mockBudget.createdAt).toBeInstanceOf(Date);
      expect(mockBudget.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs', () => {
      const budget1 = createBudget({ category: 'A', limit: 100 });
      const budget2 = createBudget({ category: 'B', limit: 200 });
      expect(budget1.id).not.toBe(budget2.id);
    });

    it('should reject empty category', () => {
      expect(() => createBudget({ category: '', limit: 100 })).toThrow('Category is required');
    });

    it('should reject zero limit', () => {
      expect(() => createBudget({ category: 'Test', limit: 0 })).toThrow('Budget limit must be greater than 0');
    });

    it('should reject negative limit', () => {
      expect(() => createBudget({ category: 'Test', limit: -100 })).toThrow('Budget limit must be greater than 0');
    });
  });

  describe('isOverBudget', () => {
    it('should return false when spent is less than limit', () => {
      expect(isOverBudget(mockBudget, 1000000)).toBe(false);
    });

    it('should return false when spent equals limit', () => {
      expect(isOverBudget(mockBudget, 2000000)).toBe(false);
    });

    it('should return true when spent exceeds limit', () => {
      expect(isOverBudget(mockBudget, 2500000)).toBe(true);
    });

    it('should handle edge case at zero spent', () => {
      expect(isOverBudget(mockBudget, 0)).toBe(false);
    });

    it('should handle large overages', () => {
      expect(isOverBudget(mockBudget, 10000000)).toBe(true);
    });
  });

  describe('getBudgetPercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(getBudgetPercentage(mockBudget, 1000000)).toBe(50); // 50%
      expect(getBudgetPercentage(mockBudget, 500000)).toBe(25); // 25%
      expect(getBudgetPercentage(mockBudget, 2000000)).toBe(100); // 100%
    });

    it('should cap at 100% when over budget', () => {
      expect(getBudgetPercentage(mockBudget, 4000000)).toBe(100);
      expect(getBudgetPercentage(mockBudget, 10000000)).toBe(100);
    });

    it('should return 0 when nothing spent', () => {
      expect(getBudgetPercentage(mockBudget, 0)).toBe(0);
    });

    it('should handle decimal percentages', () => {
      const budget = createBudget({ category: 'Test', limit: 3000000 });
      expect(getBudgetPercentage(budget, 1000000)).toBeCloseTo(33.33, 1);
    });
  });

  describe('getRemainingAmount', () => {
    it('should return positive remaining amount', () => {
      expect(getRemainingAmount(mockBudget, 1000000)).toBe(1000000);
    });

    it('should return zero when fully spent', () => {
      expect(getRemainingAmount(mockBudget, 2000000)).toBe(0);
    });

    it('should return negative when over budget', () => {
      expect(getRemainingAmount(mockBudget, 3000000)).toBe(-1000000);
    });

    it('should return full limit when nothing spent', () => {
      expect(getRemainingAmount(mockBudget, 0)).toBe(2000000);
    });
  });

  describe('Budget warning levels', () => {
    it('should identify budget at 80% as warning', () => {
      const percentage = getBudgetPercentage(mockBudget, 1600000);
      expect(percentage).toBe(80);
    });

    it('should identify budget at 100% as critical', () => {
      const percentage = getBudgetPercentage(mockBudget, 2000000);
      expect(percentage).toBe(100);
    });

    it('should identify budget over 100% as exceeded', () => {
      expect(isOverBudget(mockBudget, 2500000)).toBe(true);
    });
  });
});