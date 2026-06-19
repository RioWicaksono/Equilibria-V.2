import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { PrismaDebtRepository } from '@/infrastructure/repositories/PrismaDebtRepository';
import { validateAmount, AMOUNT_LIMITS } from '@/lib/amountUtils';

const debtRepo = new PrismaDebtRepository();

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
    const debts = await debtRepo.findAll();
    return ApiResponse.ok({ debts });
  } catch (error) {
    logger.error('[GET /api/debts]', { error });
    return ApiResponse.internalError('Failed to fetch debts');
  }
}

export async function POST(req: Request) {
  try {
    const { name, amount, type, dueDate, description } = await req.json();
    if (!name) {
      return ApiResponse.badRequest('Name is required');
    }

    // Validate amount
    const amountValidation = safeParseAmount(amount);
    if (!amountValidation.valid) {
      return ApiResponse.badRequest(amountValidation.error || 'Invalid amount');
    }

    const debt = {
      id: crypto.randomUUID(),
      name,
      amount: amountValidation.value,
      type: type || 'DEBT',
      status: 'UNPAID' as const,
      paidAmount: 0,
      description: description || undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await debtRepo.save(debt);
    return ApiResponse.created({ debt });
  } catch (error) {
    logger.error('[POST /api/debts]', { error });
    return ApiResponse.internalError('Failed to create debt');
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, amount, type, status, dueDate, description, paidAmount } = await req.json();
    if (!id) {
      return ApiResponse.badRequest('ID is required');
    }

    const existing = await debtRepo.findById(id);
    if (!existing) {
      return ApiResponse.notFound('Debt');
    }

    let parsedAmount: number | undefined;
    let parsedPaidAmount: number | undefined;

    // Validate amount if provided
    if (amount !== undefined) {
      const amountValidation = safeParseAmount(amount);
      if (!amountValidation.valid) {
        return ApiResponse.badRequest(amountValidation.error || 'Invalid amount');
      }
      parsedAmount = amountValidation.value;
    }

    // Validate paidAmount if provided
    if (paidAmount !== undefined) {
      const paidValidation = validateAmount(paidAmount, {
        min: 0,
        max: AMOUNT_LIMITS.MAX,
        allowZero: true,
        allowNegative: false,
      });
      if (!paidValidation.valid) {
        return ApiResponse.badRequest(paidValidation.error || 'Invalid paid amount');
      }
      parsedPaidAmount = paidValidation.amount!;
    }

    const updated = {
      ...existing,
      ...(name && { name }),
      ...(parsedAmount !== undefined && { amount: parsedAmount }),
      ...(type && { type: type as 'DEBT' | 'LOAN' }),
      ...(status && { status: status as 'UNPAID' | 'PAID' }),
      ...(description !== undefined && { description }),
      ...(parsedPaidAmount !== undefined && { paidAmount: parsedPaidAmount }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
      updatedAt: new Date(),
    };

    await debtRepo.save(updated);
    return ApiResponse.ok({ debt: updated });
  } catch (error) {
    logger.error('[PUT /api/debts]', { error });
    return ApiResponse.internalError('Failed to update debt');
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return ApiResponse.badRequest('ID is required');
    }

    const existing = await debtRepo.findById(id);
    if (!existing) {
      return ApiResponse.notFound('Debt');
    }

    await debtRepo.delete(id);
    return ApiResponse.noContent();
  } catch (error) {
    logger.error('[DELETE /api/debts]', { error });
    return ApiResponse.internalError('Failed to delete debt');
  }
}