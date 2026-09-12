import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'completed' | 'pending' | 'failed' | 'processing' | 'inactive';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<StatusType, {
  bg: string;
  text: string;
  dot: string;
  icon: LucideIcon;
  label: string;
}> = {
  completed: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    icon: CheckCircle,
    label: 'Completed',
  },
  pending: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    icon: Clock,
    label: 'Pending',
  },
  failed: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    icon: XCircle,
    label: 'Failed',
  },
  processing: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    icon: Loader2,
    label: 'Processing',
  },
  inactive: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    icon: AlertCircle,
    label: 'Inactive',
  },
};

export function StatusBadge({
  status,
  label,
  size = 'md',
  showDot = true,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2.5',
  };

  const dotClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };

  const iconClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const isAnimated = status === 'processing';

  return (
    <div
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.bg,
        config.text,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <div
          className={cn(
            'rounded-full',
            config.dot,
            dotClasses[size],
            isAnimated && 'animate-pulse'
          )}
        />
      )}
      {isAnimated ? (
        <Icon className={cn(iconClasses[size], 'animate-spin')} />
      ) : null}
      <span>{label || config.label}</span>
    </div>
  );
}

export function StatusDot({ status }: { status: StatusType }) {
  const config = STATUS_CONFIG[status];
  const isAnimated = status === 'processing';

  return (
    <div
      className={cn(
        'h-2.5 w-2.5 rounded-full',
        config.dot,
        isAnimated && 'animate-pulse'
      )}
    />
  );
}
