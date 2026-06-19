import { NextRequest, NextResponse } from 'next/server';
import { checkOverdueDebts } from '@/lib/cron';
import { withCronAuth } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const handler = async () => {
  try {
    const result = await checkOverdueDebts();

    return NextResponse.json({
      success: true,
      message: `Found ${result.overdueDebts.length} overdue debts`,
      overdueDebts: result.overdueDebts,
    });
  } catch (error) {
    console.error('Check overdue debts cron error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check overdue debts',
    }, { status: 500 });
  }
};

// Apply cron authentication
export const GET = withCronAuth(handler);
