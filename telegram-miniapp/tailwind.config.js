/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B63FF',
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#C1DFFF',
          300: '#A2CFFF',
          400: '#83BFFF',
          500: '#0B63FF',
          600: '#0552E5',
          700: '#0441CB',
          800: '#0330B1',
          900: '#021F97',
        },
        secondary: {
          DEFAULT: '#FF6B00',
          50: '#FFF5F0',
          100: '#FFEBE0',
          200: '#FFD6C1',
          300: '#FFC1A2',
          400: '#FFAC83',
          500: '#FF6B00',
          600: '#E55A00',
          700: '#CB4900',
          800: '#B13800',
          900: '#972700',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [
    require('tailwindcss/plugin')(function ({ addUtilities }) {
      addUtilities({
        '.safe-top': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.safe-bottom': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-left': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.safe-right': {
          paddingRight: 'env(safe-area-inset-right)',
        },
      })
    }),
  ],
}
