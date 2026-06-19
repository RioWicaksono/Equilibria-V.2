'use client';

import { useState, useEffect, useMemo, memo, useRef, TouchEvent } from 'react';
import { Trash2, Edit2, CloudOff, X, AlertTriangle, Copy, Check, CopyCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useSettings } from '../contexts/SettingsContext';
import { Transaction } from '@/domain/entities/Transaction';

interface OfflineQueueItem extends Transaction {
  isOffline: boolean;
}

type TransactionItem = Transaction | OfflineQueueItem;

function isOfflineItem(item: TransactionItem): item is OfflineQueueItem {
  return 'isOffline' in item && (item as OfflineQueueItem).isOffline === true;
}

interface SwipeState {
  id: string;
  offset: number;
  action: 'edit' | 'delete' | null;
}

const SWIPE_THRESHOLD = 80;

const ClientTransactionList = memo(function ClientTransactionList({
  initialTransactions,
  onDelete
}: {
  initialTransactions: Transaction[];
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const { formatCurrency } = useSettings();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [swipeStates, setSwipeStates] = useState<Record<string, SwipeState>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const touchStartX = useRef<Record<string, number>>({});
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const queueStr = localStorage.getItem('transaction_queue') || '[]';
    const queue = JSON.parse(queueStr);
    if (queue.length > 0) {
      setOfflineQueue(queue.map((q: Transaction, i: number) => ({
        ...q,
        id: `offline-${Date.now()}-${i}`,
        isOffline: true
      })));
    }

    const interval = setInterval(() => {
      const qs = localStorage.getItem('transaction_queue') || '[]';
      const q = JSON.parse(qs);
      if (q.length !== offlineQueue.length) {
        setOfflineQueue(q.map((item: Transaction, i: number) => ({
          ...item,
          id: `offline-${Date.now()}-${i}`,
          isOffline: true
        })));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [offlineQueue.length]);

  const allCombined = useMemo(() => [...offlineQueue, ...initialTransactions] as TransactionItem[], [offlineQueue, initialTransactions]);

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
    let result = allCombined;
    if (selectedTag) {
      result = result.filter(t => {
        const tags = extractTags((t.description || '') + ' ' + (t.category || ''));
        return tags.includes(selectedTag);
      });
    }
    if (searchQuery.trim() !== '') {
      const qs = searchQuery.toLowerCase();
      result = result.filter(t =>
        (t.description || '').toLowerCase().includes(qs) ||
        (t.category || '').toLowerCase().includes(qs)
      );
    }
    return result;
  }, [selectedTag, searchQuery, allCombined]);

  // Touch handlers for swipe actions
  const handleTouchStart = (id: string, e: TouchEvent) => {
    touchStartX.current[id] = e.touches[0].clientX;
  };

  const handleTouchMove = (id: string, e: TouchEvent) => {
    if (!touchStartX.current[id]) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current[id];

    // Determine swipe direction and action
    let action: 'edit' | 'delete' | null = null;
    let offset = 0;

    if (diff < -SWIPE_THRESHOLD) {
      action = 'delete';
      offset = Math.min(Math.abs(diff) - SWIPE_THRESHOLD, 100);
    } else if (diff > SWIPE_THRESHOLD) {
      action = 'edit';
      offset = Math.min(Math.abs(diff) - SWIPE_THRESHOLD, 100);
    } else if (diff < -30) {
      action = 'delete';
      offset = Math.abs(diff) - 30;
    } else if (diff > 30) {
      action = 'edit';
      offset = Math.abs(diff) - 30;
    }

    setSwipeStates(prev => ({
      ...prev,
      [id]: { id, offset, action }
    }));
  };

  const handleTouchEnd = (id: string) => {
    const state = swipeStates[id];
    if (state?.action && state.offset > SWIPE_THRESHOLD / 2) {
      // Trigger action
      if (state.action === 'delete' && !isOfflineItem(filteredTransactions.find(t => t.id === id)!)) {
        setDeletingId(id);
      } else if (state.action === 'edit' && !isOfflineItem(filteredTransactions.find(t => t.id === id)!)) {
        const item = filteredTransactions.find(t => t.id === id) as Transaction;
        if (item) {
          const dateObj = new Date(item.date);
          const localIso = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          setEditingItem({ ...item, date: localIso });
        }
      }
    }

    touchStartX.current[id] = 0;
    setSwipeStates(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const handleDuplicate = async (item: Transaction) => {
    setDuplicatingId(item.id);

    const formData = new FormData();
    formData.append('type', item.type);
    formData.append('amount', item.amount.toString());
    formData.append('category', item.category);
    formData.append('description', item.description || '');
    formData.append('date', new Date().toISOString().split('T')[0]);

    try {
      if (navigator.onLine) {
        await fetch('/api/transactions', {
          method: 'POST',
          body: formData,
        });
        router.refresh();
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (!editingItem) return;
      formData.append('id', editingItem.id);
      formData.append('type', editingItem.type);
      formData.append('amount', editingItem.amount.toString());
      formData.append('category', editingItem.category);
      formData.append('description', editingItem.description);
      formData.append('date', new Date(editingItem.date).toISOString().split('T')[0]);

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
      <div className="flex flex-col gap-4 mb-4">
        <input
          type="text"
          placeholder="Cari nama atau kategori transaksi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
        />
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Mobile hint */}
      <p className="text-[10px] text-zinc-600 md:hidden">
        Geser kiri untuk hapus, geser kanan untuk edit/duplikat
      </p>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          Belum ada transaksi ditemukan.
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((t) => {
              const swipeState = swipeStates[t.id];
              const swipeOffset = swipeState?.offset || 0;
              const swipeAction = swipeState?.action || null;
              const isCopied = copiedId === t.id;
              const isDuplicating = duplicatingId === t.id;

              return (
                <div key={t.id} className="relative overflow-hidden rounded-xl">
                  {/* Swipe action backgrounds */}
                  <div className="absolute inset-0 flex">
                    {/* Edit/Duplicate background (right swipe) */}
                    <div className={`flex-1 flex items-center justify-start pl-4 transition-colors ${swipeAction === 'edit' ? 'bg-teal-500/30' : 'bg-teal-500/10'}`}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const dateObj = new Date(t.date);
                            const localIso = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                            setEditingItem({ ...t, date: localIso });
                          }}
                          disabled={isOfflineItem(t)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-teal-500/20 hover:bg-teal-500/30 rounded-lg text-teal-400 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(t)}
                          disabled={isOfflineItem(t) || isDuplicating}
                          className="flex items-center gap-1.5 px-3 py-2 bg-teal-500/20 hover:bg-teal-500/30 rounded-lg text-teal-400 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDuplicating ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </motion.div>
                          ) : isCopied ? (
                            <CopyCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {isCopied ? 'Tersalin!' : 'Duplikat'}
                        </button>
                      </div>
                    </div>
                    {/* Delete background (left swipe) */}
                    <div className={`flex items-center justify-end pr-4 transition-colors ${swipeAction === 'delete' ? 'bg-rose-500/30' : 'bg-rose-500/10'}`}>
                      <button
                        onClick={() => !isOfflineItem(t) && setDeletingId(t.id)}
                        disabled={isOfflineItem(t)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-rose-400 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </div>
                  </div>

                  {/* Main card */}
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1, x: swipeOffset }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative bg-[#141414] hover:bg-[#1A1A1A] transition-colors"
                    style={{
                      x: swipeOffset,
                      touchAction: 'pan-y'
                    }}
                    onTouchStart={(e) => handleTouchStart(t.id, e)}
                    onTouchMove={(e) => handleTouchMove(t.id, e)}
                    onTouchEnd={() => handleTouchEnd(t.id)}
                    ref={(el) => { itemRefs.current[t.id] = el; }}
                  >
                    <div className="p-4 border border-zinc-800/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {t.category}
                          </span>
                          {isOfflineItem(t) && (
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
                          {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                        {!isOfflineItem(t) && (
                          <div className="flex items-center md:hidden">
                            <button
                              onClick={() => handleDuplicate(t)}
                              className="text-zinc-500 hover:text-teal-400 transition-colors py-2 px-3 flex items-center gap-1.5 font-medium rounded-lg hover:bg-[#1A1A1A] border border-transparent hover:border-[#262626]"
                            >
                              {isCopied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => setDeletingId(t.id)}
                              className="text-zinc-500 hover:text-rose-500 transition-colors py-2 px-3 flex items-center gap-1.5 font-medium rounded-lg hover:bg-[#1A1A1A] border border-transparent hover:border-[#262626]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
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
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
                    onChange={(e) => setEditingItem({...editingItem, type: e.target.value as Transaction['type']})}
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
                    value={editingItem.amount.toLocaleString('id-ID')}
                    onChange={(e) => setEditingItem({...editingItem, amount: Number(e.target.value.replace(/\D/g, ''))})}
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
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm scheme-dark"
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Hapus Transaksi?</h3>
                  <p className="text-sm text-zinc-400 mt-2">
                    Tindakan ini tidak dapat dibatalkan. Data transaksi ini akan dihapus secara permanen.
                  </p>
                </div>
                <div className="flex w-full gap-3 pt-4">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="flex-1 px-4 py-2 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] rounded-lg text-white font-medium text-sm transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      onDelete(deletingId);
                      setDeletingId(null);
                    }}
                    className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-sm transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ClientTransactionList;
