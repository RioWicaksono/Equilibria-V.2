import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  checkDatabaseRateLimit,
  createRateLimitResponse,
  addRateLimitHeaders,
  getRateLimitConfig,
  DEFAULT_RATE_LIMIT,
  STRICT_RATE_LIMIT,
  SENSITIVE_RATE_LIMIT,
  type RateLimitConfig,
} from '@/lib/db-rate-limit';

// Mock Prisma
vi.mock('@/infrastructure/database/PrismaClient', () => ({
  getPrismaAsync: vi.fn(() => Promise.resolve({
    rateLimitEntry: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: '1' }),
    },
  })),
}));

describe('Rate Limiting', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    mockRequest = {
      headers: new Map([
        ['x-forwarded-for', '192.168.1.1'],
      ]),
      nextUrl: {
        pathname: '/api/test',
      },
    } as unknown as Partial<NextRequest>;
  });

  describe('checkDatabaseRateLimit', () => {
    it('should allow first request within limit', async () => {
      const result = await checkDatabaseRateLimit(
        mockRequest as NextRequest,
        DEFAULT_RATE_LIMIT
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(DEFAULT_RATE_LIMIT.maxRequests - 1);
    });

    it('should return correct reset time', async () => {
      const result = await checkDatabaseRateLimit(
        mockRequest as NextRequest,
        DEFAULT_RATE_LIMIT
      );

      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should use custom identifier when provided', async () => {
      const result = await checkDatabaseRateLimit(
        mockRequest as NextRequest,
        DEFAULT_RATE_LIMIT,
        'custom_key'
      );

      expect(result.allowed).toBe(true);
    });
  });

  describe('getRateLimitConfig', () => {
    it('should return sensitive config for sensitive paths', () => {
      const sensitivePaths = ['/api/auth', '/api/telegram', '/api/settings/pin'];

      sensitivePaths.forEach(path => {
        const config = getRateLimitConfig(path);
        expect(config).toEqual(SENSITIVE_RATE_LIMIT);
      });
    });

    it('should return default config for normal paths', () => {
      const normalPaths = ['/api/transactions', '/api/budgets', '/api/health'];

      normalPaths.forEach(path => {
        const config = getRateLimitConfig(path);
        expect(config).toEqual(DEFAULT_RATE_LIMIT);
      });
    });
  });

  describe('Rate limit configurations', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_RATE_LIMIT.maxRequests).toBe(100);
      expect(DEFAULT_RATE_LIMIT.windowMs).toBe(60000);
    });

    it('should have stricter limits for sensitive operations', () => {
      expect(SENSITIVE_RATE_LIMIT.maxRequests).toBeLessThan(DEFAULT_RATE_LIMIT.maxRequests);
    });

    it('should have stricter limits than default for strict config', () => {
      expect(STRICT_RATE_LIMIT.maxRequests).toBeLessThan(DEFAULT_RATE_LIMIT.maxRequests);
    });
  });

  describe('createRateLimitResponse', () => {
    it('should create 429 response when rate limited', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      };

      const response = createRateLimitResponse(result, DEFAULT_RATE_LIMIT);

      expect(response.status).toBe(429);
    });

    it('should include rate limit headers', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      };

      const response = createRateLimitResponse(result, DEFAULT_RATE_LIMIT);

      expect(response.headers.get('Retry-After')).toBe('60');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should include error body', async () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 30,
      };

      const response = createRateLimitResponse(result, DEFAULT_RATE_LIMIT);
      const body = await response.json();

      expect(body.error).toBeDefined();
      expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers to response', () => {
      const mockResponse = {
        headers: {
          set: vi.fn(),
        },
      } as unknown as Response;

      const result = {
        allowed: true,
        remaining: 50,
        resetTime: Date.now() + 60000,
      };

      addRateLimitHeaders(mockResponse as any, result, DEFAULT_RATE_LIMIT);

      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '50');
    });
  });
});
