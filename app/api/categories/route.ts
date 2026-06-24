import { NextRequest } from 'next/server';
import { PrismaCustomCategoryRepository } from '@/infrastructure/repositories/PrismaCustomCategoryRepository';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { authenticateRequest } from '@/lib/auth';

const categoryRepo = new PrismaCustomCategoryRepository();

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

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

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const { name, icon, color, type } = await req.json();

    if (!name || !type) {
      return ApiResponse.badRequest('Name and type are required');
    }

    // Validate type
    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return ApiResponse.badRequest('Type must be INCOME or EXPENSE');
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

export async function DELETE(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const body = await req.json();
    const { id } = body;

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
