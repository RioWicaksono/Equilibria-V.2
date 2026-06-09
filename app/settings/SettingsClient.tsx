'use client';

import { useState, useEffect } from 'react';
import { Send, CheckCircle, RefreshCw, HelpCircle, X, ChevronDown, ChevronUp, Terminal, Lock, KeyRound, Palette, Globe, Bell, Trash2, Shield, Blocks, Settings2, Save, Download, Upload, Eye, EyeOff, Database, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'general' | 'security' | 'integration' | 'advanced';

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [telegramStatus, setTelegramStatus] = useState<'LOADING' | 'ACTIVE' | 'INACTIVE'>('LOADING');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testPayload, setTestPayload] = useState<any>(null);
  const [showPayload, setShowPayload] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [telegramLogs, setTelegramLogs] = useState<Array<{ message: string, status: string, timestamp: string }>>([]);

  // Show/Hide password fields
  const [showTelegramToken, setShowTelegramToken] = useState(false);

  // Integration status states
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [apiHealthStatus, setApiHealthStatus] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);

  // Mock Settings State
  const [currency, setCurrency] = useState('IDR');
  const [telegramToken, setTelegramToken] = useState('');
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    // Load general settings
    const c = localStorage.getItem('equilibria_currency');
    if (c) setCurrency(c);
    setTelegramToken(localStorage.getItem('equilibria_telegram_token') || '');
  }, []);

  const handleSettingChange = (key: string, value: string) => {
    if (key === 'currency') setCurrency(value);
  };

  const handleSaveGeneral = () => {
    localStorage.setItem('equilibria_currency', currency);
    window.dispatchEvent(new Event('settingsUpdated'));
    showToast(`Pengaturan Umum disimpan`);
  };

  const showToast = (message: string) => {
    setToastMessage({ message, type: 'success' });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // PIN State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Auto-lock timeout state
  const [autoLockTimeout, setAutoLockTimeout] = useState(5);
  const [showTimeoutDropdown, setShowTimeoutDropdown] = useState(false);

  const timeoutOptions = [
    { value: 0, label: 'Tidak Pernah' },
    { value: 1, label: '1 menit' },
    { value: 5, label: '5 menit' },
    { value: 10, label: '10 menit' },
    { value: 15, label: '15 menit' },
    { value: 30, label: '30 menit' },
  ];

  useEffect(() => {
    // Load auto-lock timeout
    const timeout = localStorage.getItem('equilibria_auto_lock_timeout');
    if (timeout) setAutoLockTimeout(parseInt(timeout));
  }, []);

  useEffect(() => {
    let active = true;

    const doFetchLogs = () => {
      fetch('/api/telegram-webhook?logs=true')
        .then(res => res.json())
        .then(data => {
          if (active && data.logs) setTelegramLogs(data.logs);
        })
        .catch(() => {});
    };

    const doFetchStatus = () => {
      setTelegramStatus('LOADING');
      fetch('/api/telegram-webhook')
        .then(res => res.json())
        .then(data => {
          if (!active) return;
          setTelegramStatus(data.status);
          if (data.lastSync) setLastSync(data.lastSync);
        })
        .catch(() => {
          if (active) setTelegramStatus('INACTIVE');
        });
        
      doFetchLogs();
    };

    doFetchStatus();
    
    // Refresh logs periodically
    const interval = setInterval(doFetchLogs, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleSavePin = () => {
    setPinError('');
    setPinSuccess('');

    const stored = localStorage.getItem('equilibria_pin');

    // First time setting PIN - no need for current PIN
    if (!stored) {
      if (newPin.length !== 6) {
        setPinError('PIN baru harus 6 digit');
        return;
      }

      if (newPin !== confirmPin) {
        setPinError('Konfirmasi PIN tidak cocok');
        return;
      }

      localStorage.setItem('equilibria_pin', btoa(newPin));
      setPinSuccess('PIN berhasil dibuat');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setIsChangingPin(false);

      setTimeout(() => {
        setPinSuccess('');
      }, 3000);
      return;
    }

    // Changing existing PIN - require current PIN
    const actualPin = atob(stored);

    if (currentPin !== actualPin) {
      setPinError('PIN saat ini salah');
      return;
    }

    if (newPin.length !== 6) {
      setPinError('PIN baru harus 6 digit');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('Konfirmasi PIN tidak cocok');
      return;
    }

    localStorage.setItem('equilibria_pin', btoa(newPin));
    setPinSuccess('PIN berhasil diperbarui');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setIsChangingPin(false);

    setTimeout(() => {
      setPinSuccess('');
    }, 3000);
  };

  const handleSaveTimeout = () => {
    localStorage.setItem('equilibria_auto_lock_timeout', autoLockTimeout.toString());
    window.dispatchEvent(new Event('settingsUpdated'));
    showToast(`Pengaturan auto-lock disimpan (${autoLockTimeout === 0 ? 'Dinonaktifkan' : `${autoLockTimeout} menit`})`);
    setShowTimeoutDropdown(false);
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestPayload(null);
    try {
      const res = await fetch('/api/telegram-webhook?test=true');
      const data = await res.json();
      setTelegramStatus(data.status);
      if (data.lastSync) setLastSync(data.lastSync);
      setTestPayload(data);
      if (data.status === 'ACTIVE') {
        alert('Test Connection: ' + data.message);
      } else {
        alert('Test Connection failed: ' + data.message);
      }
    } catch (e) {
      alert('Test Connection failed');
    }
    setIsTesting(false);
  };

  const handleClearData = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua data? Ini tidak dapat dibatalkan.')) {
      localStorage.clear();
      alert('Data berhasil dihapus. Aplikasi akan dimuat ulang.');
      window.location.reload();
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
    } catch (err) {
      showToast('Gagal memproses backup ZIP');
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
        } catch (err) {
          showToast('Gagal memproses file JSON');
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
          showToast('File backup invalid (JSON tidak ditemukan)');
        }
      } catch (error) {
        showToast('Gagal mengekstrak ZIP');
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
          showToast('Izin notifikasi ditolak.');
        }
      });
    } else {
      showToast('Browser ini tidak mendukung notifikasi desktop.');
    }
  };

  // Check API and Database health
  const checkHealth = async () => {
    setApiHealthStatus('unknown');
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.status === 'ok' || data.health === 'ok') {
        setApiHealthStatus('healthy');
        setDatabaseConnected(true);
      } else {
        setApiHealthStatus('unhealthy');
        setDatabaseConnected(false);
      }
      setLastHealthCheck(new Date().toLocaleString('id-ID'));
    } catch {
      setApiHealthStatus('unhealthy');
      setDatabaseConnected(false);
      setLastHealthCheck(new Date().toLocaleString('id-ID'));
    }
  };

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
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap text-sm font-medium ${
              activeTab === 'security' ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1A1A1A]'
            }`}
          >
            <Shield className="w-5 h-5" /> Keamanan
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
                    <label className="text-sm font-medium text-zinc-300">Bahasa</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                      <select value="id" disabled className="w-full bg-[#1A1A1A] border border-[#333] text-zinc-500 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none cursor-not-allowed">
                        <option value="id">Bahasa Indonesia</option>
                      </select>
                    </div>
                    <p className="text-xs text-zinc-600">Hanya Bahasa Indonesia yang tersedia</p>
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

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-xl font-bold text-white mb-1"><Lock className="w-5 h-5 inline-block mr-2 text-teal-400" /> Keamanan & PIN</h3>
                <p className="text-sm text-zinc-400 mb-6">Atur PIN perlindungan dan auto-lock untuk keamanan aplikasi.</p>

                {/* Auto-Lock Timeout Setting */}
                <div className="bg-[#1A1A1A] border border-[#262626] rounded-xl p-5 w-full max-w-md mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">Auto-Lock Timeout</p>
                      <p className="text-xs text-zinc-400 mt-1">Aplikasi akan terkunci otomatis setelah waktu tertentu tidak aktif.</p>
                    </div>
                  </div>
                  <div className="mt-4 relative">
                    <div className="relative">
                      <select
                        value={autoLockTimeout}
                        onChange={(e) => setAutoLockTimeout(parseInt(e.target.value))}
                        className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 cursor-pointer"
                      >
                        {timeoutOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleSaveTimeout}
                      className="w-full mt-3 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Simpan Auto-Lock
                    </button>
                  </div>
                </div>

                {/* PIN Change Section */}
                <div className="bg-[#1A1A1A] border border-[#262626] rounded-xl p-5 w-full max-w-md">
                  {!isChangingPin ? (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <p className="text-sm text-white font-medium">Ubah PIN Aplikasi</p>
                        <p className="text-xs text-zinc-500 mt-1">PIN digunakan untuk membuka aplikasi dan mengakses data.</p>
                      </div>
                      <button
                        onClick={() => setIsChangingPin(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#252525] hover:bg-zinc-700 border border-[#333] text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto justify-center"
                      >
                        <KeyRound className="w-4 h-4" /> Ubah PIN
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {!localStorage.getItem('equilibria_pin') ? (
                        <p className="text-xs text-teal-400/70 bg-teal-500/5 border border-teal-500/20 rounded-lg p-3">
                          Anda belum memiliki PIN. Buat PIN 6 digit untuk mengamankan aplikasi.
                        </p>
                      ) : (
                        <div>
                          <label className="block tracking-wide text-zinc-400 text-xs font-medium mb-2">MASUKKAN PIN SAAT INI</label>
                          <input
                            type="password"
                            maxLength={6}
                            value={currentPin}
                            onChange={(e) => setCurrentPin(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            placeholder="Masukkan PIN saat ini"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block tracking-wide text-zinc-400 text-xs font-medium mb-2">PIN BARU (6 DIGIT)</label>
                        <input
                          type="password"
                          maxLength={6}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                          placeholder="******"
                        />
                      </div>

                      <div>
                        <label className="block tracking-wide text-zinc-400 text-xs font-medium mb-2">KONFIRMASI PIN BARU</label>
                        <input
                          type="password"
                          maxLength={6}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                          placeholder="******"
                        />
                      </div>

                      {pinError && <p className="text-rose-500 text-xs font-medium">{pinError}</p>}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSavePin}
                          className="flex-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-black text-sm font-semibold rounded-lg transition-colors"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => {
                            setIsChangingPin(false);
                            setPinError('');
                            setCurrentPin('');
                            setNewPin('');
                            setConfirmPin('');
                          }}
                          className="px-4 py-2.5 bg-[#141414] hover:bg-zinc-800 border border-[#333] text-zinc-300 text-sm font-semibold rounded-lg transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                  {pinSuccess && (
                    <p className="text-emerald-400 text-sm font-medium flex items-center gap-1.5 mt-4">
                      <CheckCircle className="w-4 h-4" /> {pinSuccess}
                    </p>
                  )}
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
                      Host: ep-dawn-bonus-aomgzs1d (Neon PostgreSQL)
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
                      {telegramStatus === 'ACTIVE' && localStorage.getItem('equilibria_telegram_token') ? (
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
                            {showTelegramToken ? localStorage.getItem('equilibria_telegram_token') : `${localStorage.getItem('equilibria_telegram_token')?.substring(0, 10)}...${localStorage.getItem('equilibria_telegram_token')?.substring(localStorage.getItem('equilibria_telegram_token')!.length - 5)}`}
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
                        onClick={() => {
                          localStorage.setItem('equilibria_telegram_token', telegramToken);
                          showToast('Token Telegram disimpan');
                          // Refresh status
                          fetch('/api/telegram-webhook')
                            .then(res => res.json())
                            .then(data => setTelegramStatus(data.status))
                            .catch(() => setTelegramStatus('INACTIVE'));
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

                {testPayload && (
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

