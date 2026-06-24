import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { PrismaRecurringTransactionRepository } from '@/infrastructure/repositories/PrismaRecurringTransactionRepository';
import { validateAmount, AMOUNT_LIMITS } from '@/lib/amountUtils';
import { authenticateRequest } from '@/lib/auth';

const recurringRepo = new PrismaRecurringTransactionRepository();

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

// Valid frequency values
const VALID_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const VALID_TYPES = ['INCOME', 'EXPENSE'];

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const recurring = await recurringRepo.findAll();
    return ApiResponse.ok({ recurring });
  } catch (error) {
    logger.error('[GET /api/recurring]', { error });
    return ApiResponse.internalError('Failed to fetch recurring transactions');
  }
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const { name, amount, type, category, frequency, nextDate, description } = await req.json();
    if (!name || !amount || !frequency || !nextDate) {
      return ApiResponse.badRequest('Name, amount, frequency, and nextDate are required');
    }

    // Validate amount
    const amountValidation = safeParseAmount(amount);
    if (!amountValidation.valid) {
      return ApiResponse.badRequest(amountValidation.error || 'Invalid amount');
    }

    // Validate frequency
    if (!VALID_FREQUENCIES.includes(frequency)) {
      return ApiResponse.badRequest(`Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`);
    }

    // Validate type if provided
    if (type && !VALID_TYPES.includes(type)) {
      return ApiResponse.badRequest(`Type must be one of: ${VALID_TYPES.join(', ')}`);
    }

    // Validate date
    const dateObj = new Date(nextDate);
    if (Number.isNaN(dateObj.getTime())) {
      return ApiResponse.badRequest('Invalid date format');
    }

    const recurring = {
      id: crypto.randomUUID(),
      amount: amountValidation.value,
      type: (type || 'EXPENSE') as 'INCOME' | 'EXPENSE',
      category: category || 'Lainnya',
      description: description || name,
      frequency: frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
      nextDate: dateObj,
      createdAt: new Date(),
    };

    await recurringRepo.save(recurring);
    return ApiResponse.created({ recurring });
  } catch (error) {
    logger.error('[POST /api/recurring]', { error });
    return ApiResponse.internalError('Failed to create recurring transaction');
  }
}

export async function PUT(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const { id, name, amount, type, category, frequency, nextDate, description } = await req.json();
    if (!id) {
      return ApiResponse.badRequest('ID is required');
    }

    const existing = await recurringRepo.findById(id);
    if (!existing) {
      return ApiResponse.notFound('Recurring transaction');
    }

    let parsedAmount: number | undefined;
    let parsedNextDate: Date | undefined;

    // Validate amount if provided
    if (amount !== undefined) {
      const amountValidation = safeParseAmount(amount);
      if (!amountValidation.valid) {
        return ApiResponse.badRequest(amountValidation.error || 'Invalid amount');
      }
      parsedAmount = amountValidation.value;
    }

    // Validate frequency if provided
    if (frequency && !VALID_FREQUENCIES.includes(frequency)) {
      return ApiResponse.badRequest(`Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`);
    }

    // Validate type if provided
    if (type && !VALID_TYPES.includes(type)) {
      return ApiResponse.badRequest(`Type must be one of: ${VALID_TYPES.join(', ')}`);
    }

    // Validate date if provided
    if (nextDate !== undefined) {
      const dateObj = new Date(nextDate);
      if (Number.isNaN(dateObj.getTime())) {
        return ApiResponse.badRequest('Invalid date format');
      }
      parsedNextDate = dateObj;
    }

    const updated = {
      ...existing,
      ...(parsedAmount !== undefined && { amount: parsedAmount }),
      ...(type && { type: type as 'INCOME' | 'EXPENSE' }),
      ...(category && { category }),
      ...(frequency && { frequency: frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' }),
      ...(parsedNextDate !== undefined && { nextDate: parsedNextDate }),
      ...((description !== undefined || name) && { description: description || name }),
    };

    await recurringRepo.save(updated);
    return ApiResponse.ok({ recurring: updated });
  } catch (error) {
    logger.error('[PUT /api/recurring]', { error });
    return ApiResponse.internalError('Failed to update recurring transaction');
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
      return ApiResponse.badRequest('ID is required');
    }

    const existing = await recurringRepo.findById(id);
    if (!existing) {
      return ApiResponse.notFound('Recurring transaction');
    }

    await recurringRepo.delete(id);
    return ApiResponse.noContent();
  } catch (error) {
    logger.error('[DELETE /api/recurring]', { error });
    return ApiResponse.internalError('Failed to delete recurring transaction');
  }
}
