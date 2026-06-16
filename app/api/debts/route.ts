import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { PrismaDebtRepository } from '@/infrastructure/repositories/PrismaDebtRepository';

const debtRepo = new PrismaDebtRepository();

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
    if (!name || !amount) {
      return ApiResponse.badRequest('Name and amount are required');
    }

    const debt = {
      id: crypto.randomUUID(),
      name,
      amount: parseFloat(amount),
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

    const updated = {
      ...existing,
      ...(name && { name }),
      ...(amount && { amount: parseFloat(amount) }),
      ...(type && { type: type as 'DEBT' | 'LOAN' }),
      ...(status && { status: status as 'UNPAID' | 'PAID' }),
      ...(description !== undefined && { description }),
      ...(paidAmount !== undefined && { paidAmount: parseFloat(paidAmount) }),
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