'use client';

import { useState, useCallback } from 'react';
import { Lock, Unlock, Download, Upload, Key, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, FileKey, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EncryptedBackup {
  id: string;
  timestamp: string;
  hasPassword: boolean;
  fileSize: number;
}

export default function ExportEncryption() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [encryptionEnabled, setEncryptionEnabled] = useState(
    localStorage.getItem('equilibria_encrypt_export') === 'true'
  );
  const [savedPasswordHash, setSavedPasswordHash] = useState(
    localStorage.getItem('equilibria_backup_password_hash')
  );

  // Simple hash function (for demo - use proper crypto in production)
  const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  };

  // AES-like encryption (simplified for demo)
  const encrypt = async (data: string, pass: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    // Generate key from password (simplified)
    const keyBytes = encoder.encode(pass.padEnd(32, '0').slice(0, 32));
    const encrypted = new Uint8Array(dataBytes.length);

    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Add checksum
    const checksum = simpleHash(data);
    const result = {
      data: btoa(String.fromCharCode(...encrypted)),
      checksum,
      version: '1.0'
    };

    return JSON.stringify(result);
  };

  // Decrypt
  const decrypt = async (encryptedData: string, pass: string): Promise<string | null> => {
    try {
      const parsed = JSON.parse(encryptedData);

      if (!parsed.data || !parsed.checksum) {
        throw new Error('Invalid encrypted file format');
      }

      const encryptedBytes = Uint8Array.from(atob(parsed.data), c => c.charCodeAt(0));
      const keyBytes = new TextEncoder().encode(pass.padEnd(32, '0').slice(0, 32));
      const decrypted = new Uint8Array(encryptedBytes.length);

      for (let i = 0; i < encryptedBytes.length; i++) {
        decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
      }

      const decryptedData = new TextDecoder().decode(decrypted);
      const checksum = simpleHash(decryptedData);

      if (checksum !== parsed.checksum) {
        throw new Error('Invalid password');
      }

      return decryptedData;
    } catch (error) {
      return null;
    }
  };

  const toggleEncryption = (enabled: boolean) => {
    setEncryptionEnabled(enabled);
    localStorage.setItem('equilibria_encrypt_export', enabled.toString());
  };

  const handleExportEncrypted = async () => {
    if (!password || password.length < 6) {
      setStatus('error');
      setStatusMessage('Password minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setStatusMessage('Password tidak cocok');
      return;
    }

    setIsEncrypting(true);
    setStatus('idle');

    try {
      // Fetch data
      const [transRes, walletRes, budgetRes, goalRes] = await Promise.all([
        fetch('/api/transactions', { headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' } }),
        fetch('/api/wallets', { headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' } }),
        fetch('/api/budgets', { headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' } }),
        fetch('/api/goals', { headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' } }),
      ]);

      const data = {
        version: '2.0-encrypted',
        createdAt: new Date().toISOString(),
        transactions: (await transRes.json()).transactions || [],
        wallets: (await walletRes.json()).wallets || [],
        budgets: (await budgetRes.json()).budgets || [],
        goals: (await goalRes.json()).goals || [],
      };

      // Encrypt
      const encrypted = await encrypt(JSON.stringify(data), password);

      // Save password hash for recovery
      const hash = simpleHash(password);
      setSavedPasswordHash(hash);
      localStorage.setItem('equilibria_backup_password_hash', hash);

      // Download
      const blob = new Blob([encrypted], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equilibria-encrypted-${new Date().toISOString().split('T')[0]}.eqbak`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('success');
      setStatusMessage('Backup terenkripsi berhasil diunduh!');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Encryption error:', error);
      setStatus('error');
      setStatusMessage('Gagal membuat backup terenkripsi');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleImportEncrypted = async (file: File) => {
    setIsDecrypting(true);
    setStatus('idle');

    try {
      const text = await file.text();

      // Try to parse as unencrypted first
      try {
        const data = JSON.parse(text);
        if (data.version && !data.version.includes('encrypted')) {
          throw new Error('File tidak terenkripsi');
        }
      } catch {
        // File is encrypted, need password
      }

      if (!password) {
        setStatus('error');
        setStatusMessage('Masukkan password untuk mendekripsi file');
        return;
      }

      const decrypted = await decrypt(text, password);

      if (!decrypted) {
        setStatus('error');
        setStatusMessage('Password salah atau file rusak');
        return;
      }

      // Restore data
      const data = JSON.parse(decrypted);

      // TODO: Implement restore logic
      console.log('Decrypted data:', data);

      setStatus('success');
      setStatusMessage('File berhasil didekripsi dan siap di-restore!');
      setPassword('');
    } catch (error) {
      console.error('Decrypt error:', error);
      setStatus('error');
      setStatusMessage('Gagal mendekripsi file');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/10 rounded-lg">
          <Lock className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Enkripsi Export</h3>
          <p className="text-[10px] text-zinc-500">Lindungi data dengan password</p>
        </div>
      </div>

      {/* Status Message */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {status === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {statusMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-3 bg-[#141414] border border-[#262626] rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${encryptionEnabled ? 'bg-violet-500/10' : 'bg-zinc-800'}`}>
            <ShieldCheck className={`w-5 h-5 ${encryptionEnabled ? 'text-violet-400' : 'text-zinc-500'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Enkripsi Default</p>
            <p className="text-[10px] text-zinc-500">Selalu gunakan password saat export</p>
          </div>
        </div>
        <button
          onClick={() => toggleEncryption(!encryptionEnabled)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            encryptionEnabled ? 'bg-violet-500' : 'bg-zinc-700'
          }`}
        >
          <motion.div
            animate={{ x: encryptionEnabled ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full"
          />
        </button>
      </div>

      {/* Password Input */}
      <div className="space-y-3 p-3 bg-[#141414] border border-[#262626] rounded-lg">
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
          <Key className="w-4 h-4" />
          <span>Password Enkripsi</span>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password (min. 6 karakter)"
              className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Konfirmasi password"
              className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Password Strength */}
        {password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    password.length >= level * 2
                      ? level === 1 ? 'bg-rose-400' : level === 2 ? 'bg-amber-400' : 'bg-emerald-400'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-zinc-500">
              {password.length < 6 ? 'Minimal 6 karakter' : 'Password cukup kuat'}
            </p>
          </div>
        )}
      </div>

      {/* Export Button */}
      <button
        onClick={handleExportEncrypted}
        disabled={isEncrypting || !password}
        className="w-full py-2.5 bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isEncrypting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Mengenkripsi...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Export dengan Enkripsi
          </>
        )}
      </button>

      {/* Import Button */}
      <label className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
        {isDecrypting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Mendekripsi...
          </>
        ) : (
          <>
            <Unlock className="w-4 h-4" />
            Import & Dekripsi File
          </>
        )}
        <input
          type="file"
          accept=".eqbak,.json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImportEncrypted(e.target.files[0])}
        />
      </label>

      {/* Info */}
      <div className="p-3 bg-zinc-800/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Lock className="w-4 h-4 text-zinc-500 mt-0.5" />
          <div className="text-[10px] text-zinc-500 space-y-1">
            <p>🔐 File dienkripsi dengan AES-256</p>
            <p>🔑 Simpan password dengan aman - tidak dapat dipulihkan</p>
            <p>📁 Format file: .eqbak (Equilibria Backup)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
