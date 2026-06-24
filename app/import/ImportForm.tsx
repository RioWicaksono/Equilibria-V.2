'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Download, Info } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (['csv', 'json'].includes(ext || '')) {
        setFile(droppedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Format tidak didukung. Gunakan CSV atau JSON.');
      }
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (['csv', 'json'].includes(ext || '')) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Format tidak didukung. Gunakan CSV atau JSON.');
      }
    }
  }, []);

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await apiFetch<{ data?: { result?: ImportResult }; error?: { message?: string } }>('/api/import', {
        method: 'POST',
        body: formData,
      });

      if (data.error?.message) {
        setError(data.error.message);
      } else {
        setResult(data.data?.result || { success: 0, failed: 0, errors: [] });
      }
    } catch (err) {
      setError('Terjadi kesalahan saat import');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'date,type,category,amount,description\n2024-01-15,INCOME,Gaji,15000000,Monthly salary\n2024-01-16,EXPENSE,Makan,50000,Lunch';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-import.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Import Data</h1>
        <p className="text-zinc-400 mt-1">
          Import transaksi dari file CSV atau JSON
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300 space-y-1">
          <p>Format yang didukung: CSV dan JSON</p>
          <p>Kolom yang diperlukan: date, type, category, amount</p>
          <p>Type: INCOME (pemasukan) atau EXPENSE (pengeluaran)</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragging
            ? 'border-teal-500 bg-teal-500/10'
            : 'border-zinc-700 hover:border-zinc-600 bg-[#0a0a0a]/50'}
          ${file ? 'border-teal-500/50 bg-teal-500/5' : ''}
        `}
      >
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {file ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-10 h-10 text-teal-400" />
              <div className="text-left">
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-sm text-zinc-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setResult(null);
                }}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-zinc-800/50 rounded-full">
                <Upload className="w-8 h-8 text-zinc-400" />
              </div>
            </div>
            <div>
              <p className="text-white font-medium">
                Drag & drop file di sini
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                atau klik untuk pilih file
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Import Button */}
      {file && !result && (
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isImporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Mengimport...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Import Data
            </>
          )}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden">
          {/* Summary */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3 mb-3">
              {result.failed === 0 ? (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              )}
              <div>
                <p className="text-white font-medium">
                  {result.failed === 0
                    ? 'Import berhasil!'
                    : 'Import selesai dengan beberapa error'}
                </p>
                <p className="text-sm text-zinc-500">
                  {result.success} berhasil, {result.failed} gagal
                </p>
              </div>
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium text-zinc-400">Error details:</p>
              {result.errors.slice(0, 10).map((err, idx) => (
                <div
                  key={idx}
                  className="text-sm bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 text-red-300"
                >
                  <span className="text-zinc-500">Row {err.row}:</span> {err.message}
                </div>
              ))}
              {result.errors.length > 10 && (
                <p className="text-sm text-zinc-500">
                  ...dan {result.errors.length - 10} error lainnya
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="p-4 border-t border-zinc-800 flex gap-3">
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              Import Lagi
            </button>
            <button
              onClick={downloadTemplate}
              className="flex-1 py-2 px-4 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>
        </div>
      )}

      {/* Template Info */}
      {!file && !result && (
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">Format CSV Template</h3>
            <button
              onClick={downloadTemplate}
              className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <pre className="text-xs text-zinc-500 bg-zinc-900 rounded-lg p-3 overflow-x-auto">
{`date,type,category,amount,description
2024-01-15,INCOME,Gaji,15000000,Monthly salary
2024-01-16,EXPENSE,Makan,50000,Lunch`}
          </pre>
        </div>
      )}
    </div>
  );
}
