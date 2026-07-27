import { useColorScheme } from 'react-native';

export const COLORS = {
  primary: '#FF6B00', // SwiftPay Orange (Vibrant)
  secondary: '#0B63FF', // Accent Blue
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  light: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    card: '#FFFFFF',
    tabBar: '#FFFFFF',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    card: '#1E293B',
    tabBar: '#1E293B',
  }
};

export const useTheme = () => {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  return {
    isDark,
    colors,
    common: {
      primary: COLORS.primary,
      secondary: COLORS.secondary,
      success: COLORS.success,
      warning: COLORS.warning,
      danger: COLORS.danger,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    roundness: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      full: 9999,
    },
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
      },
    },
    typography: {
      h1: { fontSize: 32, fontWeight: '900', letterSpacing: -1.0 },
      h2: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
      h3: { fontSize: 20, fontWeight: '800' },
      bodyLarge: { fontSize: 16, fontWeight: '600' },
      body: { fontSize: 14, fontWeight: '500' },
      bodySmall: { fontSize: 13, fontWeight: '500' },
      caption: { fontSize: 12, fontWeight: '600' },
      label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.0 },
      button: { fontSize: 15, fontWeight: '700' },
    }
  };
};
