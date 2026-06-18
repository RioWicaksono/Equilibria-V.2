import { NextRequest, NextResponse } from 'next/server';
import { getFinanceService } from '@/application/services/FinanceService';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

const financeService = getFinanceService();

interface ImportRow {
  date?: string;
  type?: string;
  category?: string;
  amount?: string | number;
  description?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

function parseCSV(csvText: string): ImportRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: ImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: ImportRow = {};

    headers.forEach((header, idx) => {
      const value = values[idx] || '';
      switch (header) {
        case 'date':
        case 'tanggal':
          row.date = value;
          break;
        case 'type':
        case 'tipe':
          row.type = value.toUpperCase();
          break;
        case 'category':
        case 'kategori':
          row.category = value;
          break;
        case 'amount':
        case 'jumlah':
        case 'nominal':
          row.amount = parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
          break;
        case 'description':
        case 'deskripsi':
        case 'keterangan':
          row.description = value;
          break;
      }
    });

    rows.push(row);
  }

  return rows;
}

function validateRow(row: ImportRow, rowIndex: number): string | null {
  if (!row.date) return `Row ${rowIndex}: Date is required`;
  if (!row.type) return `Row ${rowIndex}: Type is required (INCOME/EXPENSE)`;
  if (!['INCOME', 'EXPENSE', 'PEMASUKAN', 'PENGELUARAN'].includes(row.type.toUpperCase())) {
    return `Row ${rowIndex}: Invalid type "${row.type}"`;
  }
  if (!row.category) return `Row ${rowIndex}: Category is required`;
  const amountNum = Number(row.amount);
  if (!row.amount || isNaN(amountNum) || amountNum <= 0) return `Row ${rowIndex}: Amount must be greater than 0`;

  const dateValid = !isNaN(Date.parse(row.date));
  if (!dateValid) return `Row ${rowIndex}: Invalid date format`;

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return ApiResponse.badRequest('No file provided');
    }

    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'json', 'xlsx'].includes(fileType || '')) {
      return ApiResponse.badRequest('Invalid file type. Supported: CSV, JSON, XLSX');
    }

    let rows: ImportRow[] = [];

    if (fileType === 'json') {
      const text = await file.text();
      const data = JSON.parse(text);
      rows = Array.isArray(data) ? data : data.transactions || data.data || [];
    } else if (fileType === 'csv') {
      const text = await file.text();
      rows = parseCSV(text);
    } else {
      // For XLSX, we'll return a specific error since we need processing
      return ApiResponse.badRequest(
        'XLSX format not directly supported. Please convert to CSV or JSON format.'
      );
    }

    if (rows.length === 0) {
      return ApiResponse.badRequest('No data found in file');
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validationError = validateRow(row, i + 2);

      if (validationError) {
        result.failed++;
        result.errors.push({ row: i + 2, message: validationError });
        continue;
      }

      try {
        const type = ['PEMASUKAN', 'PENGELUARAN'].includes(row.type!.toUpperCase())
          ? (row.type!.toUpperCase() === 'PEMASUKAN' ? 'INCOME' : 'EXPENSE')
          : row.type!.toUpperCase() as 'INCOME' | 'EXPENSE';

        await financeService.addTransaction(
          Number(row.amount),
          type,
          row.category!,
          row.description || '',
          row.date!
        );
        result.success++;
      } catch (err) {
        result.failed++;
        logger.error(`[Import] Failed to import row ${i + 2}`, err);
        result.errors.push({
          row: i + 2,
          message: `Failed to import: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
      }
    }

    logger.info(`[Import] Completed: ${result.success} success, ${result.failed} failed`);

    return ApiResponse.ok({
      message: `Imported ${result.success} transactions`,
      result,
    });
  } catch (error) {
    logger.error('[POST /api/import]', error);
    return ApiResponse.internalError('Failed to import data');
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      supportedFormats: ['CSV', 'JSON'],
      csvTemplate: {
        headers: 'date,type,category,amount,description',
        example: '2024-01-15,INCOME,Gaji,15000000,Monthly salary',
      },
      requiredFields: ['date', 'type', 'category', 'amount'],
      optionalFields: ['description'],
      typeValues: ['INCOME', 'EXPENSE', 'PEMASUKAN', 'PENGELUARAN'],
      dateFormats: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'],
    },
  });
}
