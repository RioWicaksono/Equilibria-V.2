import { FinanceService } from '@/src/application/use-cases/FinanceService';
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import DashboardChart from './components/DashboardChart';
import { headers } from 'next/headers';

// Format rupiah helper
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  await headers();
  const summary = await FinanceService.getSummary();
  const transactions = await FinanceService.getTransactions();

  // Prepare chart data (Last 7 Days)
  // Simplifying for preview: Aggregate transactions by date
  // A real app would aggregate more comprehensively.
  const chartData = transactions.map(t => ({
    date: new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    income: t.type === 'INCOME' ? t.amount : 0,
    expense: t.type === 'EXPENSE' ? t.amount : 0,
  })).reverse().slice(-10); // get last 10 transactions

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h2 className="text-2xl font-semibold text-white">Ringkasan Keuangan</h2>
          <p className="text-sm text-zinc-500 mt-1">Laporan otomatis berdasarkan catatan harian Anda.</p>
        </div>
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

      {/* Chart Section */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Aktivitas Terbaru</h3>
        <div className="h-80 w-full">
          <DashboardChart data={chartData} />
        </div>
      </div>
      
      {/* Infrastructure Note */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300">
        <strong className="text-zinc-100">Info Setup Server:</strong> Aplikasi saat ini berjalan menggunakan <em className="text-zinc-400">In-Memory Storage</em> untuk mode Preview. Untuk deploy ke Railway dengan PostgreSQL, cukup tambahkan Environtment Variables <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-200">DATABASE_URL</code>, dan sistem akan otomatis bind ke layer Database Postgres berkat arsitektur Domain-Driven Design (DDD).
      </div>
    </div>
  );
}
