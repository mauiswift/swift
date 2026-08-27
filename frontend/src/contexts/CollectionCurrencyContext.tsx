import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { client } from '@/lib/api';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

interface CollectionCurrencyContextValue {
  collectionCurrency: string;
  setCollectionCurrency: (currency: string) => void;
}

const CollectionCurrencyContext = createContext<CollectionCurrencyContextValue | undefined>(undefined);

export function CollectionCurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setLanguage } = useLanguage();
  const [collectionCurrency, setCurrency] = useState(
    () => localStorage.getItem('collection_currency')?.toUpperCase() || 'PHP',
  );

  const setCollectionCurrency = (currency: string) => {
    const normalizedCurrency = currency.toUpperCase();
    setCurrency(normalizedCurrency);
    setLanguage(normalizedCurrency === 'KRW' ? 'ko' : 'en');
    localStorage.setItem('collection_currency', normalizedCurrency);
  };

  useEffect(() => {
    if (!user) return;

    client.get('/api/v1/merchant/api-config').then((response) => {
      if (response.ok && response.data?.collection_currency) {
        setCollectionCurrency(String(response.data.collection_currency));
      }
    }).catch(() => undefined);
  }, [user]);

  return (
    <CollectionCurrencyContext.Provider value={{ collectionCurrency, setCollectionCurrency }}>
      {children}
    </CollectionCurrencyContext.Provider>
  );
}

export function useCollectionCurrency() {
  const context = useContext(CollectionCurrencyContext);
  if (!context) {
    throw new Error('useCollectionCurrency must be used within CollectionCurrencyProvider');
  }
  return context;
}