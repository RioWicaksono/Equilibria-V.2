'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, X, AlertTriangle, Loader2 } from 'lucide-react';
import { usePinLock } from '../hooks/usePinLock';

interface PinLockOverlayProps {
  onUnlock: () => void;
}

export default function PinLockOverlay({ onUnlock }: PinLockOverlayProps) {
  const {
    isPinEnabled,
    isLocked,
    isLoading,
    failedAttempts,
    isLockedOut,
    lockoutRemaining,
    verifyPin,
    enablePin,
    disablePin,
  } = usePinLock();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mode, setMode] = useState<'verify' | 'setup' | 'disable'>('verify');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Format lockout time
  const formatLockout = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle PIN input
  const handlePinInput = useCallback((digit: string) => {
    if (mode === 'setup') {
      if (pin.length < 6) {
        const newPin = pin + digit;
        setPin(newPin);
        setError('');
      }
    } else if (mode === 'verify') {
      if (pin.length < 6) {
        const newPin = pin + digit;
        setPin(newPin);
        setError('');

        // Auto-submit when 6 digits entered
        if (newPin.length === 6) {
          handleVerify(newPin);
        }
      }
    }
  }, [mode, pin]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setPin('');
    setConfirmPin('');
    setError('');
  }, []);

  // Verify PIN
  const handleVerify = async (pinToVerify: string) => {
    setIsSubmitting(true);
    setError('');

    const result = await verifyPin(pinToVerify);

    if (result.success) {
      setPin('');
      onUnlock();
    } else {
      setError(result.error || 'PIN salah');
      setPin('');
    }

    setIsSubmitting(false);
  };

  // Handle setup new PIN
  const handleSetupPin = async () => {
    if (pin.length < 4) {
      setError('PIN minimal 4 digit');
      return;
    }

    if (confirmPin === '') {
      setConfirmPin('pending');
      setPin('');
      return;
    }

    if (pin !== confirmPin) {
      setError('PIN tidak cocok');
      setPin('');
      setConfirmPin('');
      return;
    }

    setIsSubmitting(true);
    const result = await enablePin(pin);

    if (result.success) {
      onUnlock();
    } else {
      setError(result.error || 'Gagal setup PIN');
    }

    setIsSubmitting(false);
  };

  // Handle disable PIN
  const handleDisablePin = async () => {
    setIsSubmitting(true);
    const result = await disablePin();

    if (result.success) {
      setMode('verify');
    } else {
      setError(result.error || 'Gagal disable PIN');
    }

    setIsSubmitting(false);
  };

  // Show loading
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  // Not enabled - no lock needed
  if (!isPinEnabled) {
    return null;
  }

  // Not locked - no overlay needed
  if (!isLocked) {
    return null;
  }

  const dots = Array(6).fill(0);
  const inputLength = mode === 'setup' && confirmPin === 'pending' ? confirmPin.length : pin.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col items-center justify-center p-6"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === 'verify' && 'Masukkan PIN'}
            {mode === 'setup' && confirmPin === 'pending' && 'Konfirmasi PIN'}
            {mode === 'setup' && confirmPin === '' && 'Buat PIN Baru'}
            {mode === 'disable' && 'Nonaktifkan PIN'}
          </h1>
          <p className="text-sm text-zinc-400">
            {mode === 'verify' && 'Masukkan PIN untuk membuka aplikasi'}
            {mode === 'setup' && confirmPin === 'pending' && 'Masukkan kembali PIN Anda'}
            {mode === 'setup' && confirmPin === '' && 'PIN akan disimpan di database (cross-device)'}
            {mode === 'disable' && 'Konfirmasi PIN lama untuk menonaktifkan'}
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex gap-3 mb-8">
          {dots.map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                i < inputLength
                  ? 'bg-teal-400 scale-110'
                  : 'bg-zinc-800 border border-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-sm"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Lockout Message */}
        {isLockedOut && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-400 text-sm"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Terlalu banyak percobaan. Coba lagi dalam{' '}
              <span className="font-mono font-bold">{formatLockout(lockoutRemaining)}</span>
            </span>
          </motion.div>
        )}

        {/* Loading Spinner */}
        {isSubmitting && (
          <div className="mb-6">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          </div>
        )}

        {/* Keypad */}
        {!isLockedOut && !isSubmitting && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
              <button
                key={digit}
                onClick={() => handlePinInput(digit)}
                className="w-16 h-16 bg-[#1A1A1A] border border-[#262626] rounded-2xl text-2xl font-bold text-white hover:bg-[#222] active:scale-95 transition-all"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={() => setShowPin(!showPin)}
              className="w-16 h-16 bg-[#1A1A1A] border border-[#262626] rounded-2xl flex items-center justify-center text-zinc-400 hover:bg-[#222] active:scale-95 transition-all"
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <button
              onClick={() => handlePinInput('0')}
              className="w-16 h-16 bg-[#1A1A1A] border border-[#262626] rounded-2xl text-2xl font-bold text-white hover:bg-[#222] active:scale-95 transition-all"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="w-16 h-16 bg-[#1A1A1A] border border-[#262626] rounded-2xl flex items-center justify-center text-zinc-400 hover:bg-[#222] active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* PIN Display (when visible) */}
        {showPin && pin && (
          <div className="mb-6 px-4 py-2 bg-zinc-900 rounded-lg font-mono text-lg text-teal-400 tracking-widest">
            {pin}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          {mode === 'setup' && confirmPin === 'pending' && (
            <button
              onClick={handleSetupPin}
              disabled={pin.length < 4}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-semibold rounded-xl transition-colors"
            >
              Konfirmasi PIN
            </button>
          )}

          {mode === 'setup' && confirmPin === '' && (
            <button
              onClick={handleSetupPin}
              disabled={pin.length < 4}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-semibold rounded-xl transition-colors"
            >
              Lanjut
            </button>
          )}

          {mode === 'disable' && (
            <>
              <button
                onClick={handleDisablePin}
                disabled={pin.length < 4}
                className="w-full py-3 bg-rose-500 hover:bg-rose-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold rounded-xl transition-colors"
              >
                Nonaktifkan PIN
              </button>
              <button
                onClick={() => { setMode('verify'); handleClear(); }}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
              >
                Batal
              </button>
            </>
          )}

          {mode === 'verify' && (
            <button
              onClick={() => setMode('disable')}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Lupa PIN?
            </button>
          )}
        </div>

        {/* Failed Attempts Warning */}
        {failedAttempts > 0 && mode === 'verify' && (
          <p className="mt-4 text-xs text-zinc-500">
            {5 - failedAttempts} percobaan tersisa
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
