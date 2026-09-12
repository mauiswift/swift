/**
 * Unified Design System - Spacing, Colors, Typography, Shadows
 */

// ═══════════════════════════════════════════════════════════════════
// SPACING SCALE (standardized to 3 tiers: sm, md, lg)
// ═══════════════════════════════════════════════════════════════════
export const SPACING = {
  // Padding tiers
  padding: {
    sm: 'p-3', // 0.75rem
    md: 'p-4', // 1rem
    lg: 'p-6', // 1.5rem
  },
  paddingX: {
    sm: 'px-3',
    md: 'px-4',
    lg: 'px-6',
  },
  paddingY: {
    sm: 'py-3',
    md: 'py-4',
    lg: 'py-6',
  },
  // Gap tiers (for flex/grid)
  gap: {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  },
  // Responsive padding pattern
  responsive: {
    contentPadding: 'p-3 sm:p-4 md:p-6',
    sectionPadding: 'p-4 sm:p-6 md:p-8',
    compactPadding: 'p-2 sm:p-3 md:p-4',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// TEXT COLORS - 3 tier system
// ═══════════════════════════════════════════════════════════════════
export const TEXT_COLORS = {
  primary: 'text-slate-900', // Main text
  secondary: 'text-slate-600', // Supporting text
  muted: 'text-slate-500', // Disabled/placeholder text
  error: 'text-red-600',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  info: 'text-blue-600',
} as const;

// ═══════════════════════════════════════════════════════════════════
// BUTTON VARIANTS
// ═══════════════════════════════════════════════════════════════════
export const BUTTON_VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 shadow-sm hover:shadow-md disabled:opacity-50',
  tertiary: 'bg-transparent hover:bg-slate-100 text-slate-900 border border-transparent hover:border-slate-300 disabled:opacity-50',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg disabled:opacity-50',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg disabled:opacity-50',
} as const;

// ═══════════════════════════════════════════════════════════════════
// CARD VARIANTS - 3 tier system
// ═══════════════════════════════════════════════════════════════════
export const CARD_VARIANTS = {
  elevated: 'bg-white border border-slate-200 rounded-lg shadow-md hover:shadow-lg transition-shadow',
  bordered: 'bg-white border-2 border-slate-200 rounded-lg shadow-none hover:border-slate-300 transition-colors',
  flat: 'bg-slate-50 border border-slate-200 rounded-lg shadow-none hover:bg-slate-100 transition-colors',
} as const;

// ═══════════════════════════════════════════════════════════════════
// SHADOWS - 4 tier system
// ═══════════════════════════════════════════════════════════════════
export const SHADOWS = {
  subtle: 'shadow-sm', // 0 1px 2px rgba(0,0,0,0.05)
  medium: 'shadow-md', // 0 4px 6px rgba(0,0,0,0.1)
  prominent: 'shadow-lg', // 0 10px 15px rgba(0,0,0,0.1)
  elevated: 'shadow-xl', // 0 20px 25px rgba(0,0,0,0.1)
  custom: {
    card: 'shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]',
    hover: 'shadow-[0_20px_25px_rgba(0,0,0,0.15)]',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// STATUS INDICATORS
// ═══════════════════════════════════════════════════════════════════
export const STATUS_COLORS = {
  completed: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
  pending: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
  },
  failed: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    border: 'border-red-200',
  },
  processing: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  inactive: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// INPUT FOCUS STATES - Enhanced
// ═══════════════════════════════════════════════════════════════════
export const INPUT_FOCUS = 'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500';

// ═══════════════════════════════════════════════════════════════════
// FORM ELEMENT STYLING
// ═══════════════════════════════════════════════════════════════════
export const FORM_STYLES = {
  label: 'text-sm font-semibold text-slate-700 mb-2 block',
  input: `w-full px-3 py-2 border border-slate-300 rounded-lg text-base transition-all ${INPUT_FOCUS} disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`,
  textarea: `w-full px-3 py-2 border border-slate-300 rounded-lg text-base transition-all resize-none ${INPUT_FOCUS} disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`,
  errorText: 'text-xs text-red-600 mt-1 block font-medium',
  helperText: 'text-xs text-slate-500 mt-1 block',
  required: 'text-red-600 font-semibold',
} as const;

// ═══════════════════════════════════════════════════════════════════
// RESPONSIVE DESIGN PATTERNS
// ═══════════════════════════════════════════════════════════════════
export const RESPONSIVE = {
  container: 'w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6',
  gridCols: {
    auto: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    twoCol: 'grid-cols-1 sm:grid-cols-2',
    threeCol: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  },
  iconSize: {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// ANIMATION TIMINGS
// ═══════════════════════════════════════════════════════════════════
export const ANIMATIONS = {
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
  verySlow: 'duration-500',
} as const;

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getStatusColor(status: keyof typeof STATUS_COLORS) {
  return STATUS_COLORS[status];
}

export function getButtonVariant(variant: keyof typeof BUTTON_VARIANTS) {
  return BUTTON_VARIANTS[variant];
}

export function getCardVariant(variant: keyof typeof CARD_VARIANTS) {
  return CARD_VARIANTS[variant];
}
