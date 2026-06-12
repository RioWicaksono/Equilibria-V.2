import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-teal-400', sizeStyles[size], className)}
    />
  );
}

interface LoadingProps {
  text?: string;
  variant?: 'spinner' | 'skeleton' | 'dots';
  className?: string;
}

export function Loading({ text = 'Memuat...', variant = 'spinner', className }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      {variant === 'spinner' && (
        <>
          <Spinner size="lg" />
          <p className="text-sm text-zinc-500">{text}</p>
        </>
      )}
      {variant === 'skeleton' && (
        <div className="space-y-3 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-zinc-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
      {variant === 'dots' && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PageLoadingProps {
  title?: string;
}

export function PageLoading({ title = 'Memuat halaman...' }: PageLoadingProps) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <Spinner size="xl" className="mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">{title}</p>
      </div>
    </div>
  );
}