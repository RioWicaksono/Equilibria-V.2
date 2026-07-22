import { NextRequest } from 'next/server';
import { FinanceService } from '@/application/services/FinanceService';
import { CreateTransactionSchema, UpdateTransactionSchema } from '@/lib/validation';
import { parseAmount, validateAmount, AMOUNT_LIMITS } from '@/lib/amountUtils';
import { ZodError } from 'zod';
import { ApiResponse, parsePaginationParams, createPaginationMeta } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { authenticateRequest } from '@/lib/auth';
import { checkDatabaseRateLimit, createRateLimitResponse, addRateLimitHeaders, DEFAULT_RATE_LIMIT } from '@/lib/db-rate-limit';

const financeService = new FinanceService();

function formatZodError(error: ZodError): string {
  return error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}

export async function GET(req: NextRequest) {
  // Rate limiting check
  const rateLimitResult = await checkDatabaseRateLimit(req, DEFAULT_RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, DEFAULT_RATE_LIMIT);
  }

  // Authenticate request
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const { page = 1, limit = 20 } = parsePaginationParams(req.nextUrl.searchParams);
    const transactions = await financeService.getTransactions();
    const summary = await financeService.getSummary();

    // Apply pagination
    const start = (page - 1) * limit;
    const paginatedTransactions = transactions.slice(start, start + limit);
    const meta = createPaginationMeta(page, limit, transactions.length);

    const response = ApiResponse.ok({ transactions: paginatedTransactions, summary }, meta);
    addRateLimitHeaders(response, rateLimitResult, DEFAULT_RATE_LIMIT);
    return response;
  } catch (error) {
    logger.error('[GET /api/transactions]', error);
    return ApiResponse.internalError('Failed to fetch transactions');
  }
}

export async function POST(req: Request) {
  // Rate limiting check
  const rateLimitResult = await checkDatabaseRateLimit(req as NextRequest, DEFAULT_RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, DEFAULT_RATE_LIMIT);
  }

  try {
    const formData = await req.formData();

    const rawAmount = formData.get('amount') as string;
    const type = formData.get('type') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    // Validate amount with proper parsing
    const amountValidation = validateAmount(rawAmount, {
      min: 1,
      max: AMOUNT_LIMITS.MAX,
      allowZero: false,
      allowNegative: false,
    });

    if (!amountValidation.valid) {
      return ApiResponse.badRequest(amountValidation.error || 'Jumlah tidak valid');
    }

    // Validate with Zod
    try {
      CreateTransactionSchema.parse({
        amount: amountValidation.amount,
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

    const transaction = await financeService.addTransaction(
      amountValidation.amount!,
      type as 'INCOME' | 'EXPENSE',
      category,
      description,
      date
    );
    const response = ApiResponse.created({ transaction });
    addRateLimitHeaders(response, rateLimitResult, DEFAULT_RATE_LIMIT);
    return response;

  } catch (error) {
    logger.error('[POST /api/transactions]', { error });
    return ApiResponse.internalError('Failed to add transaction');
  }
}

export async function PUT(req: Request) {
  // Rate limiting check
  const rateLimitResult = await checkDatabaseRateLimit(req as NextRequest, DEFAULT_RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, DEFAULT_RATE_LIMIT);
  }

  try {
    const formData = await req.formData();

    const id = formData.get('id') as string;
    const rawAmount = formData.get('amount') as string;
    const type = formData.get('type') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    if (!id) {
      return ApiResponse.badRequest('ID transaksi wajib ada');
    }

    // Validate amount with proper parsing
    if (rawAmount) {
      const amountValidation = validateAmount(rawAmount, {
        min: 1,
        max: AMOUNT_LIMITS.MAX,
        allowZero: false,
        allowNegative: false,
      });

      if (!amountValidation.valid) {
        return ApiResponse.badRequest(amountValidation.error || 'Jumlah tidak valid');
      }

      // Validate with Zod
      try {
        UpdateTransactionSchema.parse({
          id,
          amount: amountValidation.amount,
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

      const transaction = await financeService.updateTransaction(
        id,
        amountValidation.amount!,
        type as 'INCOME' | 'EXPENSE',
        category,
        description,
        date
      );
      const response = ApiResponse.ok({ transaction });
      addRateLimitHeaders(response, rateLimitResult, DEFAULT_RATE_LIMIT);
      return response;
    }

    // Update without amount
    const transaction = await financeService.updateTransaction(
      id,
      0,
      type as 'INCOME' | 'EXPENSE',
      category,
      description,
      date
    );
    const response = ApiResponse.ok({ transaction });
    addRateLimitHeaders(response, rateLimitResult, DEFAULT_RATE_LIMIT);
    return response;

  } catch (error) {
    logger.error('[PUT /api/transactions]', { error });
    return ApiResponse.internalError('Failed to update transaction');
  }
}

export async function DELETE(req: Request) {
  // Rate limiting check
  const rateLimitResult = await checkDatabaseRateLimit(req as NextRequest, DEFAULT_RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, DEFAULT_RATE_LIMIT);
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return ApiResponse.badRequest('Missing transaction id');
    }

    await financeService.deleteTransaction(id);
    const response = ApiResponse.noContent();
    addRateLimitHeaders(response, rateLimitResult, DEFAULT_RATE_LIMIT);
    return response;
  } catch (error) {
    logger.error('[DELETE /api/transactions]', { error });
    return ApiResponse.internalError('Failed to delete transaction');
  }
}
