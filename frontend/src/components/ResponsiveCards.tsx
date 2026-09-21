/**
 * Responsive Card & Container Components
 * Reusable responsive cards, alerts, and containers
 */

import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  hover = false,
  clickable = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm
        p-4 sm:p-5 md:p-6
        ${hover ? 'hover:shadow-md hover:border-gray-300 transition' : ''}
        ${clickable ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface ResponsiveAlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  onClose?: () => void;
  icon?: React.ReactNode;
}

export const ResponsiveAlert: React.FC<ResponsiveAlertProps> = ({
  type,
  title,
  message,
  onClose,
  icon,
}) => {
  const typeMap = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Info className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
  };

  const config = typeMap[type];

  return (
    <div
      className={`
        ${config.bg} ${config.border} ${config.text}
        rounded-lg border p-4 sm:p-5 md:p-6
      `}
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="flex-shrink-0">{icon || config.icon}</div>
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold text-sm sm:text-base mb-1">
              {title}
            </h3>
          )}
          <p className="text-xs sm:text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-lg leading-none hover:opacity-70 transition"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

interface ResponsiveBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const ResponsiveBadge: React.FC<ResponsiveBadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  className = '',
}) => {
  const variantMap = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizeMap = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

interface ResponsiveDividerProps {
  text?: string;
  className?: string;
}

export const ResponsiveDivider: React.FC<ResponsiveDividerProps> = ({
  text,
  className = '',
}) => {
  if (text) {
    return (
      <div className={`flex items-center gap-3 sm:gap-4 my-4 sm:my-6 ${className}`}>
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
          {text}
        </span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>
    );
  }

  return <div className={`h-px bg-gray-300 my-4 sm:my-6 ${className}`} />;
};

interface ResponsiveStatsProps {
  stats: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
  }>;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export const ResponsiveStats: React.FC<ResponsiveStatsProps> = ({
  stats,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
}) => {
  return (
    <div className={`grid grid-cols-${columns.xs} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} gap-4 sm:gap-6`}>
      {stats.map((stat, idx) => (
        <ResponsiveCard key={idx} hover>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                {stat.label}
              </p>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
            {stat.icon && (
              <div className="flex-shrink-0 text-blue-600">
                {stat.icon}
              </div>
            )}
          </div>
          {stat.trend && (
            <p
              className={`text-xs mt-2 font-medium ${
                stat.trend === 'up'
                  ? 'text-green-600'
                  : stat.trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {stat.trend === 'up'
                ? '↑ Increased'
                : stat.trend === 'down'
                  ? '↓ Decreased'
                  : 'Contact your Relationship Manager'}
            </p>
          )}
        </ResponsiveCard>
      ))}
    </div>
  );
};

interface ResponsiveTableProps {
  headers: string[];
  rows: Array<Record<string, React.ReactNode>>;
  compact?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  headers,
  rows,
  compact = false,
}) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className={`text-left font-semibold text-gray-900 ${
                  compact
                    ? 'px-3 py-2 text-xs sm:text-sm'
                    : 'px-4 sm:px-6 py-3 sm:py-4 text-sm md:text-base'
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              {headers.map((header) => (
                <td
                  key={`${idx}-${header}`}
                  className={`text-gray-900 ${
                    compact
                      ? 'px-3 py-2 text-xs sm:text-sm'
                      : 'px-4 sm:px-6 py-3 sm:py-4 text-sm md:text-base'
                  }`}
                >
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
