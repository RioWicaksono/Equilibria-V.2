'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, X, Loader2, Scan, Check, AlertCircle, Info } from 'lucide-react';

interface ParsedReceipt {
  amount?: number;
  date?: string;
  merchant?: string;
  items?: string[];
  raw: string;
}

interface ReceiptScannerProps {
  onParsed: (data: { amount: number; description: string; date?: string }) => void;
  onClose?: () => void;
}

export default function ReceiptScanner({ onParsed, onClose }: ReceiptScannerProps) {
  const [step, setStep] = useState<'capture' | 'processing' | 'result'>('capture');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualAmount, setManualAmount] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [showManual, setShowManual] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch {
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setImageUrl(dataUrl);
      stopCamera();
      processImage(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageUrl(dataUrl);
      processImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (dataUrl: string) => {
    setStep('processing');
    setProgress(0);
    setError(null);

    try {
      // Dynamic import Tesseract.js
      const Tesseract = await import('tesseract.js');

      const result = await Tesseract.recognize(dataUrl, 'ind', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });

      const text = result.data.text;
      const parsed = parseReceiptText(text);
      setParsedData(parsed);
      setStep('result');
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Gagal memproses gambar. Silakan coba lagi atau masukkan manual.');
      setStep('result');
    }
  };

  const parseReceiptText = (text: string): ParsedReceipt => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let amount: number | undefined;
    let date: string | undefined;
    let merchant: string | undefined;

    // Extract amount - look for patterns like Rp 150.000, 150000, TOTAL: 150000
    const amountPatterns = [
      /(?:total| jumlah| jumlahkan| subtotal| grand total)[:\s]*[rp\. ]*([\d.,]+)/i,
      /(?:rp)[\s.]*([\d.,]+)/,
      /\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b/,
    ];

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const numStr = match[1].replace(/[.,]/g, '');
        const num = parseInt(numStr, 10);
        if (num > 1000) { // Filter out small numbers
          amount = num;
          break;
        }
      }
    }

    // Extract date - look for patterns like 15/01/2024, 2024-01-15, 15 Jan 2024
    const datePatterns = [
      /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,
      /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,
      /(\d{1,2})\s+(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)\s+(\d{2,4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const d = new Date(text.match(/\d{4}/)?.[0] ? match[0] : match[0]);
          if (!isNaN(d.getTime())) {
            date = d.toISOString().split('T')[0];
            break;
          }
        } catch {}
      }
    }

    // First non-empty line is often the merchant name
    if (lines.length > 0) {
      merchant = lines[0].substring(0, 50);
    }

    return {
      amount,
      date,
      merchant,
      raw: text,
    };
  };

  const handleApply = () => {
    const finalAmount = parsedData?.amount
      ? parsedData.amount
      : parseInt(manualAmount.replace(/\D/g, ''), 10) || 0;

    if (finalAmount <= 0) {
      setError('Silakan masukkan jumlah yang valid');
      return;
    }

    onParsed({
      amount: finalAmount,
      description: manualDescription || parsedData?.merchant || 'Dari struk',
      date: parsedData?.date,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-[#141414] border border-[#262626] rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-bold text-white">Scan Struk</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-300">
              Arahkan kamera ke struk belanja. Aplikasi akan mencoba membaca nominal dan tanggal secara otomatis.
            </p>
          </div>

          {/* Capture Step */}
          <AnimatePresence mode="wait">
            {step === 'capture' && (
              <motion.div
                key="capture"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Hidden elements for camera */}
                <video ref={videoRef} className="hidden" playsInline />
                <canvas ref={canvasRef} className="hidden" />

                {/* Camera Preview */}
                {isCameraActive ? (
                  <div className="relative aspect-[3/4] bg-black rounded-xl overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                      <Camera className="w-16 h-16" />
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button
                        onClick={stopCamera}
                        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-medium transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-black rounded-full font-bold transition-colors"
                      >
                        Ambil Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={startCamera}
                      className="flex flex-col items-center gap-2 p-4 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] rounded-xl transition-colors"
                    >
                      <Camera className="w-8 h-8 text-teal-400" />
                      <span className="text-sm text-zinc-300">Kamera</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-4 bg-[#1A1A1A] hover:bg-zinc-800 border border-[#262626] rounded-xl transition-colors"
                    >
                      <Upload className="w-8 h-8 text-teal-400" />
                      <span className="text-sm text-zinc-300">Upload File</span>
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Manual input option */}
                <button
                  onClick={() => setShowManual(true)}
                  className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Atau masukkan manual...
                </button>

                {showManual && (
                  <div className="space-y-3 p-3 bg-[#1A1A1A] rounded-xl border border-[#262626]">
                    <input
                      type="text"
                      placeholder="Nominal (Rp)"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
                      className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Deskripsi"
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    />
                    <button
                      onClick={handleApply}
                      className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-lg text-sm transition-colors"
                    >
                      Gunakan Data
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 flex flex-col items-center"
              >
                <div className="relative w-20 h-20 mb-4">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#262626"
                      strokeWidth="2"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#2dd4bf"
                      strokeWidth="2"
                      strokeDasharray={`${progress} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                  </div>
                </div>
                <p className="text-sm text-zinc-400">Memproses struk...</p>
                <p className="text-xs text-zinc-600 mt-1">{progress}%</p>
              </motion.div>
            )}

            {/* Result Step */}
            {step === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {imageUrl && (
                  <div className="aspect-[3/4] bg-black rounded-xl overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Captured receipt"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Parsed Data */}
                <div className="space-y-3">
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-300">{error}</p>
                    </div>
                  )}

                  <div className="p-3 bg-[#1A1A1A] rounded-xl border border-[#262626]">
                    <h4 className="text-sm font-medium text-zinc-400 mb-2">Data Terdeteksi:</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-zinc-500">Nominal:</span>
                        <span className="text-sm font-semibold text-white">
                          {parsedData?.amount
                            ? `Rp ${parsedData.amount.toLocaleString('id-ID')}`
                            : manualAmount
                            ? `Rp ${parseInt(manualAmount.replace(/\D/g, ''), 10).toLocaleString('id-ID')}`
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-zinc-500">Tanggal:</span>
                        <span className="text-sm text-white">
                          {parsedData?.date
                            ? new Date(parsedData.date).toLocaleDateString('id-ID')
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-zinc-500">Toko:</span>
                        <span className="text-sm text-white truncate max-w-[200px]">
                          {parsedData?.merchant || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Manual override */}
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-500">Koreksi nominal:</label>
                    <input
                      type="text"
                      placeholder="Masukkan nominal..."
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
                      className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-500">Deskripsi:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Belanja mingguan"
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setStep('capture');
                        setImageUrl(null);
                        setParsedData(null);
                        setError(null);
                      }}
                      className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      Scan Ulang
                    </button>
                    <button
                      onClick={handleApply}
                      className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-black rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Gunakan Data
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
