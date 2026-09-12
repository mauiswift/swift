/**
 * Responsive Form Components
 * Touch-friendly, accessible form inputs with mobile optimization
 */

import React from 'react';

interface ResponsiveInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ResponsiveInput: React.FC<ResponsiveInputProps> = ({
  label,
  error,
  helper,
  fullWidth = true,
  size = 'medium',
  className = '',
  ...props
}) => {
  const sizeMap = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-4 py-3 text-base',
    large: 'px-4 py-4 text-lg',
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`
          w-full rounded-lg border-2 transition-colors
          ${sizeMap[size]}
          ${error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}
          focus:outline-none focus:ring-2 focus:ring-blue-200
          placeholder-gray-400 text-gray-900
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs sm:text-sm text-red-500 mt-1 sm:mt-2">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">{helper}</p>
      )}
    </div>
  );
};

interface ResponsiveSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ResponsiveSelect: React.FC<ResponsiveSelectProps> = ({
  label,
  error,
  options,
  fullWidth = true,
  size = 'medium',
  className = '',
  ...props
}) => {
  const sizeMap = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-4 py-3 text-base',
    large: 'px-4 py-4 text-lg',
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`
          w-full rounded-lg border-2 transition-colors appearance-none
          ${sizeMap[size]}
          ${error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}
          focus:outline-none focus:ring-2 focus:ring-blue-200
          text-gray-900 bg-white
          ${className}
        `}
        {...props}
      >
        <option value="">Select an option...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs sm:text-sm text-red-500 mt-1 sm:mt-2">{error}</p>
      )}
    </div>
  );
};

interface ResponsiveTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  rows?: number;
}

export const ResponsiveTextarea: React.FC<ResponsiveTextareaProps> = ({
  label,
  error,
  fullWidth = true,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`
          w-full rounded-lg border-2 transition-colors
          px-4 py-3 text-base
          ${error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}
          focus:outline-none focus:ring-2 focus:ring-blue-200
          placeholder-gray-400 text-gray-900 resize-none
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs sm:text-sm text-red-500 mt-1 sm:mt-2">{error}</p>
      )}
    </div>
  );
};

interface ResponsiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const variantMap = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400',
    secondary:
      'bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:bg-gray-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400',
    ghost:
      'bg-transparent hover:bg-gray-100 text-gray-900 disabled:bg-gray-50',
  };

  const sizeMap = {
    small: 'px-3 py-2 text-sm rounded-md min-h-[32px]',
    medium: 'px-4 py-3 text-base rounded-lg min-h-[44px]',
    large: 'px-6 py-4 text-lg rounded-lg min-h-[52px]',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${sizeMap[size]}
        ${variantMap[variant]}
        ${fullWidth ? 'w-full' : ''}
        disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

interface ResponsiveCheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const ResponsiveCheckbox: React.FC<ResponsiveCheckboxProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="flex items-start gap-2 sm:gap-3">
      <input
        type="checkbox"
        className={`
          w-5 h-5 sm:w-6 sm:h-6 rounded border-2 border-gray-300 text-blue-600
          focus:outline-none focus:ring-2 focus:ring-blue-200
          cursor-pointer accent-blue-600
          ${className}
        `}
        {...props}
      />
      {label && (
        <label className="text-sm sm:text-base text-gray-700 cursor-pointer">
          {label}
        </label>
      )}
      {error && <p className="text-xs sm:text-sm text-red-500">{error}</p>}
    </div>
  );
};

interface ResponsiveFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  layout?: 'vertical' | 'horizontal';
  gap?: 'small' | 'medium' | 'large';
}

export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  onSubmit,
  layout = 'vertical',
  gap = 'medium',
}) => {
  const gapMap = {
    small: 'gap-2 sm:gap-3',
    medium: 'gap-4 sm:gap-6',
    large: 'gap-6 sm:gap-8',
  };

  return (
    <form onSubmit={onSubmit} className={`flex flex-col ${gapMap[gap]}`}>
      {children}
    </form>
  );
};
