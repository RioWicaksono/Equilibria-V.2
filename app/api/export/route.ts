import { NextResponse } from 'next/server';
import { FinanceService } from '@/src/application/use-cases/FinanceService';
import * as xlsx from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const transactions = await FinanceService.getTransactions();

    // Map the transactions to a flatter structure for the sheet
    const data = transactions.map((t) => ({
      ID: t.id,
      Tanggal: new Date(t.date).toLocaleDateString('id-ID'),
      Jenis: t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      Kategori: t.category,
      Keterangan: t.description || '-',
      Amount: t.amount,
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Transaksi');

    // Write the workbook to a buffer
    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="Laporan_Keuangan.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
