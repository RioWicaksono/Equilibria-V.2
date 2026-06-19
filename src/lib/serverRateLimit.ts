/**
 * Database-backed Rate Limiter for Serverless Environments
 *
 * Uses PostgreSQL to store rate limit counters, making it compatible
 * with Vercel serverless functions running on multiple instances.
 *
 * Algorithm: Sliding window counter with cleanup
 */

import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix: string;    // Prefix for rate limit keys
}

/**
 * Check rate limit for a given identifier (IP, user ID, API key, etc.)
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { windowMs, maxRequests, keyPrefix } = config;
  const prisma = await getPrismaAsync();
  const now = Date.now();
  const windowStart = new Date(now - windowMs);

  try {
    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Clean up old entries first (older than 2 windows)
      await tx.$executeRaw`
        DELETE FROM "RateLimitEntry"
        WHERE key = ${`${keyPrefix}:${identifier}`}
        AND created_at < ${new Date(now - windowMs * 2)}
      `;

      // Count current requests in window
      const countResult = await tx.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "RateLimitEntry"
        WHERE key = ${`${keyPrefix}:${identifier}`}
        AND created_at > ${windowStart}
      `;

      const currentCount = Number(countResult[0]?.count || 0);

      if (currentCount >= maxRequests) {
        // Rate limit exceeded
        const oldestResult = await tx.$queryRaw<Array<{ created_at: Date }>>`
          SELECT created_at
          FROM "RateLimitEntry"
          WHERE key = ${`${keyPrefix}:${identifier}`}
          ORDER BY created_at ASC
          LIMIT 1
        `;

        const oldestTime = oldestResult[0]?.created_at?.getTime() || now;
        const resetTime = oldestTime + windowMs;

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000),
        };
      }

      // Add new entry
      await tx.$executeRaw`
        INSERT INTO "RateLimitEntry" (key, created_at)
        VALUES (${`${keyPrefix}:${identifier}`}, ${new Date(now)})
      `;

      return {
        allowed: true,
        remaining: maxRequests - currentCount - 1,
        resetTime: now + windowMs,
      };
    });

    return result;
  } catch (error) {
    console.error('[RateLimit] Error:', error);
    // Fail open - allow request if rate limit check fails
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: now + windowMs,
    };
  }
}

/**
 * Reset rate limit for an identifier (e.g., after successful auth)
 */
export async function resetRateLimit(
  identifier: string,
  keyPrefix: string
): Promise<void> {
  const prisma = await getPrismaAsync();
  const key = `${keyPrefix}:${identifier}`;

  try {
    await prisma.$executeRaw`
      DELETE FROM "RateLimitEntry"
      WHERE key = ${key}
    `;
  } catch (error) {
    console.error('[RateLimit] Error resetting:', error);
  }
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): Promise<{ count: number; remaining: number; resetTime: number }> {
  const { windowMs, maxRequests, keyPrefix } = config;
  const prisma = await getPrismaAsync();
  const now = Date.now();
  const windowStart = new Date(now - windowMs);

  try {
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "RateLimitEntry"
      WHERE key = ${`${keyPrefix}:${identifier}`}
      AND created_at > ${windowStart}
    `;

    const currentCount = Number(countResult[0]?.count || 0);

    return {
      count: currentCount,
      remaining: Math.max(0, maxRequests - currentCount),
      resetTime: now + windowMs,
    };
  } catch (error) {
    console.error('[RateLimit] Error getting status:', error);
    return {
      count: 0,
      remaining: maxRequests,
      resetTime: now + windowMs,
    };
  }
}

// Pre-configured rate limit settings
export const RATE_LIMIT_CONFIGS = {
  // Standard API: 100 requests per minute
  standard: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: 'rl:api',
  },
  // Sensitive endpoints: 30 requests per minute
  sensitive: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyPrefix: 'rl:sensitive',
  },
  // Strict: 10 requests per minute
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'rl:strict',
  },
  // Auth endpoints: 5 requests per minute
  auth: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'rl:auth',
  },
} as const;
