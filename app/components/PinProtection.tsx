'use client';

import { useState, useEffect } from 'react';
import { Lock, Delete } from 'lucide-react';
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

  useEffect(() => {
    const init = () => {
      setIsClient(true);
      setCorrectPin(getStoredPin());
      const auth = sessionStorage.getItem('equilibria_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('equilibria_auth');
      }, 5 * 60 * 1000); // 5 minutes locker
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
    setPin(pin.slice(0, -1));
    setError(false);
  };

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
        <div className="flex gap-4 mb-12">
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

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
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
          <div /> {/* Empty space */}
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
            <span className="sr-only">Hapus</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
