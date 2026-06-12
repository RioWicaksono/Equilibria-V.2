import { describe, it, expect } from 'vitest';
import { createAmount, formatAmount, type Amount } from '@/domain/value-objects/Amount';

describe('Amount Value Object', () => {
  describe('createAmount', () => {
    it('should create a valid amount with default currency IDR', () => {
      const amount = createAmount(150000);
      expect(amount.value).toBe(150000);
      expect(amount.currency).toBe('IDR');
    });

    it('should create a valid amount with custom currency', () => {
      const amount = createAmount(100, 'USD');
      expect(amount.value).toBe(100);
      expect(amount.currency).toBe('USD');
    });

    it('should create amount with zero value', () => {
      const amount = createAmount(0);
      expect(amount.value).toBe(0);
      expect(amount.currency).toBe('IDR');
    });

    it('should create amount with large values', () => {
      const amount = createAmount(1000000000);
      expect(amount.value).toBe(1000000000);
    });

    it('should reject negative values', () => {
      expect(() => createAmount(-100)).toThrow('Amount cannot be negative');
      expect(() => createAmount(-0.01)).toThrow('Amount cannot be negative');
      expect(() => createAmount(-1000000)).toThrow('Amount cannot be negative');
    });

    it('should reject very small negative values', () => {
      expect(() => createAmount(-0.001)).toThrow('Amount cannot be negative');
    });
  });

  describe('Amount immutability (conceptual)', () => {
    it('should be treated as immutable value object', () => {
      const amount = createAmount(50000);
      // The interface should be treated as read-only
      expect(Object.isFrozen(amount)).toBe(false); // Plain objects aren't frozen by default
      // But code should treat it as immutable
      expect(amount.value).toBe(50000);
    });

    it('should have predictable values', () => {
      const amount = createAmount(100, 'EUR');
      // Values should be what was passed in
      expect(amount.value).toBe(100);
      expect(amount.currency).toBe('EUR');
    });
  });

  describe('formatAmount', () => {
    it('should format IDR amount correctly', () => {
      const amount = createAmount(1500000);
      const formatted = formatAmount(amount);
      expect(formatted).toContain('1.500.000');
      expect(formatted).toContain('Rp');
    });

    it('should format USD amount correctly', () => {
      const amount = createAmount(99.99, 'USD');
      const formatted = formatAmount(amount);
      // Indonesian locale may format USD differently
      expect(formatted).toMatch(/\$|US/);
      expect(formatted).toMatch(/99/);
    });

    it('should format zero amount', () => {
      const amount = createAmount(0);
      const formatted = formatAmount(amount);
      expect(formatted).toContain('0');
    });

    it('should format large amounts', () => {
      const amount = createAmount(100000000);
      const formatted = formatAmount(amount);
      expect(formatted).toContain('100');
    });

    it('should include currency symbol', () => {
      const idrAmount = createAmount(1000, 'IDR');
      const usdAmount = createAmount(1000, 'USD');
      const eurAmount = createAmount(1000, 'EUR');

      expect(formatAmount(idrAmount)).toContain('Rp');
      expect(formatAmount(usdAmount)).toContain('$');
      expect(formatAmount(eurAmount)).toContain('€');
    });
  });

  describe('Amount operations', () => {
    it('should handle decimal values', () => {
      const amount = createAmount(99.99, 'USD');
      expect(amount.value).toBe(99.99);
    });

    it('should handle small amounts', () => {
      const amount = createAmount(0.01);
      expect(amount.value).toBe(0.01);
    });

    it('should handle integer values', () => {
      const amount = createAmount(1000000);
      expect(Number.isInteger(amount.value)).toBe(true);
    });
  });
});