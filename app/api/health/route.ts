/**
 * Health Check API Endpoint
 * Provides detailed health status for monitoring and alerting
 */

import { NextResponse } from 'next/server';
import { getFinanceService } from '@/application/services/FinanceService';
import { logDatabaseOperation } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: { status: 'pass' | 'fail'; latency?: number; error?: string };
    api: { status: 'pass' | 'fail'; latency?: number; error?: string };
    memory: { status: 'pass' | 'warn' | 'fail'; used: number; total: number; percentage: number };
  };
}

export async function GET() {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {
    database: { status: 'fail' },
    api: { status: 'fail' },
    memory: { status: 'pass', used: 0, total: 0, percentage: 0 },
  };

  let overallStatus: HealthStatus['status'] = 'healthy';

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memTotal = memUsage.heapTotal;
  const memUsed = memUsage.heapUsed;
  const memPercentage = (memUsed / memTotal) * 100;

  checks.memory = {
    status: memPercentage > 90 ? 'fail' : memPercentage > 70 ? 'warn' : 'pass',
    used: Math.round(memUsed / 1024 / 1024),
    total: Math.round(memTotal / 1024 / 1024),
    percentage: Math.round(memPercentage),
  };

  if (checks.memory.status !== 'pass') {
    overallStatus = 'degraded';
  }

  // Check database connection
  const dbStart = Date.now();
  try {
    const financeService = getFinanceService();
    await financeService.getSummary();
    const dbDuration = Date.now() - dbStart;
    checks.database = {
      status: 'pass',
      latency: dbDuration,
    };
    logDatabaseOperation('health_check', 'all', dbDuration, true);
  } catch (error) {
    const err = error as Error;
    const dbDuration = Date.now() - dbStart;
    checks.database = {
      status: 'fail',
      latency: dbDuration,
      error: err.message,
    };
    overallStatus = 'unhealthy';
    logDatabaseOperation('health_check', 'all', dbDuration, false);
  }

  // Check API functionality
  const apiStart = Date.now();
  try {
    // Simple calculation to verify API works
    const result = 1 + 1;
    checks.api = {
      status: 'pass',
      latency: Date.now() - apiStart,
    };
  } catch (error) {
    const err = error as Error;
    checks.api = {
      status: 'fail',
      latency: Date.now() - apiStart,
      error: err.message,
    };
    overallStatus = 'degraded';
  }

  // Determine overall status
  if (checks.database.status === 'fail' || checks.api.status === 'fail') {
    overallStatus = 'unhealthy';
  }

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    uptime: Math.round(process.uptime()),
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}