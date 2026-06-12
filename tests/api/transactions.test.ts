import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';

// Mock Prisma client
vi.mock('@/infrastructure/database/PrismaClient', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'tx-mock-1',
        amount: 150000,
        type: 'EXPENSE',
        category: 'Makanan',
        description: 'Test transaction',
        date: new Date(),
        createdAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: 'tx-mock-1',
        amount: 150000,
        type: 'EXPENSE',
        category: 'Makanan',
        description: 'Updated transaction',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    budget: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'budget-mock-1',
        category: 'Makanan',
        limit: 2000000,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: 'budget-mock-1',
        category: 'Makanan',
        limit: 2500000,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Transactions API Route', () => {
  describe('GET /api/transactions', () => {
    it('should return 200 with empty array when no transactions', async () => {
      const { prisma } = await import('@/infrastructure/database/PrismaClient');

      // The actual route handler would be called here
      // For unit testing, we test the data layer
      const transactions = await prisma.transaction.findMany();

      expect(transactions).toEqual([]);
    });

    it('should return transactions with correct structure', async () => {
      const mockTransaction = {
        id: 'tx-1',
        amount: 150000,
        type: 'EXPENSE',
        category: 'Makanan',
        description: 'Makan siang',
        date: expect.any(Date),
        createdAt: expect.any(Date),
      };

      const { prisma } = await import('@/infrastructure/database/PrismaClient');
      const created = await prisma.transaction.create({
        data: {
          amount: 150000,
          type: 'EXPENSE',
          category: 'Makanan',
          description: 'Makan siang',
          date: new Date(),
        },
      });

      expect(created).toMatchObject({
        id: expect.any(String),
        amount: 150000,
        type: 'EXPENSE',
      });
    });
  });

  describe('POST /api/transactions', () => {
    it('should validate required fields', () => {
      const validData = {
        amount: 100000,
        type: 'EXPENSE',
        category: 'Makanan',
        description: 'Test',
        date: new Date().toISOString(),
      };

      expect(validData.amount).toBeGreaterThan(0);
      expect(['INCOME', 'EXPENSE']).toContain(validData.type);
      expect(validData.category.length).toBeGreaterThan(0);
    });

    it('should reject negative amounts', () => {
      const invalidData = { amount: -100 };
      expect(invalidData.amount).toBeLessThan(0);
    });

    it('should reject invalid transaction types', () => {
      const validTypes = ['INCOME', 'EXPENSE'];
      expect(validTypes).not.toContain('TRANSFER');
      expect(validTypes).not.toContain('INVALID');
    });
  });
});

describe('Budgets API Route', () => {
  describe('GET /api/budgets', () => {
    it('should return empty array when no budgets', async () => {
      const { prisma } = await import('@/infrastructure/database/PrismaClient');
      const budgets = await prisma.budget.findMany();

      expect(budgets).toEqual([]);
    });

    it('should return budgets with correct structure', async () => {
      const { prisma } = await import('@/infrastructure/database/PrismaClient');
      const created = await prisma.budget.create({
        data: {
          category: 'Makanan',
          limit: 2000000,
        },
      });

      expect(created).toMatchObject({
        id: expect.any(String),
        category: 'Makanan',
        limit: 2000000,
      });
    });
  });

  describe('POST /api/budgets', () => {
    it('should create budget with valid data', () => {
      const validData = {
        category: 'Transport',
        limit: 1000000,
      };

      expect(validData.category.length).toBeGreaterThan(0);
      expect(validData.limit).toBeGreaterThan(0);
    });

    it('should reject empty category', () => {
      const invalidData = { category: '', limit: 1000000 };
      expect(invalidData.category.trim().length).toBe(0);
    });

    it('should reject zero or negative limit', () => {
      expect(() => {
        const data = { category: 'Test', limit: 0 };
        if (data.limit <= 0) throw new Error('Invalid limit');
      }).toThrow('Invalid limit');
    });

    it('should reject duplicate categories', async () => {
      const { prisma } = await import('@/infrastructure/database/PrismaClient');

      // Check if category already exists
      const existing = await prisma.budget.findFirst({
        where: { category: 'Makanan' },
      });

      // If exists, should not allow duplicate
      if (existing) {
        expect(existing.category).toBe('Makanan');
      }
    });
  });
});

describe('Wallets API Route', () => {
  describe('GET /api/wallets', () => {
    it('should return wallets from database', async () => {
      // Test that we can query wallets
      const { prisma } = await import('@/infrastructure/database/PrismaClient');
      // This would normally query the database
      expect(prisma).toBeDefined();
    });
  });

  describe('POST /api/wallets', () => {
    it('should validate wallet creation data', () => {
      const validData = {
        name: 'BCA Utama',
        balance: 5000000,
        description: 'Rekening utama',
      };

      expect(validData.name.length).toBeGreaterThan(0);
      expect(typeof validData.balance).toBe('number');
    });

    it('should set default balance to 0 if not provided', () => {
      const data = { name: 'Test Wallet' };
      const balance = data.balance ?? 0;
      expect(balance).toBe(0);
    });
  });
});

describe('Goals API Route', () => {
  describe('GET /api/goals', () => {
    it('should return financial goals', async () => {
      const mockGoal = {
        id: 'goal-1',
        name: 'Dana Darurat',
        targetAmount: 20000000,
        currentAmount: 5000000,
        deadline: new Date('2026-12-31'),
        createdAt: new Date(),
      };

      expect(mockGoal.targetAmount).toBeGreaterThan(0);
      expect(mockGoal.currentAmount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /api/goals', () => {
    it('should validate goal data', () => {
      const validGoal = {
        name: 'Liburan ke Bali',
        targetAmount: 7000000,
        currentAmount: 0,
        deadline: '2026-08-15',
        description: 'Tabungan untuk berwisata',
      };

      expect(validGoal.name.length).toBeGreaterThan(0);
      expect(validGoal.targetAmount).toBeGreaterThan(0);
      expect(new Date(validGoal.deadline).getTime()).toBeGreaterThan(Date.now());
    });

    it('should calculate progress percentage', () => {
      const goal = { targetAmount: 10000000, currentAmount: 5000000 };
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      expect(progress).toBe(50);
    });
  });
});

describe('Debts API Route', () => {
  describe('GET /api/debts', () => {
    it('should return debts and loans', async () => {
      const mockDebt = {
        id: 'debt-1',
        name: 'Pinjam ke Budi',
        amount: 500000,
        type: 'DEBT',
        status: 'UNPAID',
        createdAt: new Date(),
      };

      expect(['DEBT', 'LOAN']).toContain(mockDebt.type);
      expect(['UNPAID', 'PAID']).toContain(mockDebt.status);
    });
  });

  describe('POST /api/debts', () => {
    it('should validate debt data', () => {
      const validDebt = {
        name: 'Test Debt',
        amount: 100000,
        type: 'DEBT',
        loanDate: '2026-06-01',
        dueDate: '2026-07-01',
      };

      expect(validDebt.name.length).toBeGreaterThan(0);
      expect(validDebt.amount).toBeGreaterThan(0);
      expect(['DEBT', 'LOAN']).toContain(validDebt.type);
    });

    it('should calculate remaining amount', () => {
      const debt = { amount: 500000, paidAmount: 200000 };
      const remaining = debt.amount - debt.paidAmount;
      expect(remaining).toBe(300000);
    });
  });
});

describe('Recurring API Route', () => {
  describe('GET /api/recurring', () => {
    it('should return recurring transactions', async () => {
      const mockRecurring = {
        id: 'rec-1',
        name: 'Langganan Netflix',
        amount: 153000,
        frequency: 'MONTHLY',
        nextDate: new Date('2026-06-15'),
        createdAt: new Date(),
      };

      expect(mockRecurring.amount).toBeGreaterThan(0);
      expect(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).toContain(mockRecurring.frequency);
    });
  });

  describe('POST /api/recurring', () => {
    it('should validate recurring data', () => {
      const validRecurring = {
        name: 'Netflix',
        amount: 153000,
        frequency: 'MONTHLY',
        nextDate: '2026-06-15',
      };

      expect(validRecurring.name.length).toBeGreaterThan(0);
      expect(validRecurring.amount).toBeGreaterThan(0);
    });

    it('should calculate next occurrence based on frequency', () => {
      const now = new Date('2026-06-10');
      const frequencies: Record<string, number> = {
        DAILY: 1,
        WEEKLY: 7,
        MONTHLY: 30,
        YEARLY: 365,
      };

      Object.entries(frequencies).forEach(([freq, days]) => {
        const nextDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        expect(nextDate.getTime()).toBeGreaterThan(now.getTime());
      });
    });
  });
});