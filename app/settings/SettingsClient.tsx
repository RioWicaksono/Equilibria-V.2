'use client';

import { useState, useEffect } from 'react';
import { Send, CheckCircle, RefreshCw, HelpCircle, X, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

export default function SettingsClient() {
  const [telegramStatus, setTelegramStatus] = useState<'LOADING' | 'ACTIVE' | 'INACTIVE'>('LOADING');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testPayload, setTestPayload] = useState<any>(null);
  const [showPayload, setShowPayload] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [telegramLogs, setTelegramLogs] = useState<Array<{ message: string, status: string, timestamp: string }>>([]);

  const fetchStatus = () => {
    setTelegramStatus('LOADING');
    fetch('/api/telegram-webhook')
      .then(res => res.json())
      .then(data => {
        setTelegramStatus(data.status);
        if (data.lastSync) setLastSync(data.lastSync);
      })
      .catch(() => setTelegramStatus('INACTIVE'));
      
    fetchLogs();
  };

  const fetchLogs = () => {
    fetch('/api/telegram-webhook?logs=true')
      .then(res => res.json())
      .then(data => {
        if (data.logs) setTelegramLogs(data.logs);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStatus();
    // Refresh logs periodically (e.g. every 10 seconds)
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      {/* Existing Settings content goes here... */}

      {/* Telegram Integration Section */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" /> 
            Integrasi Telegram
            <button 
              onClick={() => setShowHelpModal(true)}
              className="ml-2 text-zinc-400 hover:text-white transition-colors p-1"
              title="Panduan Telegram"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            Status: 
            {telegramStatus === 'LOADING' ? (
              <span className="text-zinc-500 flex items-center gap-1.5"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zinc-500"></span></span> Memeriksa...</span>
            ) : telegramStatus === 'ACTIVE' ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span> Aktif</span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1.5 font-medium"><span className="relative flex h-2.5 w-2.5"><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span></span> Tidak Aktif</span>
            )}
          </div>
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Anda dapat mencatat transaksi keuangan (pemasukan atau pengeluaran) langsung melalui bot Telegram. Pastikan <strong>TELEGRAM_BOT_TOKEN</strong> diatur.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#1A1A1A] border border-zinc-800 rounded-lg p-4">
            <div>
              <h4 className="text-sm font-bold text-white">Sinkronisasi Terakhir</h4>
              <p className="text-xs text-zinc-500 mt-1">{lastSync ? new Date(lastSync).toLocaleString('id-ID') : 'Belum Pernah'}</p>
            </div>
            
            <button 
              onClick={testConnection}
              disabled={isTesting}
              className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
          </div>

          {testPayload && (
            <div className="bg-[#1A1A1A] border border-zinc-800 rounded-lg p-4 mt-4 transition-all overflow-hidden">
              <button 
                onClick={() => setShowPayload(!showPayload)} 
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Terminal className="w-4 h-4" /> Server Response Payload
                </div>
                {showPayload ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>
              
              {showPayload && (
                <div className="mt-4 bg-black/50 p-3 rounded font-mono text-xs text-emerald-400 border border-zinc-800 overflow-x-auto">
                  <pre>{JSON.stringify(testPayload, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          <div className="bg-[#1A1A1A] border border-zinc-800 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-bold text-white mb-2">Telegram Logs (Real-time)</h4>
            <p className="text-xs text-zinc-500 mb-3">10 Webhook events terakhir yang diterima oleh sistem.</p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {telegramLogs.length === 0 ? (
                <div className="text-center py-4 text-zinc-500 text-xs">Belum ada log yang tersimpan.</div>
              ) : (
                telegramLogs.map((log, idx) => (
                  <div key={idx} className="bg-black/40 border border-zinc-800/60 p-3 rounded-lg flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                    <div className="text-xs text-zinc-300 font-mono break-all line-clamp-2">
                      {log.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#262626] rounded-xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#262626]">
              <h3 className="text-lg font-bold text-white">Panduan Bot Telegram</h3>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Format Penulisan</h4>
                <p className="text-sm text-zinc-400">
                  Untuk mencatat keuangan, ketik pesan di bot dengan struktur:
                </p>
                <div className="mt-2 bg-black/50 p-3 rounded-lg font-mono text-xs text-teal-400 border border-zinc-800">
                  [Tipe] [Kategori/Deskripsi] [Nominal]
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Tipe yang Mendukung</h4>
                <div className="flex gap-2 text-xs">
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">pemasukan</span>
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">income</span>
                  <span className="bg-rose-500/10 text-rose-400 px-2 py-1 rounded border border-rose-500/20">pengeluaran</span>
                  <span className="bg-rose-500/10 text-rose-400 px-2 py-1 rounded border border-rose-500/20">expense</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Contoh Penggunaan</h4>
                <div className="space-y-3 bg-[#1A1A1A] border border-zinc-800 rounded-lg p-3">
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">Mencatat Pengeluaran Makanan:</div>
                    <div className="font-mono text-xs text-white bg-black/40 px-2 py-1.5 rounded border border-zinc-800/60">
                      pengeluaran makan siang 50000
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">Mencatat Pemasukan Gaji:</div>
                    <div className="font-mono text-xs text-white bg-black/40 px-2 py-1.5 rounded border border-zinc-800/60">
                      pemasukan gaji proyek bulanan 1500000
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 mt-3 flex items-start gap-1">
                  <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                  Sistem akan otomatis menentukan kategori berdasarkan kata kunci (cth: "makan" akan masuk kategori Food).
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#262626] bg-[#1A1A1A] rounded-b-xl flex justify-end">
              <button 
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-semibold rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
