import { getFinanceService } from '@/application/services/FinanceService';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import ExportButton from './ExportButton';
import ClientTransactionList from './ClientTransactionList';
import TransactionModal from './TransactionModal';
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  await headers();
  const financeService = getFinanceService();
  const allTransactions = await financeService.getTransactions();

  // Get date filter (default: today)
  const requestedDate = typeof searchParams?.date === 'string' ? searchParams.date : new Date().toISOString().split('T')[0];

  // Get category filter
  const categoryFilter = typeof searchParams?.category === 'string' ? searchParams.category : '';

  // Get type filter
  const typeFilter = typeof searchParams?.type === 'string' ? searchParams.type : '';

  // Filter transactions
  const transactions = allTransactions.filter(t => {
    const tDate = new Date(t.date).toISOString().split('T')[0];
    const matchDate = requestedDate === 'all' || tDate === requestedDate;
    const matchCategory = !categoryFilter || t.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchType = !typeFilter || t.type === typeFilter;
    return matchDate && matchCategory && matchType;
  });

  // Get unique categories
  const categories = Array.from(new Set(allTransactions.map(t => t.category)));

  // Date options
  const dateOptions = [
    { value: new Date().toISOString().split('T')[0], label: 'Hari Ini' },
    { value: new Date(Date.now() - 86400000).toISOString().split('T')[0], label: 'Kemarin' },
    { value: 'all', label: 'Semua' },
  ];

  async function deleteTransaction(id: string) {
    'use server';
    const financeService = getFinanceService();
    await financeService.deleteTransaction(id);
    revalidatePath('/transactions');
    revalidatePath('/');
    revalidatePath('/summary');
  }

  return (
    <div className="space-y-4">
      {/* Header - Mobile Friendly */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white">Transaksi</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{transactions.length} item ditemukan</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <ExportButton transactions={transactions} />
          <TransactionModal />
        </div>
      </header>

      {/* Filters */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 sm:p-4">
        <form className="flex flex-wrap gap-2 items-end">
          {/* Date Filter */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-medium text-zinc-500 mb-1 uppercase">Tanggal</label>
            <input
              type="date"
              name="date"
              defaultValue={requestedDate === 'all' ? '' : requestedDate}
              className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-teal-500 [color-scheme:dark]"
            />
          </div>

          {/* Type Filter */}
          <div className="flex-1 min-w-[100px]">
            <label className="block text-[10px] font-medium text-zinc-500 mb-1 uppercase">Tipe</label>
            <select
              name="type"
              defaultValue={typeFilter}
              className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
            >
              <option value="">Semua</option>
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex-1 min-w-[100px]">
            <label className="block text-[10px] font-medium text-zinc-500 mb-1 uppercase">Kategori</label>
            <select
              name="category"
              defaultValue={categoryFilter}
              className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
            >
              <option value="">Semua</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black font-semibold rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Cari</span>
          </button>
        </form>

        {/* Quick Date Links */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#262626]">
          {dateOptions.map(opt => (
            <a
              key={opt.value}
              href={`/transactions?date=${opt.value}${typeFilter ? `&type=${typeFilter}` : ''}${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                requestedDate === opt.value
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 sm:p-4">
        <ClientTransactionList
          initialTransactions={transactions}
          onDelete={deleteTransaction}
        />
      </div>
    </div>
  );
}