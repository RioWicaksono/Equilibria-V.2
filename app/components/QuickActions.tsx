'use client';

import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense' | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const expenseCategories = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Tagihan', 'Lainnya'];
  const incomeCategories = ['Gaji', 'Freelance', 'Investasi', 'Hadiah', 'Lainnya'];

  const handleSubmit = async () => {
    if (!amount || !category) return;
    setIsSubmitting(true);

    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount.replace(/\D/g, '')),
          type: type?.toUpperCase(),
          category,
          description: description || category,
          date: new Date().toISOString(),
        }),
      });
      setIsOpen(false);
      setType(null);
      setAmount('');
      setDescription('');
      setCategory('');
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg text-[10px] lg:text-xs font-semibold text-black hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-200 active:scale-95"
      >
        <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
        <span className="hidden sm:inline">Quick Add</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setIsOpen(false); setType(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#141414] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {!type ? (
                <>
                  <div className="p-4 border-b border-zinc-800">
                    <h2 className="text-sm font-semibold text-white">Tambah Transaksi</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Pilih jenis transaksi</p>
                  </div>
                  <div className="p-4 flex gap-3">
                    <button
                      onClick={() => setType('income')}
                      className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-xs font-medium text-emerald-400">Pemasukan</span>
                    </button>
                    <button
                      onClick={() => setType('expense')}
                      className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-rose-400" />
                      </div>
                      <span className="text-xs font-medium text-rose-400">Pengeluaran</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-white">Tambah {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <button
                        onClick={() => { setIsOpen(false); setType(null); }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Jumlah</label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                          placeholder="0"
                          className="w-full pl-8 pr-4 py-2.5 bg-[#1f1f23] border border-zinc-800 rounded-lg text-lg font-semibold text-white placeholder-zinc-600 focus:border-teal-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Kategori</label>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              category === cat
                                ? type === 'income'
                                  ? 'bg-emerald-500 text-black'
                                  : 'bg-rose-500 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Catatan (opsional)</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tambahkan catatan..."
                        className="w-full mt-1 px-3 py-2.5 bg-[#1f1f23] border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-800 flex gap-2">
                    <button
                      onClick={() => setType(null)}
                      className="flex-1 py-2.5 text-sm font-medium text-zinc-400 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!amount || !category || isSubmitting}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        type === 'income'
                          ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                          : 'bg-rose-500 text-white hover:bg-rose-400'
                      }`}
                    >
                      {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
