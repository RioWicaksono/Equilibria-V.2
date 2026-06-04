import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/database/PrismaClient';

export async function GET() {
  try {
    const debts = await prisma.debt.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ debts });
  } catch (error) {
    console.error('[GET /api/debts]', error);
    return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, amount, type, dueDate } = await req.json();
    if (!name || !amount) {
      return NextResponse.json({ error: 'Name and amount are required' }, { status: 400 });
    }

    const debt = await prisma.debt.create({
      data: {
        name,
        amount: parseFloat(amount),
        type: type || 'DEBT',
        status: 'UNPAID',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    return NextResponse.json({ success: true, debt });
  } catch (error) {
    console.error('[POST /api/debts]', error);
    return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, amount, type, status, dueDate } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (amount) updateData.amount = parseFloat(amount);
    if (type) updateData.type = type;
    if (status) updateData.status = status;
    if (dueDate) updateData.dueDate = new Date(dueDate);

    const debt = await prisma.debt.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ success: true, debt });
  } catch (error) {
    console.error('[PUT /api/debts]', error);
    return NextResponse.json({ error: 'Failed to update debt' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.debt.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/debts]', error);
    return NextResponse.json({ error: 'Failed to delete debt' }, { status: 500 });
  }
}