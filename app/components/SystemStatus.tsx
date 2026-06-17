'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff, Database, BotMessageSquare, LucideIcon } from 'lucide-react';

type StatusKey = 'telegram' | 'database' | 'system';
type StatusValue = 'LOADING' | 'ACTIVE' | 'INACTIVE' | 'CONNECTED' | 'DISCONNECTED' | 'green' | 'yellow' | 'red';

interface StatusConfigItem {
  color: string;
  glow: string;
  label: string;
  icon: LucideIcon;
}

const telegramConfig: Record<'LOADING' | 'ACTIVE' | 'INACTIVE', StatusConfigItem> = {
  LOADING: { color: 'bg-zinc-400', glow: 'shadow-[0_0_8px_#9ca3af]', label: 'Memeriksa...', icon: BotMessageSquare },
  ACTIVE: { color: 'bg-teal-400', glow: 'shadow-[0_0_8px_#2DD4BF]', label: 'Terhubung', icon: BotMessageSquare },
  INACTIVE: { color: 'bg-rose-500', glow: 'shadow-[0_0_8px_#f43f5e]', label: 'Terputus', icon: BotMessageSquare },
};

const databaseConfig: Record<'LOADING' | 'CONNECTED' | 'DISCONNECTED', StatusConfigItem> = {
  LOADING: { color: 'bg-zinc-400', glow: 'shadow-[0_0_8px_#9ca3af]', label: 'Menyambung...', icon: Database },
  CONNECTED: { color: 'bg-teal-400', glow: 'shadow-[0_0_8px_#2DD4BF]', label: 'Terhubung', icon: Database },
  DISCONNECTED: { color: 'bg-rose-500', glow: 'shadow-[0_0_8px_#f43f5e]', label: 'Terputus', icon: Database },
};

const systemConfig: Record<'green' | 'yellow' | 'red', StatusConfigItem> = {
  green: { color: 'bg-teal-400', glow: 'shadow-[0_0_8px_#2DD4BF]', label: 'Aktif', icon: Wifi },
  yellow: { color: 'bg-amber-400', glow: 'shadow-[0_0_8px_#fbbf24]', label: 'Lemah', icon: Wifi },
  red: { color: 'bg-rose-500', glow: 'shadow-[0_0_8px_#f43f5e]', label: 'Offline', icon: WifiOff },
};

interface StatusState {
  telegram: 'LOADING' | 'ACTIVE' | 'INACTIVE';
  database: 'LOADING' | 'CONNECTED' | 'DISCONNECTED';
  system: 'green' | 'yellow' | 'red';
}

export default function SystemStatus() {
  const [status, setStatus] = useState<StatusState>({
    telegram: 'LOADING',
    database: 'LOADING',
    system: 'green',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let isActive = true;

    const checkTelegram = async () => {
      try {
        const res = await fetch('/api/telegram-webhook');
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (isActive) {
          const botStatus = data.bot || data.status;
          setStatus(prev => ({ ...prev, telegram: botStatus === 'CONNECTED' ? 'ACTIVE' : 'INACTIVE' }));
        }
      } catch {
        if (isActive) setStatus(prev => ({ ...prev, telegram: 'INACTIVE' }));
      }
    };

    const checkDatabase = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (isActive) {
            const dbCheck = data.checks?.database?.status;
            setStatus(prev => ({ ...prev, database: dbCheck === 'pass' ? 'CONNECTED' : 'DISCONNECTED' }));
          }
        } else {
          if (isActive) setStatus(prev => ({ ...prev, database: 'DISCONNECTED' }));
        }
      } catch {
        if (isActive) setStatus(prev => ({ ...prev, database: 'DISCONNECTED' }));
      }
    };

    const checkSystem = async () => {
      if (!navigator.onLine) {
        setStatus(prev => ({ ...prev, system: 'red' }));
        return;
      }

      const connection = (navigator as Navigator & { connection?: { effectiveType: string; saveData: boolean } }).connection;
      let isUnstable = false;
      if (connection) {
        if (['slow-2g', '2g', '3g'].includes(connection.effectiveType) || connection.saveData) {
          isUnstable = true;
        }
      }

      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000);
        const res = await fetch('/api/health', { signal: controller.signal });
        clearTimeout(id);

        if (!res.ok) {
          setStatus(prev => ({ ...prev, system: 'red' }));
        } else {
          const data = await res.json();
          const dbPass = data.checks?.database?.status === 'pass';
          if (dbPass) {
            setStatus(prev => ({ ...prev, system: isUnstable ? 'yellow' : 'green' }));
          } else {
            setStatus(prev => ({ ...prev, system: 'red' }));
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          setStatus(prev => ({ ...prev, system: 'yellow' }));
        } else {
          setStatus(prev => ({ ...prev, system: 'red' }));
        }
      }
    };

    const checkAll = async () => {
      setIsRefreshing(true);
      await Promise.all([checkTelegram(), checkDatabase(), checkSystem()]);
      setIsRefreshing(false);
      timeout = setTimeout(checkAll, 15000);
    };

    const handleOnline = () => checkSystem();
    const handleOffline = () => {
      setStatus(prev => ({ ...prev, system: 'red', telegram: 'INACTIVE', database: 'DISCONNECTED' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    checkAll();

    return () => {
      isActive = false;
      clearTimeout(timeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusConfig = (key: StatusKey, value: StatusValue): StatusConfigItem => {
    if (key === 'telegram') return telegramConfig[value as keyof typeof telegramConfig];
    if (key === 'database') return databaseConfig[value as keyof typeof databaseConfig];
    return systemConfig[value as keyof typeof systemConfig];
  };

  const StatusItem = ({ statusKey, label, value }: { statusKey: StatusKey; label: string; value: StatusValue }) => {
    const config = getStatusConfig(statusKey, value);
    const Icon = config.icon;
    const isLoading = value === 'LOADING';
    const isSuccess = value === 'ACTIVE' || value === 'CONNECTED' || value === 'green';

    return (
      <div className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#262626] px-2 py-1 rounded-full group hover:border-[#333] transition-colors">
        {isLoading ? (
          <RefreshCw className="w-2.5 h-2.5 text-zinc-400 animate-spin" />
        ) : (
          <div className={`w-1.5 h-1.5 rounded-full ${config.color} ${config.glow} animate-pulse`} />
        )}
        <Icon className={`w-3 h-3 ${isLoading ? 'text-zinc-400' : isSuccess ? 'text-teal-400' : 'text-rose-400'}`} />
        <span className="text-zinc-300 font-semibold text-[10px] sm:text-xs">
          {label}: {config.label}
        </span>
      </div>
    );
  };

  const refreshStatus = () => {
    setStatus(prev => ({ ...prev, telegram: 'LOADING', database: 'LOADING' }));
    fetch('/api/telegram-webhook')
      .then(res => res.json())
      .then(data => {
        const botStatus = data.bot || data.status;
        setStatus(prev => ({ ...prev, telegram: botStatus === 'CONNECTED' ? 'ACTIVE' : 'INACTIVE' }));
      })
      .catch(() => setStatus(prev => ({ ...prev, telegram: 'INACTIVE' })));

    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        const dbCheck = data.checks?.database?.status;
        setStatus(prev => ({ ...prev, database: dbCheck === 'pass' ? 'CONNECTED' : 'DISCONNECTED' }));
      })
      .catch(() => setStatus(prev => ({ ...prev, database: 'DISCONNECTED' })));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-1.5 items-end">
      <div className="flex flex-col sm:flex-row gap-1.5">
        <StatusItem statusKey="telegram" label="Telegram" value={status.telegram} />
        <StatusItem statusKey="database" label="Database" value={status.database} />
        <StatusItem statusKey="system" label="System" value={status.system} />
      </div>

      <button
        onClick={refreshStatus}
        className="p-1.5 text-zinc-500 hover:text-teal-400 hover:bg-[#1A1A1A] rounded-full transition-colors"
        title="Refresh Status"
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
