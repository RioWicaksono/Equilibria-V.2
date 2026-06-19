/**
 * Date Validation Utilities
 *
 * Provides robust date parsing and validation functions
 * that are timezone-aware and culture-safe.
 */

import { z } from 'zod';

/**
 * Parse and validate a date string
 * Returns a Date object or null if invalid
 */
export function parseDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Parse date with multiple format support
 * Supported formats: ISO 8601, YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
 */
export function parseDateFlexible(value: string): Date | null {
  if (!value || typeof value !== 'string') return null;

  // Try ISO format first (most reliable)
  const isoDate = new Date(value);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try DD/MM/YYYY format
  const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }

  // Try MM/DD/YYYY format
  const mmddyyyy = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

/**
 * Check if a date is valid and not in the future (for most transaction dates)
 */
export function isValidPastDate(value: unknown): boolean {
  const date = parseDate(value);
  if (!date) return false;
  return date <= new Date();
}

/**
 * Check if a date is valid and not in the past (for deadlines, due dates)
 */
export function isValidFutureDate(value: unknown): boolean {
  const date = parseDate(value);
  if (!date) return false;
  return date >= new Date();
}

/**
 * Format date to ISO 8601 for database storage (UTC)
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Format date to YYYY-MM-DD for display
 */
export function formatDate(date: Date, locale: string = 'id-ID'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format date with time to locale string
 */
export function formatDateTime(date: Date, locale: string = 'id-ID'): string {
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get start of day (00:00:00) in local timezone
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day (23:59:59.999) in local timezone
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get start of month in local timezone
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Get end of month in local timezone
 */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date (handles month overflow correctly)
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Calculate difference in days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date2.getTime() - date1.getTime()) / oneDay);
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date): boolean {
  return date > new Date();
}

/**
 * Zod schema for date validation
 */
export const DateSchema = z.union([
  z.string().refine(val => parseDate(val) !== null, {
    message: 'Invalid date format',
  }),
  z.number().refine(val => !isNaN(new Date(val).getTime()), {
    message: 'Invalid timestamp',
  }),
  z.date(),
]);

/**
 * Zod schema for optional date
 */
export const OptionalDateSchema = z.union([
  z.string().refine(val => parseDate(val) !== null, {
    message: 'Invalid date format',
  }),
  z.number().refine(val => !isNaN(new Date(val).getTime()), {
    message: 'Invalid timestamp',
  }),
  z.date(),
  z.string().length(0), // Allow empty string
]).optional().nullable();

/**
 * Zod schema for past date validation (for transaction dates)
 */
export const PastDateSchema = z.string().refine(
  val => isValidPastDate(val),
  { message: 'Date cannot be in the future' }
);

/**
 * Zod schema for future date validation (for deadlines, due dates)
 */
export const FutureDateSchema = z.string().refine(
  val => isValidFutureDate(val),
  { message: 'Date cannot be in the past' }
);

/**
 * Zod schema for month format (YYYY-MM)
 */
export const MonthSchema = z.string().regex(
  /^\d{4}-\d{2}$/,
  'Format bulan harus YYYY-MM'
);

/**
 * Zod schema for time format (HH:mm)
 */
export const TimeSchema = z.string().regex(
  /^\d{2}:\d{2}$/,
  'Format waktu harus HH:mm'
);
