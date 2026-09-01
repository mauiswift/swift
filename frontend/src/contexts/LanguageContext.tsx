import React, { createContext, useContext, useState } from 'react';
import { translations, type Language, type TranslationKey } from '@/lib/i18n';

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
    const storedLang = localStorage.getItem('language') as Language | null;
    const storedCurrency = (localStorage.getItem('collection_currency') || 'PHP').toUpperCase();

    if (storedLang === 'zh' || storedLang === 'ko') {
      return storedLang;
    }

    return storedCurrency === 'KRW' ? 'ko' : 'en';
  });

  const setLanguage = (lang: Language) => {
    const normalizedLang = lang === 'zh' || lang === 'ko' ? lang : 'en';
    setLanguageState(normalizedLang);
    localStorage.setItem('language', normalizedLang);
    document.documentElement.lang = normalizedLang;
  };

  const t = (key: TranslationKey): string => translations[language][key];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
