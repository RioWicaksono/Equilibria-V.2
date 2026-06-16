import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { PrismaRecurringTransactionRepository } from '@/infrastructure/repositories/PrismaRecurringTransactionRepository';

const recurringRepo = new PrismaRecurringTransactionRepository();

export async function GET() {
  try {
    const recurring = await recurringRepo.findAll();
    return ApiResponse.ok({ recurring });
  } catch (error) {
    logger.error('[GET /api/recurring]', { error });
    return ApiResponse.internalError('Failed to fetch recurring transactions');
  }
}

export async function POST(req: Request) {
  try {
    const { name, amount, type, category, frequency, nextDate, description } = await req.json();
    if (!name || !amount || !frequency || !nextDate) {
      return ApiResponse.badRequest('Name, amount, frequency, and nextDate are required');
    }

    const recurring = {
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      type: (type || 'EXPENSE') as 'INCOME' | 'EXPENSE',
      category: category || 'Lainnya',
      description: description || name,
      frequency: frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
      nextDate: new Date(nextDate),
      createdAt: new Date(),
    };

    await recurringRepo.save(recurring);
    return ApiResponse.created({ recurring });
  } catch (error) {
    logger.error('[POST /api/recurring]', { error });
    return ApiResponse.internalError('Failed to create recurring transaction');
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, amount, type, category, frequency, nextDate, description } = await req.json();
    if (!id) {
      return ApiResponse.badRequest('ID is required');
    }

    const existing = await recurringRepo.findById(id);
    if (!existing) {
      return ApiResponse.notFound('Recurring transaction');
    }

    const updated = {
      ...existing,
      ...(amount && { amount: parseFloat(amount) }),
      ...(type && { type: type as 'INCOME' | 'EXPENSE' }),
      ...(category && { category }),
      ...(frequency && { frequency: frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' }),
      ...(nextDate && { nextDate: new Date(nextDate) }),
      ...((description !== undefined || name) && { description: description || name }),
    };

    await recurringRepo.save(updated);
    return ApiResponse.ok({ recurring: updated });
  } catch (error) {
    logger.error('[PUT /api/recurring]', { error });
    return ApiResponse.internalError('Failed to update recurring transaction');
  }
}

export async function DELETE(req: Request) {
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