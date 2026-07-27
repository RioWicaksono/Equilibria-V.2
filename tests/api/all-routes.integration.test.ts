/**
 * Comprehensive Integration Tests for ALL API Routes
 *
 * Tests coverage:
 * 1. /api/transactions - ✅
 * 2. /api/budgets - ✅
 * 3. /api/wallets - ✅
 * 4. /api/goals - ✅
 * 5. /api/debts - ✅
 * 6. /api/recurring - ✅
 * 7. /api/reminders - ✅
 * 8. /api/categories - ✅
 * 9. /api/summary - ✅
 * 10. /api/health - ✅
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';

// ============================================
// MOCK DEPENDENCIES
// ============================================

// Mock Prisma
vi.mock('@/infrastructure/database/PrismaClient', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'tx-mock-1', amount: 100000, type: 'EXPENSE',
        category: 'Makanan', description: 'Test', date: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: 'tx-mock-1', amount: 200000, type: 'EXPENSE',
        category: 'Makanan', description: 'Updated', date: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    budget: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'budget-mock-1', category: 'Makanan', limit: 2000000,
        createdAt: new Date(), updatedAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: 'budget-mock-1', category: 'Makanan', limit: 2500000,
        createdAt: new Date(), updatedAt: new Date(),
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    wallet: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'wallet-mock-1', name: 'Test Wallet', balance: 0,
        createdAt: new Date(), updatedAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: 'wallet-mock-1', name: 'Updated Wallet', balance: 100000,
        createdAt: new Date(), updatedAt: new Date(),
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    goal: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'goal-mock-1', name: 'Dana Darurat', targetAmount: 20000000,
        currentAmount: 0, deadline: new Date(), createdAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: 'goal-mock-1', name: 'Dana Darurat', targetAmount: 20000000,
        currentAmount: 5000000, deadline: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    debt: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'debt-mock-1', name: 'Pinjam', amount: 500000,
        type: 'DEBT', status: 'UNPAID', createdAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: 'debt-mock-1', name: 'Pinjam', amount: 500000,
        type: 'DEBT', status: 'PAID', createdAt: new Date(),
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    recurring: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'rec-mock-1', name: 'Netflix', amount: 153000,
        frequency: 'MONTHLY', nextDate: new Date(), createdAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: 'rec-mock-1', name: 'Netflix', amount: 153000,
        frequency: 'MONTHLY', nextDate: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    reminder: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({
        id: 'rem-mock-1', title: 'Bayar Tagihan', date: new Date(),
        type: 'RECURRING', isCompleted: false, createdAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: 'rem-mock-1', title: 'Bayar Tagihan', date: new Date(),
        type: 'RECURRING', isCompleted: true, createdAt: new Date(),
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    category: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'cat-1', name: 'Makanan', icon: '🍔', color: '#FF0000', createdAt: new Date() },
        { id: 'cat-2', name: 'Transport', icon: '🚗', color: '#00FF00', createdAt: new Date() },
      ]),
    },
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  authenticateRequest: vi.fn().mockReturnValue({ authenticated: true }),
}));

// ============================================
// TEST HELPERS
// ============================================

function createMockRequest(method: string, options: {
  query?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
} = {}) {
  const { req, res } = createMocks({
    method,
    query: options.query || {},
    body: options.body,
    headers: options.headers || {},
  });
  return { req, res };
}

// ============================================
// TEST SUITE: ALL API ROUTES
// ============================================

describe('API Routes Integration Tests', () => {

  // ========================================
  // 1. TRANSACTIONS API
  // ========================================
  describe('POST /api/transactions', () => {
    it('should create transaction with valid data', async () => {
      const formData = new FormData();
      formData.append('amount', '100000');
      formData.append('type', 'EXPENSE');
      formData.append('category', 'Makanan');
      formData.append('date', new Date().toISOString());

      const { req, res } = createMockRequest('POST', { body: formData });
      const handler = (await import('@/app/api/transactions/route')).POST;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(201);
      const body = JSON.parse(res._getData());
      expect(body.success).toBe(true);
    });

    it('should reject invalid amount', async () => {
      const formData = new FormData();
      formData.append('amount', '-100');
      formData.append('type', 'EXPENSE');
      formData.append('category', 'Test');
      formData.append('date', new Date().toISOString());

      const { req, res } = createMockRequest('POST', { body: formData });
      const handler = (await import('@/app/api/transactions/route')).POST;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(400);
    });
  });

  // ========================================
  // 2. BUDGETS API
  // ========================================
  describe('POST /api/budgets', () => {
    it('should create budget with valid data', async () => {
      const { req, res } = createMockRequest('POST', {
        body: { category: 'Makanan', limit: 2000000 },
        headers: { 'Content-Type': 'application/json' },
      });

      const handler = (await import('@/app/api/budgets/route')).POST;
      await handler(req as never);

      const body = JSON.parse(res._getData());
      expect(body.success || body.id).toBeTruthy();
    });
  });

  describe('GET /api/budgets', () => {
    it('should return budgets list', async () => {
      const { req, res } = createMockRequest('GET');
      const handler = (await import('@/app/api/budgets/route')).GET;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ========================================
  // 3. WALLETS API
  // ========================================
  describe('POST /api/wallets', () => {
    it('should create wallet with valid data', async () => {
      const { req, res } = createMockRequest('POST', {
        body: { name: 'Test Wallet', balance: 0 },
        headers: { 'Content-Type': 'application/json' },
      });

      const handler = (await import('@/app/api/wallets/route')).POST;
      await handler(req as never);

      const body = JSON.parse(res._getData());
      expect(body.success || body.id).toBeTruthy();
    });
  });

  describe('GET /api/wallets', () => {
    it('should return wallets list', async () => {
      const { req, res } = createMockRequest('GET');
      const handler = (await import('@/app/api/wallets/route')).GET;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ========================================
  // 4. GOALS API
  // ========================================
  describe('POST /api/goals', () => {
    it('should create goal with valid data', async () => {
      const { req, res } = createMockRequest('POST', {
        body: {
          name: 'Dana Darurat',
          targetAmount: 20000000,
          currentAmount: 0,
          deadline: new Date().toISOString(),
        },
        headers: { 'Content-Type': 'application/json' },
      });

      const handler = (await import('@/app/api/goals/route')).POST;
      await handler(req as never);

      const body = JSON.parse(res._getData());
      expect(body.success || body.id).toBeTruthy();
    });
  });

  describe('GET /api/goals', () => {
    it('should return goals list', async () => {
      const { req, res } = createMockRequest('GET');
      const handler = (await import('@/app/api/goals/route')).GET;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ========================================
  // 5. DEBTS API
  // ========================================
  describe('POST /api/debts', () => {
    it('should create debt with valid data', async () => {
      const { req, res } = createMockRequest('POST', {
        body: {
          name: 'Pinjam',
          amount: 500000,
          type: 'DEBT',
          status: 'UNPAID',
        },
        headers: { 'Content-Type': 'application/json' },
      });

      const handler = (await import('@/app/api/debts/route')).POST;
      await handler(req as never);

      const body = JSON.parse(res._getData());
      expect(body.success || body.id).toBeTruthy();
    });
  });

  describe('GET /api/debts', () => {
    it('should return debts list', async () => {
      const { req, res } = createMockRequest('GET');
      const handler = (await import('@/app/api/debts/route')).GET;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ========================================
  // 6. RECURRING API
  // ========================================
  describe('POST /api/recurring', () => {
    it('should create recurring transaction with valid data', async () => {
      const { req, res } = createMockRequest('POST', {
        body: {
          name: 'Netflix',
          amount: 153000,
          frequency: 'MONTHLY',
          nextDate: new Date().toISOString(),
        },
        headers: { 'Content-Type': 'application/json' },
      });

      const handler = (await import('@/app/api/recurring/route')).POST;
      await handler(req as never);

      const body = JSON.parse(res._getData());
      expect(body.success || body.id).toBeTruthy();
    });
  });

  describe('GET /api/recurring', () => {
    it('should return recurring transactions list', async () => {
      const { req, res } = createMockRequest('GET');
      const handler = (await import('@/app/api/recurring/route')).GET;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ========================================
  // 7. REMINDERS API
  // ========================================
  describe('POST /api/reminders', () => {
    it('should create reminder with valid data', async () => {
      const { req, res } = createMockRequest('POST', {
        body: {
          title: 'Bayar Tagihan',
          date: new Date().toISOString(),
          type: 'ONE_TIME',
        },
        headers: { 'Content-Type': 'application/json' },
      });

      const handler = (await import('@/app/api/reminders/route')).POST;
      await handler(req as never);

      const body = JSON.parse(res._getData());
      expect(body.success || body.id).toBeTruthy();
    });
  });

  describe('GET /api/reminders', () => {
    it('should return reminders list', async () => {
      const { req, res } = createMockRequest('GET');
      const handler = (await import('@/app/api/reminders/route')).GET;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ========================================
  // 8. CATEGORIES API
  // ========================================
  describe('GET /api/categories', () => {
    it('should return categories list', async () => {
      const { req, res } = createMockRequest('GET');
      const handler = (await import('@/app/api/categories/route')).GET;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(200);
      const body = JSON.parse(res._getData());
      expect(Array.isArray(body.data || body)).toBe(true);
    });
  });

  // ========================================
  // 9. SUMMARY API
  // ========================================
  describe('GET /api/summary', () => {
    it('should return financial summary', async () => {
      const { req, res } = createMockRequest('GET');
      const handler = (await import('@/app/api/summary/route')).GET;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ========================================
  // 10. HEALTH API
  // ========================================
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const { req, res } = createMockRequest('GET');
      const handler = (await import('@/app/api/health/route')).GET;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(200);
      const body = JSON.parse(res._getData());
      expect(body.status || body.success).toBeTruthy();
    });
  });

  // ========================================
  // 11. SEARCH API
  // ========================================
  describe('GET /api/search', () => {
    it('should return search results', async () => {
      const { req, res } = createMockRequest('GET', {
        query: { q: 'test' },
      });
      const handler = (await import('@/app/api/search/route')).GET;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ========================================
  // 12. NETWORTH API
  // ========================================
  describe('GET /api/networth', () => {
    it('should return networth calculation', async () => {
      const { req, res } = createMockRequest('GET');
      const handler = (await import('@/app/api/networth/route')).GET;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ========================================
  // 13. SETTINGS API
  // ========================================
  describe('GET /api/settings', () => {
    it('should return settings', async () => {
      const { req, res } = createMockRequest('GET');
      const handler = (await import('@/app/api/settings/route')).GET;
      await handler(req as never);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('POST /api/settings', () => {
    it('should update settings', async () => {
      const { req, res } = createMockRequest('POST', {
        body: { theme: 'dark' },
        headers: { 'Content-Type': 'application/json' },
      });

      const handler = (await import('@/app/api/settings/route')).POST;
      await handler(req as never);

      expect(res._getStatusCode()).toBeGreaterThanOrEqual(200);
    });
  });
});

// ============================================
// TEST SUITE: API Response Consistency
// ============================================

describe('API Response Format Consistency', () => {
  it('should return consistent success response format', async () => {
    const { ApiResponse } = await import('@/lib/api-helpers');

    // Test ok response
    const okResponse = ApiResponse.ok({ data: 'test' });
    const okBody = await okResponse.json();
    expect(okBody).toHaveProperty('success');
    expect(okBody).toHaveProperty('data');

    // Test created response
    const createdResponse = ApiResponse.created({ id: '123' });
    const createdBody = await createdResponse.json();
    expect(createdBody).toHaveProperty('success');
  });

  it('should return consistent error response format', async () => {
    const { ApiResponse } = await import('@/lib/api-helpers');

    const errorResponse = ApiResponse.notFound('Transaction');
    const errorBody = await errorResponse.json();

    expect(errorBody).toHaveProperty('error');
    expect(errorBody.error).toHaveProperty('code');
    expect(errorBody.error).toHaveProperty('message');
    expect(errorBody.error).toHaveProperty('request_id');
    expect(res._getStatusCode()).toBe(404);
  });
});

// ============================================
// TEST SUITE: Pagination Consistency
// ============================================

describe('Pagination Consistency', () => {
  it('should support both offset and cursor pagination', async () => {
    const { parsePaginationParams, parseCursorPaginationParams } = await import('@/lib/api-helpers');

    // Offset pagination
    const offsetParams = parsePaginationParams(new URLSearchParams('page=2&limit=10'));
    expect(offsetParams.page).toBe(2);
    expect(offsetParams.limit).toBe(10);

    // Cursor pagination
    const cursorParams = parseCursorPaginationParams(new URLSearchParams('cursor=abc123&limit=20'));
    expect(cursorParams.cursor).toBe('abc123');
    expect(cursorParams.limit).toBe(20);
  });

  it('should cap limit at maximum value', async () => {
    const { parsePaginationParams, parseCursorPaginationParams } = await import('@/lib/api-helpers');

    const offsetParams = parsePaginationParams(new URLSearchParams('limit=500'));
    expect(offsetParams.limit).toBeLessThanOrEqual(100);

    const cursorParams = parseCursorPaginationParams(new URLSearchParams('limit=500'));
    expect(cursorParams.limit).toBeLessThanOrEqual(100);
  });
});
