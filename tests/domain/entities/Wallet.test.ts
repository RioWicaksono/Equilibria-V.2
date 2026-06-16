import { describe, it, expect } from 'vitest';
import type { Wallet } from '@/domain/entities/Wallet';

describe('Wallet Entity', () => {
  describe('Wallet interface structure', () => {
    it('should have correct structure', () => {
      const wallet: Wallet = {
        id: 'wallet-123',
        name: 'Rekening Utama',
        balance: 5000000,
        createdAt: new Date(),
      };

      expect(wallet.id).toBe('wallet-123');
      expect(wallet.name).toBe('Rekening Utama');
      expect(wallet.balance).toBe(5000000);
      expect(wallet.createdAt).toBeInstanceOf(Date);
    });

    it('should work with minimum required fields', () => {
      const wallet: Wallet = {
        id: 'wallet-min',
        name: 'Test Wallet',
        balance: 0,
        createdAt: new Date(),
      };

      expect(wallet.id).toBeDefined();
      expect(wallet.name).toBeDefined();
      expect(wallet.balance).toBe(0);
    });

    it('should support optional fields', () => {
      const wallet: Wallet = {
        id: 'wallet-1',
        name: 'Dompet Digital',
        balance: 1000000,
        currency: 'IDR',
        icon: '💰',
        color: '#4CAF50',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(wallet.currency).toBe('IDR');
      expect(wallet.icon).toBe('💰');
      expect(wallet.color).toBe('#4CAF50');
    });
  });

  describe('Balance operations', () => {
    it('should handle positive balance', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: 'Test',
        balance: 1000000,
        createdAt: new Date(),
      };

      expect(wallet.balance).toBeGreaterThan(0);
    });

    it('should handle zero balance', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: 'Test',
        balance: 0,
        createdAt: new Date(),
      };

      expect(wallet.balance).toBe(0);
    });

    it('should handle negative balance (credit/overdraft)', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: 'Test',
        balance: -500000,
        createdAt: new Date(),
      };

      expect(wallet.balance).toBeLessThan(0);
    });

    it('should add income correctly', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: 'Test',
        balance: 1000000,
        createdAt: new Date(),
      };

      const incomeAmount = 500000;
      const newBalance = wallet.balance + incomeAmount;
      expect(newBalance).toBe(1500000);
    });

    it('should subtract expense correctly', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: 'Test',
        balance: 1000000,
        createdAt: new Date(),
      };

      const expenseAmount = 250000;
      const newBalance = wallet.balance - expenseAmount;
      expect(newBalance).toBe(750000);
    });

    it('should handle large balances', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: 'Test',
        balance: 999999999999,
        createdAt: new Date(),
      };

      expect(wallet.balance).toBe(999999999999);
    });

    it('should handle small balances (decimal)', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: 'Test',
        balance: 0.01,
        createdAt: new Date(),
      };

      expect(wallet.balance).toBe(0.01);
    });
  });

  describe('Wallet name validation', () => {
    it('should handle wallet names with spaces', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: 'Rekening Bersama',
        balance: 1000000,
        createdAt: new Date(),
      };

      expect(wallet.name).toBe('Rekening Bersama');
    });

    it('should handle wallet names with special characters', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: "Rekening - Utama (Priority)",
        balance: 1000000,
        createdAt: new Date(),
      };

      expect(wallet.name).toContain('-');
      expect(wallet.name).toContain('(');
    });

    it('should handle wallet names with numbers', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: 'Rekening 2026',
        balance: 1000000,
        createdAt: new Date(),
      };

      expect(wallet.name).toContain('2026');
    });
  });

  describe('Wallet type identification', () => {
    it('should identify cash wallet', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: 'Tunai',
        balance: 500000,
        type: 'CASH',
        createdAt: new Date(),
      };

      expect((wallet as any).type).toBe('CASH');
    });

    it('should identify bank account', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: 'BCA',
        balance: 5000000,
        type: 'BANK',
        createdAt: new Date(),
      };

      expect((wallet as any).type).toBe('BANK');
    });

    it('should identify e-wallet', () => {
      const wallet: Wallet = {
        id: 'w1',
        name: 'GoPay',
        balance: 250000,
        type: 'E_WALLET',
        createdAt: new Date(),
      };

      expect((wallet as any).type).toBe('E_WALLET');
    });
  });

  describe('Date handling', () => {
    it('should handle Date object for createdAt', () => {
      const createdDate = new Date('2026-01-15');
      const wallet: Wallet = {
        id: 'w1',
        name: 'Test',
        balance: 1000000,
        createdAt: createdDate,
      };

      expect(wallet.createdAt).toBe(createdDate);
      expect(wallet.createdAt).toBeInstanceOf(Date);
    });

    it('should calculate days since creation', () => {
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - 30);

      const wallet: Wallet = {
        id: 'w1',
        name: 'Test',
        balance: 1000000,
        createdAt: createdDate,
      };

      const daysSinceCreation = Math.floor(
        (new Date().getTime() - wallet.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysSinceCreation).toBeGreaterThanOrEqual(29);
      expect(daysSinceCreation).toBeLessThanOrEqual(31);
    });
  });
});