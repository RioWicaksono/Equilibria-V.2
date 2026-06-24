'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '@/contexts/SettingsContext';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  categoryIcon?: string;
  categoryColor?: string;
  description: string;
  date: string;
  walletId?: string;
}

interface VirtualListProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const ITEM_HEIGHT = 64; // Height of each transaction item
const OVERSCAN = 5; // Number of items to render outside viewport

export default function VirtualTransactionList({
  transactions,
  onEdit,
  onDelete,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false
}: VirtualListProps) {
  const { formatCurrency } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const totalHeight = transactions.length * ITEM_HEIGHT;

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    // Calculate visible range
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const end = Math.min(
      transactions.length,
      Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT) + OVERSCAN
    );

    setVisibleRange({ start, end });

    // Load more when near bottom
    if (hasMore && onLoadMore && scrollTop + clientHeight >= scrollHeight - 200) {
      onLoadMore();
    }
  }, [transactions.length, hasMore, onLoadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const visibleItems = useMemo(() => {
    return transactions.slice(visibleRange.start, visibleRange.end).map((transaction, index) => ({
      transaction,
      index: visibleRange.start + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.start + index) * ITEM_HEIGHT,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT
      }
    }));
  }, [transactions, visibleRange]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Makanan & Minuman': '🍔',
      'Transportasi': '🚗',
      'Belanja': '🛒',
      'Kesehatan': '💊',
      'Pendidikan': '📚',
      'Entertainment': '🎬',
      'Tagihan': '📄',
      'Gaji': '💰',
      'Investasi': '📈',
      'Lainnya': '📦',
    };
    return icons[category] || '💳';
  };

  return (
    <div className="relative">
      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="overflow-y-auto overflow-x-hidden"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {/* Virtual List */}
        <div
          className="relative"
          style={{ height: totalHeight, position: 'relative' }}
        >
          <AnimatePresence mode="popLayout">
            {visibleItems.map(({ transaction, index, style }) => (
              <motion.div
                key={transaction.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                style={style}
                className="px-1"
              >
                <div
                  className={`
                    flex items-center gap-3 p-2.5 rounded-xl
                    ${transaction.type === 'INCOME'
                      ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                      : 'bg-rose-500/5 hover:bg-rose-500/10'
                    }
                    transition-colors cursor-pointer
                    group
                  `}
                  onClick={() => onEdit?.(transaction)}
                >
                  {/* Icon */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0
                      ${transaction.type === 'INCOME'
                        ? 'bg-emerald-500/10'
                        : 'bg-rose-500/10'
                      }
                    `}
                  >
                    {getCategoryIcon(transaction.category)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {transaction.description || transaction.category}
                      </p>
                      <p className={`text-sm font-bold shrink-0 ${
                        transaction.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-zinc-500">
                        {transaction.category}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {formatTime(transaction.date)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(transaction);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(transaction.id);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Loading More */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {transactions.length === 0 && !isLoadingMore && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-4">📭</span>
            <p className="text-sm text-zinc-400">Belum ada transaksi</p>
            <p className="text-xs text-zinc-500">Tambahkan transaksi pertamamu</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-xl p-5 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-2">Hapus Transaksi?</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Aksi ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    const transaction = transactions.find(t => t.id === showDeleteConfirm);
                    if (transaction && onDelete) {
                      onDelete(transaction);
                    }
                    setShowDeleteConfirm(null);
                  }}
                  className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold rounded-lg"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
