import { NextResponse } from 'next/server';
import { PrismaCustomCategoryRepository } from '@/infrastructure/repositories/PrismaCustomCategoryRepository';

const categoryRepo = new PrismaCustomCategoryRepository();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const categories = type
      ? await categoryRepo.findByType(type)
      : await categoryRepo.findAll();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[GET /api/categories]', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, icon, color, type } = await req.json();

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const category = await categoryRepo.save({
      name,
      icon: icon || '📁',
      color: color || '#6b7280',
      type,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/categories]', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await categoryRepo.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/categories]', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}