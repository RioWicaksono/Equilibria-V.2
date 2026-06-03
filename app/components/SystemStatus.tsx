'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function SystemStatus() {
  const [status, setStatus] = useState<'green' | 'yellow' | 'red'>('green');
  const [telegramStatus, setTelegramStatus] = useState<'LOADING' | 'ACTIVE' | 'INACTIVE'>('LOADING');

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
      } catch (error) {
        if (isActive) setTelegramStatus('INACTIVE');
      }
    };

    const checkStatus = async () => {
      if (!navigator.onLine) {
        setStatus('red');
      } else {
        // Check network stability using Network Information API if available
        const connection = (navigator as any).connection;
        let isUnstable = false;
        if (connection) {
          if (['slow-2g', '2g', '3g'].includes(connection.effectiveType) || connection.saveData) {
            isUnstable = true;
          }
        }

        try {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 5000); // 5s timeout
          const res = await fetch('/api/health', { signal: controller.signal });
          clearTimeout(id);
          
          if (!res.ok) {
            setStatus('red');
          } else {
            setStatus(isUnstable ? 'yellow' : 'green');
          }
        } catch (error) {
          // fetch failed or timed out
          if (error instanceof Error && error.name === 'AbortError') {
            setStatus('yellow'); // Network is just very slow over 5s
          } else {
            setStatus('red');
          }
        }
      }
      
      checkTelegram();
      timeout = setTimeout(checkStatus, 15000); // Check every 15s
    };

    const handleOnline = () => {
      checkStatus();
    };

    const handleOffline = () => {
      setStatus('red');
      setTelegramStatus('INACTIVE');
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

  const colorClasses = {
    green: 'bg-teal-400 shadow-[0_0_8px_#2DD4BF]',
    yellow: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    red: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
  };

  const telegramColorClasses = {
    LOADING: 'bg-zinc-400 shadow-[0_0_8px_#9ca3af]',
    ACTIVE: 'bg-teal-400 shadow-[0_0_8px_#2DD4BF]',
    INACTIVE: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#262626] px-3 py-1.5 rounded-full">
        {telegramStatus === 'LOADING' ? (
          <RefreshCw className="w-3 h-3 text-zinc-400 animate-spin" />
        ) : (
          <div className={`w-2 h-2 rounded-full ${telegramColorClasses[telegramStatus]}`} />
        )}
        <span className="text-zinc-300 font-semibold text-xs mt-0.5">
          Telegram: {telegramStatus === 'ACTIVE' ? 'Aktif' : telegramStatus === 'LOADING' ? 'Memeriksa' : 'Tidak Aktif'}
        </span>
      </div>
      <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#262626] px-3 py-1.5 rounded-full">
        <div className={`w-2 h-2 rounded-full ${colorClasses[status]}`} />
        <span className="text-zinc-300 font-semibold text-xs mt-0.5">Sistem aktif</span>
      </div>
    </div>
  );
}
