'use client';

/**
 * Suspense Boundary Components
 *
 * Provides route-level loading states using React Suspense.
 * Includes skeleton fallbacks and error handling.
 */

import { Suspense, type ReactNode } from 'react';
import { Skeleton } from './Skeleton';
import { ErrorState } from './RetryButton';

interface SuspenseBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// ============================================
// BASIC SUSPENSE BOUNDARY
// ============================================

export function SuspenseBoundary({
  children,
  fallback = <DefaultSkeletonFallback />,
  errorFallback,
  onError,
}: SuspenseBoundaryProps) {
  return (
    <ErrorBoundaryWrapper fallback={errorFallback} onError={onError}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundaryWrapper>
  );
}

// ============================================
// ERROR BOUNDARY WRAPPER
// ============================================

import { Component, ReactElement } from 'react';
import Link from 'next/link';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryWrapper extends Component<ErrorBoundaryWrapperProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryWrapperProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactElement {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Terjadi Kesalahan</h2>
          <p className="text-muted-foreground mb-4">
            Gagal memuat konten. Silakan refresh halaman.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Refresh
            </button>
            <Link
              href="/"
              className="px-4 py-2 border rounded-lg hover:bg-muted"
            >
              Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

// ============================================
// DEFAULT SKELETON FALLBACKS
// ============================================

function DefaultSkeletonFallback() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

// ============================================
// PAGE LEVEL SUSPENSE
// ============================================

interface PageSuspenseProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function PageLoadingState({ title, description }: PageSuspenseProps) {
  return (
    <div className="space-y-6">
      {(title || description) && (
        <div className="space-y-2">
          {title && <Skeleton className="h-8 w-48" />}
          {description && <Skeleton className="h-4 w-64" />}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 border rounded-lg space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// LIST SUSPENSE
// ============================================

interface ListSuspenseProps {
  count?: number;
}

export function ListLoadingState({ count = 5 }: ListSuspenseProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-5 w-20 ml-auto" />
            <Skeleton className="h-3 w-14 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// CARD SUSPENSE
// ============================================

interface CardSuspenseProps {
  count?: number;
}

export function CardGridLoadingState({ count = 6 }: CardSuspenseProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg space-y-4">
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// CHART SUSPENSE
// ============================================

export function ChartLoadingState() {
  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex items-end justify-around h-64 gap-2">
        {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 45, 90].map((height, i) => (
          <Skeleton key={i} className="w-8" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// FORM SUSPENSE
// ============================================

export function FormLoadingState() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
