import { NextRequest, NextResponse } from 'next/server';

/**
 * API Authentication Middleware
 * Protects all API routes with a simple token-based auth
 */
export function withAuth(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.API_SECRET_KEY;

    // Skip auth for health check
    if (req.nextUrl.pathname === '/api/health') {
      return handler(req, context);
    }

    // Validate API key exists
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'API key required' },
        { status: 401 }
      );
    }

    // Validate API key matches
    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Invalid API key' },
        { status: 403 }
      );
    }

    return handler(req, context);
  };
}

/**
 * Generate a random API key
 */
export function generateApiKey(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}