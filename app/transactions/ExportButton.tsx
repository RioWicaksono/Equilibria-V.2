'use client';

import { useState } from 'react';
import { Download, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setToast({ message: 'Memulai proses export...', type: 'success' });
    try {
      const response = await fetch(`/api/export?month=${selectedMonth}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Keuangan_${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setToast({ message: 'Eksport berhasil diunduh!', type: 'success' });
      setShowModal(false);
    } catch (error) {
      setToast({ message: 'Gagal melakukan eksport', type: 'error' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#262626] hover:bg-[#202020] text-zinc-300 rounded-lg text-sm font-medium transition-colors"
      >
        <Download className="w-4 h-4" />
        Eksport XLSX
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-sm shadow-2xl relative"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-6">Pilih Bulan Export</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Bulan & Tahun</label>
                  <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm [color-scheme:dark]"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full flex justify-center items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:text-zinc-400 text-black font-bold py-2.5 rounded-lg transition-colors text-sm"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download Data
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-sm font-medium shadow-lg z-50 ${
              toast.type === 'success' ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
