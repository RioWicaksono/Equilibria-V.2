import { NextRequest, NextResponse } from 'next/server';
import { processRecurringTransactions } from '@/lib/cron';
import { withCronAuth } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const handler = async () => {
  try {
    const result = await processRecurringTransactions();

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} recurring transactions`,
      processed: result.processed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process recurring transactions',
    }, { status: 500 });
  }
};

// Apply cron authentication
export const GET = withCronAuth(handler);
