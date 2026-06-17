'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { offlineDB, syncOfflineData, isOnline, OfflineTransaction } from '@/lib/offlineDB';

interface UseOfflineDataOptions {
  autoSync?: boolean;
  syncInterval?: number;
  onSyncStart?: () => void;
  onSyncComplete?: (result: { synced: number; failed: number }) => void;
  onSyncError?: (error: Error) => void;
  onOnlineStatusChange?: (online: boolean) => void;
}

interface UseOfflineDataReturn {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  syncNow: () => Promise<{ synced: number; failed: number }>;
  saveOffline: (transaction: Omit<OfflineTransaction, 'syncStatus'>) => Promise<void>;
  clearCache: () => Promise<void>;
  cacheSize: number;
}

export function useOfflineData(options: UseOfflineDataOptions = {}): UseOfflineDataReturn {
  const {
    autoSync = true,
    syncInterval = 30000,
    onSyncStart,
    onSyncComplete,
    onSyncError,
    onOnlineStatusChange,
  } = options;

  const [online, setOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateOnlineStatus = useCallback(async () => {
    const status = await isOnline();
    setOnline(status);
    onOnlineStatusChange?.(status);
  }, [onOnlineStatusChange]);

  const updatePendingCount = useCallback(async () => {
    try {
      const queue = await offlineDB.getSyncQueue();
      setPendingCount(queue.length);

      const transactions = await offlineDB.getAllFromStore('transactions');
      const wallets = await offlineDB.getAllFromStore('wallets');
      const budgets = await offlineDB.getAllFromStore('budgets');
      setCacheSize(transactions.length + wallets.length + budgets.length);
    } catch {
      setPendingCount(0);
      setCacheSize(0);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (isSyncing || !online) {
      return { synced: 0, failed: 0 };
    }

    setIsSyncing(true);
    onSyncStart?.();

    try {
      const result = await syncOfflineData();
      setLastSyncTime(new Date());
      onSyncComplete?.(result);
      await updatePendingCount();
      return result;
    } catch (error) {
      onSyncError?.(error as Error);
      return { synced: 0, failed: 0 };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, online, onSyncStart, onSyncComplete, onSyncError, updatePendingCount]);

  const saveOffline = useCallback(async (transaction: Omit<OfflineTransaction, 'syncStatus'>) => {
    await offlineDB.addToSyncQueue('CREATE', 'transaction', transaction);
    await offlineDB.addToStore('transactions', {
      ...transaction,
      syncStatus: 'pending',
      localId: `offline-${Date.now()}`,
    });
    await updatePendingCount();
  }, [updatePendingCount]);

  const clearCache = useCallback(async () => {
    await offlineDB.clearStore('transactions');
    await offlineDB.clearStore('wallets');
    await offlineDB.clearStore('budgets');
    await offlineDB.clearExpiredCache();
    await updatePendingCount();
  }, [updatePendingCount]);

  useEffect(() => {
    offlineDB.init().then(() => {
      updatePendingCount();
      updateOnlineStatus();
    });

    const handleOnline = () => {
      updateOnlineStatus();
      if (autoSync) syncNow();
    };

    const handleOffline = () => {
      updateOnlineStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (autoSync && online) {
      syncIntervalRef.current = setInterval(syncNow, syncInterval);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, syncInterval, online, syncNow, updateOnlineStatus, updatePendingCount]);

  return {
    isOnline: online,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncNow,
    saveOffline,
    clearCache,
    cacheSize,
  };
}
