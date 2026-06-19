/**
 * Amount Validation Utilities
 *
 * Provides robust amount parsing and validation functions
 * for currency values (IDR, USD, etc.)
 */

import { z } from 'zod';

/**
 * Maximum amount limits
 */
export const AMOUNT_LIMITS = {
  MIN: 0,
  MAX: 999999999999999, // ~1 quadrillion (safe for 64-bit)
  MAX_IDR: 999999999999999,
} as const;

/**
 * Parse amount from various input formats
 * Handles: strings with/without formatting, numbers, etc.
 */
export function parseAmount(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    // Remove currency symbols, spaces, and thousand separators
    const cleaned = value
      .replace(/[Rp\s.,]/g, '')
      .replace(/,/g, '.');

    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

/**
 * Validate and parse amount with constraints
 */
export function validateAmount(
  value: unknown,
  options?: {
    min?: number;
    max?: number;
    allowZero?: boolean;
    allowNegative?: boolean;
  }
): { valid: boolean; amount: number | null; error?: string } {
  const amount = parseAmount(value);

  if (amount === null) {
    return { valid: false, amount: null, error: 'Format jumlah tidak valid' };
  }

  const {
    min = AMOUNT_LIMITS.MIN,
    max = AMOUNT_LIMITS.MAX,
    allowZero = false,
    allowNegative = false,
  } = options || {};

  if (!allowNegative && amount < 0) {
    return { valid: false, amount: null, error: 'Jumlah tidak boleh negatif' };
  }

  if (!allowZero && amount === 0) {
    return { valid: false, amount: null, error: 'Jumlah harus lebih dari 0' };
  }

  if (amount < min) {
    return { valid: false, amount: null, error: `Jumlah minimal ${min}` };
  }

  if (amount > max) {
    return { valid: false, amount: null, error: `Jumlah maksimal ${max.toLocaleString('id-ID')}` };
  }

  return { valid: true, amount };
}

/**
 * Format amount for display (IDR)
 */
export function formatAmount(
  amount: number,
  options?: {
    currency?: 'IDR' | 'USD' | 'EUR';
    showSign?: boolean;
    compact?: boolean;
  }
): string {
  const { currency = 'IDR', showSign = false, compact = false } = options || {};

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  });

  const formatted = formatter.format(Math.abs(amount));

  if (showSign) {
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  return amount < 0 ? `-${formatted}` : formatted;
}

/**
 * Format amount as plain number with thousand separators
 */
export function formatAmountPlain(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Zod schema for positive amount
 */
export const PositiveAmountSchema = z.number()
  .positive('Jumlah harus lebih dari 0')
  .max(AMOUNT_LIMITS.MAX, 'Jumlah terlalu besar')
  .finite('Jumlah tidak valid');

/**
 * Zod schema for non-negative amount (includes zero)
 */
export const NonNegativeAmountSchema = z.number()
  .min(0, 'Jumlah tidak boleh negatif')
  .max(AMOUNT_LIMITS.MAX, 'Jumlah terlalu besar')
  .finite('Jumlah tidak valid');

/**
 * Zod schema for any valid amount
 */
export const AmountSchema = z.number()
  .max(AMOUNT_LIMITS.MAX, 'Jumlah terlalu besar')
  .finite('Jumlah tidak valid');

/**
 * Zod schema for string amount input (e.g., "100000" or "Rp 100.000")
 */
export const StringAmountSchema = z.string()
  .min(1, 'Jumlah wajib diisi')
  .transform(val => parseAmount(val))
  .refine(val => val !== null && val > 0, {
    message: 'Jumlah harus lebih dari 0',
  })
  .transform(val => val!);

/**
 * Zod schema for optional string amount
 */
export const OptionalStringAmountSchema = z.string()
  .optional()
  .transform(val => val ? parseAmount(val) : null)
  .refine(val => val === null || (Number.isFinite(val) && val >= 0), {
    message: 'Format jumlah tidak valid',
  });

/**
 * Create a form amount field schema with common validations
 */
export function createAmountFieldSchema(options?: {
  required?: boolean;
  min?: number;
  max?: number;
  allowZero?: boolean;
}) {
  const { required = true, min = 0, max = AMOUNT_LIMITS.MAX, allowZero = false } = options || {};

  const baseSchema = z.union([
    z.number()
      .min(min, `Minimal ${min}`)
      .max(max, `Maksimal ${max.toLocaleString('id-ID')}`),
    z.string()
      .min(1, required ? 'Jumlah wajib diisi' : undefined)
      .transform(parseAmount)
      .refine(val => val !== null, { message: 'Format jumlah tidak valid' })
      .transform(val => val!)
  ]);

  if (required) {
    return baseSchema.refine(val => val > 0 || allowZero, {
      message: allowZero ? 'Jumlah tidak valid' : 'Jumlah harus lebih dari 0',
    });
  }

  return baseSchema.optional();
}

/**
 * Currency codes supported
 */
export const SUPPORTED_CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

/**
 * Zod schema for currency
 */
export const CurrencySchema = z.enum(SUPPORTED_CURRENCIES);

/**
 * Parse currency string to enum value
 */
export function parseCurrency(value: unknown): SupportedCurrency | null {
  if (typeof value === 'string' && SUPPORTED_CURRENCIES.includes(value as SupportedCurrency)) {
    return value as SupportedCurrency;
  }
  return null;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
  const symbols: Record<SupportedCurrency, string> = {
    IDR: 'Rp',
    USD: '$',
    EUR: '€',
    SGD: 'S$',
    MYR: 'RM',
    JPY: '¥',
  };
  return symbols[currency] || 'Rp';
}

/**
 * Convert amount between currencies (simplified rates for display)
 */
export function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency
): number {
  // Simplified exchange rates (in production, use live API)
  const rates: Record<string, number> = {
    'IDR-USD': 0.000063,
    'IDR-EUR': 0.000058,
    'IDR-SGD': 0.000085,
    'IDR-MYR': 0.00028,
    'IDR-JPY': 0.0095,
    'USD-IDR': 15800,
    'EUR-IDR': 17200,
    'SGD-IDR': 11800,
    'MYR-IDR': 3600,
    'JPY-IDR': 105,
  };

  if (from === to) return amount;

  const key = `${from}-${to}`;
  const rate = rates[key];

  if (!rate) {
    console.warn(`[Currency] No rate for ${key}, returning original amount`);
    return amount;
  }

  return Math.round(amount * rate);
}
