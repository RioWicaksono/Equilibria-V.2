import { NextResponse } from 'next/server';
import { FinanceService } from '@/src/application/use-cases/FinanceService';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const rawAmount = formData.get('amount') as string;
    const cleanAmount = rawAmount.replace(/[^0-9]/g, '');
    const amount = Number(cleanAmount) || 0;
    
    const type = formData.get('type') as any;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    if (amount > 0) {
      await FinanceService.addTransaction(amount, type, category, description, date);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add transaction' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    
    const id = formData.get('id') as string;
    const rawAmount = formData.get('amount') as string;
    const cleanAmount = rawAmount.replace(/[^0-9]/g, '');
    const amount = Number(cleanAmount) || 0;
    
    const type = formData.get('type') as any;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    if (amount > 0 && id) {
      await FinanceService.updateTransaction(id, amount, type, category, description, date);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}
