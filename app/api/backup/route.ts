import { NextRequest } from 'next/server';
import { FinanceService } from '@/application/services/FinanceService';
import { logger } from '@/lib/logger';
import { authenticateRequest } from '@/lib/auth';

const financeService = new FinanceService();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth.authenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const transactions = await financeService.getTransactions();
    return new Response(JSON.stringify(transactions), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('[GET /api/backup]', { error });
    return new Response(
      JSON.stringify({ error: 'Failed to fetch transactions' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
