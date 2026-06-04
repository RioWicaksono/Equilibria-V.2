import { NextResponse } from 'next/server';
import { FinanceService } from '@/application/services/FinanceService';

const financeService = new FinanceService();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const transactions = await financeService.getTransactions();
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('[GET /api/backup]', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}