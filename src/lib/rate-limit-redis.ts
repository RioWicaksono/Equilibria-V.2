/**
 * Redis-based Rate Limiting
 *
 * For production deployment with multiple serverless instances.
 * Falls back to in-memory rate limiting in development.
 *
 * Usage:
 *   import { createRedisRateLimiter } from './rate-limit-redis';
 */

import Redis from 'ioredis';

// Redis connection config
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Rate limit configs per endpoint type
const RATE_LIMITS = {
  DEFAULT: { maxRequests: 100, windowMs: 60 * 1000 },
  SENSITIVE: { maxRequests: 30, windowMs: 60 * 1000 },
  WRITE: { maxRequests: 60, windowMs: 60 * 1000 },
  CRON: { maxRequests: 10, windowMs: 60 * 1000 },
} as const;

type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; resetAt: number }>();

// Lazy Redis client (only connect in production)
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (process.env.NODE_ENV === 'production' && !redis) {
    try {
      redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      redis.on('error', (err) => {
        console.error('Redis connection error:', err.message);
        redis = null;
      });

      return redis;
    } catch (err) {
      console.error('Failed to create Redis client:', err);
      return null;
    }
  }
  return redis;
}

// ============================================
// IN-MEMORY RATE LIMITER (Development)
// ============================================

function checkMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || record.resetAt < now) {
    // New window
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
      limit: maxRequests,
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      limit: maxRequests,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
    limit: maxRequests,
  };
}

// ============================================
// REDIS RATE LIMITER (Production)
// ============================================

async function checkRedisRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const client = getRedisClient();
  if (!client) {
    // Fallback to memory if Redis unavailable
    return checkMemoryRateLimit(key, maxRequests, windowMs);
  }

  const redisKey = `ratelimit:${key}`;
  const now = Date.now();

  try {
    const multi = client.multi();

    // Remove old entries
    multi.zremrangebyscore(redisKey, 0, now - windowMs);

    // Count current requests
    multi.zcard(redisKey);

    // Add new request with timestamp
    multi.zadd(redisKey, now, `${now}:${Math.random()}`);

    // Set expiry
    multi.pexpire(redisKey, windowMs);

    const results = await multi.exec();

    if (!results) {
      throw new Error('Redis transaction failed');
    }

    const currentCount = results[1][1] as number;

    if (currentCount >= maxRequests) {
      // Get oldest entry to calculate reset time
      const oldest = await client.zrange(redisKey, 0, 0, 'WITHSCORES');
      const resetAt = oldest.length >= 2 ? parseInt(oldest[1]) + windowMs : now + windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: maxRequests,
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - currentCount - 1,
      resetAt: now + windowMs,
      limit: maxRequests,
    };
  } catch (err) {
    console.error('Redis rate limit error:', err);
    // Fallback to memory on error
    return checkMemoryRateLimit(key, maxRequests, windowMs);
  }
}

// ============================================
// PUBLIC API
// ============================================

export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'DEFAULT'
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;

  // Use Redis in production, memory in development
  if (process.env.NODE_ENV === 'production') {
    return checkRedisRateLimit(key, config.maxRequests, config.windowMs);
  }

  return checkMemoryRateLimit(key, config.maxRequests, config.windowMs);
}

export function createRateLimitResponse(result: RateLimitResult) {
  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.resetAt / 1000).toString(),
    'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
  };

  if (!result.allowed) {
    return {
      allowed: false,
      headers,
      status: 429,
      body: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
      },
    };
  }

  return {
    allowed: true,
    headers,
    status: 200,
    body: null,
  };
}

// ============================================
// SLIDING WINDOW RATE LIMITER
// ============================================

export async function checkSlidingWindowRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const client = getRedisClient();
  const redisKey = `sliding:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!client) {
    // Fallback to memory
    return checkMemoryRateLimit(`${identifier}:sliding`, maxRequests, windowMs);
  }

  try {
    const multi = client.multi();

    // Remove entries outside window
    multi.zremrangebyscore(redisKey, 0, windowStart);

    // Count entries in window
    multi.zcard(redisKey);

    // Add new request
    multi.zadd(redisKey, now, `${now}:${Math.random()}`);

    // Expire key
    multi.pexpire(redisKey, windowMs * 2);

    const results = await multi.exec();

    if (!results) {
      throw new Error('Redis transaction failed');
    }

    const currentCount = results[1][1] as number;

    if (currentCount >= maxRequests) {
      // Calculate when oldest entry expires
      const oldest = await client.zrange(redisKey, 0, 0, 'WITHSCORES');
      const oldestTime = oldest.length >= 2 ? parseInt(oldest[1]) : now;
      const resetAt = oldestTime + windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: maxRequests,
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - currentCount - 1,
      resetAt: now + windowMs,
      limit: maxRequests,
    };
  } catch (err) {
    console.error('Redis sliding window error:', err);
    return checkMemoryRateLimit(`${identifier}:sliding`, maxRequests, windowMs);
  }
}

// ============================================
// TOKEN BUCKET RATE LIMITER
// ============================================

const tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();

export async function checkTokenBucketRateLimit(
  identifier: string,
  maxTokens: number,
  refillRate: number, // tokens per second
  cost: number = 1
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const now = Date.now();
  const bucket = tokenBuckets.get(identifier);

  if (!bucket) {
    tokenBuckets.set(identifier, {
      tokens: maxTokens - cost,
      lastRefill: now,
    });
    return { allowed: true, remaining: maxTokens - cost };
  }

  // Calculate token refill
  const elapsed = (now - bucket.lastRefill) / 1000;
  const tokensToAdd = elapsed * refillRate;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens < cost) {
    const retryAfter = Math.ceil((cost - bucket.tokens) / refillRate);
    return { allowed: false, remaining: Math.floor(bucket.tokens), retryAfter };
  }

  bucket.tokens -= cost;
  return { allowed: true, remaining: Math.floor(bucket.tokens) };
}
