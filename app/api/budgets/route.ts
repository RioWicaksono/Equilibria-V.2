import { NextResponse } from 'next/server';
import { FinanceService } from '@/application/services/FinanceService';

const financeService = new FinanceService();

export async function GET() {
  try {
    const budgets = await financeService.getBudgets();
    const statuses = await financeService.getBudgetStatuses();
    return NextResponse.json({ budgets, statuses });
  } catch (error) {
    console.error('[GET /api/budgets]', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { category, limit } = await req.json();
    if (!category || !limit) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const budget = await financeService.setBudget(category, limit);
    return NextResponse.json(budget);
  } catch (error) {
    console.error('[POST /api/budgets]', error);
    return NextResponse.json({ error: 'Failed to set budget' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, category, limit } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing budget id' }, { status: 400 });

    const budget = await financeService.updateBudget(id, { category, limit });
    return NextResponse.json(budget);
  } catch (error) {
    console.error('[PUT /api/budgets]', error);
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing budget id' }, { status: 400 });

    const budget = await financeService.deleteBudget(id);
    return NextResponse.json({ success: !!budget });
  } catch (error) {
    console.error('[DELETE /api/budgets]', error);
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
  }
}