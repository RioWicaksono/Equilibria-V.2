import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';

// ============================================
// MOCK DEPENDENCIES
// ============================================

// Mock Prisma client
vi.mock('@/infrastructure/database/PrismaClient', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'tx-mock-1',
        amount: 150000,
        type: 'EXPENSE',
        category: 'Makanan',
        description: 'Test transaction',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: 'tx-mock-1',
        amount: 200000,
        type: 'EXPENSE',
        category: 'Makanan',
        description: 'Updated transaction',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    wallet: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'wallet-1', name: 'Test Wallet', balance: 0 }),
    },
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  authenticateRequest: vi.fn().mockReturnValue({ authenticated: true, reason: '' }),
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

function createApiKeyHeader(): Record<string, string> {
  return { 'x-api-key': 'test-api-key' };
}

// ============================================
// TEST SUITE: Transaction API Routes
// ============================================

describe('Transaction API Routes', () => {

  // ========================================
  // GET /api/transactions - List Transactions
  // ========================================
  describe('GET /api/transactions', () => {
    it('should return 401 without API key', async () => {
      // Arrange
      const { vi: authVi } = await import('@/lib/auth');
      authVi.mockReturnValueOnce({ authenticated: false, reason: 'Missing API key' });

      const { req, res } = createMockRequest('GET');

      // Act - Import handler dynamically
      const handler = (await import('@/app/api/transactions/route')).GET;
      await handler(req as never);

      // Assert
      expect(res._getStatusCode()).toBe(401);
    });

    it('should return transactions with offset pagination', async () => {
      // Arrange
      const { req, res } = createMockRequest('GET', {
        query: { page: '1', limit: '20' },
        headers: createApiKeyHeader(),
      });

      // Act
      const handler = (await import('@/app/api/transactions/route')).GET;
      await handler(req as never);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      const body = JSON.parse(res._getData());
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');
    });

    it('should support cursor-based pagination', async () => {
      // Arrange
      const cursor = Buffer.from(JSON.stringify({
        id: 'tx-123',
        createdAt: new Date().toISOString(),
      })).toString('base64url');

      const { req, res } = createMockRequest('GET', {
        query: { cursor, limit: '10' },
        headers: createApiKeyHeader(),
      });

      // Act
      const handler = (await import('@/app/api/transactions/route')).GET;
      await handler(req as never);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      const body = JSON.parse(res._getData());
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
    });

    it('should cap limit at 100', async () => {
      // Arrange
      const { req, res } = createMockRequest('GET', {
        query: { limit: '500' },
        headers: createApiKeyHeader(),
      });

      // Act
      const handler = (await import('@/app/api/transactions/route')).GET;
      await handler(req as never);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      const body = JSON.parse(res._getData());
      expect(body.meta?.limit || body.data?.length).toBeLessThanOrEqual(100);
    });
  });

  // ========================================
  // POST /api/transactions - Create Transaction
  // ========================================
  describe('POST /api/transactions', () => {
    it('should create transaction with valid data', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('amount', '150000');
      formData.append('type', 'EXPENSE');
      formData.append('category', 'Makanan');
      formData.append('description', 'Test transaction');
      formData.append('date', new Date().toISOString());

      const { req, res } = createMockRequest('POST', {
        body: formData,
        headers: createApiKeyHeader(),
      });

      // Act
      const handler = (await import('@/app/api/transactions/route')).POST;
      await handler(req as never);

      // Assert
      expect(res._getStatusCode()).toBe(201);
      const body = JSON.parse(res._getData());
      expect(body.success).toBe(true);
      expect(body.data.transaction).toBeDefined();
    });

    it('should reject invalid amount', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('amount', '-100');
      formData.append('type', 'EXPENSE');
      formData.append('category', 'Makanan');
      formData.append('date', new Date().toISOString());

      const { req, res } = createMockRequest('POST', {
        body: formData,
        headers: createApiKeyHeader(),
      });

      // Act
      const handler = (await import('@/app/api/transactions/route')).POST;
      await handler(req as never);

      // Assert
      expect(res._getStatusCode()).toBe(400);
      const body = JSON.parse(res._getData());
      expect(body.error).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('amount', '100000');
      // Missing type, category, date

      const { req, res } = createMockRequest('POST', {
        body: formData,
        headers: createApiKeyHeader(),
      });

      // Act
      const handler = (await import('@/app/api/transactions/route')).POST;
      await handler(req as never);

      // Assert
      expect(res._getStatusCode()).toBe(400);
    });
  });

  // ========================================
  // PUT /api/transactions - Update Transaction
  // ========================================
  describe('PUT /api/transactions', () => {
    it('should update transaction with valid data', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('id', 'tx-mock-1');
      formData.append('amount', '200000');
      formData.append('type', 'EXPENSE');
      formData.append('category', 'Transport');
      formData.append('description', 'Updated');
      formData.append('date', new Date().toISOString());

      const { req, res } = createMockRequest('PUT', {
        body: formData,
        headers: createApiKeyHeader(),
      });

      // Act
      const handler = (await import('@/app/api/transactions/route')).PUT;
      await handler(req as never);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      const body = JSON.parse(res._getData());
      expect(body.success).toBe(true);
    });

    it('should reject update without id', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('amount', '100000');
      formData.append('type', 'EXPENSE');
      formData.append('category', 'Test');
      formData.append('date', new Date().toISOString());

      const { req, res } = createMockRequest('PUT', {
        body: formData,
        headers: createApiKeyHeader(),
      });

      // Act
      const handler = (await import('@/app/api/transactions/route')).PUT;
      await handler(req as never);

      // Assert
      expect(res._getStatusCode()).toBe(400);
    });
  });

  // ========================================
  // DELETE /api/transactions - Delete Transaction
  // ========================================
  describe('DELETE /api/transactions', () => {
    it('should delete transaction with valid id', async () => {
      // Arrange
      const { req, res } = createMockRequest('DELETE', {
        body: { id: 'tx-mock-1' },
        headers: createApiKeyHeader(),
      });

      // Act
      const handler = (await import('@/app/api/transactions/route')).DELETE;
      await handler(req as never);

      // Assert
      expect(res._getStatusCode()).toBe(204);
    });

    it('should reject delete without id', async () => {
      // Arrange
      const { req, res } = createMockRequest('DELETE', {
        body: {},
        headers: createApiKeyHeader(),
      });

      // Act
      const handler = (await import('@/app/api/transactions/route')).DELETE;
      await handler(req as never);

      // Assert
      expect(res._getStatusCode()).toBe(400);
    });
  });
});

// ============================================
// TEST SUITE: Cursor Pagination
// ============================================

describe('Cursor Pagination Utilities', () => {
  describe('encodeCursor / decodeCursor', () => {
    it('should round-trip encode and decode', async () => {
      // Arrange
      const { encodeCursor, decodeCursor } = await import('@/lib/api-helpers');

      const original = { id: 'tx-123', createdAt: '2026-06-10T00:00:00.000Z' };

      // Act
      const encoded = encodeCursor(original);
      const decoded = decodeCursor(encoded);

      // Assert
      expect(decoded).toEqual(original);
    });

    it('should handle invalid cursor gracefully', async () => {
      // Arrange
      const { decodeCursor } = await import('@/lib/api-helpers');

      // Act
      const decoded = decodeCursor('invalid-cursor-string');

      // Assert
      expect(decoded).toBeNull();
    });
  });

  describe('parseCursorPaginationParams', () => {
    it('should parse valid cursor params', async () => {
      // Arrange
      const { parseCursorPaginationParams } = await import('@/lib/api-helpers');
      const searchParams = new URLSearchParams({
        cursor: 'eyJpZCI6InR4LTEyMyIsImNyZWF0ZWRBdCI6IjIwMjYtMDYtMTBUMDA6MDA6MDAuMDAwWiJ9',
        limit: '30',
      });

      // Act
      const result = parseCursorPaginationParams(searchParams);

      // Assert
      expect(result.cursor).toBeDefined();
      expect(result.limit).toBe(30);
    });

    it('should use default limit when not provided', async () => {
      // Arrange
      const { parseCursorPaginationParams } = await import('@/lib/api-helpers');
      const searchParams = new URLSearchParams();

      // Act
      const result = parseCursorPaginationParams(searchParams);

      // Assert
      expect(result.limit).toBe(20);
    });

    it('should cap limit at 100', async () => {
      // Arrange
      const { parseCursorPaginationParams } = await import('@/lib/api-helpers');
      const searchParams = new URLSearchParams({ limit: '500' });

      // Act
      const result = parseCursorPaginationParams(searchParams);

      // Assert
      expect(result.limit).toBe(100);
    });
  });
});

// ============================================
// TEST SUITE: API Response Format
// ============================================

describe('API Response Format', () => {
  describe('Success responses', () => {
    it('should have correct structure for ok response', async () => {
      // Arrange
      const { ApiResponse } = await import('@/lib/api-helpers');

      // Act
      const response = ApiResponse.ok({ transactions: [] });
      const body = await response.json();

      // Assert
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');
      expect(body.success).toBe(true);
    });

    it('should have correct structure for created response', async () => {
      // Arrange
      const { ApiResponse } = await import('@/lib/api-helpers');

      // Act
      const response = ApiResponse.created({ id: '123' });
      const body = await response.json();

      // Assert
      expect(body).toHaveProperty('success');
      expect(body.success).toBe(true);
    });
  });

  describe('Error responses', () => {
    it('should have correct structure for error response', async () => {
      // Arrange
      const { ApiResponse } = await import('@/lib/api-helpers');

      // Act
      const response = ApiResponse.badRequest('Test error', { field: 'amount' });
      const body = await response.json();

      // Assert
      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code');
      expect(body.error).toHaveProperty('message');
      expect(body.error).toHaveProperty('request_id');
    });

    it('should include request_id for tracing', async () => {
      // Arrange
      const { ApiResponse } = await import('@/lib/api-helpers');

      // Act
      const response = ApiResponse.notFound('Transaction');
      const body = await response.json();

      // Assert
      expect(body.error.request_id).toMatch(/^[0-9a-f-]{36}$/);
    });
  });
});
