import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';
import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

export const STRICT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 20,
};

export const SENSITIVE_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 10,
};

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return realIP || 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export async function checkDatabaseRateLimit(
  req: NextRequest,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
  identifier?: string
): Promise<RateLimitResult> {
  const prisma = await getPrismaAsync();
  const ip = identifier || getClientIP(req);
  const key = `rl:${ip}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.rateLimitEntry.deleteMany({
        where: {
          createdAt: { lt: windowStart },
        },
      });

      const count = await tx.rateLimitEntry.count({
        where: { key },
      });

      if (count >= config.maxRequests) {
        const oldestEntry = await tx.rateLimitEntry.findFirst({
          where: { key },
          orderBy: { createdAt: 'asc' },
        });

        const resetTime = oldestEntry
          ? oldestEntry.createdAt.getTime() + config.windowMs
          : now.getTime() + config.windowMs;

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - now.getTime()) / 1000),
        };
      }

      await tx.rateLimitEntry.create({
        data: { key },
      });

      return {
        allowed: true,
        remaining: config.maxRequests - count - 1,
        resetTime: now.getTime() + config.windowMs,
      };
    });

    return result;
  } catch (error) {
    console.error('[RateLimit] Database error, allowing request:', error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: now.getTime() + config.windowMs,
    };
  }
}

export function createRateLimitResponse(result: RateLimitResult, config: RateLimitConfig): NextResponse {
  const retryAfter = result.retryAfter || Math.ceil((result.resetTime - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
        retryAfter,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
      },
    }
  );
}

export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  config: RateLimitConfig
): void {
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
}

export function isSensitivePath(path: string): boolean {
  const sensitivePaths = ['/api/auth', '/api/telegram', '/api/settings/pin'];
  return sensitivePaths.some((p) => path.startsWith(p));
}

export function getRateLimitConfig(path: string): RateLimitConfig {
  if (isSensitivePath(path)) {
    return SENSITIVE_RATE_LIMIT;
  }
  return DEFAULT_RATE_LIMIT;
}
