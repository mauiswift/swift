import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export function FormField({
  label,
  error,
  helperText,
  required,
  children,
  className,
  labelClassName,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label className={cn('text-sm font-semibold text-slate-700', labelClassName)}>
          {label}
          {required && <span className="ml-1 text-red-600 font-semibold">*</span>}
        </label>
      )}

      <div className="relative">{children}</div>

      {error ? (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1">
          ⚠ {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'bordered' | 'flat';
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
}

export function Card({
  children,
  variant = 'elevated',
  className,
  padding = 'md',
  clickable,
}: CardProps) {
  const variantClasses = {
    elevated: 'bg-white border border-slate-200 shadow-md hover:shadow-lg',
    bordered: 'bg-white border-2 border-slate-200 shadow-none hover:border-slate-300',
    flat: 'bg-slate-50 border border-slate-200 shadow-none hover:bg-slate-100',
  };

  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-200',
        variantClasses[variant],
        paddingClasses[padding],
        clickable && 'cursor-pointer hover:translate-y-[-2px]',
        className
      )}
    >
      {children}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-12 px-4 text-center',
        className
      )}
    >
      {icon && <div className="text-slate-300 text-5xl">{icon}</div>}
      <div className="gap-2 flex flex-col">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 px-4',
        className
      )}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export function ErrorState({
  title = 'Error',
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 py-8 px-4 text-center',
        className
      )}
    >
      <div className="text-4xl">⚠️</div>
      <div className="gap-2 flex flex-col">
        <h3 className="text-lg font-semibold text-red-900">{title}</h3>
        <p className="text-sm text-red-700">{message}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
