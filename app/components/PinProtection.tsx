'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

interface PinProtectionProps {
  children: React.ReactNode;
}

const AUTO_LOCK_KEY = 'equilibria_auto_lock_timeout';
const LAST_ACTIVITY_KEY = 'equilibria_last_activity';

export default function PinProtection({ children }: PinProtectionProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Check if PIN exists and load auto-lock settings
  useEffect(() => {
    const checkPinStatus = async () => {
      try {
        const res = await fetch('/api/pin');
        const data = await res.json();
        if (data.success) {
          setHasPin(data.hasPin || false);
        }
      } catch {
        setHasPin(false);
      }
    };

    // Load auto-lock timeout
    const savedTimeout = localStorage.getItem(AUTO_LOCK_KEY);
    if (savedTimeout) {
      setAutoLockMinutes(parseInt(savedTimeout, 10));
    }

    checkPinStatus();
  }, []);

  // If no PIN is set, allow access and skip protection
  useEffect(() => {
    if (hasPin === false) {
      setIsLocked(false);
    }
  }, [hasPin]);

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Save to sessionStorage (cleared on tab close)
    try {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch {}

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // If auto-lock is disabled (0), don't set timer
    if (autoLockMinutes === 0) return;

    // Set new idle timer
    idleTimerRef.current = setTimeout(() => {
      setIsLocked(true);
      setPinInput('');
      setError('');
    }, autoLockMinutes * 60 * 1000);
  }, [autoLockMinutes]);

  // Set up activity listeners and idle check
  useEffect(() => {
    if (isLocked || hasPin === false) return;

    // Initial timer setup
    resetIdleTimer();

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Periodic check (every 30 seconds) for more accurate timing
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const timeout = autoLockMinutes * 60 * 1000;

      if (autoLockMinutes > 0 && elapsed >= timeout) {
        setIsLocked(true);
        setPinInput('');
        setError('');
      }
    }, 30000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      clearInterval(intervalId);
    };
  }, [isLocked, hasPin, autoLockMinutes, resetIdleTimer]);

  // Listen for manual lock event
  useEffect(() => {
    const handleLock = () => {
      if (hasPin) {
        setIsLocked(true);
        setPinInput('');
        setError('');
      }
    };

    window.addEventListener('equilibria:lock', handleLock);
    return () => window.removeEventListener('equilibria:lock', handleLock);
  }, [hasPin]);

  // Listen for settings update to reload auto-lock timeout
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const savedTimeout = localStorage.getItem(AUTO_LOCK_KEY);
      if (savedTimeout) {
        setAutoLockMinutes(parseInt(savedTimeout, 10));
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  const handleVerifyPin = async () => {
    if (pinInput.length !== 6) {
      setError('PIN harus 6 digit');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Get stored hash from database
      const res = await fetch('/api/pin?verify=true');
      const data = await res.json();

      if (!data.success || !data.hasPin) {
        setIsLocked(false);
        setHasPin(false);
        return;
      }

      // Import bcrypt and verify
      const bcrypt = await import('bcryptjs');
      const storedHash = data.hash;

      const isValid = await bcrypt.compare(pinInput, storedHash);

      if (isValid) {
        setIsLocked(false);
        setPinInput('');
        setError('');
        resetIdleTimer();
      } else {
        setError('PIN salah');
        setPinInput('');
      }
    } catch (err) {
      console.error('PIN verification error:', err);
      setError('Gagal memverifikasi PIN');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerifyPin();
    }
  };

  // Loading state
  if (hasPin === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  // No PIN set - no protection needed
  if (!hasPin) {
    return <>{children}</>;
  }

  // Locked state - show PIN input
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-black border border-[#faff04] rounded-2xl">
              <span className="text-2xl font-black text-[#faff04]">E</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Equilibria</h1>
            <p className="text-sm text-zinc-400">Masukkan PIN untuk membuka aplikasi</p>
          </div>

          {/* PIN Input */}
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
            {/* PIN dots */}
            <div className="flex justify-center gap-3 mb-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all ${
                    pinInput.length > i
                      ? 'bg-teal-500 scale-110'
                      : 'bg-zinc-800 border border-zinc-700'
                  }`}
                />
              ))}
            </div>

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((key, i) => {
                if (key === '') {
                  return <div key={i} />;
                }
                if (key === 'del') {
                  return (
                    <button
                      key={i}
                      onClick={() => setPinInput(prev => prev.slice(0, -1))}
                      className="h-14 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl text-zinc-400 text-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                      </svg>
                    </button>
                  );
                }
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (pinInput.length < 6) {
                        setPinInput(prev => prev + key);
                      }
                    }}
                    className="h-14 bg-[#1A1A1A] hover:bg-zinc-700/50 border border-[#333] hover:border-zinc-600 rounded-xl text-xl font-semibold text-white transition-colors"
                  >
                    {key}
                  </button>
                );
              })}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center justify-center gap-2 text-rose-400 text-sm mb-4">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Unlock button */}
            <button
              onClick={handleVerifyPin}
              disabled={pinInput.length !== 6 || isVerifying}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Buka Kunci
                </>
              )}
            </button>
          </div>

          {/* Footer hint */}
          <p className="text-center text-xs text-zinc-600 mt-6">
            Aplikasi terkunci untuk keamanan data Anda
          </p>
        </div>
      </div>
    );
  }

  // Unlocked - render children
  return <>{children}</>;
}

// Export lock function for manual lock
export function lockApp() {
  window.dispatchEvent(new Event('equilibria:lock'));
}