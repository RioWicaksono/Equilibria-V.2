'use client';

import { useEffect, useCallback } from 'react';

interface QueuedTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  description: string;
  date: string;
  queuedAt: string;
}

const QUEUE_KEY = 'equilibria_transaction_queue';

/**
 * Hook to process offline transaction queue when back online
 */
export function useOfflineQueueProcessor(onQueueProcessed?: (count: number) => void) {
  const processQueue = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const queueData = localStorage.getItem(QUEUE_KEY);
    if (!queueData) return;

    let queue: QueuedTransaction[] = [];
    try {
      queue = JSON.parse(queueData);
    } catch {
      console.error('Failed to parse transaction queue');
      return;
    }

    if (queue.length === 0) return;

    console.log(`[OfflineQueue] Processing ${queue.length} queued transactions...`);

    const successfulIds: string[] = [];

    for (const item of queue) {
      try {
        const formData = new FormData();
        formData.append('type', item.type);
        formData.append('amount', item.amount.toString());
        formData.append('category', item.category);
        formData.append('description', item.description || '');
        formData.append('date', item.date);

        const response = await fetch('/api/transactions', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          successfulIds.push(item.id);
          console.log(`[OfflineQueue] Synced: ${item.id}`);
        } else {
          console.warn(`[OfflineQueue] Failed to sync: ${item.id}`, response.status);
        }
      } catch (error) {
        console.error(`[OfflineQueue] Error syncing ${item.id}:`, error);
      }
    }

    // Remove successful items from queue
    if (successfulIds.length > 0) {
      const remaining = queue.filter(item => !successfulIds.includes(item.id));
      if (remaining.length === 0) {
        localStorage.removeItem(QUEUE_KEY);
      } else {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
      }

      onQueueProcessed?.(successfulIds.length);
      console.log(`[OfflineQueue] Processed ${successfulIds.length}/${queue.length} transactions`);
    }
  }, [onQueueProcessed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('[OfflineQueue] Connection restored, processing queue...');
      processQueue();
    };

    // Process queue when coming back online
    window.addEventListener('online', handleOnline);

    // Also process on mount if online and queue exists
    if (navigator.onLine) {
      processQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [processQueue]);

  return { processQueue };
}

/**
 * Get current queue count
 */
export function getQueueCount(): number {
  if (typeof window === 'undefined') return 0;

  const queueData = localStorage.getItem(QUEUE_KEY);
  if (!queueData) return 0;

  try {
    const queue = JSON.parse(queueData);
    return Array.isArray(queue) ? queue.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Add transaction to offline queue
 */
export function addToQueue(transaction: Omit<QueuedTransaction, 'id' | 'queuedAt'>) {
  if (typeof window === 'undefined') return;

  const queueData = localStorage.getItem(QUEUE_KEY);
  let queue: QueuedTransaction[] = [];

  if (queueData) {
    try {
      queue = JSON.parse(queueData);
    } catch {
      queue = [];
    }
  }

  const newItem: QueuedTransaction = {
    ...transaction,
    id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    queuedAt: new Date().toISOString(),
  };

  queue.push(newItem);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

  console.log(`[OfflineQueue] Added transaction to queue. Queue size: ${queue.length}`);

  return newItem;
}

/**
 * Clear the queue
 */
export function clearQueue() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_KEY);
}
