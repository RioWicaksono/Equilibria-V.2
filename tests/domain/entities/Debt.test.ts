import { describe, it, expect } from 'vitest';
import type { Debt } from '@/domain/entities/Debt';

describe('Debt Entity', () => {
  describe('Debt interface structure', () => {
    it('should have correct structure for DEBT type', () => {
      const debt: Debt = {
        id: 'debt-123',
        name: 'Kartu Kredit',
        amount: 5000000,
        paidAmount: 0,
        type: 'DEBT',
        status: 'UNPAID',
        description: 'Tagihan kartu kredit bulan ini',
        dueDate: new Date('2026-07-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(debt.id).toBe('debt-123');
      expect(debt.name).toBe('Kartu Kredit');
      expect(debt.amount).toBe(5000000);
      expect(debt.paidAmount).toBe(0);
      expect(debt.type).toBe('DEBT');
      expect(debt.status).toBe('UNPAID');
      expect(debt.dueDate).toBeInstanceOf(Date);
    });

    it('should have correct structure for LOAN type', () => {
      const loan: Debt = {
        id: 'loan-456',
        name: 'Pinjaman Bank',
        amount: 50000000,
        paidAmount: 25000000,
        type: 'LOAN',
        status: 'UNPAID',
        description: 'KPR rumah',
        dueDate: new Date('2030-06-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(loan.id).toBe('loan-456');
      expect(loan.type).toBe('LOAN');
      expect(loan.paidAmount).toBe(25000000);
    });

    it('should work with minimum required fields', () => {
      const debt: Debt = {
        id: 'debt-min',
        name: 'Test Debt',
        amount: 100000,
        type: 'DEBT',
        status: 'UNPAID',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(debt.id).toBeDefined();
      expect(debt.name).toBeDefined();
      expect(debt.amount).toBeGreaterThan(0);
      expect(debt.dueDate).toBeUndefined();
      expect(debt.description).toBeUndefined();
    });

    it('should support optional fields', () => {
      const debt: Debt = {
        id: 'debt-1',
        name: 'Sewa',
        amount: 3000000,
        type: 'DEBT',
        status: 'UNPAID',
        description: 'Sewa kontrakan Juni',
        dueDate: new Date('2026-06-30'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(debt.description).toBe('Sewa kontrakan Juni');
      expect(debt.dueDate).toBeInstanceOf(Date);
    });
  });

  describe('Debt type validation', () => {
    it('should correctly identify DEBT type', () => {
      const debt: Debt = {
        id: 'd1',
        name: 'Test',
        amount: 1000,
        type: 'DEBT',
        status: 'UNPAID',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(debt.type).toBe('DEBT');
    });

    it('should correctly identify LOAN type', () => {
      const loan: Debt = {
        id: 'l1',
        name: 'Test',
        amount: 1000,
        type: 'LOAN',
        status: 'UNPAID',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(loan.type).toBe('LOAN');
    });
  });

  describe('Debt status validation', () => {
    it('should correctly identify UNPAID status', () => {
      const debt: Debt = {
        id: 'd1',
        name: 'Test',
        amount: 1000,
        type: 'DEBT',
        status: 'UNPAID',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(debt.status).toBe('UNPAID');
    });

    it('should correctly identify PAID status', () => {
      const paidDebt: Debt = {
        id: 'd2',
        name: 'Test',
        amount: 1000,
        paidAmount: 1000,
        type: 'DEBT',
        status: 'PAID',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(paidDebt.status).toBe('PAID');
      expect(paidDebt.paidAmount).toBe(paidDebt.amount);
    });
  });

  describe('Debt amount calculations', () => {
    it('should calculate remaining amount correctly', () => {
      const debt: Debt = {
        id: 'd1',
        name: 'Test',
        amount: 1000000,
        paidAmount: 250000,
        type: 'DEBT',
        status: 'UNPAID',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const remainingAmount = debt.amount - debt.paidAmount;
      expect(remainingAmount).toBe(750000);
    });

    it('should identify fully paid debt', () => {
      const debt: Debt = {
        id: 'd1',
        name: 'Test',
        amount: 500000,
        paidAmount: 500000,
        type: 'DEBT',
        status: 'PAID',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const remainingAmount = debt.amount - debt.paidAmount;
      expect(remainingAmount).toBe(0);
      expect(debt.status).toBe('PAID');
    });

    it('should identify overdue debt', () => {
      const overdueDebt: Debt = {
        id: 'd1',
        name: 'Test',
        amount: 1000000,
        type: 'DEBT',
        status: 'UNPAID',
        dueDate: new Date('2020-01-01'), // Past date
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (overdueDebt.dueDate) {
        const isOverdue = overdueDebt.dueDate < new Date();
        expect(isOverdue).toBe(true);
      }
    });
  });

  describe('Due date handling', () => {
    it('should handle Date object for dueDate', () => {
      const dueDate = new Date('2026-06-30');
      const debt: Debt = {
        id: 'd1',
        name: 'Test',
        amount: 1000,
        type: 'DEBT',
        status: 'UNPAID',
        dueDate: dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(debt.dueDate).toBe(dueDate);
      expect(debt.dueDate).toBeInstanceOf(Date);
    });

    it('should handle missing dueDate', () => {
      const debt: Debt = {
        id: 'd1',
        name: 'Test',
        amount: 1000,
        type: 'DEBT',
        status: 'UNPAID',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(debt.dueDate).toBeUndefined();
    });
  });
});
