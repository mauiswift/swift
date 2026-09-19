import React from 'react';
import { cn } from '@/lib/utils';

interface DataTableProps {
  columns: Array<{
    key: string;
    label: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
  }>;
  rows: Array<Record<string, React.ReactNode>>;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  rowClassName?: string;
  striped?: boolean;
  hoverable?: boolean;
}

export function DataTable({
  columns,
  rows,
  loading,
  empty,
  emptyMessage = 'No data available',
  className,
  rowClassName,
  striped = true,
  hoverable = true,
}: DataTableProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    );
  }

  if (empty || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-slate-200', className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  'px-4 py-3 font-semibold text-slate-900',
                  alignClasses[col.align || 'left']
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className={cn(
                'border-b border-slate-200 transition-colors',
                striped && idx % 2 === 1 && 'bg-slate-50',
                hoverable && 'hover:bg-slate-100',
                rowClassName
              )}
            >
              {columns.map((col) => (
                <td
                  key={`${idx}-${col.key}`}
                  className={cn(
                    'px-4 py-3 text-slate-600',
                    alignClasses[col.align || 'left']
                  )}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface StatGridProps {
  stats: Array<{
    label: string;
    value: React.ReactNode;
    change?: string;
    icon?: React.ReactNode;
    color?: 'blue' | 'emerald' | 'amber' | 'red';
  }>;
  columns?: number;
  className?: string;
}

export function StatGrid({ stats, columns = 4, className }: StatGridProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
  };

  return (
    <div
      className={cn(
        'grid gap-4',
        {
          'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4': columns === 4,
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': columns === 3,
          'grid-cols-1 sm:grid-cols-2': columns === 2,
        },
        className
      )}
    >
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={cn(
            'rounded-lg border p-4 transition-all hover:shadow-md',
            colorClasses[stat.color || 'blue']
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
              {stat.change && (
                <p className="mt-1 text-xs text-slate-600">{stat.change}</p>
              )}
            </div>
            {stat.icon && (
              <div className="text-slate-400 opacity-40">{stat.icon}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface TimelineProps {
  items: Array<{
    title: string;
    description?: string;
    timestamp: string;
    status?: 'completed' | 'pending' | 'failed';
    icon?: React.ReactNode;
  }>;
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  const statusColors = {
    completed: 'bg-emerald-500 ring-emerald-200',
    pending: 'bg-blue-500 ring-blue-200',
    failed: 'bg-red-500 ring-red-200',
  };

  return (
    <div className={cn('space-y-6', className)}>
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'h-10 w-10 rounded-full ring-4 flex items-center justify-center text-white',
                statusColors[item.status || 'completed']
              )}
            >
              {item.icon ? item.icon : <span className="text-xs">✓</span>}
            </div>
            {idx < items.length - 1 && (
              <div className="my-2 h-8 w-0.5 bg-slate-200" />
            )}
          </div>
          <div className="pt-1 flex-1">
            <h4 className="font-semibold text-slate-900">{item.title}</h4>
            {item.description && (
              <p className="text-sm text-slate-600 mt-1">{item.description}</p>
            )}
            <p className="text-xs text-slate-500 mt-2">{item.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  action?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  type,
  title,
  message,
  action,
  onClose,
  className,
}: AlertProps) {
  const typeClasses = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const icons = {
    success: '✓',
    error: '!',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 flex gap-4 items-start',
        typeClasses[type],
        className
      )}
    >
      <div className="flex-shrink-0 text-lg font-semibold mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <p className="text-sm opacity-90">{message}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-lg opacity-60 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
}
