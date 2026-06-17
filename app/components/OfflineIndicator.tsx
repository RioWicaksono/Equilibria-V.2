'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOfflineData } from '@/hooks/useOfflineData';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showPendingCount?: boolean;
  showSyncButton?: boolean;
}

export default function OfflineIndicator({
  position = 'top',
  showPendingCount = true,
  showSyncButton = true,
}: OfflineIndicatorProps) {
  const {
    isOnline: online,
    isSyncing,
    pendingCount,
    syncNow,
  } = useOfflineData({ autoSync: true, syncInterval: 30000 });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isTop = position === 'top';

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ opacity: 0, y: isTop ? -50 : 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: isTop ? -50 : 50 }}
          transition={{ duration: 0.3 }}
          className={`fixed ${isTop ? 'top-0' : 'bottom-20'} left-0 right-0 z-[90] bg-amber-500/90 backdrop-blur-sm text-black px-4 py-2`}
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            <span>Mode Offline - Perubahan akan disinkronkan saat online</span>
            {showPendingCount && pendingCount > 0 && (
              <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs">
                {pendingCount} menunggu
              </span>
            )}
          </div>
        </motion.div>
      )}

      {online && pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`fixed ${isTop ? 'top-2' : 'bottom-24'} right-4 z-50`}
        >
          <button
            onClick={() => syncNow()}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 border border-teal-500/30 text-teal-400 rounded-full text-xs font-medium hover:bg-teal-500/30 transition-colors disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <Cloud className="w-3 h-3" />
                <span>{pendingCount} pending</span>
              </>
            )}
          </button>
        </motion.div>
      )}

      {online && pendingCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed ${isTop ? 'top-2' : 'bottom-24'} right-4 z-50`}
        >
          <div className="flex items-center gap-1.5 px-2 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-teal-400 font-medium">Synced</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
