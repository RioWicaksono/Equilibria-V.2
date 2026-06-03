import { NextResponse } from 'next/server';
import { FinanceService } from '@/src/application/use-cases/FinanceService';

export async function POST(req: Request) {
  try {
    const { category, limit } = await req.json();
    if (!category || !limit) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const budget = await FinanceService.setBudget(category, limit);
    return NextResponse.json(budget);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to set budget' }, { status: 500 });
  }
}
