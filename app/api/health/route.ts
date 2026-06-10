import { NextResponse } from 'next/server';
import { getFinanceService } from '@/application/services/FinanceService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const financeService = getFinanceService();
    await financeService.getSummary();
    return NextResponse.json({ health: 'ok' });
  } catch {
    return NextResponse.json({ health: 'error' }, { status: 500 });
  }
}