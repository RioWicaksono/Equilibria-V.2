'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useSettings } from '@/contexts/SettingsContext';

interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface CurrencyRate {
  code: string;
  symbol: string;
  name: string;
  rate: number;
  change24h: number;
  flag: string;
}

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
];

export default function CurrencyExchange() {
  const { formatCurrency } = useSettings();
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch from free API
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/IDR`,
        { cache: 'no-store' }
      );

      if (!response.ok) throw new Error('Failed to fetch rates');

      const data: ExchangeRates = await response.json();

      // Calculate rates from IDR perspective
      const currencyRates: CurrencyRate[] = currencies
        .filter(c => c.code !== 'IDR')
        .map(currency => {
          const rate = data.rates[currency.code] || 1;
          // Convert: 1 IDR = X foreign currency
          const idrToForeign = 1 / rate;
          // Random 24h change for demo (in real app, store previous rates)
          const change24h = (Math.random() - 0.5) * 2;

          return {
            ...currency,
            rate: idrToForeign,
            change24h
          };
        });

      setRates(currencyRates);
      setLastUpdated(new Date());

      // Cache in localStorage
      localStorage.setItem('equilibria_exchange_rates', JSON.stringify({
        rates: currencyRates,
        timestamp: Date.now()
      }));
    } catch (err) {
      // Try to load from cache
      const cached = localStorage.getItem('equilibria_exchange_rates');
      if (cached) {
        const { rates: cachedRates, timestamp } = JSON.parse(cached);
        setRates(cachedRates);
        setLastUpdated(new Date(timestamp));
        setError('Menggunakan data tersimpan');
      } else {
        setError('Tidak dapat mengambil data kurs');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cached rates on mount
  useEffect(() => {
    const cached = localStorage.getItem('equilibria_exchange_rates');
    if (cached) {
      const { rates: cachedRates, timestamp } = JSON.parse(cached);
      // Use cache if less than 1 hour old
      if (Date.now() - timestamp < 3600000) {
        setRates(cachedRates);
        setLastUpdated(new Date(timestamp));
        setIsLoading(false);
        return;
      }
    }
    fetchRates();
  }, [fetchRates]);

  const convertCurrency = (amount: number, fromRate: number, toRate: number) => {
    return (amount / fromRate) * toRate;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Kurs Mata Uang</h3>
            <p className="text-[10px] text-zinc-500">
              {lastUpdated
                ? `Update: ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                : 'Kurs terhadap IDR'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchRates}
          disabled={isLoading}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 bg-amber-500/10 rounded-lg text-xs text-amber-400">
          {error}
        </div>
      )}

      {/* Rates List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {isLoading && rates.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          </div>
        ) : rates.map(currency => (
          <motion.div
            key={currency.code}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{currency.flag}</span>
              <div>
                <p className="text-sm font-medium text-white">{currency.code}</p>
                <p className="text-[10px] text-zinc-500">{currency.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                {currency.rate.toFixed(4)}
              </p>
              <div className={`flex items-center gap-1 text-[10px] ${
                currency.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {currency.change24h >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {currency.change24h >= 0 ? '+' : ''}{currency.change24h.toFixed(2)}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Converter */}
      <div className="p-3 bg-[#141414] border border-[#262626] rounded-xl">
        <p className="text-[10px] text-zinc-500 uppercase font-medium mb-2">Konverter Cepat</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <p className="text-zinc-500">1 USD =</p>
            <p className="text-lg font-bold text-teal-400">
              {rates.find(r => r.code === 'USD')?.rate.toFixed(2) || '...'} IDR
            </p>
          </div>
          <div className="text-center">
            <p className="text-zinc-500">1 IDR =</p>
            <p className="text-lg font-bold text-amber-400">
              {rates.find(r => r.code === 'USD') ? (1 / rates.find(r => r.code === 'USD')!.rate).toFixed(4) : '...'} USD
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
