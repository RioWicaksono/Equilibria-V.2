import { NextRequest, NextResponse } from 'next/server';
import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';
import { withCronAuth } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CLEANUP_THRESHOLD_MS = RATE_LIMIT_WINDOW_MS * 2;

interface CleanupResult {
  deletedCount: number;
  executionTime: number;
  errors: string[];
}

async function cleanupRateLimitEntries(): Promise<CleanupResult> {
  const prisma = await getPrismaAsync();
  const result: CleanupResult = {
    deletedCount: 0,
    executionTime: 0,
    errors: [],
  };

  const startTime = Date.now();

  try {
    const threshold = new Date(Date.now() - CLEANUP_THRESHOLD_MS);

    const deleteResult = await prisma.rateLimitEntry.deleteMany({
      where: {
        createdAt: { lt: threshold },
      },
    });

    result.deletedCount = deleteResult.count;
    result.executionTime = Date.now() - startTime;

    console.log(`[Cleanup] Deleted ${result.deletedCount} rate limit entries in ${result.executionTime}ms`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMessage);
    console.error('[Cleanup] Rate limit cleanup error:', error);
  }

  return result;
}

const getHandler = async (_req: NextRequest) => {
  try {
    const result = await cleanupRateLimitEntries();

    if (result.errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Cleanup completed with errors',
        ...result,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      deletedEntries: result.deletedCount,
      executionTimeMs: result.executionTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cleanup] Rate limit cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup rate limit entries',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
};

export const GET = withCronAuth(getHandler);
