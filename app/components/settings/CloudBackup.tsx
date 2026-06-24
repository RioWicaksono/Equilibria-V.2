'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, Download, Upload, RefreshCw, CheckCircle, AlertCircle, Loader2, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '@/contexts/SettingsContext';

interface BackupMeta {
  id: string;
  timestamp: string;
  size: number;
  transactionCount: number;
  walletCount: number;
  budgetCount: number;
  goalCount: number;
}

interface BackupData {
  version: string;
  createdAt: string;
  transactions: any[];
  wallets: any[];
  budgets: any[];
  goals: any[];
  debts: any[];
  recurring: any[];
  reminders: any[];
  settings: any;
}

export default function CloudBackup() {
  const { formatCurrency } = useSettings();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Load backup history from localStorage
  useEffect(() => {
    const savedBackups = localStorage.getItem('equilibria_backup_history');
    if (savedBackups) {
      const parsed = JSON.parse(savedBackups);
      setBackups(parsed);
      if (parsed.length > 0) {
        setLastBackup(new Date(parsed[0].timestamp));
      }
    }
  }, []);

  const saveBackupMeta = (meta: BackupMeta) => {
    const newBackups = [meta, ...backups.slice(0, 9)]; // Keep last 10 backups
    setBackups(newBackups);
    localStorage.setItem('equilibria_backup_history', JSON.stringify(newBackups));
    setLastBackup(new Date(meta.timestamp));
  };

  const createBackup = async () => {
    setIsBackingUp(true);
    setStatus('idle');

    try {
      // Fetch all data
      const [transRes, walletRes, budgetRes, goalRes, debtRes, recurringRes, reminderRes] = await Promise.all([
        fetch('/api/transactions', { headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' } }),
        fetch('/api/wallets', { headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' } }),
        fetch('/api/budgets', { headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' } }),
        fetch('/api/goals', { headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' } }),
        fetch('/api/debts', { headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' } }),
        fetch('/api/recurring', { headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' } }),
        fetch('/api/reminders', { headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' } }),
      ]);

      const [transactions, wallets, budgets, goals, debts, recurring, reminders] = await Promise.all([
        transRes.json(),
        walletRes.json(),
        budgetRes.json(),
        goalRes.json(),
        debtRes.json(),
        recurringRes.json(),
        reminderRes.json(),
      ]);

      const backupData: BackupData = {
        version: '2.0',
        createdAt: new Date().toISOString(),
        transactions: transactions.transactions || [],
        wallets: wallets.wallets || [],
        budgets: budgets.budgets || [],
        goals: goals.goals || [],
        debts: debts.debts || [],
        recurring: recurring.recurring || [],
        reminders: reminders.reminders || [],
        settings: JSON.parse(localStorage.getItem('equilibria_settings') || '{}'),
      };

      // Store in IndexedDB for persistent local backup
      await storeBackup(backupData);

      // Also export as downloadable file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equilibria-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const meta: BackupMeta = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        size: blob.size,
        transactionCount: backupData.transactions.length,
        walletCount: backupData.wallets.length,
        budgetCount: backupData.budgets.length,
        goalCount: backupData.goals.length,
      };
      saveBackupMeta(meta);

      setStatus('success');
      setStatusMessage('Backup berhasil disimpan!');
    } catch (error) {
      console.error('Backup error:', error);
      setStatus('error');
      setStatusMessage('Gagal membuat backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const storeBackup = async (data: BackupData) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('EquilibriaDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('backups', 'readwrite');
        const store = tx.objectStore('backups');
        store.put(data, `backup_${Date.now()}`);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups');
        }
      };
    });
  };

  const restoreBackup = async (backupId: string) => {
    setIsRestoring(true);
    setShowRestoreConfirm(false);

    try {
      const request = indexedDB.open('EquilibriaDB', 1);
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const tx = db.transaction('backups', 'readonly');
      const store = tx.objectStore('backups');
      const backup = await new Promise<BackupData>((resolve, reject) => {
        const req = store.get(`backup_${backupId}`);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (!backup) {
        throw new Error('Backup tidak ditemukan');
      }

      // Restore each data type
      for (const transaction of backup.transactions) {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
          },
          body: JSON.stringify(transaction)
        });
      }

      for (const wallet of backup.wallets) {
        await fetch('/api/wallets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
          },
          body: JSON.stringify(wallet)
        });
      }

      setStatus('success');
      setStatusMessage('Data berhasil direstore!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Restore error:', error);
      setStatus('error');
      setStatusMessage('Gagal merestore data');
    } finally {
      setIsRestoring(false);
    }
  };

  const importFromFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;

      if (!data.version || !data.createdAt) {
        throw new Error('Format file tidak valid');
      }

      const meta: BackupMeta = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        size: file.size,
        transactionCount: data.transactions.length,
        walletCount: data.wallets.length,
        budgetCount: data.budgets.length,
        goalCount: data.goals.length,
      };

      await storeBackup(data);
      saveBackupMeta(meta);

      setStatus('success');
      setStatusMessage('File backup berhasil diimport!');
    } catch (error) {
      console.error('Import error:', error);
      setStatus('error');
      setStatusMessage('Gagal import file backup');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Cloud className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Cloud Backup</h3>
          <p className="text-[10px] text-zinc-500">Simpan dan restore data kapan saja</p>
        </div>
      </div>

      {/* Status Message */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {status === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {statusMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backup Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={createBackup}
          disabled={isBackingUp}
          className="flex flex-col items-center gap-2 p-4 bg-[#141414] border border-[#262626] rounded-xl hover:border-teal-500/30 transition-colors disabled:opacity-50"
        >
          {isBackingUp ? (
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-teal-400" />
          )}
          <span className="text-xs font-medium text-white">Backup Sekarang</span>
        </button>

        <label className="flex flex-col items-center gap-2 p-4 bg-[#141414] border border-[#262626] rounded-xl hover:border-blue-500/30 transition-colors cursor-pointer">
          <Download className="w-6 h-6 text-blue-400" />
          <span className="text-xs font-medium text-white">Import Backup</span>
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])}
          />
        </label>
      </div>

      {/* Last Backup Info */}
      {lastBackup && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="w-3 h-3" />
          <span>Backup terakhir: {lastBackup.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      )}

      {/* Backup History */}
      {backups.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-zinc-400 uppercase">Riwayat Backup</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-zinc-800 rounded">
                    <Cloud className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">
                      {new Date(backup.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {backup.transactionCount} transaksi • {formatSize(backup.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRestoreConfirm(true);
                    setTimeout(() => restoreBackup(backup.id), 100);
                  }}
                  disabled={isRestoring}
                  className="p-2 text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
