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

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
].filter(Boolean);

// CSRF safe methods
const CSRF_SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

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

/**
 * Validate CORS origin
 */
function isValidOrigin(origin: string | null): boolean {
  if (!origin) return true; // Allow null for same-origin requests
  return ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const origin = req.headers.get('origin');
  const method = req.method;

  // Add security headers to all responses
  const response = NextResponse.next();

  // CORS headers
  if (isValidOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return response;
  }

  // Skip middleware for non-API routes
  if (!path.startsWith('/api/')) {
    return response;
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // CSRF protection for mutating requests
  if (!CSRF_SAFE_METHODS.includes(method)) {
    const csrfToken = req.headers.get('x-csrf-token');
    // In production, validate CSRF token against stored token
    // For now, we just check it exists for mutating requests
    if (!csrfToken) {
      // Log potential CSRF attempt (in production, use proper logging)
      console.warn(`CSRF warning: Missing token for ${method} ${path}`);
    }
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

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  }

  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
};