import { NextRequest } from 'next/server';
import { ApiResponse, parsePaginationParams, createPaginationMeta } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { FinanceService } from '@/application/services/FinanceService';
import { authenticateRequest } from '@/lib/auth';

const financeService = new FinanceService();

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const budgets = await financeService.getBudgets();
    const statuses = await financeService.getBudgetStatuses();
    return ApiResponse.ok({ budgets, statuses });
  } catch (error) {
    logger.error('[GET /api/budgets]', { error });
    return ApiResponse.internalError('Failed to fetch budgets');
  }
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const { category, limit } = await req.json();
    if (!category || !limit) {
      return ApiResponse.badRequest('Missing required fields: category and limit');
    }

    const budget = await financeService.setBudget(category, limit);
    return ApiResponse.created({ budget });
  } catch (error) {
    logger.error('[POST /api/budgets]', { error });
    return ApiResponse.internalError('Failed to set budget');
  }
}

export async function PUT(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const { id, category, limit } = await req.json();
    if (!id) {
      return ApiResponse.badRequest('Missing budget id');
    }

    const budget = await financeService.updateBudget(id, { category, limit });
    if (!budget) {
      return ApiResponse.notFound('Budget');
    }
    return ApiResponse.ok({ budget });
  } catch (error) {
    logger.error('[PUT /api/budgets]', { error });
    return ApiResponse.internalError('Failed to update budget');
  }
}

export async function DELETE(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return ApiResponse.badRequest('Missing budget id');
    }

    const deleted = await financeService.deleteBudget(id);
    if (!deleted) {
      return ApiResponse.notFound('Budget');
    }
    return ApiResponse.noContent();
  } catch (error) {
    logger.error('[DELETE /api/budgets]', { error });
    return ApiResponse.internalError('Failed to delete budget');
  }
}
