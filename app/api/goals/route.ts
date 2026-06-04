import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/database/PrismaClient';

export async function GET() {
  try {
    const goals = await prisma.financialGoal.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ goals });
  } catch (error) {
    console.error('[GET /api/goals]', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, targetAmount, currentAmount, deadline } = await req.json();
    if (!name || !targetAmount) {
      return NextResponse.json({ error: 'Name and targetAmount are required' }, { status: 400 });
    }

    const goal = await prisma.financialGoal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        deadline: deadline ? new Date(deadline) : null,
      },
    });
    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('[POST /api/goals]', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, targetAmount, currentAmount, deadline } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (targetAmount) updateData.targetAmount = parseFloat(targetAmount);
    if (currentAmount !== undefined) updateData.currentAmount = parseFloat(currentAmount);
    if (deadline) updateData.deadline = new Date(deadline);

    const goal = await prisma.financialGoal.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('[PUT /api/goals]', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.financialGoal.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/goals]', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}