'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, Calendar, Check } from 'lucide-react';

type ExportType = 'transactions' | 'wallets' | 'goals' | 'debts' | 'recurring' | 'all';
type ExportFormat = 'csv' | 'xlsx' | 'json';

const exportTypes = [
  { value: 'all', label: 'Semua Data', description: 'Export semua transaksi' },
  { value: 'transactions', label: 'Transaksi', description: 'Hanya transaksi' },
  { value: 'wallets', label: 'Dompet', description: 'Saldo dan dompet' },
  { value: 'goals', label: 'Target', description: 'Goal keuangan' },
  { value: 'debts', label: 'Hutang', description: 'Hutang dan piutang' },
  { value: 'recurring', label: 'Berulang', description: 'Transaksi berulang' },
];

const formatOptions = [
  { value: 'csv', label: 'CSV', icon: FileText, description: 'Spreadsheet umum', color: 'teal' },
  { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel', color: 'green' },
  { value: 'json', label: 'JSON', icon: FileJson, description: 'Data mentah', color: 'blue' },
];

export default function SharePage() {
  const [selectedType, setSelectedType] = useState<ExportType>('transactions');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [month, setMonth] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setExported(false);

    try {
      const params = new URLSearchParams({
        format: selectedFormat,
        type: selectedType,
      });

      if (month) {
        params.set('month', month);
      }

      const response = await fetch(`/api/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `export.${selectedFormat}`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Export Data</h1>
        <p className="text-zinc-400 mt-1">
          Download laporan keuangan dalam berbagai format
        </p>
      </div>

      {/* Data Type Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300">Pilih Data</label>
        <div className="grid grid-cols-2 gap-2">
          {exportTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value as ExportType)}
              className={`
                p-4 rounded-xl border text-left transition-all duration-200
                ${selectedType === type.value
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-zinc-800 bg-[#0a0a0a]/50 hover:border-zinc-700'}
              `}
            >
              <p className={`font-medium ${selectedType === type.value ? 'text-teal-400' : 'text-white'}`}>
                {type.label}
              </p>
              <p className="text-xs text-zinc-500 mt-1">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Month Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Filter Bulan (Opsional)
        </label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full px-4 py-3 bg-[#0a0a0a] border border-zinc-800 rounded-xl text-white focus:border-teal-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300">Pilih Format</label>
        <div className="grid grid-cols-3 gap-3">
          {formatOptions.map((format) => (
            <button
              key={format.value}
              onClick={() => setSelectedFormat(format.value as ExportFormat)}
              className={`
                p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200
                ${selectedFormat === format.value
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-zinc-800 bg-[#0a0a0a]/50 hover:border-zinc-700'}
              `}
            >
              <format.icon className={`w-6 h-6 ${selectedFormat === format.value ? 'text-teal-400' : 'text-zinc-500'}`} />
              <p className={`font-medium ${selectedFormat === format.value ? 'text-teal-400' : 'text-white'}`}>
                {format.label}
              </p>
              <p className="text-xs text-zinc-500 text-center">{format.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full py-4 px-4 bg-teal-500 hover:bg-teal-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
      >
        {isExporting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Memproses...
          </>
        ) : exported ? (
          <>
            <Check className="w-5 h-5" />
            Download Siap!
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Download {selectedFormat.toUpperCase()}
          </>
        )}
      </button>

      {/* Info */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-2">Tips:</h3>
        <ul className="text-sm text-zinc-500 space-y-1">
          <li>• CSV dapat dibuka di Excel, Google Sheets, dll</li>
          <li>• Excel (.xlsx) mempertahankan format sel</li>
          <li>• JSON berguna untuk backup atau migrasi data</li>
        </ul>
      </div>
    </div>
  );
}
