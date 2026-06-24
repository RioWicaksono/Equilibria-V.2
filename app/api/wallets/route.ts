import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { PrismaWalletRepository } from '@/infrastructure/repositories/PrismaWalletRepository';
import { authenticateRequest } from '@/lib/auth';

const walletRepo = new PrismaWalletRepository();

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const wallets = await walletRepo.findAll();
    return ApiResponse.ok({ wallets });
  } catch (error) {
    logger.error('[GET /api/wallets]', { error });
    return ApiResponse.internalError('Failed to fetch wallets');
  }
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const { name, balance } = await req.json();
    if (!name) {
      return ApiResponse.badRequest('Name is required');
    }

    const wallet = {
      id: crypto.randomUUID(),
      name,
      balance: balance || 0,
      createdAt: new Date(),
    };

    await walletRepo.save(wallet);
    return ApiResponse.created({ wallet });
  } catch (error) {
    logger.error('[POST /api/wallets]', { error });
    return ApiResponse.internalError('Failed to create wallet');
  }
}

export async function PUT(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return ApiResponse.unauthorized(auth.reason || 'Authentication required');
  }

  try {
    const { id, name, balance } = await req.json();
    if (!id) {
      return ApiResponse.badRequest('ID is required');
    }

    const existing = await walletRepo.findById(id);
    if (!existing) {
      return ApiResponse.notFound('Wallet');
    }

    const updated = {
      ...existing,
      ...(name && { name }),
      ...(balance !== undefined && { balance }),
    };

    await walletRepo.save(updated);
    return ApiResponse.ok({ wallet: updated });
  } catch (error) {
    logger.error('[PUT /api/wallets]', { error });
    return ApiResponse.internalError('Failed to update wallet');
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

    const existing = await walletRepo.findById(id);
    if (!existing) {
      return ApiResponse.notFound('Wallet');
    }

    await walletRepo.delete(id);
    return ApiResponse.noContent();
  } catch (error) {
    logger.error('[DELETE /api/wallets]', { error });
    return ApiResponse.internalError('Failed to delete wallet');
  }
}
