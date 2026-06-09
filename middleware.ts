import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

// Rate limit config
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // per minute

// Paths that don't require auth
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

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip middleware for non-API routes
  if (!path.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip rate limiting for public endpoints
  const isPublicPath = PUBLIC_PATHS.some(p => path.startsWith(p));

  if (!isPublicPath) {
    // 1. Apply rate limiting to non-public API routes
    const isSensitive = SENSITIVE_PATHS.some(p => path.startsWith(p));
    const maxRequests = isSensitive ? 30 : RATE_LIMIT_MAX_REQUESTS;

    const rateLimitResult = checkRateLimit(req, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxRequests,
    });

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

  // 2. Add security headers to all responses
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