'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, CheckCircle } from 'lucide-react';

export default function SettingsClient() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdatePin = () => {
    setError('');
    setSuccess('');
    
    // Validation
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      setError('PIN baru harus 6 digit angka');
      return;
    }
    
    if (newPin !== confirmPin) {
      setError('Konfirmasi PIN tidak cocok');
      return;
    }

    // Check old pin if stored
    const stored = localStorage.getItem('equilibria_pin');
    const correctOldPin = stored ? atob(stored) : '123789';
    
    if (currentPin !== correctOldPin) {
      setError('PIN saat ini salah');
      return;
    }

    // Save new PIN
    localStorage.setItem('equilibria_pin', btoa(newPin));
    setSuccess('PIN berhasil diperbarui!');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">PIN Saat Ini</label>
          <div className="relative">
            <input 
              type={showCurrentPin ? "text" : "password"}
              maxLength={6}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 pr-10 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm font-mono tracking-widest"
              placeholder="••••••"
            />
            <button 
              type="button"
              onClick={() => setShowCurrentPin(!showCurrentPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">PIN Baru (6 Digit)</label>
          <div className="relative">
            <input 
              type={showNewPin ? "text" : "password"}
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 pr-10 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm font-mono tracking-widest"
              placeholder="••••••"
            />
            <button 
              type="button"
              onClick={() => setShowNewPin(!showNewPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Konfirmasi PIN Baru</label>
          <div className="relative">
            <input 
              type={showNewPin ? "text" : "password"}
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 pr-10 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm font-mono tracking-widest"
              placeholder="••••••"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      <div className="pt-2">
        <button 
          onClick={handleUpdatePin}
          disabled={!currentPin || !newPin || !confirmPin}
          className="w-full sm:w-auto px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          Update PIN
        </button>
      </div>
    </div>
  );
}
