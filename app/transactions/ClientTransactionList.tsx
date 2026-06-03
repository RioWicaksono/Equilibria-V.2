'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { Trash2, Edit2, CloudOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

const formatIDR = (amount: number) => {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
};

const ClientTransactionList = memo(function ClientTransactionList({ 
  initialTransactions,
  onDelete
}: { 
  initialTransactions: any[];
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const queueStr = localStorage.getItem('transaction_queue') || '[]';
    const queue = JSON.parse(queueStr);
    if (queue.length > 0) {
      setOfflineQueue(queue.map((q: any, i: number) => ({
        ...q,
        id: `offline-${Date.now()}-${i}`,
        isOffline: true
      })));
    }

    const interval = setInterval(() => {
      const qs = localStorage.getItem('transaction_queue') || '[]';
      const q = JSON.parse(qs);
      if (q.length !== offlineQueue.length) {
        setOfflineQueue(q.map((item: any, i: number) => ({
          ...item,
          id: `offline-${Date.now()}-${i}`,
          isOffline: true
        })));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [offlineQueue.length]);

  const allCombined = useMemo(() => [...offlineQueue, ...initialTransactions], [offlineQueue, initialTransactions]);

  const extractTags = (text: string) => {
    const matches = text.match(/#[\w]+/g);
    return matches ? matches.map(t => t.toLowerCase()) : [];
  };

  const allTags = useMemo(() => {
    return Array.from(new Set(allCombined.flatMap(t => {
      return extractTags((t.description || '') + ' ' + (t.category || ''));
    })));
  }, [allCombined]);

  const filteredTransactions = useMemo(() => {
    return selectedTag 
      ? allCombined.filter(t => {
          const tags = extractTags((t.description || '') + ' ' + (t.category || ''));
          return tags.includes(selectedTag);
        })
      : allCombined;
  }, [selectedTag, allCombined]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('id', editingItem.id);
      formData.append('type', editingItem.type);
      formData.append('amount', editingItem.amount.toString());
      formData.append('category', editingItem.category);
      formData.append('description', editingItem.description);
      formData.append('date', editingItem.date.split('T')[0]);

      if (navigator.onLine) {
        await fetch('/api/transactions', {
          method: 'PUT',
          body: formData,
        });
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
      setEditingItem(null);
    }
  };

  return (
    <div className="space-y-4 relative">
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedTag === null ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            Semua
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTag === tag ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          Belum ada transaksi ditemukan.
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((t) => (
              <motion.div 
                key={t.id} 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-zinc-800/50 bg-[#141414] hover:bg-[#1A1A1A] hover:border-zinc-700 transition-colors gap-4"
               >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {t.category}
                    </span>
                    {t.isOffline && (
                      <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium" title="Menunggu sinkronisasi (Offline)">
                        <CloudOff className="w-3 h-3" />
                        Tertunda
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-zinc-500 mt-1 whitespace-pre-wrap">
                    {t.description || "Tanpa Keterangan"} • {new Date(t.date).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-end sm:space-x-6 w-full sm:w-auto mt-2 sm:mt-0">
                  <span className={`font-semibold ${t.type === 'INCOME' ? 'text-teal-400' : 'text-rose-400'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatIDR(t.amount)}
                  </span>
                  {!t.isOffline && (
                    <div className="flex items-center">
                      <button 
                        onClick={() => {
                          const dateObj = new Date(t.date);
                          // offset for correct local yyyy-mm-dd
                          const localIso = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                          setEditingItem({ ...t, date: localIso });
                        }}
                        className="text-zinc-500 hover:text-teal-400 transition-colors p-2"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(t.id)} 
                        className="text-zinc-500 hover:text-rose-500 transition-colors p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setEditingItem(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-6">Edit Transaksi</h3>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Jenis Transaksi</label>
                  <select 
                    value={editingItem.type} 
                    onChange={(e) => setEditingItem({...editingItem, type: e.target.value})}
                    required 
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                  >
                    <option value="EXPENSE">Pengeluaran</option>
                    <option value="INCOME">Pemasukan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Nominal (Rp)</label>
                  <input 
                    type="text" 
                    value={editingItem.amount} 
                    onChange={(e) => setEditingItem({...editingItem, amount: e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')})}
                    required 
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Kategori (Gunakan #tag)</label>
                  <input 
                    type="text" 
                    value={editingItem.category} 
                    onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                    required 
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Keterangan / Deskripsi</label>
                  <input 
                    type="text" 
                    value={editingItem.description} 
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Tanggal</label>
                  <input 
                    type="date" 
                    value={editingItem.date} 
                    onChange={(e) => setEditingItem({...editingItem, date: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                    required 
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm [color-scheme:dark]"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !editingItem.amount}
                    className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:text-zinc-400 text-black font-bold py-2.5 rounded-lg transition-colors text-sm"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ClientTransactionList;
