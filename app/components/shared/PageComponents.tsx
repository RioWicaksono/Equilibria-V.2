'use client';

import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6', className)}>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-6 h-6 text-teal-400" />}
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
        </div>
        {description && (
          <p className="text-sm text-zinc-500 mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = 'default',
  trend,
  className,
}: StatCardProps) {
  const variantStyles = {
    default: 'text-white',
    success: 'text-emerald-400',
    danger: 'text-rose-400',
    warning: 'text-amber-400',
  };

  const iconBgStyles = {
    default: 'bg-zinc-700/50',
    success: 'bg-emerald-500/10',
    danger: 'bg-rose-500/10',
    warning: 'bg-amber-500/10',
  };

  return (
    <div className={cn('bg-[#141414] border border-[#262626] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500 font-medium uppercase flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <span className={cn('text-xl sm:text-2xl font-bold', variantStyles[variant])}>
        {value}
      </span>
    </div>
  );
}

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Grid({ children, cols = 3, gap = 'md', className }: GridProps) {
  const colStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapStyles = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={cn('grid', colStyles[cols], gapStyles[gap], className)}>
      {children}
    </div>
  );
}

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex-1 h-px bg-[#262626]" />
        <span className="text-xs text-zinc-500 font-medium">{label}</span>
        <div className="flex-1 h-px bg-[#262626]" />
      </div>
    );
  }

  return <div className={cn('h-px bg-[#262626]', className)} />;
}