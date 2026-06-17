/**
 * IndexedDB Service for Equilibria Offline Mode
 * Provides offline data caching and synchronization
 */

const DB_NAME = 'equilibria-offline';
const DB_VERSION = 1;

export interface OfflineTransaction {
  id: string;
  walletId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  localId?: string;
}

export interface OfflineWallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  icon: string;
  color: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface OfflineBudget {
  id: string;
  walletId: string;
  category: string;
  amount: number;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  syncStatus: 'pending' | 'synced' | 'failed';
}

interface DBSchema {
  transactions: OfflineTransaction;
  wallets: OfflineWallet;
  budgets: OfflineBudget;
  syncQueue: {
    id: string;
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    entity: 'transaction' | 'wallet' | 'budget';
    data: unknown;
    timestamp: string;
  };
  cache: {
    key: string;
    value: unknown;
    expiry: number;
  };
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[IndexedDB] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('wallets')) {
          db.createObjectStore('wallets', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiry', 'expiry', { unique: false });
        }

        console.log('[IndexedDB] Database schema created');
      };
    });

    return this.initPromise;
  }

  private getStore(storeName: keyof DBSchema, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async addToStore<K extends keyof DBSchema>(
    storeName: K,
    data: DBSchema[K]
  ): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.add(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async putToStore<K extends keyof DBSchema>(
    storeName: K,
    data: DBSchema[K]
  ): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getFromStore<K extends keyof DBSchema>(
    storeName: K,
    key: string
  ): Promise<DBSchema[K] | undefined> {
    await this.init();
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getAllFromStore<K extends keyof DBSchema>(
    storeName: K
  ): Promise<DBSchema[K][]> {
    await this.init();
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async deleteFromStore<K extends keyof DBSchema>(
    storeName: K,
    key: string
  ): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async clearStore<K extends keyof DBSchema>(storeName: K): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async addToSyncQueue(
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: 'transaction' | 'wallet' | 'budget',
    data: unknown
  ): Promise<void> {
    await this.init();
    const item = {
      type,
      entity,
      data,
      timestamp: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('syncQueue', 'readwrite');
        const request = store.add(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getSyncQueue(): Promise<Array<{ id: string; type: string; entity: string; data: unknown; timestamp: string }>> {
    await this.init();
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('syncQueue');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('syncQueue', 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async clearSyncQueue(): Promise<void> {
    await this.clearStore('syncQueue');
  }

  async setCache(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
    await this.init();
    const item = {
      key,
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    };

    return this.putToStore('cache', item as unknown as DBSchema['cache']);
  }

  async getCache<T>(key: string): Promise<T | undefined> {
    await this.init();
    const item = await this.getFromStore('cache', key);

    if (!item) return undefined;

    if (Date.now() > item.expiry) {
      await this.deleteFromStore('cache', key);
      return undefined;
    }

    return item.value as T;
  }

  async clearExpiredCache(): Promise<void> {
    await this.init();
    const all = await this.getAllFromStore('cache');
    const now = Date.now();

    for (const item of all) {
      if (item.expiry < now) {
        await this.deleteFromStore('cache', item.key);
      }
    }
  }

  async cacheAPIResponse<T>(endpoint: string, data: T, ttlSeconds: number = 300): Promise<void> {
    await this.setCache(`api:${endpoint}`, data, ttlSeconds);
  }

  async getCachedAPIResponse<T>(endpoint: string): Promise<T | undefined> {
    return this.getCache<T>(`api:${endpoint}`);
  }

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      await this.init();
      return this.db !== null;
    } catch {
      return false;
    }
  }
}

export const offlineDB = new IndexedDBService();

export async function syncOfflineData(): Promise<{ synced: number; failed: number }> {
  const queue = await offlineDB.getSyncQueue();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const endpoint = `/api/${item.entity}${item.type === 'CREATE' ? '' : `/${(item.data as { id: string }).id}`}`;
      const method = item.type === 'CREATE' ? 'POST' : item.type === 'UPDATE' ? 'PUT' : 'DELETE';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: item.type !== 'DELETE' ? JSON.stringify(item.data) : undefined,
      });

      if (response.ok) {
        await offlineDB.removeSyncQueueItem(item.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

export async function isOnline(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}
