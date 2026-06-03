'use client';
import { useSettings } from '../contexts/SettingsContext';

export default function FormatCurrency({ amount, className = "" }: { amount: number, className?: string }) {
  const { formatCurrency } = useSettings();
  return <span className={className}>{formatCurrency(amount)}</span>;
}
