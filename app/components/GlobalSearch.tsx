'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, ArrowRight, Hash, Wallet, Target, DollarSign, Receipt } from 'lucide-react';
import { useGlobalSearch, SearchResult } from '../hooks/useGlobalSearch';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = 'equilibria_recent_searches';
const MAX_RECENT = 5;

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const { query, setQuery, results, isSearching, totalResults } = useGlobalSearch();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Save recent search
  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (query) saveRecentSearch(query);

    if (result.href) {
      router.push(result.href);
      onClose();
    }
  };

  // Handle recent search click
  const handleRecentClick = (search: string) => {
    setQuery(search);
  };

  // Clear recent searches
  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Format amount
  const formatAmount = (amount: number, type?: string) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));

    return type === 'EXPENSE' || type === 'debt' ? `-${formatted}` : `+${formatted}`;
  };

  // Get icon for type
  const getIcon = (type: string) => {
    switch (type) {
      case 'transaction': return <Receipt className="w-4 h-4" />;
      case 'category': return <Hash className="w-4 h-4" />;
      case 'wallet': return <Wallet className="w-4 h-4" />;
      case 'goal': return <Target className="w-4 h-4" />;
      case 'debt': return <DollarSign className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Search Container */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[#262626]">
            <Search className="w-5 h-5 text-zinc-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari transaksi, kategori, dompet..."
              className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none text-base"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 text-zinc-500 text-xs rounded border border-zinc-700">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Recent Searches (when no query) */}
            {!query && recentSearches.length > 0 && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Terbaru</span>
                  <button
                    onClick={clearRecent}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, i) => (
                    <button
                      key={i}
                      onClick={() => handleRecentClick(search)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors"
                    >
                      <Clock className="w-4 h-4 text-zinc-600" />
                      <span>{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No query and no recent */}
            {!query && recentSearches.length === 0 && (
              <div className="p-8 text-center">
                <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Ketik untuk mencari...</p>
                <p className="text-xs text-zinc-600 mt-1">Transaksi, kategori, dompet, target, hutang</p>
              </div>
            )}

            {/* Searching */}
            {query && isSearching && (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Mencari...</p>
              </div>
            )}

            {/* Results */}
            {query && !isSearching && results.length > 0 && (
              <div className="p-3">
                <div className="px-2 py-1 mb-2">
                  <span className="text-xs font-medium text-zinc-500">
                    {totalResults} hasil untuk "{query}"
                  </span>
                </div>
                <div className="space-y-1">
                  {results.map(result => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-zinc-800/50 active:bg-zinc-800 transition-colors group"
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${
                        result.type === 'transaction' ? 'bg-teal-500/10 text-teal-400' :
                        result.type === 'category' ? 'bg-blue-500/10 text-blue-400' :
                        result.type === 'wallet' ? 'bg-purple-500/10 text-purple-400' :
                        result.type === 'goal' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {getIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">
                            {result.icon} {result.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded uppercase">
                            {result.type}
                          </span>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-zinc-500 truncate">{result.subtitle}</p>
                        )}
                      </div>
                      {result.amount !== undefined && (
                        <div className={`text-sm font-semibold shrink-0 ${
                          result.type === 'debt' || (result.meta?.type === 'EXPENSE')
                            ? 'text-rose-400'
                            : 'text-teal-400'
                        }`}>
                          {formatAmount(result.amount, result.meta?.type)}
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query && !isSearching && results.length === 0 && (
              <div className="p-8 text-center">
                <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Tidak ada hasil untuk "{query}"</p>
                <p className="text-xs text-zinc-600 mt-1">Coba kata kunci lain</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#262626] bg-[#0A0A0A]/50">
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500">↑↓</kbd>
                navigasi
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500">Enter</kbd>
                pilih
              </span>
            </div>
            <span className="text-xs text-zinc-600">Tekan ESC untuk menutup</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
