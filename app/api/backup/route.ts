import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/application/services/FinanceService';
import { logger } from '@/lib/logger';

const financeService = new FinanceService();

export const dynamic = 'force-dynamic';

/**
 * Validate API key
 */
function validateApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key');
  const expectedKey = process.env.API_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!expectedKey) {
    return !isProduction;
  }

  if (!apiKey) {
    return false;
  }

  if (apiKey.length !== expectedKey.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.codePointAt(i)! ^ expectedKey.codePointAt(i)!;
  }

  return result === 0;
}

export async function GET(req: NextRequest) {
  // Authenticate request
  if (!validateApiKey(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const transactions = await financeService.getTransactions();
    return NextResponse.json(transactions);
  } catch (error) {
    logger.error('[GET /api/backup]', { error });
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}