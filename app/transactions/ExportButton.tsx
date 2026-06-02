'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Laporan_Keuangan.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setToast({ message: 'Eksport berhasil!', type: 'success' });
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
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#262626] hover:bg-[#202020] text-zinc-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Eksport XLSX
      </button>

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
