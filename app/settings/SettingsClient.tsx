'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, CheckCircle, RefreshCw, HelpCircle, X, ChevronDown, ChevronUp, Terminal, Palette, Globe, Bell, Trash2, Blocks, Settings2, Save, Download, Upload, Eye, EyeOff, Database, Zap, KeyRound, Shield, ShieldCheck, ShieldOff, Lock, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '@/lib/api-client';
import CloudBackup from '@/components/settings/CloudBackup';
import CurrencyExchange from '@/components/settings/CurrencyExchange';
import BudgetRecap from '@/components/settings/BudgetRecap';
import BiometricAuth from '@/components/settings/BiometricAuth';
import ExportEncryption from '@/components/settings/ExportEncryption';
import AuditLog from '@/components/settings/AuditLog';

type TabType = 'general' | 'integration' | 'advanced' | 'security';

interface Settings {
  theme: string;
  currency: string;
  language: string;
}

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [telegramStatus, setTelegramStatus] = useState<'LOADING' | 'ACTIVE' | 'INACTIVE'>('LOADING');
  const [isTesting, setIsTesting] = useState(false);
  const [testPayload, setTestPayload] = useState<unknown>(null);
  const [showPayload, setShowPayload] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [telegramLogs, setTelegramLogs] = useState<Array<{ message: string, status: string, timestamp: string }>>([]);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [apiHealthStatus, setApiHealthStatus] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Settings State - loaded from API
  const [currency, setCurrency] = useState('IDR');
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('id');

  // Telegram Token State
  const [telegramToken, setTelegramToken] = useState('');

  // Auto-lock timeout state
  const [autoLockTimeout, setAutoLockTimeout] = useState(5);

  // PIN Lock state
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<'enable' | 'disable'>('enable');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const timeoutOptions = [
    { value: 0, label: 'Tidak Pernah' },
    { value: 1, label: '1 menit' },
    { value: 5, label: '5 menit' },
    { value: 10, label: '10 menit' },
    { value: 15, label: '15 menit' },
    { value: 30, label: '30 menit' },
  ];

  // Load settings from API
  useEffect(() => {
    apiFetch<{ success?: boolean; settings?: Record<string, unknown> }>('/api/settings')
      .then(data => {
        if (data.success && data.settings) {
          setCurrency((data.settings as { currency?: string }).currency || 'IDR');
          setTheme((data.settings as { theme?: string }).theme || 'dark');
          setLanguage((data.settings as { language?: string }).language || 'id');
          setAutoLockTimeout((data.settings as { autoLockTimeout?: number }).autoLockTimeout ?? 5);
          setTelegramToken((data.settings as { telegramToken?: string }).telegramToken || '');
          setIsPinEnabled((data.settings as { isPinEnabled?: boolean }).isPinEnabled || false);
        }
      })
      .catch(console.error);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleSettingChange = async (key: string, value: string) => {
    if (key === 'currency') setCurrency(value);
    if (key === 'theme') {
      setTheme(value);
      if (value === 'light') {
        document.body.classList.add('light-mode');
      } else {
        document.body.classList.remove('light-mode');
      }
      window.dispatchEvent(new Event('settingsUpdated'));
    }

    // Save to API
    try {
      const data = await apiFetch<{ success?: boolean }>('/api/settings', {
        method: 'PATCH',
        body: { [key]: value },
      });
      if (!data.success) {
        showToast('Gagal menyimpan pengaturan', 'error');
      }
    } catch {
      showToast('Gagal menyimpan pengaturan', 'error');
    }
  };

  const handleSaveGeneral = async () => {
    try {
      const data = await apiFetch<{ success?: boolean }>('/api/settings', {
        method: 'PATCH',
        body: { currency, theme, language },
      });
      if (data.success) {
        showToast('Pengaturan Umum disimpan');
        window.dispatchEvent(new Event('settingsUpdated'));
      } else {
        showToast('Gagal menyimpan pengaturan', 'error');
      }
    } catch {
      showToast('Gagal menyimpan pengaturan', 'error');
    }
  };



  const handleSaveTimeout = async () => {
    try {
      const data = await apiFetch<{ success?: boolean }>('/api/settings', {
        method: 'PATCH',
        body: { autoLockTimeout },
      });
      if (data.success) {
        window.dispatchEvent(new Event('settingsUpdated'));
        showToast(`Pengaturan auto-lock disimpan (${autoLockTimeout === 0 ? 'Dinonaktifkan' : `${autoLockTimeout} menit`})`);
      } else {
        showToast('Gagal menyimpan pengaturan auto-lock', 'error');
      }
    } catch {
      showToast('Gagal menyimpan pengaturan auto-lock', 'error');
    }
  };

  // PIN Lock handlers
  const handleOpenPinSetup = () => {
    setPinMode('enable');
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    setShowPinModal(true);
  };

  const handleOpenPinDisable = () => {
    setPinMode('disable');
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    setShowPinModal(true);
  };

  const handlePinInput = (digit: string) => {
    if (pinMode === 'enable') {
      if (confirmPin === '') {
        if (newPin.length < 6) setNewPin(prev => prev + digit);
      } else {
        if (confirmPin.length < 6) setConfirmPin(prev => prev + digit);
      }
    } else {
      if (newPin.length < 6) setNewPin(prev => prev + digit);
    }
    setPinError('');
  };

  const handlePinBackspace = () => {
    if (pinMode === 'enable') {
      if (confirmPin !== '') {
        setConfirmPin(prev => prev.slice(0, -1));
      } else {
        setNewPin(prev => prev.slice(0, -1));
      }
    } else {
      setNewPin(prev => prev.slice(0, -1));
    }
    setPinError('');
  };

  const handlePinSubmit = async () => {
    if (pinMode === 'enable') {
      if (confirmPin === '') {
        if (newPin.length < 4) {
          setPinError('PIN minimal 4 digit');
          return;
        }
        setConfirmPin('confirming');
        setNewPin('');
        return;
      }

      if (newPin !== confirmPin) {
        setPinError('PIN tidak cocok');
        setNewPin('');
        setConfirmPin('');
        return;
      }

      // Generate salt and hash
      const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const encoder = new TextEncoder();
      const data = encoder.encode(newPin + salt);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      try {
        const result = await apiFetch<{ success?: boolean; error?: string }>('/api/settings/pin', {
          method: 'POST',
          body: { action: 'enable', pinHash: hash, pinSalt: salt },
        });
        if (result.success) {
          setIsPinEnabled(true);
          setShowPinModal(false);
          showToast('PIN Lock berhasil diaktifkan');
          window.dispatchEvent(new Event('settingsUpdated'));
        } else {
          setPinError(result.error || 'Gagal mengaktifkan PIN');
        }
      } catch {
        setPinError('Gagal mengaktifkan PIN');
      }
    } else {
      // Disable PIN - verify old PIN first
      try {
        const result = await apiFetch<{ success?: boolean; error?: string }>('/api/settings/pin', {
          method: 'POST',
          body: { pin: newPin },
        });
        if (result.success) {
          // PIN correct, now disable
          await apiFetch('/api/settings/pin', { method: 'DELETE' });
          setIsPinEnabled(false);
          setShowPinModal(false);
          showToast('PIN Lock dinonaktifkan');
          window.dispatchEvent(new Event('settingsUpdated'));
        } else {
          setPinError(result.error || 'PIN salah');
          setNewPin('');
        }
      } catch {
        setPinError('Gagal menonaktifkan PIN');
      }
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestPayload(null);
    try {
      const data = await apiFetch<{ bot?: string; status?: string; success?: boolean; message?: string; error?: string }>('/api/telegram-webhook?test=true');
      setTestPayload(data);

      const botStatus = data.bot || data.status;
      setTelegramStatus(botStatus === 'CONNECTED' ? 'ACTIVE' : 'INACTIVE');

      const message = data.message || data.error || 'Unknown response';
      if (data.success || botStatus === 'CONNECTED') {
        showToast('Test Connection: Success! Bot is connected.');
      } else {
        showToast('Test Connection failed: ' + message, 'error');
      }
    } catch (error) {
      const err = error as Error;
      showToast('Test Connection failed: ' + (err?.message || 'Network error'), 'error');
    }
    setIsTesting(false);
  };

  const handleClearData = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua data? Ini tidak dapat dibatalkan.')) {
      localStorage.clear();
      showToast('Data berhasil dihapus. Aplikasi akan dimuat ulang.');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleExportZip = async () => {
    const allData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('equilibria_')) {
        allData[key] = localStorage.getItem(key) || '';
      }
    }

    try {
      const JSZipModule = await import('jszip');
      const JSZip = JSZipModule.default || JSZipModule;
      const zip = new JSZip();
      zip.file('equilibria_backup.json', JSON.stringify(allData, null, 2));

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);

      const a = document.createElement('a');
      a.href = url;
      a.download = `equilibria_backup_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Backup ZIP berhasil diunduh');
    } catch {
      showToast('Gagal memproses backup ZIP', 'error');
    }
  };

  const handleImportZip = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          for (const key in data) {
            if (key.startsWith('equilibria_')) {
              localStorage.setItem(key, data[key]);
            }
          }
          showToast('Data berhasil diimpor!');
          setTimeout(() => window.location.reload(), 1500);
        } catch {
          showToast('Gagal memproses file JSON', 'error');
        }
      };
      reader.readAsText(file);
      return;
    }

    if (file.name.endsWith('.zip')) {
      try {
        const JSZipModule = await import('jszip');
        const JSZip = JSZipModule.default || JSZipModule;
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const jsonFile = loadedZip.file('equilibria_backup.json');
        if (jsonFile) {
          const content = await jsonFile.async('text');
          const data = JSON.parse(content);
          for (const key in data) {
            if (key.startsWith('equilibria_')) {
              localStorage.setItem(key, data[key]);
            }
          }
          showToast('Data berhasil diimpor!');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showToast('File backup invalid (JSON tidak ditemukan)', 'error');
        }
      } catch {
        showToast('Gagal mengekstrak ZIP', 'error');
      }
      return;
    }
  };

  const handleTestPush = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Equilibria', {
            body: 'Ini adalah uji coba notifikasi. Semuanya berfungsi dengan baik!',
            icon: '/icon.svg'
          });
          showToast('Notifikasi terkirim');
        } else {
          showToast('Izin notifikasi ditolak.', 'error');
        }
      });
    } else {
      showToast('Browser ini tidak mendukung notifikasi desktop.', 'error');
    }
  };

  const checkHealth = async () => {
    setApiHealthStatus('unknown');
    try {
      const data = await fetch('/api/health').then(r => r.json());
      const dbStatus = data.checks?.database?.status;
      const apiStatus = data.checks?.api?.status;

      if (dbStatus === 'pass' && apiStatus === 'pass') {
        setApiHealthStatus('healthy');
        setDatabaseConnected(true);
      } else {
        setApiHealthStatus('unhealthy');
        setDatabaseConnected(dbStatus === 'pass');
      }
      setLastHealthCheck(new Date().toLocaleString('id-ID'));
    } catch (error) {
      setApiHealthStatus('unhealthy');
      setDatabaseConnected(false);
      setLastHealthCheck(new Date().toLocaleString('id-ID'));
    }
  };

  useEffect(() => {
    let active = true;

    const doFetchLogs = () => {
      apiFetch<{ logs?: Array<{ message: string; status: string; timestamp: string }> }>('/api/telegram-webhook?logs=true')
        .then(data => {
          if (active && data.logs) setTelegramLogs(data.logs);
        })
        .catch(() => {});
    };

    const doFetchStatus = () => {
      setTelegramStatus('LOADING');
      apiFetch<{ bot?: string; status?: string }>('/api/telegram-webhook')
        .then(data => {
          if (!active) return;
          const botState = data.bot || 'INACTIVE';
          setTelegramStatus(botState === 'CONNECTED' ? 'ACTIVE' : 'INACTIVE');
        })
        .catch(() => {
          if (active) setTelegramStatus('INACTIVE');
        });

      doFetchLogs();
    };

    doFetchStatus();

    const interval = setInterval(doFetchLogs, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'integration') {
      checkHealth();
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full h-full items-start">
      
      {/* Sidebar Settings Navigation */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <h2 className="text-xl font-bold text-white mb-4 px-2 hidden md:block">Pengaturan</h2>
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none w-full">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap text-sm font-medium ${
              activeTab === 'general' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1A1A1A]'
            }`}
          >
            <Settings2 className="w-5 h-5" /> Umum
          </button>
          <button
            onClick={() => setActiveTab('integration')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap text-sm font-medium ${
              activeTab === 'integration' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1A1A1A]'
            }`}
          >
            <Blocks className="w-5 h-5" /> Integrasi
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap text-sm font-medium ${
              activeTab === 'advanced' ? 'bg-rose-500/10 text-rose-400' : 'text-zinc-400 hover:text-rose-400 hover:bg-[#1A1A1A]'
            }`}
          >
            <Terminal className="w-5 h-5" /> Lanjutan
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap text-sm font-medium ${
              activeTab === 'security' ? 'bg-violet-500/10 text-violet-400' : 'text-zinc-400 hover:text-violet-400 hover:bg-[#1A1A1A]'
            }`}
          >
            <Shield className="w-5 h-5" /> Keamanan
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full bg-[#141414] border border-[#262626] rounded-2xl p-6 min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-xl font-bold text-white mb-1"><Palette className="w-5 h-5 inline-block mr-2 text-teal-400" /> Preferensi Aplikasi</h3>
                <p className="text-sm text-zinc-400 mb-6">Konfigurasi dasar aplikasi Equilibria.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Mata Uang Utama</label>
                    <select value={currency} onChange={(e) => handleSettingChange('currency', e.target.value)} className="w-full bg-[#1A1A1A] border border-[#333] text-white rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-teal-500 outline-none">
                      <option value="IDR">IDR - Rupiah Indonesia</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Tema Aplikasi</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSettingChange('theme', 'dark')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-teal-500/20 border-teal-500/30 text-teal-400'
                            : 'bg-[#1A1A1A] border-[#333] text-zinc-400 hover:border-[#444]'
                        }`}
                      >
<span className="w-4 h-4 rounded-full bg-[#0A0A0A] border border-zinc-600" />
                        Dark
                      </button>
                      <button
                        onClick={() => handleSettingChange('theme', 'light')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                          theme === 'light'
                            ? 'bg-teal-500/20 border-teal-500/30 text-teal-400'
                            : 'bg-[#1A1A1A] border-[#333] text-zinc-400 hover:border-[#444]'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white border border-zinc-300" />
                        Light
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Bahasa</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                      <select value="id" disabled className="w-full bg-[#1A1A1A] border border-[#333] text-zinc-500 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none cursor-not-allowed">
                        <option value="id">Bahasa Indonesia</option>
                      </select>
                    </div>
                    <p className="text-xs text-zinc-600">Hanya Bahasa Indonesia yang tersedia</p>
                  </div>

                  {/* PIN Lock Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Kunci Aplikasi</label>
                    <div className="bg-[#1A1A1A] border border-[#262626] rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${isPinEnabled ? 'bg-emerald-500/10' : 'bg-zinc-800/50'}`}>
                            {isPinEnabled ? (
                              <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ShieldOff className="w-5 h-5 text-zinc-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">PIN Lock</p>
                            <p className="text-xs text-zinc-500">
                              {isPinEnabled ? 'Aktif - Lindungi dengan PIN' : 'Nonaktif - Semua orang bisa akses'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={isPinEnabled ? handleOpenPinDisable : handleOpenPinSetup}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            isPinEnabled
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                              : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/30'
                          }`}
                        >
                          {isPinEnabled ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </div>
                      {isPinEnabled && (
                        <div className="mt-3 pt-3 border-t border-[#262626] flex items-center gap-2 text-xs text-zinc-500">
                          <Shield className="w-3.5 h-3.5 text-emerald-400" />
                          <span>PIN tersimpan di database - aktif di semua perangkat</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 flex flex-col justify-end">
                    <button onClick={handleSaveGeneral} className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-black font-semibold rounded-lg px-3 py-2.5 text-sm transition-colors mt-6">
                      <Save className="w-4 h-4" /> Simpan Pengaturan
                    </button>
                    <button onClick={handleTestPush} className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] border border-[#333] hover:border-teal-500/50 text-white rounded-lg px-3 py-2.5 text-sm transition-colors mt-2">
                      <Bell className="w-4 h-4 text-teal-400" /> Uji Coba Push Notifikasi
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'integration' && (
            <motion.div
              key="integration"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold text-white"><Send className="w-5 h-5 inline-block mr-2 text-blue-400" /> Integrasi</h3>
                  <button
                    onClick={() => setShowHelpModal(true)}
                    className="text-zinc-400 hover:text-teal-400 transition-colors flex items-center gap-1 text-sm font-medium"
                  >
                    <HelpCircle className="w-4 h-4" /> Panduan
                  </button>
                </div>
                <p className="text-sm text-zinc-400 mb-5">Kelola koneksi database dan layanan Telegram Bot.</p>

                {/* Database Status Card - Read Only */}
                <div className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-5 mb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-teal-500/10 rounded-lg">
                        <Database className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white mb-0.5">Database PostgreSQL</h4>
                        <p className="text-xs text-zinc-500">Terhubung otomatis ke Neon PostgreSQL</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                        databaseConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {databaseConnected ? 'CONNECTED' : 'CONNECTING...'}
                      </span>
                      <button
                        onClick={checkHealth}
                        className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Refresh Status"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <p className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                      Connected to Neon PostgreSQL
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">Database dikonfigurasi secara otomatis oleh Vercel + Neon</p>
                  </div>
                </div>

                {/* Telegram Status Card */}
                <div className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-5 mb-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${telegramStatus === 'ACTIVE' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                        <Send className={`w-5 h-5 ${telegramStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-blue-400'}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white mb-0.5">Telegram Bot Integration</h4>
                        <p className="text-xs text-zinc-500">Kirim transaksi via chat bot</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                      telegramStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                      telegramStatus === 'INACTIVE' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {telegramStatus === 'LOADING' ? 'CHECKING...' : telegramStatus === 'ACTIVE' ? 'ACTIVE' : telegramStatus === 'INACTIVE' ? 'INACTIVE' : telegramStatus}
                    </span>
                  </div>

                  {/* Telegram Token Input */}
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center gap-2 text-zinc-400 text-xs font-bold mb-2 uppercase tracking-wide">
                        <KeyRound className="w-3.5 h-3.5 text-zinc-500" /> Bot API Token
                      </label>
                      {telegramStatus === 'ACTIVE' && telegramToken ? (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm text-emerald-400 font-medium">Bot Telegram Aktif</span>
                            </div>
                            <button
                              onClick={() => setShowTelegramToken(!showTelegramToken)}
                              className="text-zinc-500 hover:text-white transition-colors text-xs flex items-center gap-1"
                            >
                              {showTelegramToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {showTelegramToken ? 'Sembunyikan' : 'Lihat'}
                            </button>
                          </div>
                          <p className="text-xs text-zinc-500 mt-2 font-mono">
                            {showTelegramToken ? telegramToken : `${telegramToken?.substring(0, 10)}...${telegramToken?.substring(telegramToken!.length - 5)}`}
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type={showTelegramToken ? 'text' : 'password'}
                            value={telegramToken}
                            onChange={(e) => setTelegramToken(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-zinc-800 text-white rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-zinc-700 transition-shadow"
                            placeholder="1234567890:AAH... dari BotFather"
                          />
                          <button
                            onClick={() => setShowTelegramToken(!showTelegramToken)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                          >
                            {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                      <p className="text-[10px] text-zinc-500 mt-1.5 ml-1">Dapatkan token dari @BotFather di Telegram</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={async () => {
                          try {
                            const data = await apiFetch<{ success?: boolean }>('/api/settings', {
                              method: 'PATCH',
                              body: { telegramToken },
                            });
                            if (data.success) {
                              showToast('Token Telegram disimpan');
                              // Refresh status
                              apiFetch<{ status?: string }>('/api/telegram-webhook')
                                .then(res => setTelegramStatus((res.status === 'CONNECTED' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE' | 'LOADING'))
                                .catch(() => setTelegramStatus('INACTIVE'));
                            } else {
                              showToast('Gagal menyimpan token', 'error');
                            }
                          } catch {
                            showToast('Gagal menyimpan token', 'error');
                          }
                        }}
                        className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" /> Simpan Token
                      </button>
                      <button
                        onClick={testConnection}
                        disabled={isTesting}
                        className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                        {isTesting ? 'Menguji...' : 'Uji Koneksi'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* API Health Status */}
                <div className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-5 mb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-500/10 rounded-lg">
                        <Zap className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white mb-0.5">API Health</h4>
                        <p className="text-xs text-zinc-500">Status endpoint aplikasi</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                        apiHealthStatus === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' :
                        apiHealthStatus === 'unhealthy' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {apiHealthStatus === 'unknown' ? 'CHECKING...' : apiHealthStatus.toUpperCase()}
                      </span>
                      <button
                        onClick={checkHealth}
                        className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Refresh Health"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {lastHealthCheck && (
                    <p className="text-[10px] text-zinc-500 mt-3 pt-3 border-t border-zinc-800">
                      Last check: {lastHealthCheck}
                    </p>
                  )}
                </div>

                {testPayload !== null && testPayload !== undefined && (
                  <div className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-5 mb-5 transition-all overflow-hidden">
                    <button
                      onClick={() => setShowPayload(!showPayload)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <Terminal className="w-4 h-4" /> Payload Respon Server
                      </div>
                      {showPayload ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </button>

                    <AnimatePresence>
                      {showPayload && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mt-4 bg-black/60 p-4 rounded-lg font-mono text-xs text-emerald-400 border border-zinc-800 overflow-x-auto">
                            <pre>{JSON.stringify(testPayload, null, 2)}</pre>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Telegram Activity Logs */}
                <div className="bg-[#1A1A1A] border border-zinc-800 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-white mb-2">Aktivitas Telegram (Real-time)</h4>
                  <p className="text-xs text-zinc-500 mb-4">Merekam 10 aktivitas webhook terakhir dari bot Telegram.</p>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {telegramLogs.length === 0 ? (
                      <div className="text-center py-8 bg-black/20 rounded-xl border border-zinc-800/50 border-dashed text-zinc-500 text-xs">Belum ada aktivitas yang terekam.</div>
                    ) : (
                      telegramLogs.map((log, idx) => (
                        <div key={idx} className="bg-[#141414] border border-zinc-800/80 p-3.5 rounded-lg flex flex-col gap-2 relative overflow-hidden group">
                          <div className={`absolute top-0 left-0 w-1 h-full ${log.status === 'Success' ? 'bg-emerald-500' : log.status === 'Processing...' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                          <div className="flex items-center justify-between pl-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              log.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' :
                              log.status === 'Processing...' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-rose-500/10 text-rose-400'
                            }`}>
                              {log.status}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-300 font-mono break-all line-clamp-2 pl-2">
                            {log.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'advanced' && (
            <motion.div 
              key="advanced"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-xl font-bold text-white mb-1 text-rose-500"><Terminal className="w-5 h-5 inline-block mr-2" /> Zona Berbahaya</h3>
                <p className="text-sm text-zinc-400 mb-6">Aksi-aksi berikut dapat menyebabkan kehilangan data. Harap berhati-hati.</p>

                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Backup Seluruh Data</h4>
                    <p className="text-xs text-zinc-400 mt-1">Mengunduh semua transaksi dan pengaturan ke dalam format File ZIP.</p>
                  </div>
                  
                  <button 
                    onClick={handleExportZip}
                    className="flex shrink-0 items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-zinc-800 border border-emerald-500/50 text-emerald-400 font-bold text-sm rounded-lg transition-colors w-full sm:w-auto justify-center"
                  >
                    <Download className="w-4 h-4" /> Backup (ZIP)
                  </button>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-bold text-white">Import Data Backup</h4>
                    <p className="text-xs text-zinc-400 mt-1">Mengembalikan transaksi dan pengaturan dari file ZIP atau JSON.</p>
                  </div>
                  
                  <label className="flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm rounded-lg transition-colors w-full sm:w-auto cursor-pointer">
                    <Upload className="w-4 h-4" /> Import Data
                    <input 
                      type="file" 
                      accept=".zip,.json" 
                      onChange={handleImportZip} 
                      className="hidden" 
                    />
                  </label>
                </div>
                
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-5 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Hapus Seluruh Data</h4>
                    <p className="text-xs text-zinc-400 mt-1">Menghapus semua transaksi, cache antrian, dan pengaturan secara permanen dari perangkat ini.</p>
                  </div>
                  
                  <button 
                    onClick={handleClearData}
                    className="flex shrink-0 items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-lg transition-colors w-full sm:w-auto justify-center"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus Data
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Header */}
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  <Shield className="w-5 h-5 inline-block mr-2 text-violet-400" />
                  Keamanan & Backup
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Kelola keamanan aplikasi dan backup data Anda.
                </p>
              </div>

              {/* Biometric Auth */}
              <BiometricAuth />

              {/* PIN Lock Info */}
              <div className="p-3 bg-[#141414] border border-[#262626] rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isPinEnabled ? 'bg-emerald-500/10' : 'bg-zinc-800'}`}>
                      {isPinEnabled ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ShieldOff className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">PIN Lock</p>
                      <p className="text-[10px] text-zinc-500">
                        {isPinEnabled ? 'Aktif - Aplikasi terkunci dengan PIN' : 'Nonaktif'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={isPinEnabled ? handleOpenPinDisable : handleOpenPinSetup}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isPinEnabled
                        ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                        : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'
                    }`}
                  >
                    {isPinEnabled ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-800" />

              {/* Cloud Backup */}
              <CloudBackup />

              {/* Divider */}
              <div className="border-t border-zinc-800" />

              {/* Export Encryption */}
              <ExportEncryption />

              {/* Divider */}
              <div className="border-t border-zinc-800" />

              {/* Budget Recap */}
              <BudgetRecap />

              {/* Divider */}
              <div className="border-t border-zinc-800" />

              {/* Currency Exchange */}
              <CurrencyExchange />

              {/* Divider */}
              <div className="border-t border-zinc-800" />

              {/* Audit Log */}
              <AuditLog />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#262626] bg-[#1a1a1a]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Send className="w-5 h-5 text-blue-400" /> Panduan Bot Telegram</h3>
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Format Penulisan</h4>
                  <p className="text-sm text-zinc-400">
                    Untuk mencatat keuangan, ketik pesan di bot dengan struktur:
                  </p>
                  <div className="mt-2 bg-black/40 p-3 rounded-lg font-mono text-xs text-teal-400 border border-[#262626]">
                    [Tipe] [Kategori/Deskripsi] [Nominal]
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Tipe yang Mendukung</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 font-medium">pemasukan</span>
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 font-medium">income</span>
                    <span className="bg-rose-500/10 text-rose-400 px-2 py-1 rounded border border-rose-500/20 font-medium">pengeluaran</span>
                    <span className="bg-rose-500/10 text-rose-400 px-2 py-1 rounded border border-rose-500/20 font-medium">expense</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Contoh Penggunaan</h4>
                  <div className="space-y-3 bg-[#1A1A1A] border border-[#262626] rounded-xl p-4">
                    <div>
                      <div className="text-xs text-zinc-400 mb-1.5">Mencatat Pengeluaran Makanan:</div>
                      <div className="font-mono text-xs text-zinc-200 bg-black/60 px-3 py-2 rounded border border-[#333]">
                        pengeluaran makan siang 50000
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-400 mb-1.5">Mencatat Pemasukan Gaji:</div>
                      <div className="font-mono text-xs text-zinc-200 bg-black/60 px-3 py-2 rounded border border-[#333]">
                        pemasukan gaji bulanan 1500000
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-4 flex items-start gap-1.5 leading-relaxed bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                    Sistem akan otomatis menentukan kategori berdasarkan kata kunci (cth: &quot;makan&quot; akan masuk kategori Food).
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Setup Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => !pinError && setShowPinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-[#262626] bg-[#1a1a1a]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {pinMode === 'enable' ? (
                    <><Shield className="w-5 h-5 text-teal-400" /> Aktifkan PIN Lock</>
                  ) : (
                    <><ShieldOff className="w-5 h-5 text-rose-400" /> Nonaktifkan PIN Lock</>
                  )}
                </h3>
                <button
                  onClick={() => setShowPinModal(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {pinMode === 'enable' ? (
                  <div className="text-center">
                    <p className="text-sm text-zinc-400 mb-6">
                      {confirmPin === '' ? 'Masukkan PIN baru (4-6 digit)' : 'Konfirmasi PIN Anda'}
                    </p>

                    {/* PIN Dots */}
                    <div className="flex justify-center gap-3 mb-6">
                      {Array(6).fill(0).map((_, i) => {
                        const currentPin = confirmPin === 'confirming' ? confirmPin : (confirmPin !== '' ? confirmPin : newPin);
                        return (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-all ${
                              i < currentPin.length
                                ? 'bg-teal-400 scale-110'
                                : 'bg-zinc-800 border border-zinc-700'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                        <button
                          key={digit}
                          onClick={() => handlePinInput(digit)}
                          className="h-12 bg-[#1A1A1A] border border-[#262626] rounded-xl text-lg font-bold text-white hover:bg-[#222] active:scale-95 transition-all"
                        >
                          {digit}
                        </button>
                      ))}
                      <div />
                      <button
                        onClick={() => handlePinInput('0')}
                        className="h-12 bg-[#1A1A1A] border border-[#262626] rounded-xl text-lg font-bold text-white hover:bg-[#222] active:scale-95 transition-all"
                      >
                        0
                      </button>
                      <button
                        onClick={handlePinBackspace}
                        className="h-12 bg-[#1A1A1A] border border-[#262626] rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#222] active:scale-95 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-zinc-400 mb-6">Masukkan PIN lama untuk konfirmasi</p>

                    {/* PIN Dots */}
                    <div className="flex justify-center gap-3 mb-6">
                      {Array(6).fill(0).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full transition-all ${
                            i < newPin.length
                              ? 'bg-rose-400 scale-110'
                              : 'bg-zinc-800 border border-zinc-700'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                        <button
                          key={digit}
                          onClick={() => handlePinInput(digit)}
                          className="h-12 bg-[#1A1A1A] border border-[#262626] rounded-xl text-lg font-bold text-white hover:bg-[#222] active:scale-95 transition-all"
                        >
                          {digit}
                        </button>
                      ))}
                      <div />
                      <button
                        onClick={() => handlePinInput('0')}
                        className="h-12 bg-[#1A1A1A] border border-[#262626] rounded-xl text-lg font-bold text-white hover:bg-[#222] active:scale-95 transition-all"
                      >
                        0
                      </button>
                      <button
                        onClick={handlePinBackspace}
                        className="h-12 bg-[#1A1A1A] border border-[#262626] rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#222] active:scale-95 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {pinError && (
                  <div className="mb-4 px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm text-center">
                    {pinError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handlePinSubmit}
                  disabled={pinMode === 'enable' ? (confirmPin === '' ? newPin.length < 4 : confirmPin.length < 4) : newPin.length < 4}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    pinMode === 'enable'
                      ? 'bg-teal-500 hover:bg-teal-400 text-black'
                      : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  {pinMode === 'enable' ? (confirmPin === '' || confirmPin === 'confirming' ? 'Lanjut' : 'Aktifkan PIN') : 'Nonaktifkan PIN'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl font-medium text-sm text-white ${
              toastMessage.type === 'success' ? 'bg-teal-500 text-black' : 'bg-rose-500 text-white'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            {toastMessage.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

