'use client';

import { useState, useEffect, useMemo } from 'react';
import { Activity, Clock, User, Database, Settings, Plus, Minus, Edit3, Trash2, Download, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT' | 'LOGIN' | 'LOGOUT';
  entityType: string;
  entityId: string;
  entityName: string;
  details?: string;
  userAgent?: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <Plus className="w-4 h-4" />,
  UPDATE: <Edit3 className="w-4 h-4" />,
  DELETE: <Trash2 className="w-4 h-4" />,
  EXPORT: <Download className="w-4 h-4" />,
  IMPORT: <Database className="w-4 h-4" />,
  LOGIN: <User className="w-4 h-4" />,
  LOGOUT: <User className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-400',
  UPDATE: 'bg-blue-500/10 text-blue-400',
  DELETE: 'bg-rose-500/10 text-rose-400',
  EXPORT: 'bg-violet-500/10 text-violet-400',
  IMPORT: 'bg-cyan-500/10 text-cyan-400',
  LOGIN: 'bg-amber-500/10 text-amber-400',
  LOGOUT: 'bg-zinc-500/10 text-zinc-400',
};

const entityLabels: Record<string, string> = {
  TRANSACTION: 'Transaksi',
  WALLET: 'Dompet',
  BUDGET: 'Budget',
  GOAL: 'Target',
  DEBT: 'Hutang',
  RECURRING: 'Auto Transaksi',
  REMINDER: 'Reminder',
  SETTINGS: 'Pengaturan',
  USER: 'User',
};

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load logs
  useEffect(() => {
    const savedLogs = localStorage.getItem('equilibria_audit_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      // Generate sample logs for demo
      const sampleLogs: AuditLogEntry[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          action: 'CREATE',
          entityType: 'TRANSACTION',
          entityId: 't1',
          entityName: 'Gaji Bulanan',
          details: 'Pemasukan: Rp 5.000.000',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          action: 'UPDATE',
          entityType: 'WALLET',
          entityId: 'w1',
          entityName: 'BCA Utama',
          details: 'Saldo diupdate',
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          action: 'EXPORT',
          entityType: 'TRANSACTION',
          entityId: 'all',
          entityName: 'Semua Transaksi',
          details: 'Format: JSON Encrypted',
        },
      ];
      setLogs(sampleLogs);
      localStorage.setItem('equilibria_audit_logs', JSON.stringify(sampleLogs));
    }
    setIsLoading(false);
  }, []);

  // Add new log entry (called from other components)
  const addLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newLog: AuditLogEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50),
    };

    const updatedLogs = [newLog, ...logs].slice(0, 500); // Keep last 500 logs
    setLogs(updatedLogs);
    localStorage.setItem('equilibria_audit_logs', JSON.stringify(updatedLogs));
  };

  // Export logs
  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equilibria-audit-log-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterAction !== 'all' && log.action !== filterAction) return false;
      if (filterEntity !== 'all' && log.entityType !== filterEntity) return false;
      return true;
    });
  }, [logs, filterAction, filterEntity]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const uniqueEntities = [...new Set(logs.map(l => l.entityType))];
  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Activity className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Audit Log</h3>
            <p className="text-[10px] text-zinc-500">{logs.length} aktivitas tercatat</p>
          </div>
        </div>
        <button
          onClick={exportLogs}
          disabled={logs.length === 0}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between p-2 bg-[#141414] border border-[#262626] rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#141414] border border-[#262626] rounded-lg">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Aksi</label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2 text-xs"
                  >
                    <option value="all">Semua</option>
                    {uniqueActions.map(action => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Entitas</label>
                  <select
                    value={filterEntity}
                    onChange={(e) => setFilterEntity(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2 text-xs"
                  >
                    <option value="all">Semua</option>
                    {uniqueEntities.map(entity => (
                      <option key={entity} value={entity}>{entityLabels[entity] || entity}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Log List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-zinc-500 text-sm">Memuat...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Tidak ada aktivitas</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="bg-[#141414] border border-[#262626] rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div className={`p-1.5 rounded-lg ${actionColors[log.action]}`}>
                  {actionIcons[log.action]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {entityLabels[log.entityType] || log.entityType}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{log.entityName}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <Clock className="w-3 h-3" />
                    {formatTime(log.timestamp)}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expandedId === log.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="border-t border-zinc-800 overflow-hidden"
                  >
                    <div className="p-3 space-y-2 text-xs">
                      {log.details && (
                        <div>
                          <span className="text-zinc-500">Detail: </span>
                          <span className="text-zinc-300">{log.details}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-zinc-500">ID: </span>
                        <span className="text-zinc-300 font-mono">{log.entityId}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Waktu: </span>
                        <span className="text-zinc-300">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {log.userAgent && (
                        <div className="truncate">
                          <span className="text-zinc-500">Device: </span>
                          <span className="text-zinc-400">{log.userAgent}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
