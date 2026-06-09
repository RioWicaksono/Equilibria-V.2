import { describe, it, expect } from 'vitest';
import {
  exportToCSV,
  exportToXLSX,
  exportToJSON,
  getExportFilename,
} from '@/lib/export';

describe('Export Functions', () => {
  const sampleData = {
    transactions: [
      {
        id: 'txn_1',
        amount: 150000,
        type: 'INCOME',
        category: 'Gaji Utama',
        description: 'Gaji bulanan',
        date: '2026-06-08T00:00:00Z',
      },
      {
        id: 'txn_2',
        amount: 50000,
        type: 'EXPENSE',
        category: 'Makan',
        description: 'Makan siang',
        date: '2026-06-08T00:00:00Z',
      },
    ],
    wallets: [
      {
        id: 'wlt_1',
        name: 'BCA Utama',
        balance: 5000000,
        currency: 'IDR',
        description: 'Rekening utama',
      },
    ],
    goals: [
      {
        id: 'gl_1',
        name: 'Dana Darurat',
        targetAmount: 20000000,
        currentAmount: 5000000,
        deadline: '2026-12-31',
        description: 'Dana cadangan',
      },
    ],
    debts: [
      {
        id: 'dbt_1',
        name: 'Pinjam ke Budi',
        amount: 500000,
        type: 'DEBT',
        status: 'UNPAID',
        description: 'Pinjam untuk usaha',
      },
    ],
    recurring: [
      {
        id: 'rcr_1',
        name: 'Langganan Netflix',
        amount: 153000,
        frequency: 'BULANAN',
        description: 'Streaming film',
      },
    ],
  };

  describe('exportToCSV', () => {
    it('should export transactions to CSV format', () => {
      const csv = exportToCSV(sampleData, 'transactions');

      expect(csv).toContain('=== TRANSAKSI ===');
      expect(csv).toContain('ID,Tanggal,Jenis,Kategori,Jumlah,Deskripsi');
      expect(csv).toContain('txn_1');
      expect(csv).toContain('Gaji Utama');
      expect(csv).toContain('150000');
    });

    it('should export wallets to CSV format', () => {
      const csv = exportToCSV(sampleData, 'wallets');

      expect(csv).toContain('=== DOMPET ===');
      expect(csv).toContain('BCA Utama');
      expect(csv).toContain('5000000');
      expect(csv).toContain('IDR');
    });

    it('should export goals to CSV format', () => {
      const csv = exportToCSV(sampleData, 'goals');

      expect(csv).toContain('=== TARGET TABUNGAN ===');
      expect(csv).toContain('Dana Darurat');
      expect(csv).toContain('20000000');
    });

    it('should export debts to CSV format', () => {
      const csv = exportToCSV(sampleData, 'debts');

      expect(csv).toContain('=== HUTANG/PiUTANG ===');
      expect(csv).toContain('Pinjam ke Budi');
      expect(csv).toContain('DEBT');
    });

    it('should export recurring to CSV format', () => {
      const csv = exportToCSV(sampleData, 'recurring');

      expect(csv).toContain('=== TRANSAKSI OTOMATIS ===');
      expect(csv).toContain('Langganan Netflix');
      expect(csv).toContain('153000');
    });

    it('should export all data when type is "all"', () => {
      const csv = exportToCSV(sampleData, 'all');

      expect(csv).toContain('=== TRANSAKSI ===');
      expect(csv).toContain('=== DOMPET ===');
      expect(csv).toContain('=== TARGET TABUNGAN ===');
      expect(csv).toContain('=== HUTANG/PiUTANG ===');
      expect(csv).toContain('=== TRANSAKSI OTOMATIS ===');
    });

    it('should handle empty data', () => {
      const csv = exportToCSV({ transactions: [] }, 'transactions');

      expect(csv).toContain('=== TRANSAKSI ===');
      expect(csv).not.toContain('txn_1');
    });
  });

  describe('exportToXLSX', () => {
    it('should export transactions to XLSX format', () => {
      const xlsx = exportToXLSX(sampleData, 'transactions');

      expect(xlsx).toBeInstanceOf(Uint8Array);
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it('should export all data to XLSX format', () => {
      const xlsx = exportToXLSX(sampleData, 'all');

      expect(xlsx).toBeInstanceOf(Uint8Array);
      expect(xlsx.length).toBeGreaterThan(0);
    });

    it('should handle empty data', () => {
      const xlsx = exportToXLSX({ transactions: [] }, 'transactions');

      expect(xlsx).toBeInstanceOf(Uint8Array);
    });
  });

  describe('exportToJSON', () => {
    it('should export data to JSON format', () => {
      const json = exportToJSON(sampleData);

      expect(json).toBeTypeOf('string');

      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('transactions');
      expect(parsed).toHaveProperty('wallets');
      expect(parsed).toHaveProperty('goals');
      expect(parsed).toHaveProperty('debts');
      expect(parsed).toHaveProperty('recurring');
    });

    it('should pretty print JSON', () => {
      const json = exportToJSON(sampleData);

      // Check for indentation (2 spaces)
      expect(json).toContain('  "transactions":');
    });

    it('should preserve all data in JSON', () => {
      const json = exportToJSON(sampleData);
      const parsed = JSON.parse(json);

      expect(parsed.transactions).toHaveLength(2);
      expect(parsed.wallets).toHaveLength(1);
      expect(parsed.goals).toHaveLength(1);
      expect(parsed.debts).toHaveLength(1);
      expect(parsed.recurring).toHaveLength(1);
    });
  });

  describe('getExportFilename', () => {
    it('should generate correct filename for CSV', () => {
      const filename = getExportFilename('transactions', 'csv');

      expect(filename).toMatch(/^equilibria_transactions_\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('should generate correct filename for XLSX', () => {
      const filename = getExportFilename('all', 'xlsx');

      expect(filename).toMatch(/^equilibria_all_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should generate correct filename for JSON', () => {
      const filename = getExportFilename('wallets', 'json');

      expect(filename).toMatch(/^equilibria_wallets_\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('should include date in filename', () => {
      const today = new Date().toISOString().split('T')[0];
      const filename = getExportFilename('all', 'csv');

      expect(filename).toContain(today);
    });
  });
});