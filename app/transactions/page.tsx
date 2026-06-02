import { FinanceService } from '@/src/application/use-cases/FinanceService';
import { revalidatePath } from 'next/cache';
import { TransactionType } from '@/src/domain/models/Transaction';
import { Trash2 } from 'lucide-react';
import { headers } from 'next/headers';

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  await headers(); // Force dynamic rendering and prevent build-time DB execution
  const transactions = await FinanceService.getTransactions();

  // Server Action for adding transaction
  async function addTransaction(formData: FormData) {
    'use server';
    const amount = Number(formData.get('amount'));
    const type = formData.get('type') as TransactionType;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    await FinanceService.addTransaction(amount, type, category, description, date);
    revalidatePath('/transactions');
    revalidatePath('/');
  }

  // Server Action for deleting transaction
  async function deleteTransaction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await FinanceService.deleteTransaction(id);
    revalidatePath('/transactions');
    revalidatePath('/');
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold text-white">Transaksi</h2>
        <p className="text-sm text-zinc-500 mt-1">Catat dan kelola pengeluaran serta pemasukan harian Anda secara manual.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction Form Container */}
        <div className="lg:col-span-1">
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Catat Transaksi</h3>
            <form action={addTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Jenis Transaksi</label>
                <select name="type" required className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm">
                  <option value="EXPENSE">Pengeluaran</option>
                  <option value="INCOME">Pemasukan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Nominal (Rp)</label>
                <input 
                  type="number" 
                  name="amount" 
                  min="1" 
                  required 
                  placeholder="Contoh: 150000"
                  className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Kategori</label>
                <input 
                  type="text" 
                  name="category" 
                  required 
                  placeholder="Contoh: Makan Siang, Gaji, dll"
                  className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Keterangan / Deskripsi</label>
                <input 
                  type="text" 
                  name="description" 
                  placeholder="Rincian tambahan..."
                  className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Tanggal</label>
                <input 
                  type="date" 
                  name="date" 
                  required 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm [color-scheme:dark]"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-2.5 rounded-lg transition-colors text-sm mt-4"
              >
                Simpan Transaksi
              </button>
            </form>
          </div>
        </div>

        {/* Transactions List Container */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Riwayat Terakhir</h3>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                Belum ada transaksi yang dicatat.
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800/50 hover:bg-[#1A1A1A] hover:border-zinc-700 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{t.category}</span>
                      <span className="text-sm text-zinc-500">{t.description || "Tanpa Keterangan"} • {new Date(t.date).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex items-center space-x-6">
                      <span className={`font-semibold ${t.type === 'INCOME' ? 'text-teal-400' : 'text-rose-400'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatIDR(t.amount)}
                      </span>
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={t.id} />
                        <button type="submit" className="text-zinc-500 hover:text-rose-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
