'use client';

import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Skeleton } from './ui/Skeleton';

interface LazyWrapperProps {
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  onError?: (error: Error) => void;
}

/**
 * Create a lazy-loaded component with fallback
 */
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: P & LazyWrapperProps) {
    const { fallback: customFallback, errorFallback, onError, ...rest } = props;

    return (
      <Suspense fallback={customFallback || fallback || <Skeleton className="w-full h-full" />}>
        <LazyComponent {...rest} />
      </Suspense>
    );
  };
}

/**
 * Chart wrapper with lazy loading
 * Use this instead of importing recharts directly
 */
export function LazyChart(props: {
  data: Array<{ date: string; amount: number; [key: string]: unknown }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <Skeleton className="w-full h-48" />
        </div>
      }
    >
      <LazyChartComponent {...props} />
    </Suspense>
  );
}

const LazyChartComponent = withLazyLoading(
  () => import('./DashboardChart').then((m) => ({ default: m.default })),
  <div className="h-full flex items-center justify-center"><Skeleton className="w-full h-48" /></div>
);

/**
 * Receipt scanner wrapper with lazy loading
 * Tesseract.js is very heavy (~3MB), so we lazy load it
 */
export function LazyReceiptScanner(props: {
  onScanComplete?: (data: { amount?: number; category?: string; description?: string }) => void;
  onClose?: () => void;
}) {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 max-w-md w-full text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-48 bg-zinc-800 rounded-xl" />
              <div className="h-4 w-32 mx-auto bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
      }
    >
      <LazyReceiptScannerComponent {...props} />
    </Suspense>
  );
}

const LazyReceiptScannerComponent = lazy(() => import('./ReceiptScanner'));

/**
 * Pie chart for category breakdown
 */
export function LazyPieChart(props: {
  data: Array<{ name: string; value: number; fill: string }>;
  title?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="w-full h-48 rounded-lg" />
        </div>
      }
    >
      <LazyPieChartComponent {...props} />
    </Suspense>
  );
}

const LazyPieChartComponent = withLazyLoading(
  () => import('./PieChart'),
  <Skeleton className="w-full h-48" />
);

/**
 * Calendar component with lazy loading
 */
export function LazyCalendar(props: {
  selectedDate: Date | undefined;
  onDateSelect?: (date: Date) => void;
  transactions?: Array<{ date: Date; amount: number }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
          <Skeleton className="h-6 w-full mb-4" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      }
    >
      <LazyCalendarComponent {...props} />
    </Suspense>
  );
}

const LazyCalendarComponent = withLazyLoading(
  () => import('./DashboardCalendar').then((m) => ({ default: m.default })),
  <Skeleton className="w-full h-64" />
);
