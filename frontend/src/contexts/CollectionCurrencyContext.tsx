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
  const { user, isSuperAdmin } = useAuth();
  const { setLanguage } = useLanguage();
  const [collectionCurrency, setCurrency] = useState(
    () => {
      try {
        return localStorage.getItem('collection_currency')?.toUpperCase() || 'CNY';
      } catch {
        return 'CNY';
      }
    },
  );
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>(['CNY', 'PHP', 'KRW', 'USDT']);

  const setCollectionCurrency = (currency: string) => {
    const normalizedCurrency = currency.toUpperCase();
    setCurrency(normalizedCurrency);
    setLanguage('zh');
    try {
      localStorage.setItem('collection_currency', normalizedCurrency);
      localStorage.setItem('language', 'zh');
    } catch {
      // Preference persistence is optional.
    }
    document.documentElement.lang = 'zh';
  };

  useEffect(() => {
    setLanguage('zh');
    try {
      localStorage.setItem('language', 'zh');
    } catch {
      // Preference persistence is optional.
    }
    document.documentElement.lang = 'zh';
  }, [setLanguage]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const syncCurrencySettings = async () => {
      try {
        const [currenciesResponse, configResponse] = await Promise.all([
          client.get('/api/v1/app-settings/collection-currencies'),
          client.get('/api/v1/merchant/api-config'),
        ]);

        if (!isMounted) return;

        let availableCurrencies = enabledCurrencies;
        if (currenciesResponse.ok && Array.isArray(currenciesResponse.data?.currencies)) {
          const currencies = currenciesResponse.data.currencies.map((currency: unknown) => String(currency).toUpperCase());
          availableCurrencies = currencies.length ? currencies : availableCurrencies;
          setEnabledCurrencies(availableCurrencies);
        }

        let storedCurrency = 'CNY';
        try {
          storedCurrency = (localStorage.getItem('collection_currency') || 'CNY').toUpperCase();
        } catch {
          // Use the configured currency when browser storage is unavailable.
        }
        const configuredCurrency = configResponse.ok && configResponse.data?.collection_currency
          ? String(configResponse.data.collection_currency).toUpperCase()
          : storedCurrency;

        const nextCurrency = availableCurrencies.includes(configuredCurrency)
          ? configuredCurrency
          : availableCurrencies.includes(storedCurrency)
            ? storedCurrency
            : availableCurrencies[0] || 'CNY';

        setCurrency((currentCurrency) => {
          const safeCurrentCurrency = String(currentCurrency || 'CNY').toUpperCase();
          return availableCurrencies.includes(safeCurrentCurrency) ? safeCurrentCurrency : nextCurrency;
        });

        if (nextCurrency !== storedCurrency) {
          try {
            localStorage.setItem('collection_currency', nextCurrency);
          } catch {
            // Preference persistence is optional.
          }
        }

        setLanguage('zh');
      } catch (error) {
        console.warn('Unable to sync collection currency settings:', error);
      }
    };

    syncCurrencySettings();
    return () => { isMounted = false; };
  }, [user, isSuperAdmin]);

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