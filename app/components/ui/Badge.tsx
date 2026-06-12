import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-zinc-700/50 text-zinc-300',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  outline: 'bg-transparent text-zinc-400 border border-zinc-700',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'danger' && 'bg-rose-400',
            variant === 'info' && 'bg-blue-400',
            variant === 'default' && 'bg-zinc-400',
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  );
}

// Special badges for status
export function StatusBadge({ status }: { status: 'connected' | 'disconnected' | 'loading' | 'error' | 'pending' }) {
  const config: Record<string, { variant: BadgeVariant; label: string; dot: boolean; pulse?: boolean }> = {
    connected: { variant: 'success', label: 'CONNECTED', dot: true },
    disconnected: { variant: 'danger', label: 'DISCONNECTED', dot: true },
    loading: { variant: 'warning', label: 'LOADING', dot: true, pulse: true },
    error: { variant: 'danger', label: 'ERROR', dot: true },
    pending: { variant: 'info', label: 'PENDING', dot: true },
  };

  const { variant, label, dot, pulse } = config[status];
  return (
    <Badge variant={variant} size="sm" dot={dot} pulse={pulse}>
      {label}
    </Badge>
  );
}

// Transaction type badges
export function TransactionBadge({ type }: { type: 'INCOME' | 'EXPENSE' }) {
  return (
    <Badge variant={type === 'INCOME' ? 'success' : 'danger'} size="sm">
      {type === 'INCOME' ? '+Pemasukan' : '-Pengeluaran'}
    </Badge>
  );
}