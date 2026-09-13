import React, { createContext, useContext, useState } from 'react';
import { translations, type Language, type TranslationKey } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function getDeploymentLanguage(): Language | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === 'kr.swiftpay.site' || hostname.startsWith('kr.')) return 'ko';
  if (hostname === 'swiftpay.site' || hostname === 'www.swiftpay.site') return 'en';
  return null;
}

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language: Language = 'en';

  const setLanguage = (_lang: Language) => {
    document.documentElement.lang = 'en';
  };

  const t = (key: TranslationKey): string => translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
