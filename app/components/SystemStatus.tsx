'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function SystemStatus() {
  const [systemStatus, setSystemStatus] = useState<'green' | 'yellow' | 'red'>('green');
  const [telegramStatus, setTelegramStatus] = useState<'LOADING' | 'ACTIVE' | 'INACTIVE'>('LOADING');
  const [databaseStatus, setDatabaseStatus] = useState<'LOADING' | 'CONNECTED' | 'DISCONNECTED'>('LOADING');

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let isActive = true;

    const checkTelegram = async () => {
      try {
        const res = await fetch('/api/telegram-webhook');
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (isActive) {
          setTelegramStatus(data.status as 'ACTIVE' | 'INACTIVE');
        }
      } catch {
        if (isActive) setTelegramStatus('INACTIVE');
      }
    };

    const checkDatabase = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (isActive) {
            setDatabaseStatus(data.health === 'ok' || data.status === 'ok' ? 'CONNECTED' : 'DISCONNECTED');
          }
        } else {
          if (isActive) setDatabaseStatus('DISCONNECTED');
        }
      } catch {
        if (isActive) setDatabaseStatus('DISCONNECTED');
      }
    };

    const checkStatus = async () => {
      if (!navigator.onLine) {
        setSystemStatus('red');
      } else {
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
            setSystemStatus('red');
          } else {
            setSystemStatus(isUnstable ? 'yellow' : 'green');
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            setSystemStatus('yellow');
          } else {
            setSystemStatus('red');
          }
        }
      }

      checkTelegram();
      checkDatabase();
      timeout = setTimeout(checkStatus, 15000);
    };

    const handleOnline = () => {
      checkStatus();
    };

    const handleOffline = () => {
      setSystemStatus('red');
      setTelegramStatus('INACTIVE');
      setDatabaseStatus('DISCONNECTED');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    checkStatus();

    return () => {
      isActive = false;
      clearTimeout(timeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const statusColorClasses = {
    green: 'bg-teal-400 shadow-[0_0_8px_#2DD4BF]',
    yellow: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    red: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
  };

  const statusTextClasses = {
    green: 'Aktif',
    yellow: 'Lemah',
    red: 'Offline'
  };

  const telegramColorClasses = {
    LOADING: 'bg-zinc-400 shadow-[0_0_8px_#9ca3af]',
    ACTIVE: 'bg-teal-400 shadow-[0_0_8px_#2DD4BF]',
    INACTIVE: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
  };

  const telegramTextClasses = {
    LOADING: 'Memeriksa',
    ACTIVE: 'Aktif',
    INACTIVE: 'Tidak Aktif'
  };

  const databaseColorClasses = {
    LOADING: 'bg-zinc-400 shadow-[0_0_8px_#9ca3af]',
    CONNECTED: 'bg-teal-400 shadow-[0_0_8px_#2DD4BF]',
    DISCONNECTED: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
  };

  const databaseTextClasses = {
    LOADING: 'Menyambung...',
    CONNECTED: 'Terhubung',
    DISCONNECTED: 'Terputus'
  };

  return (
    <div className="flex flex-col sm:flex-row gap-1.5">
      {/* Telegram Status */}
      <div className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#262626] px-2 py-1 rounded-full">
        {telegramStatus === 'LOADING' ? (
          <RefreshCw className="w-2.5 h-2.5 text-zinc-400 animate-spin" />
        ) : (
          <div className={`w-1.5 h-1.5 rounded-full ${telegramColorClasses[telegramStatus]}`} />
        )}
        <span className="text-zinc-300 font-semibold text-[10px] sm:text-xs">
          TG: {telegramTextClasses[telegramStatus]}
        </span>
      </div>

      {/* Database Status */}
      <div className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#262626] px-2 py-1 rounded-full">
        {databaseStatus === 'LOADING' ? (
          <RefreshCw className="w-2.5 h-2.5 text-zinc-400 animate-spin" />
        ) : (
          <div className={`w-1.5 h-1.5 rounded-full ${databaseColorClasses[databaseStatus]}`} />
        )}
        <span className="text-zinc-300 font-semibold text-[10px] sm:text-xs">
          DB: {databaseTextClasses[databaseStatus]}
        </span>
      </div>

      {/* System Status */}
      <div className="flex items-center gap-1.5 bg-[#1A1A1A] border border-[#262626] px-2 py-1 rounded-full">
        <div className={`w-1.5 h-1.5 rounded-full ${statusColorClasses[systemStatus]}`} />
        <span className="text-zinc-300 font-semibold text-[10px] sm:text-xs">Sys: {statusTextClasses[systemStatus]}</span>
      </div>
    </div>
  );
}
