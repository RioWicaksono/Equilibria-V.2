'use client';

import { useState, useEffect } from 'react';
import { Lock, Delete, Fingerprint, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

const getStoredPin = () => {
  if (typeof window === 'undefined') return '123789';
  const stored = localStorage.getItem('equilibria_pin');
  if (stored) {
    try {
      return atob(stored);
    } catch {
      return '123789';
    }
  }
  return '123789';
};

export default function PinProtection({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [correctPin, setCorrectPin] = useState('123789');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricError, setBiometricError] = useState('');

  useEffect(() => {
    const init = () => {
      setIsClient(true);
      setCorrectPin(getStoredPin());

      // Check biometric availability
      if (window.PublicKeyCredential) {
        const storedBiometric = localStorage.getItem('equilibria_biometric_enabled');
        setBiometricEnabled(storedBiometric === 'true');
        setBiometricAvailable(true);
      }

      const auth = sessionStorage.getItem('equilibria_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load auto-lock timeout
    const timeoutMinutes = parseInt(localStorage.getItem('equilibria_auto_lock_timeout') || '5');

    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('equilibria_auth');
      }, timeoutMinutes * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [isAuthenticated]);

  const handleKeyPress = (num: number) => {
    if (pin.length < 6) {
      setError(false);
      const newPin = pin + num.toString();
      setPin(newPin);

      if (newPin.length === 6) {
        if (newPin === correctPin) {
          setTimeout(() => {
            sessionStorage.setItem('equilibria_auth', 'true');
            setIsAuthenticated(true);
            setPin('');
          }, 300);
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  // Biometric Authentication
  const handleBiometricAuth = async () => {
    setBiometricError('');

    if (!window.PublicKeyCredential) {
      setBiometricError('Biometric not supported');
      return;
    }

    try {
      const storedCredential = localStorage.getItem('equilibria_biometric_credential');
      if (!storedCredential) {
        // Register biometric first time
        await registerBiometric();
        return;
      }

      const credential = JSON.parse(storedCredential);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array([1, 2, 3, 4, 5, 6]),
          allowCredentials: [{
            id: new Uint8Array(credential.rawId),
            type: 'public-key'
          }],
          userVerification: 'required'
        }
      });

      if (assertion) {
        sessionStorage.setItem('equilibria_auth', 'true');
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      console.error('Biometric error:', err);
      if (err.name === 'NotAllowedError') {
        setBiometricError('Authentication cancelled');
      } else {
        setBiometricError('Authentication failed');
      }
    }
  };

  const registerBiometric = async () => {
    setBiometricError('');

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array([1, 2, 3, 4, 5, 6]),
          rp: { name: 'Equilibria Finance', id: window.location.hostname },
          user: {
            id: new Uint8Array([1, 2, 3, 4]),
            name: 'Equilibria User',
            displayName: 'Equilibria User'
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          }
        }
      }) as PublicKeyCredential;

      if (credential) {
        const credentialData = {
          rawId: Array.from(new Uint8Array(credential.rawId)),
          id: credential.id,
          type: credential.type
        };

        localStorage.setItem('equilibria_biometric_credential', JSON.stringify(credentialData));
        localStorage.setItem('equilibria_biometric_enabled', 'true');
        setBiometricEnabled(true);

        // Auto login after registration
        sessionStorage.setItem('equilibria_auth', 'true');
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      console.error('Biometric registration error:', err);
      setBiometricError('Registration failed');
    }
  };

  // Keyboard support
  useEffect(() => {
    if (isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, pin, error, correctPin]);

  if (!isClient) return null;

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] z-50 flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
      <div className="max-w-md w-full flex flex-col items-center">
        {/* Logo / Icon */}
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-8">
          <Lock className="w-8 h-8 text-teal-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Akses Terkunci</h1>
        <p className="text-zinc-400 text-sm mb-8 text-center">
          Masukkan 6 digit PIN untuk masuk ke Equilibria
        </p>

        {/* PIN Indicators */}
        <div className="flex gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-4 h-4 rounded-full border-2 ${
                error ? 'border-rose-500 bg-rose-500' :
                i < pin.length ? 'border-teal-400 bg-teal-400' : 'border-zinc-700 bg-transparent'
              }`}
              animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>

        {error && (
          <p className="text-rose-500 text-sm mb-4">PIN salah, coba lagi</p>
        )}

        {biometricError && (
          <p className="text-amber-500 text-xs mb-4">{biometricError}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px] mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <motion.button
              whileTap={{ scale: 0.85, backgroundColor: 'rgba(45, 212, 191, 0.2)' }}
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#262626] hover:bg-[#202020] text-xl font-medium text-white flex items-center justify-center transition-colors"
            >
              {num}
            </motion.button>
          ))}
          <div />
          <motion.button
            whileTap={{ scale: 0.85, backgroundColor: 'rgba(45, 212, 191, 0.2)' }}
            onClick={() => handleKeyPress(0)}
            className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#262626] hover:bg-[#202020] text-xl font-medium text-white flex items-center justify-center transition-colors"
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85, backgroundColor: 'rgba(244, 63, 94, 0.2)', color: 'rgba(244, 63, 94, 1)' }}
            onClick={handleDelete}
            className="w-16 h-16 rounded-full text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <Delete className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Biometric Button */}
        {biometricAvailable && (
          <div className="mt-4">
            {biometricEnabled ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleBiometricAuth}
                className="flex items-center gap-2 px-6 py-3 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-full hover:bg-teal-500/20 transition-colors"
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-sm font-medium">Gunakan Face ID / Fingerprint</span>
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleBiometricAuth}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-full hover:bg-zinc-700 transition-colors"
              >
                <Fingerprint className="w-5 h-5" />
                <span className="text-sm font-medium">Aktifkan Biometric Login</span>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
