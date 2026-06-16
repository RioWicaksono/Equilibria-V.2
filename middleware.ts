import { NextRequest, NextResponse } from 'next/server';

// Rate limit store with TTL cleanup
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_CLEANUP_INTERVAL = 5 * 60 * 1000; // Cleanup every 5 minutes

// Rate limit config
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // per minute

// Protected API paths (require authentication)
const PROTECTED_PATHS = [
  '/api/transactions',
  '/api/budgets',
  '/api/wallets',
  '/api/goals',
  '/api/debts',
  '/api/recurring',
  '/api/summary',
  '/api/export',
  '/api/cron',
];

// Public paths (no auth required)
const PUBLIC_PATHS = [
  '/api/health',
  '/api/docs',
  '/api/docs-json',
  '/api/telegram-webhook', // Telegram bot - uses bot token validation instead
  '/api/settings',
];

// Paths that need stricter rate limiting
const SENSITIVE_PATHS = [
  '/api/telegram',
];

// Allowed origins for CORS
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'];

const isProduction = process.env.NODE_ENV === 'production';

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
 * Validate API key for protected endpoints
 */
function validateApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key');
  const expectedKey = process.env.API_SECRET_KEY;

  if (!expectedKey) {
    // If no API key is configured, allow access (development mode)
    return !isProduction;
  }

  if (!apiKey) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (apiKey.length !== expectedKey.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.codePointAt(i)! ^ expectedKey.codePointAt(i)!;
  }

  return result === 0;
}

/**
 * Validate cron secret for scheduled endpoints
 */
function validateCronSecret(req: NextRequest): boolean {
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    // If no secret is configured, allow access (development mode)
    return !isProduction;
  }

  return cronSecret === expectedSecret;
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

  // Periodic cleanup of expired entries
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now - value.timestamp > windowMs * 2) {
        rateLimitStore.delete(key);
      }
    }
  }

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
 * Validate CORS origin with exact matching
 */
function isValidOrigin(origin: string | null): boolean {
  if (!origin) return true; // Allow null for same-origin requests
  return ALLOWED_ORIGINS.includes(origin);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const origin = req.headers.get('origin');
  const method = req.method;

  // Add security headers to all responses
  const response = NextResponse.next();

  // CORS headers with exact origin matching
  if (isValidOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-CSRF-Token, X-Cron-Secret');
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

  // Production security headers
  if (isProduction) {
    // Content Security Policy
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.vercel.app https://*.neon.tech;"
    );
    // HTTP Strict Transport Security (1 year)
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    // Permissions Policy
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  }

  // Authentication check for protected endpoints
  const isProtectedPath = PROTECTED_PATHS.some(p => path.startsWith(p));
  if (isProtectedPath && !validateApiKey(req)) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing API key. Include X-API-Key header.',
          request_id: crypto.randomUUID(),
        },
      },
      { status: 401, headers: { 'WWW-Authenticate': 'ApiKey' } }
    );
  }

  // Cron secret validation for scheduled endpoints
  if (path.startsWith('/api/cron') && !validateCronSecret(req)) {
    return NextResponse.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid or missing cron secret.',
          request_id: crypto.randomUUID(),
        },
      },
      { status: 403 }
    );
  }

  // CSRF protection for mutating requests (reject if missing)
  if (!CSRF_SAFE_METHODS.includes(method) && isProduction) {
    const csrfToken = req.headers.get('x-csrf-token');
    if (!csrfToken) {
      return NextResponse.json(
        {
          error: {
            code: 'CSRF_REQUIRED',
            message: 'CSRF token required for mutating requests.',
            request_id: crypto.randomUUID(),
          },
        },
        { status: 403 }
      );
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