import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { client } from '@/lib/api';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

interface CollectionCurrencyContextValue {
  collectionCurrency: string;
  enabledCurrencies: string[];
  setCollectionCurrency: (currency: string) => void;
}

const CollectionCurrencyContext = createContext<CollectionCurrencyContextValue | undefined>(undefined);

export function CollectionCurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setLanguage } = useLanguage();
  const [collectionCurrency, setCurrency] = useState(
    () => localStorage.getItem('collection_currency')?.toUpperCase() || 'PHP',
  );
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>(['PHP', 'CNY', 'KRW']);

  const setCollectionCurrency = (currency: string) => {
    const normalizedCurrency = currency.toUpperCase();
    setCurrency(normalizedCurrency);
    setLanguage(normalizedCurrency === 'KRW' ? 'ko' : 'en');
    localStorage.setItem('collection_currency', normalizedCurrency);
  };

  useEffect(() => {
    if (!user) return;

    Promise.all([
      client.get('/api/v1/app-settings/collection-currencies'),
      client.get('/api/v1/merchant/api-config'),
    ]).then(([currenciesResponse, configResponse]) => {
      let availableCurrencies = enabledCurrencies;
      if (currenciesResponse.ok && Array.isArray(currenciesResponse.data?.currencies)) {
        const currencies = currenciesResponse.data.currencies as string[];
        availableCurrencies = currencies;
        setEnabledCurrencies(availableCurrencies);
      }
      if (configResponse.ok && configResponse.data?.collection_currency) {
        const configuredCurrency = String(configResponse.data.collection_currency).toUpperCase();
        setCollectionCurrency(availableCurrencies.includes(configuredCurrency) ? configuredCurrency : availableCurrencies[0] || 'PHP');
      } else if (!availableCurrencies.includes(collectionCurrency)) {
        setCollectionCurrency(availableCurrencies[0] || 'PHP');
      }
    }).catch(() => undefined);
  }, [user]);

  return (
    <CollectionCurrencyContext.Provider value={{ collectionCurrency, enabledCurrencies, setCollectionCurrency }}>
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