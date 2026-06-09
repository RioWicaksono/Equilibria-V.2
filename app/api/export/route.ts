import { NextRequest, NextResponse } from 'next/server';
import { getFinanceService } from '@/application/services/FinanceService';
import { ExportQuerySchema } from '@/lib/validation';
import { exportToCSV, exportToXLSX, exportToJSON, getExportFilename } from '@/lib/export';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const type = searchParams.get('type') || 'all';
    const month = searchParams.get('month');

    // Validate query parameters
    const validation = ExportQuerySchema.safeParse({
      format,
      type,
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Parameter tidak valid',
        details: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const financeService = getFinanceService();

    // Fetch transactions
    let transactions: any[] = [];
    if (type === 'all' || type === 'transactions') {
      transactions = await financeService.getTransactions();

      // Filter by month if specified
      if (month) {
        transactions = transactions.filter((t: any) => {
          const d = new Date(t.date);
          const yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return yyyymm === month;
        });
      }
    }

    const exportData = {
      transactions: transactions.map((t: any) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description,
        date: t.date,
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
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({
      success: false,
      error: 'Gagal mengekspor data',
    }, { status: 500 });
  }
}