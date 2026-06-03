import { NextResponse } from 'next/server';
import { FinanceService } from '@/src/application/use-cases/FinanceService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // A quick check to see if we can read from the DB without errors
    await FinanceService.getSummary();
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
