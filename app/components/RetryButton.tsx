'use client';

/**
 * Retry Button Component
 *
 * Provides manual retry functionality for failed operations.
 * Used in conjunction with React Query for better UX.
 */

import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
  label?: string;
  className?: string;
}

export function RetryButton({
  onRetry,
  isRetrying = false,
  label = 'Coba lagi',
  className,
}: RetryButtonProps) {
  return (
    <button
      onClick={onRetry}
      disabled={isRetrying}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2',
        'bg-primary text-primary-foreground rounded-lg',
        'hover:bg-primary/90 transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <RefreshCw className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
      {isRetrying ? 'Memuat...' : label}
    </button>
  );
}

// ============================================
// ERROR STATE WITH RETRY
// ============================================

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Terjadi kesalahan',
  message = 'Gagal memuat data. Silakan coba lagi.',
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">{message}</p>
      {onRetry && <RetryButton onRetry={onRetry} isRetrying={isRetrying} />}
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'Tidak ada data',
  message = 'Data belum tersedia.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

// ============================================
// LOADING STATE
// ============================================

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'Memuat...',
  className,
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8', className)}>
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// ============================================
// OFFLINE STATE
// ============================================

interface OfflineStateProps {
  onRetry?: () => void;
  className?: string;
}

export function OfflineState({ onRetry, className }: OfflineStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-1">Offline</h3>
      <p className="text-muted-foreground mb-4 max-w-sm">
        Anda sedang offline. Silakan periksa koneksi internet Anda.
      </p>
      {onRetry && (
        <RetryButton onRetry={onRetry} label="Coba lagi" />
      )}
    </div>
  );
}
