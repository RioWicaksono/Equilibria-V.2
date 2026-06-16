import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { PrismaFinancialGoalRepository } from '@/infrastructure/repositories/PrismaFinancialGoalRepository';

const goalRepo = new PrismaFinancialGoalRepository();

export async function GET() {
  try {
    const goals = await goalRepo.findAll();
    return ApiResponse.ok({ goals });
  } catch (error) {
    logger.error('[GET /api/goals]', { error });
    return ApiResponse.internalError('Failed to fetch goals');
  }
}

export async function POST(req: Request) {
  try {
    const { name, targetAmount, currentAmount, deadline, description } = await req.json();
    if (!name || !targetAmount) {
      return ApiResponse.badRequest('Name and targetAmount are required');
    }

    const goal = {
      id: crypto.randomUUID(),
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
      description: description || undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await goalRepo.save(goal);
    return ApiResponse.created({ goal });
  } catch (error) {
    logger.error('[POST /api/goals]', { error });
    return ApiResponse.internalError('Failed to create goal');
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, targetAmount, currentAmount, deadline, description } = await req.json();
    if (!id) {
      return ApiResponse.badRequest('ID is required');
    }

    const existing = await goalRepo.findById(id);
    if (!existing) {
      return ApiResponse.notFound('Goal');
    }

    const updated = {
      ...existing,
      ...(name && { name }),
      ...(targetAmount && { targetAmount: parseFloat(targetAmount) }),
      ...(currentAmount !== undefined && { currentAmount: parseFloat(currentAmount) }),
      ...(description !== undefined && { description }),
      ...(deadline && { deadline: new Date(deadline) }),
      updatedAt: new Date(),
    };

    await goalRepo.save(updated);
    return ApiResponse.ok({ goal: updated });
  } catch (error) {
    logger.error('[PUT /api/goals]', { error });
    return ApiResponse.internalError('Failed to update goal');
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return ApiResponse.badRequest('ID is required');
    }

    const existing = await goalRepo.findById(id);
    if (!existing) {
      return ApiResponse.notFound('Goal');
    }

    await goalRepo.delete(id);
    return ApiResponse.noContent();
  } catch (error) {
    logger.error('[DELETE /api/goals]', { error });
    return ApiResponse.internalError('Failed to delete goal');
  }
}