'use client';

import { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSSE, SSENotification } from '@/hooks/useSSE';

interface NotificationToastProps {
  enabled?: boolean;
  maxVisible?: number;
  autoHideDuration?: number;
}

const iconMap: Record<SSENotification['type'], typeof Bell> = {
  TRANSACTION: TrendingUp,
  REMINDER: Bell,
  DEBT: AlertTriangle,
  BUDGET: TrendingDown,
  SYSTEM: CheckCircle,
  HEARTBEAT: Info,
};

const colorMap: Record<SSENotification['type'], { bg: string; border: string; icon: string }> = {
  TRANSACTION: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', icon: 'text-teal-400' },
  REMINDER: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'text-amber-400' },
  DEBT: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: 'text-rose-400' },
  BUDGET: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: 'text-orange-400' },
  SYSTEM: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', icon: 'text-teal-400' },
  HEARTBEAT: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', icon: 'text-zinc-400' },
};

export default function NotificationToast({
  enabled = true,
  maxVisible = 3,
  autoHideDuration = 8000,
}: NotificationToastProps) {
  const [visibleToasts, setVisibleToasts] = useState<SSENotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { notifications, isConnected } = useSSE({
    enabled,
    onMessage: (notification) => {
      if (notification.type === 'HEARTBEAT') return;

      const key = `${notification.type}-${notification.timestamp}`;
      if (dismissed.has(key)) return;

      setVisibleToasts((prev) => {
        const filtered = prev.filter(
          (n) => `${n.type}-${n.timestamp}` !== key
        );
        return [notification, ...filtered].slice(0, maxVisible);
      });

      setTimeout(() => {
        setDismissed((prev) => new Set(prev).add(key));
        setVisibleToasts((prev) =>
          prev.filter((n) => `${n.type}-${n.timestamp}` !== key)
        );
      }, autoHideDuration);
    },
  });

  const dismissToast = (notification: SSENotification) => {
    const key = `${notification.type}-${notification.timestamp}`;
    setDismissed((prev) => new Set(prev).add(key));
    setVisibleToasts((prev) =>
      prev.filter((n) => `${n.type}-${n.timestamp}` !== key)
    );
  };

  if (!enabled) return null;

  return (
    <>
      <AnimatePresence>
        {visibleToasts.map((notification, index) => {
          const Icon = iconMap[notification.type];
          const colors = colorMap[notification.type];
          const key = `${notification.type}-${notification.timestamp}`;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`fixed top-4 right-4 z-[100] max-w-sm ${colors.bg} border ${colors.border} rounded-xl p-4 shadow-2xl backdrop-blur-sm`}
              style={{ marginTop: `${index * 80}px` }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-black/20 ${colors.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm ${colors.icon}`}>
                    {notification.title}
                  </h4>
                  <p className="text-xs text-zinc-300 mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    {new Date(notification.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <button
                  onClick={() => dismissToast(notification)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="fixed bottom-20 right-4 z-50">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-teal-400 animate-pulse' : 'bg-zinc-500'
          } shadow-lg`}
          title={isConnected ? 'Notifikasi real-time aktif' : 'Notifikasi terputus'}
        />
      </div>
    </>
  );
}
