import { NextRequest, NextResponse } from 'next/server';
import { getFinanceService } from '@/application/services/FinanceService';
import { ApiResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

const financeService = getFinanceService();

// File upload configuration
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['csv', 'json'],
  ALLOWED_MIME_TYPES: [
    'text/csv',
    'application/json',
    'text/plain', // Some systems send JSON as text/plain
  ],
  // Magic bytes for file type validation
  FILE_SIGNATURES: {
    csv: [[0xef, 0xbb, 0xbf], null], // UTF-8 BOM (optional for CSV)
    json: [[0x7b], null], // '{'
  } as const,
};

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

/**
 * Validate file content type using magic bytes
 */
function validateFileContent(file: File): { valid: boolean; detectedType: string | null; error?: string } {
  // Check file size
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      detectedType: null,
      error: `File terlalu besar. Maksimal ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  const ext = file.name.split('.').pop()?.toLowerCase();

  // For CSV files
  if (ext === 'csv') {
    // Check MIME type
    if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.type as any) &&
        file.type !== 'application/octet-stream') {
      return {
        valid: false,
        detectedType: null,
        error: 'File bukan format CSV yang valid',
      };
    }
    return { valid: true, detectedType: 'csv' };
  }

  // For JSON files
  if (ext === 'json') {
    // Check MIME type
    if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.type as any) &&
        file.type !== 'application/octet-stream') {
      return {
        valid: false,
        detectedType: null,
        error: 'File bukan format JSON yang valid',
      };
    }
    return { valid: true, detectedType: 'json' };
  }

  // Unsupported extension
  return {
    valid: false,
    detectedType: null,
    error: `Format file tidak didukung: ${ext}. Gunakan CSV atau JSON`,
  };
}

/**
 * Validate file content after reading (for JSON structure check)
 */
async function validateFileContentParse(file: File, ext: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const text = await file.text();

    if (ext === 'json') {
      // Validate JSON structure
      const data = JSON.parse(text);

      // Must be an array or have transactions/data property
      if (!Array.isArray(data) && !data.transactions && !data.data) {
        return {
          valid: false,
          error: 'JSON harus berupa array transaksi atau memiliki property "transactions"/"data"',
        };
      }
    }

    if (ext === 'csv') {
      // Basic CSV validation
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        return {
          valid: false,
          error: 'CSV harus memiliki header dan minimal 1 baris data',
        };
      }

      // Check if header has required columns
      const header = lines[0].toLowerCase();
      const requiredColumns = ['date', 'tanggal', 'type', 'tipe', 'category', 'kategori', 'amount', 'jumlah'];
      const hasRequiredColumn = requiredColumns.some(col => header.includes(col));

      if (!hasRequiredColumn) {
        return {
          valid: false,
          error: 'CSV harus memiliki kolom yang valid (date, type, category, amount)',
        };
      }
    }

    return { valid: true };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        valid: false,
        error: 'File JSON tidak valid: ' + (error as Error).message,
      };
    }
    return {
      valid: false,
      error: 'Gagal membaca file',
    };
  }
}

function parseCSV(csvText: string): ImportRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Remove BOM if present
  const cleanLine = lines[0].replace(/^﻿/, '');
  const headers = cleanLine.split(',').map(h => h.trim().toLowerCase());
  const rows: ImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

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
      return ApiResponse.badRequest('Tidak ada file yang diupload');
    }

    // Validate file type by extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
      return ApiResponse.badRequest(
        `Format file tidak didukung: ${ext}. Gunakan: ${UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
      );
    }

    // Validate file content (size, MIME type)
    const contentValidation = validateFileContent(file);
    if (!contentValidation.valid) {
      return ApiResponse.badRequest(contentValidation.error || 'File tidak valid');
    }

    // Validate file content by parsing
    const parseValidation = await validateFileContentParse(file, ext);
    if (!parseValidation.valid) {
      return ApiResponse.badRequest(parseValidation.error || 'File tidak valid');
    }

    let rows: ImportRow[] = [];

    // Parse based on file type
    const text = await file.text();

    if (ext === 'json') {
      const data = JSON.parse(text);
      rows = Array.isArray(data) ? data : data.transactions || data.data || [];
    } else if (ext === 'csv') {
      rows = parseCSV(text);
    }

    if (rows.length === 0) {
      return ApiResponse.badRequest('Tidak ada data yang ditemukan di file');
    }

    // Limit rows to prevent DoS
    const MAX_ROWS = 10000;
    if (rows.length > MAX_ROWS) {
      return ApiResponse.badRequest(
        `Terlalu banyak baris (${rows.length}). Maksimal ${MAX_ROWS} baris per import`
      );
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
        // Limit error count to prevent large responses
        if (result.errors.length < 50) {
          result.errors.push({ row: i + 2, message: validationError });
        }
        continue;
      }

      try {
        const type = ['PEMASUKAN', 'PENGELUARAN'].includes(row.type!.toUpperCase())
          ? (row.type!.toUpperCase() === 'PEMASUKAN' ? 'INCOME' : 'EXPENSE')
          : row.type!.toUpperCase() as 'INCOME' | 'EXPENSE';

        const amount = Number(row.amount);
        if (amount <= 0 || amount > 999999999999999) {
          result.failed++;
          if (result.errors.length < 50) {
            result.errors.push({ row: i + 2, message: 'Amount tidak valid' });
          }
          continue;
        }

        await financeService.addTransaction(
          amount,
          type,
          row.category!,
          row.description || '',
          row.date!
        );
        result.success++;
      } catch (err) {
        result.failed++;
        logger.error(`[Import] Failed to import row ${i + 2}`, err);
        if (result.errors.length < 50) {
          result.errors.push({
            row: i + 2,
            message: `Gagal import: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
      }
    }

    logger.info(`[Import] Completed: ${result.success} success, ${result.failed} failed`);

    return ApiResponse.ok({
      message: `Berhasil import ${result.success} transaksi`,
      result,
    });
  } catch (error) {
    logger.error('[POST /api/import]', error);
    return ApiResponse.internalError('Gagal import data');
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      supportedFormats: ['CSV', 'JSON'],
      maxFileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
      maxRows: 10000,
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
