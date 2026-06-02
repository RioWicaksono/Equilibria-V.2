'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TransactionModal({ onSaveLocal }: { onSaveLocal: (data: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const [type, setType] = useState('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper for strictly numeric input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setAmount(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('type', type);
    formData.append('amount', amount);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('date', date);

    // Save locally first for Optimistic UI / Offline
    const localData = {
      id: 'temp-' + Date.now().toString(),
      type,
      amount: Number(amount),
      category,
      description,
      date: new Date(date).toISOString(),
      isOffline: !navigator.onLine
    };

    onSaveLocal(localData);

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
        // save to offline queue in local storage
        const queue = JSON.parse(localStorage.getItem('transaction_queue') || '[]');
        queue.push({
          type, amount: Number(amount), category, description, date
        });
        localStorage.setItem('transaction_queue', JSON.stringify(queue));
      }
    } catch (err) {
       console.error("Failed to add", err);
    } finally {
       setIsSubmitting(false);
       setIsOpen(false);
       // Reset
       setAmount('');
       setCategory('');
       setDescription('');
       setDate(new Date().toISOString().split('T')[0]);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        Tambah Transaksi
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-6">Catat Transaksi</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Jenis Transaksi</label>
                  <select 
                    value={type} onChange={(e) => setType(e.target.value)}
                    required 
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm"
                  >
                    <option value="EXPENSE">Pengeluaran</option>
                    <option value="INCOME">Pemasukan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Nominal (Rp)</label>
                  <input 
                    type="text" 
                    value={amount} onChange={handleAmountChange}
                    required 
                    placeholder="Contoh: 150000"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Kategori (Gunakan #tag)</label>
                  <input 
                    type="text" 
                    value={category} onChange={(e) => setCategory(e.target.value)}
                    required 
                    placeholder="Contoh: Makan Siang #makanan"
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Keterangan / Deskripsi</label>
                  <input 
                    type="text" 
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Rincian tambahan..."
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Tanggal</label>
                  <input 
                    type="date" 
                    value={date} onChange={(e) => setDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]} // Mencegah tanggal masa depan
                    required 
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm [color-scheme:dark]"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || amount === ''}
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
