import React, { createContext, useContext, useState } from 'react';
import { detectBrowserLanguage, normalizeLanguage, translations, type Language, type TranslationKey } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const storedLang = localStorage.getItem('language');
      if (storedLang) {
        return normalizeLanguage(storedLang);
      }
    } catch {
      // Ignore storage issues and fall back to browser detection.
    }

    if (typeof navigator !== 'undefined') {
      const browserLanguages = Array.isArray(navigator.languages)
        ? [...navigator.languages]
        : [navigator.language];
      return detectBrowserLanguage(browserLanguages);
    }

    return 'ko';
  });

  const setLanguage = (lang: Language) => {
    const normalizedLang = normalizeLanguage(lang);
    setLanguageState(normalizedLang);
    try {
      localStorage.setItem('language', normalizedLang);
    } catch {
      // Language persistence is optional.
    }
    document.documentElement.lang = normalizedLang;
  };

  const t = (key: TranslationKey): string => translations[language][key];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
