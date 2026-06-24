'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Mic, MicOff, Calculator, Save, Star, Scan } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CategorySelector from './CategorySelector';
import { useOfflineQueueProcessor, addToQueue, getQueueCount } from '../../src/lib/useOfflineQueue';
import { useTemplates, TransactionTemplate } from '../hooks/useTemplates';
import { apiFetch } from '@/lib/api-client';
import dynamic from 'next/dynamic';

const ReceiptScanner = dynamic(() => import('../components/ReceiptScanner'), { ssr: false });

export default function TransactionModal({ onSaveLocal, isFAB = false }: { onSaveLocal?: (data: Record<string, unknown>) => void; isFAB?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [queueCount, setQueueCount] = useState(0);

  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [rawAmount, setRawAmount] = useState(''); // For calculator mode
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatorMode, setCalculatorMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { templates, addTemplate, deleteTemplate, getTemplatesByType } = useTemplates();

  const isFormDirty = amount !== '' || category !== '' || description !== '';

  // Process offline queue when back online
  useOfflineQueueProcessor((count) => {
    console.log(`Synced ${count} offline transactions`);
    router.refresh();
    setQueueCount(getQueueCount());
  });

  useEffect(() => {
    setQueueCount(getQueueCount());
  }, []);

  // Setup Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'id-ID';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        // Parse voice input - expects format like "150000 makan siang" or "pengeluaran 50000 transport"
        parseVoiceInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const parseVoiceInput = (transcript: string) => {
    const lower = transcript.toLowerCase();

    // Detect type from voice
    if (lower.includes('pengeluaran') || lower.includes('beli') || lower.includes('bayar')) {
      setType('EXPENSE');
    } else if (lower.includes('pemasukan') || lower.includes('terima') || lower.includes('dapat')) {
      setType('INCOME');
    }

    // Extract amount - find first number in transcript
    const amountMatch = transcript.match(/[\d.,]+/);
    if (amountMatch) {
      const numStr = amountMatch[0].replace(/[.,]/g, '');
      setRawAmount(numStr);
      setAmount(numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
    }

    // Use remaining text as description
    let desc = transcript
      .replace(/pengeluaran|pemasukan|beli|bayar|terima|dapat|rb|ribu|juta/gi, '')
      .replace(/[\d.,]+/g, '')
      .trim();
    if (desc) {
      setDescription(desc);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input tidak didukung di browser ini');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleParsedReceipt = (data: { amount: number; description: string; date?: string }) => {
    setShowScanner(false);
    const formattedAmount = data.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setAmount(formattedAmount);
    setRawAmount(data.amount.toString());
    if (data.description) {
      setDescription(data.description);
    }
    if (data.date) {
      setDate(data.date);
    }
  };

  const handleClose = () => {
    if (isFormDirty) {
      if (confirm('Anda memiliki perubahan yang belum disimpan. Yakin ingin menutup?')) {
        resetForm();
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  const resetForm = () => {
    setType('EXPENSE');
    setAmount('');
    setRawAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setCalculatorMode(false);
    setShowTemplates(false);
    setSavingTemplate(false);
    setTemplateName('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (calculatorMode) {
      // Calculator mode - allow math expressions
      setRawAmount(e.target.value);
      try {
        // Evaluate simple math expressions
        const result = evaluateExpression(e.target.value);
        setAmount(result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
      } catch {
        // Invalid expression, keep raw value
        setAmount(e.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
      }
    } else {
      // Normal mode - only numbers
      const val = e.target.value.replace(/\D/g, '');
      setRawAmount(val);
      setAmount(val.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
    }
  };

  const evaluateExpression = (expr: string): number => {
    // Remove non-math characters except operators and numbers
    const clean = expr.replace(/[^\d+\-*/().]/g, '');
    if (!clean) return 0;

    // Safe evaluation using Function constructor
    // Only allows numbers and basic operators
    const tokens = clean.match(/(\d+\.?\d*|[+\-*/()])/g);
    if (!tokens) return 0;

    let result = 0;
    let currentNum = 0;
    let operation = '+';

    for (const token of tokens) {
      if (/^\d+\.?\d*$/.test(token)) {
        currentNum = parseFloat(token);
      } else if (token === '+') {
        result += operation === '+' ? currentNum : -currentNum;
        operation = '+';
        currentNum = 0;
      } else if (token === '-') {
        result += operation === '+' ? currentNum : -currentNum;
        operation = '-';
        currentNum = 0;
      } else if (token === '*') {
        operation = '*';
      } else if (token === '/') {
        operation = '/';
      }
    }
    result += operation === '+' ? currentNum : operation === '-' ? -currentNum :
              operation === '*' ? result * currentNum : result / currentNum;

    return Math.round(result);
  };

  const applyTemplate = (template: TransactionTemplate) => {
    setType(template.type);
    if (template.amount) {
      const val = template.amount.replace(/\D/g, '');
      setRawAmount(val);
      setAmount(val.replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
    }
    setCategory(template.category);
    if (template.description) {
      setDescription(template.description);
    }
    setShowTemplates(false);
  };

  const handleSaveAsTemplate = () => {
    if (!category) {
      alert('Silakan pilih kategori terlebih dahulu');
      return;
    }
    setSavingTemplate(true);
    setTemplateName('');
  };

  const confirmSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Silakan masukkan nama template');
      return;
    }
    addTemplate(
      templateName.trim(),
      type,
      category,
      rawAmount || undefined,
      description || undefined
    );
    setSavingTemplate(false);
    setTemplateName('');
    alert('Template berhasil disimpan!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      alert('Silakan pilih kategori terlebih dahulu');
      return;
    }
    setIsSubmitting(true);

    const numericAmount = amount.replace(/\./g, '');
    const formData = new FormData();
    formData.append('type', type);
    formData.append('amount', numericAmount);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('date', date);

    const localData = {
      id: 'temp-' + Date.now().toString(),
      type,
      amount: Number(numericAmount),
      category,
      description,
      date: new Date(date).toISOString(),
      isOffline: !navigator.onLine
    };

    if (onSaveLocal) {
      onSaveLocal(localData);
    }

    try {
      if (navigator.onLine) {
        const response = await apiFetch('/api/transactions', {
          method: 'POST',
          body: formData,
        });
        if (response) {
          router.refresh();
        }
      } else {
        addToQueue({
          type,
          amount: Number(numericAmount),
          category,
          description,
          date,
        });
        setQueueCount(getQueueCount());
      }
    } catch (err) {
      console.error("Failed to add", err);
      if (!navigator.onLine) {
        addToQueue({
          type,
          amount: Number(numericAmount),
          category,
          description,
          date,
        });
        setQueueCount(getQueueCount());
      }
    } finally {
      setIsSubmitting(false);
      setIsOpen(false);
      resetForm();
    }
  };

  const handleTypeChange = (newType: 'INCOME' | 'EXPENSE') => {
    setType(newType);
    setCategory('');
  };

  const typeTemplates = getTemplatesByType(type);

  return (
    <>
      {isFAB ? (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-teal-500 hover:bg-teal-400 text-black p-4 rounded-full shadow-[0_4px_14px_0_rgba(45,212,191,0.39)] transition-transform hover:scale-105 z-40 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Transaksi
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#141414] border border-[#262626] rounded-xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-6">Catat Transaksi</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Toggle */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Jenis Transaksi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('EXPENSE')}
                      className={`py-2.5 rounded-lg font-medium text-sm transition-colors ${
                        type === 'EXPENSE'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-[#1A1A1A] text-zinc-400 border border-[#262626] hover:bg-zinc-800'
                      }`}
                    >
                      Pengeluaran
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('INCOME')}
                      className={`py-2.5 rounded-lg font-medium text-sm transition-colors ${
                        type === 'INCOME'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#1A1A1A] text-zinc-400 border border-[#262626] hover:bg-zinc-800'
                      }`}
                    >
                      Pemasukan
                    </button>
                  </div>
                </div>

                {/* Templates Section */}
                {typeTemplates.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-zinc-400">Template Cepat</label>
                      <button
                        type="button"
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        {showTemplates ? 'Sembunyikan' : 'Lihat'} ({typeTemplates.length})
                      </button>
                    </div>
                    {showTemplates && (
                      <div className="flex flex-wrap gap-2 p-2 bg-[#1A1A1A] rounded-lg border border-[#262626]">
                        {typeTemplates.map(tpl => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => applyTemplate(tpl)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#0A0A0A] hover:bg-teal-500/10 border border-[#333] hover:border-teal-500/30 rounded-lg text-xs transition-colors group"
                          >
                            <span className="text-zinc-400 group-hover:text-teal-400">{tpl.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Hapus template "${tpl.name}"?`)) {
                                  deleteTemplate(tpl.id);
                                }
                              }}
                              className="text-zinc-600 hover:text-rose-500 ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-zinc-400">Nominal (Rp)</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isListening
                            ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                            : 'bg-[#1A1A1A] text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                        title={isListening ? 'Matikan mikrofon' : 'Input suara'}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="p-1.5 bg-[#1A1A1A] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Scan struk"
                      >
                        <Scan className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCalculatorMode(!calculatorMode);
                          setRawAmount('');
                          setAmount('');
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          calculatorMode
                            ? 'bg-teal-500/20 text-teal-400'
                            : 'bg-[#1A1A1A] text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                        title={calculatorMode ? 'Mode kalkulator aktif' : 'Aktifkan kalkulator'}
                      >
                        <Calculator className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {calculatorMode && (
                    <p className="text-[10px] text-teal-400 mb-1">💡 Ketik ekspresi: 150+50-20 = 180</p>
                  )}
                  <div className="relative">
                    <input
                      ref={amountInputRef}
                      type="text"
                      value={calculatorMode ? rawAmount : amount}
                      onChange={handleAmountChange}
                      required
                      placeholder={calculatorMode ? "Contoh: 150+50" : "Contoh: 150000"}
                      inputMode={calculatorMode ? 'text' : 'numeric'}
                      className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-zinc-600"
                    />
                    {calculatorMode && amount && rawAmount !== amount && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-teal-400">
                        = {amount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category Selector */}
                <CategorySelector
                  value={category}
                  onChange={setCategory}
                  type={type}
                />

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Keterangan / Deskripsi</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Rincian tambahan..."
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-zinc-600"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full bg-[#1A1A1A] border border-[#262626] text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm [color-scheme:dark]"
                  />
                </div>

                {/* Save as Template */}
                <AnimatePresence>
                  {savingTemplate ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="Nama template..."
                          className="flex-1 bg-[#1A1A1A] border border-[#262626] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={confirmSaveTemplate}
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-lg text-sm transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSavingTemplate(false);
                            setTemplateName('');
                          }}
                          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveAsTemplate}
                      disabled={!category}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] rounded-lg text-zinc-400 hover:text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Star className="w-4 h-4" />
                      Simpan sebagai Template
                    </button>
                  )}
                </AnimatePresence>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !amount || !category}
                    className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:text-zinc-400 text-black font-bold py-2.5 rounded-lg transition-colors text-sm"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Scanner */}
      {showScanner && (
        <ReceiptScanner
          onParsed={handleParsedReceipt}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
