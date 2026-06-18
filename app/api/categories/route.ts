import { NextResponse } from 'next/server';
import { PrismaCustomCategoryRepository } from '@/infrastructure/repositories/PrismaCustomCategoryRepository';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

const categoryRepo = new PrismaCustomCategoryRepository();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const categories = type
      ? await categoryRepo.findByType(type)
      : await categoryRepo.findAll();

    return ApiResponse.ok({ categories });
  } catch (error) {
    logger.error('[GET /api/categories]', error);
    return ApiResponse.internalError('Failed to fetch categories');
  }
}

export async function POST(req: Request) {
  try {
    const { name, icon, color, type } = await req.json();

    if (!name || !type) {
      return ApiResponse.badRequest('Name and type are required');
    }

    const category = await categoryRepo.save({
      name,
      icon: icon || '📁',
      color: color || '#6b7280',
      type,
    });

    return ApiResponse.created({ category });
  } catch (error) {
    logger.error('[POST /api/categories]', error);
    return ApiResponse.internalError('Failed to create category');
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return ApiResponse.badRequest('ID is required');
    }

    await categoryRepo.delete(id);
    return ApiResponse.noContent();
  } catch (error) {
    logger.error('[DELETE /api/categories]', error);
    return ApiResponse.internalError('Failed to delete category');
  }
}