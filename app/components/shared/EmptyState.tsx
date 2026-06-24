'use client';

import { motion } from 'motion/react';
import { ButtonHTMLAttributes } from 'react';

type EmptyStateVariant = 'transactions' | 'wallets' | 'budgets' | 'goals' | 'debts' | 'recurring' | 'reminders' | 'general';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const illustrations = {
  transactions: {
    emoji: '💸',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10'
  },
  wallets: {
    emoji: '👛',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  budgets: {
    emoji: '📊',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10'
  },
  goals: {
    emoji: '🎯',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10'
  },
  debts: {
    emoji: '🤝',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10'
  },
  recurring: {
    emoji: '🔄',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10'
  },
  reminders: {
    emoji: '🔔',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10'
  },
  general: {
    emoji: '📦',
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10'
  }
};

export default function EmptyState({
  variant = 'general',
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  const { emoji, color, bg } = illustrations[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {/* Illustration */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: 'backOut' }}
        className={`w-20 h-20 ${bg} rounded-2xl flex items-center justify-center mb-6`}
      >
        <span className="text-4xl">{emoji}</span>
      </motion.div>

      {/* Text */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-lg font-semibold text-white mb-2"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-sm text-zinc-500 max-w-xs mb-6"
      >
        {description}
      </motion.p>

      {/* Action */}
      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={onAction}
            className={`px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-black text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/25 active:scale-95`}
          >
            {actionLabel}
          </button>
        </motion.div>
      )}

      {/* Decorative dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 mt-8"
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${bg} animate-pulse`}
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

// Preset Empty States
export function EmptyTransactions({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      variant="transactions"
      title="Belum Ada Transaksi"
      description="Mulai catat pemasukan dan pengeluaran pertamamu untuk melacak keuangan dengan lebih baik."
      actionLabel="Tambah Transaksi"
      onAction={onAdd}
    />
  );
}

export function EmptyWallets({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      variant="wallets"
      title="Dompet Kosong"
      description="Tambahkan dompet digital atau rekening bank untuk mulai mengatur keuanganmu."
      actionLabel="Tambah Dompet"
      onAction={onAdd}
    />
  );
}

export function EmptyBudgets({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      variant="budgets"
      title="Belum Ada Budget"
      description="Buat budget per kategori untuk mengontrol pengeluaran dan mencapai tujuan finansialmu."
      actionLabel="Buat Budget"
      onAction={onAdd}
    />
  );
}

export function EmptyGoals({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      variant="goals"
      title="Target Kosong"
      description="Tetapkan target tabungan untuk membeli barang impian atau mencapai tujuan finansial."
      actionLabel="Buat Target"
      onAction={onAdd}
    />
  );
}

export function EmptyDebts({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      variant="debts"
      title="Tidak Ada Hutang"
      description="🎉 Selamat! Kamu tidak memiliki hutang atau piutang aktif."
      actionLabel={onAdd ? "Tambah Hutang" : undefined}
      onAction={onAdd}
    />
  );
}

export function EmptyRecurring({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      variant="recurring"
      title="Belum Ada Auto Transaksi"
      description="Atur transaksi otomatis untuk langganan dan tagihan rutin agar tidak lupa."
      actionLabel="Buat Auto Transaksi"
      onAction={onAdd}
    />
  );
}

export function EmptyReminders({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      variant="reminders"
      title="Tidak Ada Reminder"
      description="Buat pengingat untuk tagihan, deadline, atau acara finansial penting."
      actionLabel="Buat Reminder"
      onAction={onAdd}
    />
  );
}
