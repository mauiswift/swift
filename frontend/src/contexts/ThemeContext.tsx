import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // v2: GCash light redesign — reset any legacy dark preference
    let stored: Theme | null = null;
    let version: string | null = null;
    try {
      stored = localStorage.getItem('theme') as Theme | null;
      version = localStorage.getItem('theme_version');
    } catch {
      return 'light';
    }
    if (version !== '2') {
      try {
        localStorage.setItem('theme', 'light');
        localStorage.setItem('theme_version', '2');
      } catch {
        // Continue with the default theme when browser storage is unavailable.
      }
      return 'light';
    }
    return stored ?? 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Theme persistence is optional.
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};
