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
  environment: string;
  checks: {
    server: { status: 'pass' | 'warn'; latency: number; memory: { used: number; total: number; percent: number } };
    database: { status: 'pass' | 'fail' | 'skip'; latency?: number; error?: string };
    rateLimit: { status: 'pass' | 'warn'; entries: number };
  };
  metrics: {
    responseTime: number;
    memoryUsage: number;
    heapUsed: number;
    heapTotal: number;
  };
}

export async function GET() {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {
    server: { status: 'pass', latency: 0, memory: { used: 0, total: 0, percent: 0 } },
    database: { status: 'skip' },
    rateLimit: { status: 'pass', entries: 0 },
  };

  let overallStatus: HealthStatus['status'] = 'healthy';

  // Server memory check
  const memUsage = process.memoryUsage();
  const memPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  checks.server = {
    status: memPercent > 90 ? 'warn' : 'pass',
    latency: Date.now() - startTime,
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      percent: memPercent,
    },
  };

  // Memory warning threshold
  if (memPercent > 90) {
    overallStatus = 'degraded';
  }

  // Check database connection
  const dbStart = Date.now();
  try {
    const { getPrismaAsync } = await import('@/infrastructure/database/PrismaClient');
    const prisma = await getPrismaAsync();

    // Run query and count rate limit entries
    const [dbResult, rateLimitCount] = await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      prisma.rateLimitEntry.count(),
    ]);

    const dbDuration = Date.now() - dbStart;
    checks.database = {
      status: 'pass',
      latency: dbDuration,
    };

    // Rate limit entries check
    checks.rateLimit = {
      status: rateLimitCount > 10000 ? 'warn' : 'pass',
      entries: rateLimitCount,
    };

    if (rateLimitCount > 10000) {
      overallStatus = 'degraded';
    }

    logDatabaseOperation('health_check', 'ping', dbDuration, true);
  } catch (error) {
    const err = error as Error;
    const dbDuration = Date.now() - dbStart;
    checks.database = {
      status: 'fail',
      latency: dbDuration,
      error: err.message,
    };
    overallStatus = 'unhealthy';
    logDatabaseOperation('health_check', 'ping', dbDuration, false);
  }

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    checks,
    metrics: {
      responseTime: Date.now() - startTime,
      memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    },
  };

  // Return appropriate status code based on health
  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
  return NextResponse.json(response, { status: statusCode });
}
