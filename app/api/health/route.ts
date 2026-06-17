/**
 * Health Check API Endpoint
 * Provides detailed health status for monitoring and alerting
 */

import { NextResponse } from 'next/server';
import { logDatabaseOperation } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    server: { status: 'pass'; latency: number };
    database: { status: 'pass' | 'fail' | 'skip'; latency?: number; error?: string };
  };
}

export async function GET() {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {
    server: { status: 'pass', latency: 0 },
    database: { status: 'skip' },
  };

  let overallStatus: HealthStatus['status'] = 'healthy';

  // Check server (always passes if this endpoint is reachable)
  checks.server = {
    status: 'pass',
    latency: Date.now() - startTime,
  };

  // Check database connection (optional - does not fail health check)
  const dbStart = Date.now();
  try {
    // Lazy import to avoid crashing on import
    const { getPrismaAsync } = await import('@/infrastructure/database/PrismaClient');
    const prisma = await getPrismaAsync();
    await prisma.$queryRaw`SELECT 1`;
    const dbDuration = Date.now() - dbStart;
    checks.database = {
      status: 'pass',
      latency: dbDuration,
    };
    logDatabaseOperation('health_check', 'ping', dbDuration, true);
  } catch (error) {
    const err = error as Error;
    const dbDuration = Date.now() - dbStart;
    checks.database = {
      status: 'fail',
      latency: dbDuration,
      error: err.message,
    };
    // Database failure does not make server unhealthy
    // Only server being unreachable makes it unhealthy
    logDatabaseOperation('health_check', 'ping', dbDuration, false);
  }

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    uptime: Math.round(process.uptime()),
    checks,
  };

  // Always return 200 - health check should not fail the service
  return NextResponse.json(response, { status: 200 });
}
