import { NextRequest } from 'next/server';
import { FinanceService } from '@/application/services/FinanceService';
import { CreateTransactionSchema, UpdateTransactionSchema } from '@/lib/validation';
import { ZodError } from 'zod';
import { ApiResponse, parsePaginationParams, createPaginationMeta } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

const financeService = new FinanceService();

function formatZodError(error: ZodError): string {
  return error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}

export async function GET(req: NextRequest) {
  try {
    const { page = 1, limit = 20 } = parsePaginationParams(req.nextUrl.searchParams);
    const transactions = await financeService.getTransactions();
    const summary = await financeService.getSummary();

    // Apply pagination
    const start = (page - 1) * limit;
    const paginatedTransactions = transactions.slice(start, start + limit);
    const meta = createPaginationMeta(page, limit, transactions.length);

    return ApiResponse.ok({ transactions: paginatedTransactions, summary }, meta);
  } catch (error) {
    logger.error('[GET /api/transactions]', error);
    return ApiResponse.internalError('Failed to fetch transactions');
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const rawAmount = formData.get('amount') as string;
    const cleanAmount = rawAmount.replace(/\D/g, '');
    const amount = Number(cleanAmount) || 0;

    const type = formData.get('type') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    // Validate with Zod
    try {
      CreateTransactionSchema.parse({
        amount,
        type,
        category,
        description,
        date,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponse.badRequest('Validation failed', formatZodError(error));
      }
      throw error;
    }

    if (amount > 0) {
      const transaction = await financeService.addTransaction(
        amount,
        type as 'INCOME' | 'EXPENSE',
        category,
        description,
        date
      );
      return ApiResponse.created({ transaction });
    }

    return ApiResponse.badRequest('Invalid amount');
  } catch (error) {
    logger.error('[POST /api/transactions]', { error });
    return ApiResponse.internalError('Failed to add transaction');
  }
}

export async function PUT(req: Request) {
  try {
    const formData = await req.formData();

    const id = formData.get('id') as string;
    const rawAmount = formData.get('amount') as string;
    const cleanAmount = rawAmount.replace(/\D/g, '');
    const amount = Number(cleanAmount) || 0;

    const type = formData.get('type') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    // Validate with Zod
    try {
      UpdateTransactionSchema.parse({
        id,
        amount,
        type,
        category,
        description,
        date,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponse.badRequest('Validation failed', formatZodError(error));
      }
      throw error;
    }

    if (amount > 0 && id) {
      const transaction = await financeService.updateTransaction(
        id,
        amount,
        type as 'INCOME' | 'EXPENSE',
        category,
        description,
        date
      );
      return ApiResponse.ok({ transaction });
    }

    return ApiResponse.badRequest('Invalid input');
  } catch (error) {
    logger.error('[PUT /api/transactions]', { error });
    return ApiResponse.internalError('Failed to update transaction');
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return ApiResponse.badRequest('Missing transaction id');
    }

    await financeService.deleteTransaction(id);
    return ApiResponse.noContent();
  } catch (error) {
    logger.error('[DELETE /api/transactions]', { error });
    return ApiResponse.internalError('Failed to delete transaction');
  }
}
