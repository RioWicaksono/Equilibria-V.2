import { NextRequest, NextResponse } from 'next/server';

// Rate limit store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

/**
 * Default rate limit config
 * 100 requests per minute per IP
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
};

/**
 * Stricter rate limit for sensitive endpoints
 * 20 requests per minute per IP
 */
const STRICT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
};

/**
 * Get client IP from request
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return realIP || 'unknown';
}

/**
 * Clean up expired entries periodically
 */
function cleanupExpired() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.timestamp > DEFAULT_CONFIG.windowMs * 2) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpired, 5 * 60 * 1000);
}

/**
 * Check rate limit for a client
 */
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetTime: number } {
  const ip = getClientIP(req);
  const now = Date.now();

  const record = rateLimitStore.get(ip);

  // No record exists - create new one
  if (!record) {
    rateLimitStore.set(ip, { count: 1, timestamp: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Check if window has expired
  if (now - record.timestamp > config.windowMs) {
    rateLimitStore.set(ip, { count: 1, timestamp: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Increment count
  record.count++;

  // Check if limit exceeded
  if (record.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.timestamp + config.windowMs,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.timestamp + config.windowMs,
  };
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = DEFAULT_CONFIG
) {
  return async (req: NextRequest) => {
    // Skip rate limiting for health check
    if (req.nextUrl.pathname === '/api/health') {
      return handler(req);
    }

    const result = checkRateLimit(req, config);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          }
        }
      );
    }

    const response = await handler(req);

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

    return response;
  };
}

/**
 * Strict rate limit for sensitive operations (login, PIN change, etc.)
 */
export function withStrictRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRateLimit(handler, STRICT_CONFIG);
}