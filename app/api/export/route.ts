import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { getFinanceService } from '@/application/services/FinanceService';
import { ExportQuerySchema } from '@/lib/validation';
import { exportToCSV, exportToXLSX, exportToJSON, getExportFilename } from '@/lib/export';
import { Transaction } from '@/domain/entities/Transaction';

export const dynamic = 'force-dynamic';

// Export limits
const EXPORT_CONFIG = {
  MAX_RECORDS: 10000, // Maximum records per export
  DEFAULT_LIMIT: 1000,
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const type = searchParams.get('type') || 'all';
    const month = searchParams.get('month');

    // Parse and validate pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(EXPORT_CONFIG.DEFAULT_LIMIT), 10),
      EXPORT_CONFIG.MAX_RECORDS
    );

    // Validate query parameters
    const validation = ExportQuerySchema.safeParse({
      format,
      type,
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    if (!validation.success) {
      return ApiResponse.badRequest('Parameter tidak valid', validation.error.flatten().fieldErrors);
    }

    const financeService = getFinanceService();

    // Fetch transactions
    let transactions: Transaction[] = [];
    if (type === 'all' || type === 'transactions') {
      transactions = await financeService.getTransactions();

      // Filter by month if specified
      if (month) {
        transactions = transactions.filter((t: Transaction) => {
          const d = new Date(t.date);
          const yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return yyyymm === month;
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      transactions = transactions.slice(startIndex, endIndex);
    }

    const exportData = {
      transactions: transactions.map((t: Transaction) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description,
        date: new Date(t.date).toISOString(),
      })),
      wallets: [],
      goals: [],
      debts: [],
      recurring: [],
    };

    const filename = getExportFilename(type, format);

    // Generate export based on format
    let content: string | Uint8Array;
    let contentType: string;

    switch (format) {
      case 'xlsx':
        content = exportToXLSX(exportData, type);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'json':
        content = exportToJSON(exportData);
        contentType = 'application/json';
        break;
      case 'csv':
      default:
        content = exportToCSV(exportData, type);
        contentType = 'text/csv';
        break;
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Export-Page': page.toString(),
        'X-Export-Limit': limit.toString(),
        'X-Export-Max': EXPORT_CONFIG.MAX_RECORDS.toString(),
        'X-Export-Count': transactions.length.toString(),
      },
    });
  } catch (error) {
    logger.error('[GET /api/export]', { error });
    return ApiResponse.internalError('Gagal mengekspor data');
  }
}