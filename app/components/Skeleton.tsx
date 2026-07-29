'use client';

/**
 * Skeleton Components for Loading States
 *
 * Provides consistent skeleton loading UI across the application.
 * Uses Tailwind CSS for styling.
 */

import { cn } from '@/lib/utils';

// ============================================
// BASE SKELETON
// ============================================

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      style={style}
    />
  );
}

// ============================================
// TRANSACTION SKELETONS
// ============================================

export function TransactionCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 border-b">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="text-right space-y-1">
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: count }).map((_, i) => (
        <TransactionCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================
// CARD SKELETONS
// ============================================

export function CardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-3">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// ============================================
// FORM SKELETONS
// ============================================

export function FormSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

// ============================================
// TABLE SKELETONS
// ============================================

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 p-4 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================
// CHART SKELETONS
// ============================================

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="w-full" style={{ height }} />
    </div>
  );
}

export function PieChartSkeleton() {
  return (
    <div className="flex items-center gap-6">
      <Skeleton className="h-40 w-40 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// ============================================
// PAGE SKELETONS
// ============================================

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
      <ChartSkeleton height={350} />
      <TransactionListSkeleton count={8} />
    </div>
  );
}

// ============================================
// STATS SKELETONS
// ============================================

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 border rounded-lg space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="p-4 border rounded-lg space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="p-4 border rounded-lg space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="p-4 border rounded-lg space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

// ============================================
// LIST SKELETONS
// ============================================

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================
// BUTTON SKELETON
// ============================================

export function ButtonSkeleton() {
  return <Skeleton className="h-10 w-24" />;
}

// ============================================
// PROGRESS BAR SKELETON
// ============================================

export function ProgressBarSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

// ============================================
// BADGE/CATEGORY SKELETON
// ============================================

export function BadgeSkeleton() {
  return <Skeleton className="h-6 w-20 rounded-full" />;
}
