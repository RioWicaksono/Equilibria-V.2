'use client';

import { useState } from 'react';
import { Download, Loader2, FileSpreadsheet, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '@/domain/entities/Transaction';

export default function ExportButton({ transactions = [] }: { transactions?: Transaction[] }) {
  const [isExporting, setIsExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [exportType, setExportType] = useState<'xlsx' | 'csv'>('csv');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleExportXLSX = async () => {
    setIsExporting(true);
    setToast({ message: 'Memulai proses export...', type: 'success' });
    try {
      const response = await fetch(`/api/export?month=${selectedMonth}&format=xlsx`);
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

      setToast({ message: 'Export Excel berhasil diunduh!', type: 'success' });
      setShowModal(false);
    } catch {
      setToast({ message: 'Gagal melakukan export Excel', type: 'error' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      setToast({ message: 'Tidak ada data untuk di-export', type: 'error' });
      return;
    }

    setIsExporting(true);

    // Build CSV content
    const headers = ['Tanggal', 'Kategori', 'Tipe', 'Jumlah', 'Deskripsi'];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString('id-ID'),
      t.category,
      t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      t.amount.toString(),
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `Equilibria_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    setToast({ message: `Export CSV berhasil (${transactions.length} item)!`, type: 'success' });
    setIsExporting(false);
    setShowModal(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    if (exportType === 'xlsx') {
      handleExportXLSX();
    } else {
      handleExportCSV();
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] border border-[#262626] hover:bg-[#202020] text-zinc-300 rounded-lg text-xs sm:text-sm font-medium transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
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
              className="bg-[#141414] border border-[#262626] rounded-xl p-5 w-full max-w-sm shadow-2xl relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-white mb-4">Export Data</h3>

              {/* Export Type Selection */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setExportType('csv')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
                    exportType === 'csv'
                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                      : 'bg-[#1A1A1A] border-[#262626] text-zinc-400 hover:border-[#333]'
                  }`}
                >
                  <FileText className="w-6 h-6" />
                  <span className="text-xs font-medium">CSV</span>
                </button>
                <button
                  onClick={() => setExportType('xlsx')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
                    exportType === 'xlsx'
                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                      : 'bg-[#1A1A1A] border-[#262626] text-zinc-400 hover:border-[#333]'
                  }`}
                >
                  <FileSpreadsheet className="w-6 h-6" />
                  <span className="text-xs font-medium">Excel</span>
                </button>
              </div>

              {exportType === 'xlsx' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Pilih Bulan</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-teal-500 [color-scheme:dark]"
                    />
                  </div>

                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full flex justify-center items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:text-zinc-400 text-black font-bold py-2.5 rounded-lg transition-colors text-sm"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download Excel
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-500 text-center">
                    Export transaksi yang sedang ditampilkan ({transactions.length} item)
                  </p>
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full flex justify-center items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:text-zinc-400 text-black font-bold py-2.5 rounded-lg transition-colors text-sm"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download CSV
                  </button>
                </div>
              )}
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
            className={`fixed bottom-20 md:bottom-4 right-4 px-4 py-3 rounded-lg text-sm font-medium shadow-lg z-50 ${
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