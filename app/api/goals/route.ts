import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { PrismaFinancialGoalRepository } from '@/infrastructure/repositories/PrismaFinancialGoalRepository';
import { validateAmount, AMOUNT_LIMITS } from '@/lib/amountUtils';

const goalRepo = new PrismaFinancialGoalRepository();

/**
 * Validate amount with proper bounds
 */
function safeParseAmount(amount: unknown): { valid: true; value: number } | { valid: false; error: string } {
  const validation = validateAmount(amount, {
    min: 1,
    max: AMOUNT_LIMITS.MAX,
    allowZero: false,
    allowNegative: false,
  });

  if (!validation.valid || validation.amount === null) {
    return { valid: false, error: validation.error || 'Invalid amount' };
  }

  return { valid: true, value: validation.amount };
}

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
    if (!name) {
      return ApiResponse.badRequest('Name is required');
    }

    // Validate targetAmount
    const targetValidation = safeParseAmount(targetAmount);
    if (!targetValidation.valid) {
      return ApiResponse.badRequest(targetValidation.error || 'Invalid target amount');
    }

    // Validate currentAmount if provided
    if (currentAmount !== undefined) {
      const currentValidation = validateAmount(currentAmount, {
        min: 0,
        max: AMOUNT_LIMITS.MAX,
        allowZero: true,
        allowNegative: false,
      });
      if (!currentValidation.valid) {
        return ApiResponse.badRequest(currentValidation.error || 'Invalid current amount');
      }
    }

    const goal = {
      id: crypto.randomUUID(),
      name,
      targetAmount: targetValidation.value,
      currentAmount: currentAmount ? validateAmount(currentAmount, { min: 0, allowZero: true }).amount! : 0,
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

    let parsedTargetAmount: number | undefined;
    let parsedCurrentAmount: number | undefined;

    // Validate targetAmount if provided
    if (targetAmount !== undefined) {
      const targetValidation = safeParseAmount(targetAmount);
      if (!targetValidation.valid) {
        return ApiResponse.badRequest(targetValidation.error || 'Invalid target amount');
      }
      parsedTargetAmount = targetValidation.value;
    }

    // Validate currentAmount if provided
    if (currentAmount !== undefined) {
      const currentValidation = validateAmount(currentAmount, {
        min: 0,
        max: AMOUNT_LIMITS.MAX,
        allowZero: true,
        allowNegative: false,
      });
      if (!currentValidation.valid) {
        return ApiResponse.badRequest(currentValidation.error || 'Invalid current amount');
      }
      parsedCurrentAmount = currentValidation.amount!;
    }

    const updated = {
      ...existing,
      ...(name && { name }),
      ...(parsedTargetAmount !== undefined && { targetAmount: parsedTargetAmount }),
      ...(parsedCurrentAmount !== undefined && { currentAmount: parsedCurrentAmount }),
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