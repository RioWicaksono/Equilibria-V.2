import { FinanceService } from '@/src/application/use-cases/FinanceService';
import { ArrowDownRight, ArrowUpRight, Wallet, Plus } from 'lucide-react';
import DashboardCalendar from './components/DashboardCalendar';
import DashboardReminder from './components/DashboardReminder';
import SystemStatus from './components/SystemStatus';
import Link from 'next/link';
import { headers } from 'next/headers';

// Format rupiah helper
const formatIDR = (amount: number) => {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  await headers();
  const summary = await FinanceService.getSummary();
  const transactions = await FinanceService.getTransactions();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex flex-col">
          <h2 className="text-2xl font-semibold text-white">Ringkasan Keuangan</h2>
          <p className="text-sm text-zinc-500 mt-1">Laporan otomatis berdasarkan catatan harian Anda.</p>
        </div>
        <SystemStatus />
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 flex flex-col justify-between h-32">
          <span className="text-zinc-500 text-xs font-medium uppercase mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Total Saldo
          </span>
          <h3 className="text-3xl font-bold text-white">
            {formatIDR(summary.balance)}
          </h3>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 flex flex-col justify-between h-32">
          <span className="text-zinc-500 text-xs font-medium uppercase mb-4 flex items-center gap-2 text-teal-400">
            <ArrowUpRight className="h-4 w-4" /> Pemasukan
          </span>
          <h3 className="text-3xl font-bold text-teal-400">
            {formatIDR(summary.totalIncome)}
          </h3>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 flex flex-col justify-between h-32">
          <span className="text-zinc-500 text-xs font-medium uppercase mb-4 flex items-center gap-2 text-rose-500">
            <ArrowDownRight className="h-4 w-4" /> Pengeluaran
          </span>
          <h3 className="text-3xl font-bold text-rose-500">
            {formatIDR(summary.totalExpense)}
          </h3>
        </div>
      </div>

      {/* Sub Modules: Calendar & Reminder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Kalender Transaksi</h3>
          <div className="w-full flex justify-center flex-1 items-center overflow-x-auto pb-2">
            <div className="min-w-fit">
              <DashboardCalendar transactions={transactions} />
            </div>
          </div>
        </div>

        {/* Reminder Section */}
        <div className="h-full">
          <DashboardReminder />
        </div>
      </div>
    </div>
  );
}
