'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface SearchResult {
  id: string;
  type: 'transaction' | 'category' | 'wallet' | 'goal' | 'debt';
  title: string;
  subtitle?: string;
  amount?: number;
  date?: string;
  icon?: string;
  href?: string;
  meta?: Record<string, any>;
}

interface SearchResponse {
  transactions: Array<{
    id: string;
    type: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    walletName?: string;
  }>;
  categories: Array<{
    name: string;
    count: number;
    totalAmount: number;
  }>;
  wallets: Array<{
    id: string;
    name: string;
    balance: number;
  }>;
  goals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
  }>;
  debts: Array<{
    id: string;
    name: string;
    amount: number;
    paidAmount: number;
    type: string;
  }>;
}

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search function
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await res.json();

      if (data.success) {
        const formattedResults: SearchResult[] = [];

        // Format transactions
        data.results.transactions?.forEach((t: any) => {
          formattedResults.push({
            id: t.id,
            type: 'transaction',
            title: t.description || t.category,
            subtitle: t.category,
            amount: t.amount,
            date: t.date,
            icon: t.type === 'INCOME' ? '📈' : '📉',
            href: '/transactions',
            meta: t,
          });
        });

        // Format categories
        data.results.categories?.forEach((c: any) => {
          formattedResults.push({
            id: `cat-${c.name}`,
            type: 'category',
            title: c.name,
            subtitle: `${c.count} transaksi`,
            amount: c.totalAmount,
            icon: '📁',
            href: `/transactions?category=${encodeURIComponent(c.name)}`,
          });
        });

        // Format wallets
        data.results.wallets?.forEach((w: any) => {
          formattedResults.push({
            id: w.id,
            type: 'wallet',
            title: w.name,
            subtitle: 'Dompet',
            amount: w.balance,
            icon: '💳',
            href: '/wallets',
          });
        });

        // Format goals
        data.results.goals?.forEach((g: any) => {
          formattedResults.push({
            id: g.id,
            type: 'goal',
            title: g.name,
            subtitle: `${Math.round((g.currentAmount / g.targetAmount) * 100)}% tercapai`,
            amount: g.currentAmount,
            icon: '🎯',
            href: '/goals',
            meta: g,
          });
        });

        // Format debts
        data.results.debts?.forEach((d: any) => {
          formattedResults.push({
            id: d.id,
            type: 'debt',
            title: d.name,
            subtitle: d.type === 'DEBT' ? 'Hutang' : 'Pinjaman',
            amount: d.amount - d.paidAmount,
            icon: '💵',
            href: '/debts',
            meta: d,
          });
        });

        setResults(formattedResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        search(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search]);

  // Open search
  const openSearch = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setResults([]);
  }, []);

  // Close search
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    isOpen,
    openSearch,
    closeSearch,
    totalResults: results.length,
  };
}
