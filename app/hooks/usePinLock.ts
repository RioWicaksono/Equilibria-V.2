'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'equilibria_pin_session';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

interface PinSession {
  isUnlocked: boolean;
  lastActive: number;
  lockoutUntil?: number;
  failedAttempts?: number;
}

interface Settings {
  isPinEnabled: boolean;
  pinEnabled: boolean;
  autoLockTimeout: number;
  failedAttempts?: number;
  lockoutUntil?: string;
  lockoutActive?: boolean;
  [key: string]: unknown;
}

export function usePinLock() {
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Load settings and check lock status
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Single API call - /api/settings now includes PIN status
        const res = await fetch('/api/settings');
        const data = await res.json();

        if (data.success && data.settings) {
          const settings: Settings = data.settings;

          // Support both isPinEnabled and pinEnabled from API
          const pinEnabled = settings.pinEnabled ?? settings.isPinEnabled ?? false;
          setIsPinEnabled(pinEnabled);

          // Check server-side lockout first
          if (settings.lockoutActive) {
            setIsLockedOut(true);
            const remaining = settings.lockoutUntil
              ? Math.ceil((new Date(settings.lockoutUntil).getTime() - Date.now()) / 1000)
              : 0;
            setLockoutRemaining(Math.max(0, remaining));
          }

          // Set failed attempts from server
          if (settings.failedAttempts !== undefined) {
            setFailedAttempts(settings.failedAttempts);
          }

          // Check if user was unlocked in this session
          const session = localStorage.getItem(STORAGE_KEY);
          if (session) {
            const sessionData: PinSession = JSON.parse(session);
            const now = Date.now();
            const autoLockMs = (settings.autoLockTimeout || 5) * 60 * 1000;

            // If auto-lock is disabled (0), stay unlocked
            if (settings.autoLockTimeout === 0) {
              setIsLocked(false);
            } else if (now - sessionData.lastActive < autoLockMs) {
              setIsLocked(false);
            } else if (pinEnabled) {
              setIsLocked(true);
            }
          } else if (pinEnabled) {
            setIsLocked(true);
          }
        }
      } catch (error) {
        console.error('Failed to load PIN settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Update last active timestamp
  const updateLastActive = useCallback(() => {
    const session: PinSession = {
      isUnlocked: true,
      lastActive: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  // Check lockout status periodically (client-side sync)
  useEffect(() => {
    const checkLockout = () => {
      const session = localStorage.getItem(STORAGE_KEY);
      if (session) {
        const data: PinSession = JSON.parse(session);
        if (data.lockoutUntil && data.lockoutUntil > Date.now()) {
          setIsLockedOut(true);
          setLockoutRemaining(Math.ceil((data.lockoutUntil - Date.now()) / 1000));
        } else if (data.lockoutUntil) {
          // Lockout expired, clear it
          setIsLockedOut(false);
          setLockoutRemaining(0);
          const newData = { ...data, lockoutUntil: undefined, failedAttempts: 0 };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        }
      }
    };

    const interval = setInterval(checkLockout, 1000);
    checkLockout();
    return () => clearInterval(interval);
  }, []);

  // Verify PIN
  const verifyPin = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/settings/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (data.success) {
        setIsLocked(false);
        setFailedAttempts(0);
        setIsLockedOut(false);
        setLockoutRemaining(0);
        updateLastActive();
        return { success: true };
      }

      const newAttempts = (data.attempts || 0) + 1;
      setFailedAttempts(newAttempts);

      if (data.lockedOut) {
        // Server-side lockout triggered
        const lockoutUntil = Date.now() + LOCKOUT_DURATION;
        const session: PinSession = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        session.lockoutUntil = lockoutUntil;
        session.failedAttempts = newAttempts;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        setIsLockedOut(true);
        setLockoutRemaining(Math.ceil(LOCKOUT_DURATION / 1000));

        return { success: false, error: 'Terlalu banyak percobaan. Kunci akun sementara 30 menit.' };
      }

      return {
        success: false,
        error: `PIN salah. ${MAX_ATTEMPTS - newAttempts} percobaan tersisa.`,
      };
    } catch {
      return { success: false, error: 'Gagal verifikasi PIN' };
    }
  }, [updateLastActive]);

  // Enable PIN - sends plain PIN to server, server hashes with bcrypt
  const enablePin = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/settings/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable', pin }),
      });
      const data = await res.json();

      if (data.success) {
        setIsPinEnabled(true);
        updateLastActive();
        return { success: true };
      }

      return { success: false, error: data.error || 'Gagal mengaktifkan PIN' };
    } catch {
      return { success: false, error: 'Gagal mengaktifkan PIN' };
    }
  }, [updateLastActive]);

  // Disable PIN
  const disablePin = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/settings/pin', {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setIsPinEnabled(false);
        setIsLocked(false);
        setIsLockedOut(false);
        setLockoutRemaining(0);
        localStorage.removeItem(STORAGE_KEY);
        return { success: true };
      }

      return { success: false, error: 'Gagal menonaktifkan PIN' };
    } catch {
      return { success: false, error: 'Gagal menonaktifkan PIN' };
    }
  }, []);

  // Lock manually
  const lock = useCallback(() => {
    if (isPinEnabled) {
      setIsLocked(true);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isPinEnabled]);

  return {
    isPinEnabled,
    isLocked,
    isLoading,
    failedAttempts,
    isLockedOut,
    lockoutRemaining,
    verifyPin,
    enablePin,
    disablePin,
    lock,
    updateLastActive,
  };
}
