'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: string;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
}

export default function RecentTransactions({ transactions = [] }: RecentTransactionsProps) {
  const { formatCurrency } = useSettings();
  const [recent, setRecent] = useState<Transaction[]>([]);

  useEffect(() => {
    setRecent(transactions.slice(0, 5));
  }, [transactions]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Clock className="w-8 h-8 text-zinc-700 mb-2" />
        <p className="text-xs text-zinc-500">Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recent.map((tx, index) => (
        <motion.div
          key={tx.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors cursor-pointer group"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            tx.type === 'INCOME'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-rose-500/10 text-rose-400'
          }`}>
            {tx.type === 'INCOME'
              ? <ArrowUpRight className="w-4 h-4" />
              : <ArrowDownRight className="w-4 h-4" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate group-hover:text-teal-400 transition-colors">
              {tx.category}
            </p>
            <p className="text-[10px] text-zinc-500 truncate">{formatTime(tx.date)}</p>
          </div>
          <div className="text-right">
            <p className={`text-xs font-semibold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
