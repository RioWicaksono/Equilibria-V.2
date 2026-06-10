import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/database/PrismaClient';

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json({ recurring: [], error: 'Database not configured' }, { status: 200 });
    }
    const recurring = await prisma.recurringTransaction.findMany({
      orderBy: { nextDate: 'asc' },
    });
    return NextResponse.json({ recurring });
  } catch (error) {
    console.error('[GET /api/recurring]', error);
    return NextResponse.json({ recurring: [], error: 'Database not available - using local fallback' }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const { name, amount, type, category, frequency, nextDate } = await req.json();
    if (!name || !amount || !frequency || !nextDate) {
      return NextResponse.json({ error: 'Name, amount, frequency, and nextDate are required' }, { status: 400 });
    }

    const recurring = await prisma.recurringTransaction.create({
      data: {
        description: name,
        amount: parseFloat(amount),
        type: type || 'EXPENSE',
        category: category || 'Lainnya',
        frequency,
        nextDate: new Date(nextDate),
      },
    });
    return NextResponse.json({ success: true, recurring });
  } catch (error) {
    console.error('[POST /api/recurring]', error);
    return NextResponse.json({ error: 'Failed to create recurring transaction' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const { id, name, amount, type, category, description, frequency, nextDate } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (name) updateData.description = name;
    if (amount) updateData.amount = parseFloat(amount);
    if (type) updateData.type = type;
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (frequency) updateData.frequency = frequency;
    if (nextDate) updateData.nextDate = new Date(nextDate);

    const recurring = await prisma.recurringTransaction.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ success: true, recurring });
  } catch (error) {
    console.error('[PUT /api/recurring]', error);
    return NextResponse.json({ error: 'Failed to update recurring transaction' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.recurringTransaction.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/recurring]', error);
    return NextResponse.json({ error: 'Failed to delete recurring transaction' }, { status: 500 });
  }
}