import { NextRequest, NextResponse } from 'next/server';

// Rate limit store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

// Rate limit config
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // per minute

// Paths that don't require rate limiting
const PUBLIC_PATHS = [
  '/api/health',
  '/api/docs',
  '/api/docs-json',
];

// Paths that need stricter rate limiting
const SENSITIVE_PATHS = [
  '/api/telegram',
  '/api/telegram-webhook',
];

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
 * Check rate limit for a client
 */
function checkRateLimit(
  req: NextRequest,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const ip = getClientIP(req);
  const now = Date.now();

  const record = rateLimitStore.get(ip);

  // No record exists - create new one
  if (!record) {
    rateLimitStore.set(ip, { count: 1, timestamp: now });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  // Check if window has expired
  if (now - record.timestamp > windowMs) {
    rateLimitStore.set(ip, { count: 1, timestamp: now });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  // Increment count
  record.count++;

  // Check if limit exceeded
  if (record.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.timestamp + windowMs,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.timestamp + windowMs,
  };
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip middleware for non-API routes
  if (!path.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip rate limiting for public endpoints
  const isPublicPath = PUBLIC_PATHS.some(p => path.startsWith(p));

  if (!isPublicPath) {
    // Apply rate limiting to non-public API routes
    const isSensitive = SENSITIVE_PATHS.some(p => path.startsWith(p));
    const maxRequests = isSensitive ? 30 : RATE_LIMIT_MAX_REQUESTS;

    const rateLimitResult = checkRateLimit(req, RATE_LIMIT_WINDOW_MS, maxRequests);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
};