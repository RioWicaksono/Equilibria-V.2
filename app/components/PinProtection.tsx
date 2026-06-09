'use client';

import { useState, useEffect } from 'react';
import { Lock, Delete, Fingerprint, Smartphone, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const init = () => {
      setIsClient(true);
      setCorrectPin(getStoredPin());

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
          setShowSuccess(true);
          setTimeout(() => {
            sessionStorage.setItem('equilibria_auth', 'true');
            setIsAuthenticated(true);
            setPin('');
          }, 800);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleBiometricAuth = async () => {
    setBiometricError('');

    if (!window.PublicKeyCredential) {
      setBiometricError('Biometric not supported');
      return;
    }

    try {
      const storedCredential = localStorage.getItem('equilibria_biometric_credential');
      if (!storedCredential) {
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
        setShowSuccess(true);
        setTimeout(() => {
          sessionStorage.setItem('equilibria_auth', 'true');
          setIsAuthenticated(true);
        }, 800);
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

        setShowSuccess(true);
        setTimeout(() => {
          sessionStorage.setItem('equilibria_auth', 'true');
          setIsAuthenticated(true);
        }, 800);
      }
    } catch (err: any) {
      console.error('Biometric registration error:', err);
      setBiometricError('Registration failed');
    }
  };

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
    <div className="fixed inset-0 bg-[#0A0A0A] z-50 flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center animate-pulse-glow"
            >
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg font-semibold text-white mt-4"
            >
              Access Granted
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-xs sm:max-w-sm flex flex-col items-center px-4"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10, stiffness: 80, delay: 0.1 }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/30 flex items-center justify-center mb-3 sm:mb-4 animate-pulse-glow"
            >
              <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-teal-400" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl font-bold text-white gradient-text"
            >
              Equilibria
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-zinc-400 text-xs sm:text-sm mt-1"
            >
              Masukkan PIN untuk melanjutkan
            </motion.p>

            {/* PIN Indicators */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex gap-2 sm:gap-3 mt-4 sm:mt-6 mb-4"
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{
                    scale: i < pin.length ? [0, 1.3, 1] : 1,
                    backgroundColor: error
                      ? '#f43f5e'
                      : i < pin.length ? '#2dd4bf' : 'transparent'
                  }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 ${
                    error ? 'border-rose-500' : i < pin.length ? 'border-teal-400' : 'border-zinc-700'
                  }`}
                />
              ))}
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-rose-500 text-xs mb-2 animate-shake"
                >
                  PIN salah, coba lagi
                </motion.p>
              )}
            </AnimatePresence>

            {biometricError && (
              <p className="text-amber-500 text-xs mb-2">{biometricError}</p>
            )}

            {/* Numpad - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-[220px] sm:max-w-[260px]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <motion.button
                  key={num}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleKeyPress(num)}
                  className="btn-keypad aspect-square rounded-full bg-[#141414] border border-[#262626] hover:border-teal-500/30 text-lg sm:text-xl font-medium text-white flex items-center justify-center transition-smooth shadow-lg shadow-black/20"
                >
                  {num}
                </motion.button>
              ))}
              <div className="aspect-square" />
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => handleKeyPress(0)}
                className="btn-keypad aspect-square rounded-full bg-[#141414] border border-[#262626] hover:border-teal-500/30 text-lg sm:text-xl font-medium text-white flex items-center justify-center transition-smooth shadow-lg shadow-black/20"
              >
                0
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleDelete}
                className="btn-keypad aspect-square rounded-full bg-[#1a1a1a] border border-[#262626] hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-smooth"
              >
                <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
            </motion.div>

            {/* Biometric Button */}
            {biometricAvailable && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 sm:mt-6"
              >
                {biometricEnabled ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBiometricAuth}
                    className="flex items-center gap-2 px-4 py-2 glass-light rounded-full hover:bg-teal-500/20 transition-smooth"
                  >
                    <Smartphone className="w-4 h-4 text-teal-400" />
                    <span className="text-xs sm:text-sm font-medium text-teal-400">Biometric</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBiometricAuth}
                    className="flex items-center gap-2 px-4 py-2 glass rounded-full hover:bg-zinc-800/50 transition-smooth"
                  >
                    <Fingerprint className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs sm:text-sm font-medium text-zinc-400">Aktifkan</span>
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 sm:mt-8 flex items-center gap-2 text-zinc-600"
            >
              <Shield className="w-3 h-3" />
              <span className="text-[10px] sm:text-xs">Secure by Equilibria</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}