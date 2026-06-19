import { NextRequest, NextResponse } from 'next/server';

// Rate limit config
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // per minute
const SENSITIVE_MAX_REQUESTS = 30; // per minute

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
];

// Public paths (no auth required)
const PUBLIC_PATHS = [
  '/api/health',
  '/api/docs',
  '/api/docs-json',
  '/api/telegram-webhook',
  '/api/settings',
  '/api/settings/pin',
];

// Paths that need stricter rate limiting
const SENSITIVE_PATHS = [
  '/api/telegram',
  '/api/auth',
];

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
 * Check if path is public
 */
function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(p => path.startsWith(p));
}

/**
 * Check if path is sensitive (needs stricter limits)
 */
function isSensitivePath(path: string): boolean {
  return SENSITIVE_PATHS.some(p => path.startsWith(p));
}

/**
 * Get rate limit config for path
 */
function getRateLimitConfig(path: string): { windowMs: number; maxRequests: number } {
  if (isSensitivePath(path)) {
    return { windowMs: RATE_LIMIT_WINDOW_MS, maxRequests: SENSITIVE_MAX_REQUESTS };
  }
  return { windowMs: RATE_LIMIT_WINDOW_MS, maxRequests: RATE_LIMIT_MAX_REQUESTS };
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const origin = req.headers.get('origin');
  const method = req.method;

  // Create response for the next handler
  const response = req.headers.get('x-middleware-init') === 'true'
    ? new NextResponse()
    : NextResponse.next();

  // CORS headers - Fixed: Only set allowed origin, not null
  if (origin && !origin.includes('undefined') && origin !== 'null') {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (!isProduction) {
    // Allow localhost in development
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
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

  // Skip auth for public paths
  if (!isPublicPath(path)) {
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
  }

  // CSRF protection for mutating requests in production
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

  // Add rate limit headers (soft limit - actual limiting done in API routes)
  const { windowMs, maxRequests } = getRateLimitConfig(path);
  response.headers.set('X-RateLimit-Limit', maxRequests.toString());
  response.headers.set('X-RateLimit-Window', `${windowMs / 1000}s`);

  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
};
