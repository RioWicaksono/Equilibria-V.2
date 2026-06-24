import { getFinanceService } from '@/application/services/FinanceService';
import SummaryClient from './SummaryClient';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function SummaryPage() {
  await headers();
  const financeService = getFinanceService();
  const allTransactions = await financeService.getTransactions();

  return (
    <div className="space-y-4">
      <header className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-white">Summary Report</h2>
        <p className="text-xs text-zinc-500 mt-1">Laporan lengkap e-statement.</p>
      </header>

      <SummaryClient allTransactions={allTransactions} />
    </div>
  );
}