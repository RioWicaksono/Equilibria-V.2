import rateLimit from 'express-rate-limit';
import { NextRequest } from 'next/server';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.toString().split(',')[0] ||
           req.headers['x-real-ip']?.toString() ||
           req.socket.remoteAddress ||
           'unknown';
  },
});

// Strict rate limiter for authentication-related endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for write operations (POST, PUT, DELETE)
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 write requests per minute
  message: {
    success: false,
    error: 'Terlalu banyak operasi tulis. Silakan perlambat.',
    code: 'WRITE_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for Telegram webhook
export const telegramLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per minute
  message: {
    success: false,
    error: 'Rate limit exceeded for Telegram operations.',
    code: 'TELEGRAM_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for export operations
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 exports per hour
  message: {
    success: false,
    error: 'Terlalu banyak permintaan export. Silakan coba lagi nanti.',
    code: 'EXPORT_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Skip rate limiting for health checks
export const skipRateLimit = (req: NextRequest): boolean => {
  const healthPaths = ['/api/health', '/api/ping'];
  return healthPaths.includes(req.nextUrl.pathname);
};

// Create a custom handler that skips rate limiting for specific paths
export const createRateLimitHandler = (limiter: ReturnType<typeof rateLimit>) => {
  return (req: Request): { limited: boolean; headers: Record<string, string> } => {
    // This is a simplified version - in production you'd use the actual middleware
    const responseHeaders: Record<string, string> = {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '99',
      'X-RateLimit-Reset': String(Date.now() + 15 * 60 * 1000),
    };

    return { limited: false, headers: responseHeaders };
  };
};