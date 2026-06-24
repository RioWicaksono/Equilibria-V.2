/**
 * API Authentication Middleware
 * Provides API key validation for secure API access
 */

import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/docs',
  '/api/docs-json',
];

// Routes that require cron/service authentication only
const SERVICE_ROUTES = [
  '/api/cron',
  '/api/telegram-webhook',
];

// Get API key from environment
function getApiKey(): string | undefined {
  return process.env.API_SECRET_KEY;
}

// Validate API key from request
function validateApiKey(request: NextRequest): boolean {
  const apiKey = getApiKey();

  // If no API key is configured, allow all requests (development mode)
  if (!apiKey) {
    console.warn('[AUTH] No API_SECRET_KEY configured - allowing all requests');
    return true;
  }

  // Check header first (preferred method)
  const headerKey = request.headers.get('x-api-key');
  if (headerKey === apiKey) {
    return true;
  }

  // Check query parameter (fallback for SSE, downloads)
  const queryKey = request.nextUrl.searchParams.get('api_key');
  if (queryKey === apiKey) {
    return true;
  }

  return false;
}

// Check if route is public
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => path.startsWith(route));
}

// Check if route is service-only
function isServiceRoute(path: string): boolean {
  return SERVICE_ROUTES.some(route => path.startsWith(route));
}

// Validate cron secret for service routes
function validateCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // If no cron secret, allow with warning
    console.warn('[AUTH] No CRON_SECRET configured - allowing cron requests');
    return true;
  }

  const headerSecret = request.headers.get('x-cron-secret');
  return headerSecret === cronSecret;
}

export interface AuthResult {
  authenticated: boolean;
  reason?: string;
}

export function authenticateRequest(request: NextRequest): AuthResult {
  const path = request.nextUrl.pathname;

  // Allow public routes
  if (isPublicRoute(path)) {
    return { authenticated: true };
  }

  // Service routes need cron secret
  if (isServiceRoute(path)) {
    if (!validateCronSecret(request)) {
      return { authenticated: false, reason: 'Invalid cron secret' };
    }
    return { authenticated: true };
  }

  // All other routes need API key
  if (!validateApiKey(request)) {
    return { authenticated: false, reason: 'Invalid or missing API key' };
  }

  return { authenticated: true };
}

// Middleware wrapper for API routes
export function withAuth<T>(
  handler: (req: NextRequest, ...args: T[]) => Promise<NextResponse>,
  options?: { requireAuth?: boolean }
) {
  return async (req: NextRequest, ...args: T[]) => {
    const shouldAuth = options?.requireAuth !== false; // Default to require auth

    if (shouldAuth) {
      const auth = authenticateRequest(req);
      if (!auth.authenticated) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            message: auth.reason || 'Authentication required'
          },
          { status: 401 }
        );
      }
    }

    return handler(req, ...args);
  };
}
