'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Delete } from 'lucide-react';
import { motion } from 'framer-motion';

const STORAGE_KEYS = {
  PIN_HASH: 'equilibria_pin_hash',
  AUTH: 'equilibria_auth',
  AUTO_LOCK_TIMEOUT: 'equilibria_auto_lock_timeout',
};

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export default function PinProtection({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<'enter' | 'confirm'>('enter');
  const [storedHash, setStoredHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.PIN_HASH);
    if (!stored) {
      setIsSetup(true);
    } else {
      setStoredHash(stored);
    }
    setIsLoading(false);
  }, []);

  const handleKeyPress = useCallback((num: number) => {
    if (pin.length >= 6) return;
    const newPin = pin + num.toString();
    setPin(newPin);

    if (newPin.length === 6) {
      if (isSetup && setupStep === 'enter') {
        setSetupStep('confirm');
        setConfirmPin('');
        setTimeout(() => setPin(''), 300);
      } else if (isSetup && setupStep === 'confirm') {
        if (newPin === confirmPin) {
          const hash = simpleHash(newPin);
          localStorage.setItem(STORAGE_KEYS.PIN_HASH, hash);
          setStoredHash(hash);
          setIsSetup(false);
          setIsAuthenticated(true);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setConfirmPin('');
            setSetupStep('enter');
            setError(false);
          }, 600);
        }
      } else if (storedHash && simpleHash(newPin) === storedHash) {
        sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        setShowSuccess(true);
        setTimeout(() => setIsAuthenticated(true), 800);
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 600);
      }
    }
  }, [pin, storedHash, isSetup, setupStep, confirmPin]);

  const handleDelete = useCallback(() => {
    setPin(p => p.slice(0, -1));
    setError(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center max-w-sm mx-auto px-4">
          <Lock className="w-12 h-12 text-teal-400 mx-auto mb-8" />
          <h2 className="text-white text-xl font-semibold mb-6">
            {isSetup ? 'Setup PIN Baru' : 'Masukkan PIN'}
          </h2>
          <div className="flex gap-3 justify-center mb-8">
            <div className="flex gap-2">
              {(isSetup ? pin : '*'.repeat(pin.length)).split('').map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${error ? 'bg-rose-500' : 'bg-teal-500'}`}
                />
              ))}
            </div>
          </div>
          {error && (
            <p className="text-rose-500 text-sm mb-4">PIN salah</p>
          )}
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {[1,2,3,4,5,6,7,8,9,'DEL',0,''].map((n, i) => (
              <button
                key={i}
                onClick={() => n === 'DEL' ? handleDelete() : n !== '' && handleKeyPress(Number(n))}
                className="p-4 rounded-xl bg-zinc-800 text-white text-2xl font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                {n === 'DEL' ? <Delete className="w-6 h-6 mx-auto" /> : n}
              </button>
            ))}
          </div>
          {isSetup && (
            <p className="text-zinc-500 text-sm mt-4">Masukkan 6 digit PIN</p>
          )}
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full gradient-to-br from-teal-400 to-teal-600"
        />
      </div>
    );
  }

  return <>{children}</>;
}
