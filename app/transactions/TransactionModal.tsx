'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CategorySelector from './CategorySelector';

export default function TransactionModal({ onSaveLocal, isFAB = false }: { onSaveLocal?: (data: Record<string, unknown>) => void; isFAB?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Track if form has been modified
  const initialState = useRef({ type: 'EXPENSE', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] });
  const isFormDirty = amount !== '' || category !== '' || description !== '';

  useEffect(() => {
    setIsDirty(amount !== '' || category !== '' || description !== '');
  }, [amount, category, description]);

  const handleClose = () => {
    if (isFormDirty) {
      if (confirm('Anda memiliki perubahan yang belum disimpan. Yakin ingin menutup?')) {
        setIsOpen(false);
        // Reset form
        setType('EXPENSE');
        setAmount('');
        setCategory('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setAmount(val.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      alert('Silakan pilih kategori terlebih dahulu');
      return;
    }
    setIsSubmitting(true);

    const numericAmount = amount.replace(/\./g, '');
    const formData = new FormData();
    formData.append('type', type);
    formData.append('amount', numericAmount);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('date', date);

    const localData = {
      id: 'temp-' + Date.now().toString(),
      type,
      amount: Number(numericAmount),
      category,
      description,
      date: new Date(date).toISOString(),
      isOffline: !navigator.onLine
    };

    if (onSaveLocal) {
      onSaveLocal(localData);
    }

    try {
      if (navigator.onLine) {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          router.refresh();
        }
      } else {
        const queue = JSON.parse(localStorage.getItem('transaction_queue') || '[]');
        queue.push({ type, amount: Number(numericAmount), category, description, date });
        localStorage.setItem('transaction_queue', JSON.stringify(queue));
      }
    } catch (err) {
      console.error("Failed to add", err);
    } finally {
      setIsSubmitting(false);
      setIsOpen(false);
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleTypeChange = (newType: 'INCOME' | 'EXPENSE') => {
    setType(newType);
    setCategory(''); // Reset category when type changes
  };

  return (
    <>
      {isFAB ? (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-teal-500 hover:bg-teal-400 text-black p-4 rounded-full shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] transition-transform hover:scale-105 z-40 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Transaksi
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-6">Catat Transaksi</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Toggle */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Jenis Transaksi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('EXPENSE')}
                      className={`py-2.5 rounded-lg font-medium text-sm transition-colors ${
                        type === 'EXPENSE'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-[#1A1A1A] text-zinc-400 border border-[#262626] hover:bg-zinc-800'
                      }`}
                    >
                      Pengeluaran
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('INCOME')}
                      className={`py-2.5 rounded-lg font-medium text-sm transition-colors ${
                        type === 'INCOME'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#1A1A1A] text-zinc-400 border border-[#262626] hover:bg-zinc-800'
                      }`}
                    >
                      Pemasukan
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Nominal (Rp)</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    required
                    placeholder="Contoh: 150000"
                    inputMode="numeric"
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-zinc-600"
                  />
                </div>

                {/* Category Selector */}
                <CategorySelector
                  value={category}
                  onChange={setCategory}
                  type={type}
                />

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Keterangan / Deskripsi</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Rincian tambahan..."
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-zinc-600"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm [color-scheme:dark]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !amount || !category}
                    className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:text-zinc-400 text-black font-bold py-2.5 rounded-lg transition-colors text-sm"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}