/**
 * Cron Authentication Middleware
 *
 * Validates X-Cron-Secret header for scheduled cron jobs.
 * Uses CRON_SECRET environment variable.
 */

import { NextRequest, NextResponse } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Validate cron secret from request headers
 */
export function validateCronSecret(req: NextRequest): boolean {
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  // In development, allow access without secret
  if (!isProduction) {
    return true;
  }

  // In production, require the secret
  if (!expectedSecret) {
    console.error('[Cron Auth] CRON_SECRET not configured in production!');
    return false;
  }

  return cronSecret === expectedSecret;
}

/**
 * Create a cron route handler with authentication
 */
export function withCronAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function authenticatedHandler(req: NextRequest) {
    // Validate cron secret
    if (!validateCronSecret(req)) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Invalid or missing cron secret. Include X-Cron-Secret header.',
            request_id: crypto.randomUUID(),
          },
        },
        { status: 403 }
      );
    }

    // Log cron execution
    console.log(`[Cron] ${req.nextUrl.pathname} executed at ${new Date().toISOString()}`);

    // Execute the handler
    return handler(req);
  };
}

/**
 * Example usage:
 *
 * import { withCronAuth } from '@/lib/cronAuth';
 *
 * export const GET = withCronAuth(async () => {
 *   // Your cron logic here
 * });
 */
