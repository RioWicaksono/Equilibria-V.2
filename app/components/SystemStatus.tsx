'use client';

import { useState, useEffect } from 'react';

export default function SystemStatus() {
  const [status, setStatus] = useState<'green' | 'yellow' | 'red'>('green');

  useEffect(() => {
    let timeout: NodeJS.Timeout;
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
      
      timeout = setTimeout(checkStatus, 15000); // Check every 15s
    };

    const handleOnline = () => {
      checkStatus();
    };

    const handleOffline = () => {
      setStatus('red');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    checkStatus();

    return () => {
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

  return (
    <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#262626] px-3 py-1.5 rounded-full">
      <div className={`w-2 h-2 rounded-full ${colorClasses[status]}`} />
      <span className="text-zinc-300 font-semibold text-xs mt-0.5">Sistem aktif</span>
    </div>
  );
}
