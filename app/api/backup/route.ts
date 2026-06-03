import { NextResponse } from 'next/server';
import { FinanceService } from '@/src/application/use-cases/FinanceService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const transactions = await FinanceService.getTransactions();
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
