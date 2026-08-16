/**
 * SwiftPay Philippines Brand Constants & Design System
 * This is the single source of truth for all branding across the application
 * 
 * Primary Brand: Black & White Minimalist Aesthetic
 * Secondary Accent: Professional Blue for CTAs and highlights
 */

// ───────────────────────────────────────────────────────────────
// BRAND IDENTITY
// ───────────────────────────────────────────────────────────────
export const APP_NAME = 'SwiftPay';
export const APP_NAME_FULL = 'SwiftPay Philippines';
export const APP_TAGLINE = 'Digital Payment Platform';
export const APP_DESCRIPTION =
  'Bank-grade financial infrastructure for Philippine merchants. Fast, secure, and reliable payment processing.';
export const APP_SUBTITLE = 'Admin Dashboard';
export const COMPANY_NAME = 'Swiftpay Ventures Inc.';

// ───────────────────────────────────────────────────────────────
// BRAND COLORS (Black & White Primary Palette)
// ───────────────────────────────────────────────────────────────
export const BRAND_COLORS = {
  // Primary Brand Orange (Vibrant)
  orange: '#FF6B00',
  orangeLight: '#FFF5F1',
  orangeBorder: '#FFDCCB',

  // Primary: Black & White - Clean, Professional, Minimalist
  black: '#111111',
  white: '#FFFFFF',
  
  // Accent Blue - For CTAs, highlights, and interactive elements
  accentBlue: '#0B63FF',
  accentBlueDark: '#0052CC',
  accentBlueLight: '#1E7FFF',

  // Neutral Grays - Precise hierarchy and contrast
  gray50: '#F9FAFB',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Dark Mode Support (inverted but maintaining black/white theme)
  darkBg: '#0F172A',
  darkCard: '#1E293B',
  darkBorder: '#334155',

  // Status Colors (minimal, professional)
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#0B63FF',
} as const;

// ───────────────────────────────────────────────────────────────
// GRADIENT DEFINITIONS (Black/White with Accent)
// ───────────────────────────────────────────────────────────────
export const GRADIENTS = {
  // Black to White gradient
  classic: `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.white} 100%)`,
  
  // Dark mode gradient
  darkMode: `linear-gradient(135deg, ${BRAND_COLORS.darkBg} 0%, ${BRAND_COLORS.gray900} 100%)`,
  
  // Accent blue for important CTAs
  accentBluePrimary: `linear-gradient(135deg, ${BRAND_COLORS.accentBlue} 0%, ${BRAND_COLORS.accentBlueDark} 100%)`,
} as const;

// ───────────────────────────────────────────────────────────────
// SHADOW SYSTEM
// ───────────────────────────────────────────────────────────────
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  accentGlow: `0 0 20px rgba(11, 99, 255, 0.3)`,
  accentGlowStrong: `0 0 40px rgba(11, 99, 255, 0.5)`,
} as const;

// ───────────────────────────────────────────────────────────────
// TYPOGRAPHY SCALE
// ───────────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, sans-serif',
    display: '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, sans-serif',
    mono: '"Fira Code", "Monaco", monospace',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;

// ───────────────────────────────────────────────────────────────
// SPACING SCALE
// ───────────────────────────────────────────────────────────────
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
} as const;

// ───────────────────────────────────────────────────────────────
// BORDER RADIUS
// ───────────────────────────────────────────────────────────────
export const BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
} as const;

// ───────────────────────────────────────────────────────────────
// SUPPORT & CONTACT
// ───────────────────────────────────────────────────────────────
export const SUPPORT_URL = 'mailto:support@swiftpay.site';
export const SUPPORT_HANDLE = 'support@swiftpay.site';

// ───────────────────────────────────────────────────────────────
// BRAND COLOR HELPERS
// ───────────────────────────────────────────────────────────────
export const BRAND_COLOR = BRAND_COLORS.black; // Primary brand color
export const BRAND_COLOR_ACCENT = BRAND_COLORS.accentBlue; // Accent for highlights

/**
 * Get color by semantic name
 * Helpful for components that need semantic color selection
 */
export function getSemanticColor(
  status: 'success' | 'warning' | 'error' | 'info' | 'default'
): string {
  const map: Record<string, string> = {
    success: BRAND_COLORS.success,
    warning: BRAND_COLORS.warning,
    error: BRAND_COLORS.error,
    info: BRAND_COLORS.accentBlue,
    default: BRAND_COLORS.black,
  };
  return map[status] ?? BRAND_COLORS.black;
}
