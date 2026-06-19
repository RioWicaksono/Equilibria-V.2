/**
 * Rate Limiting Middleware for API Routes
 *
 * This middleware provides database-backed rate limiting that works
 * across serverless instances. It should be used in API routes
 * that need strict rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/serverRateLimit';

/**
 * Create a rate limiting middleware for specific routes
 */
export function withRateLimit(
  config: keyof typeof RATE_LIMIT_CONFIGS = 'standard'
) {
  return async function rateLimitMiddleware(
    req: NextRequest,
    options?: {
      identifierExtractor?: (req: NextRequest) => string;
      onLimitExceeded?: (req: NextRequest) => NextResponse;
    }
  ) {
    const rateLimitConfig = RATE_LIMIT_CONFIGS[config];

    // Default: use client IP
    const identifier = options?.identifierExtractor
      ? options.identifierExtractor(req)
      : getClientIP(req);

    try {
      const result = await checkRateLimit(identifier, rateLimitConfig);

      // Create response
      const response = options?.onLimitExceeded
        ? options.onLimitExceeded(req)
        : createRateLimitResponse(result, rateLimitConfig.maxRequests);

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', rateLimitConfig.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

      if (!result.allowed) {
        response.headers.set('Retry-After', (result.retryAfter || 1).toString());
        return response;
      }

      return null; // Continue to handler
    } catch (error) {
      console.error('[RateLimit] Error:', error);
      return null; // Fail open
    }
  };
}

/**
 * Get client IP from request
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return realIP || 'unknown';
}

/**
 * Create a 429 rate limit exceeded response
 */
function createRateLimitResponse(
  result: { remaining: number; resetTime: number; retryAfter?: number },
  maxRequests: number
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter || 1,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': (result.retryAfter || 1).toString(),
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetTime.toString(),
      },
    }
  );
}

/**
 * Pre-configured rate limit middlewares for common use cases
 */
export const rateLimitMiddleware = {
  // Standard API: 100 requests per minute
  standard: withRateLimit('standard'),

  // Sensitive endpoints: 30 requests per minute
  sensitive: withRateLimit('sensitive'),

  // Strict: 10 requests per minute
  strict: withRateLimit('strict'),

  // Auth endpoints: 5 requests per minute
  auth: withRateLimit('auth'),
};

/**
 * Example usage in API route:
 *
 * export async function POST(req: NextRequest) {
 *   const rateLimit = rateLimitMiddleware.standard;
 *   const blocked = await rateLimit(req);
 *   if (blocked) return blocked;
 *
 *   // Your handler code...
 * }
 */
