import { getFinanceService } from '@/application/services/FinanceService';
import SummaryClient from './SummaryClient';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function SummaryPage() {
  await headers();
  const financeService = getFinanceService();
  const allTransactions = await financeService.getTransactions();

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold text-white">Summary Report</h2>
        <p className="text-sm text-zinc-500 mt-1">Laporan lengkap e-statement untuk seluruh transaksi Anda.</p>
      </header>

      <SummaryClient allTransactions={allTransactions} />
    </div>
  );
}