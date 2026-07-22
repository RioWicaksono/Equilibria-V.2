import { NextRequest, NextResponse } from 'next/server';
import {
  checkDatabaseRateLimit,
  createRateLimitResponse,
  addRateLimitHeaders,
  getRateLimitConfig,
  DEFAULT_RATE_LIMIT,
  type RateLimitConfig,
} from './db-rate-limit';

export function withRateLimit<T extends NextRequest>(
  handler: (req: T) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (req: T): Promise<NextResponse> => {
    const rateLimitConfig = config || getRateLimitConfig(req.nextUrl.pathname);
    const result = await checkDatabaseRateLimit(req, rateLimitConfig);

    if (!result.allowed) {
      return createRateLimitResponse(result, rateLimitConfig);
    }

    const response = await handler(req);
    addRateLimitHeaders(response, result, rateLimitConfig);
    return response;
  };
}

export async function rateLimitRequest(
  req: NextRequest,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Promise<{ allowed: boolean; result: Awaited<ReturnType<typeof checkDatabaseRateLimit>> }> {
  const result = await checkDatabaseRateLimit(req, config);
  return { allowed: result.allowed, result };
}

export { checkDatabaseRateLimit, createRateLimitResponse, addRateLimitHeaders };
export type { RateLimitResult, RateLimitConfig } from './db-rate-limit';
