import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/database/PrismaClient';

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json({ wallets: [], error: 'Database not configured' }, { status: 200 });
    }
    const wallets = await prisma.wallet.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ wallets });
  } catch (error) {
    console.error('[GET /api/wallets]', error);
    return NextResponse.json({ wallets: [], error: 'Database not available - using local fallback' }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const { name, balance } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const wallet = await prisma.wallet.create({
      data: {
        name,
        balance: balance || 0,
      },
    });
    return NextResponse.json({ success: true, wallet });
  } catch (error) {
    console.error('[POST /api/wallets]', error);
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const { id, name, balance } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const wallet = await prisma.wallet.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(balance !== undefined && { balance }),
      },
    });
    return NextResponse.json({ success: true, wallet });
  } catch (error) {
    console.error('[PUT /api/wallets]', error);
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await prisma.wallet.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/wallets]', error);
    return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 });
  }
}