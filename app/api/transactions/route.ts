import { NextResponse } from 'next/server';
import { FinanceService } from '@/application/services/FinanceService';

const financeService = new FinanceService();

export async function GET() {
  try {
    const transactions = await financeService.getTransactions();
    const summary = await financeService.getSummary();
    return NextResponse.json({ transactions, summary });
  } catch (error) {
    console.error('[GET /api/transactions]', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const rawAmount = formData.get('amount') as string;
    const cleanAmount = rawAmount.replace(/\D/g, '');
    const amount = Number(cleanAmount) || 0;

    const type = formData.get('type') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    if (amount > 0) {
      const transaction = await financeService.addTransaction(amount, type as 'INCOME' | 'EXPENSE', category, description, date);
      return NextResponse.json({ success: true, transaction });
    }

    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/transactions]', error);
    return NextResponse.json({ error: 'Failed to add transaction' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const formData = await req.formData();

    const id = formData.get('id') as string;
    const rawAmount = formData.get('amount') as string;
    const cleanAmount = rawAmount.replace(/\D/g, '');
    const amount = Number(cleanAmount) || 0;

    const type = formData.get('type') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    if (amount > 0 && id) {
      const transaction = await financeService.updateTransaction(id, amount, type as 'INCOME' | 'EXPENSE', category, description, date);
      return NextResponse.json({ success: true, transaction });
    }

    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  } catch (error) {
    console.error('[PUT /api/transactions]', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });

    await financeService.deleteTransaction(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/transactions]', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}