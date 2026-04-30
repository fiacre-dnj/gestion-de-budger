import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, currenciesApi } from '../services/api';
import { useAuth } from './AuthContext';

interface CurrencyContextType {
  currency: string;
  rates: Record<string, number>;
  formatAmount: (amountInMGA: number) => string;
  setCurrency: (currency: string) => Promise<void>;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState('MGA');
  const [rates, setRates] = useState<Record<string, number>>({ MGA: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const initCurrency = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [profileRes, ratesRes] = await Promise.all([
          authApi.getProfile(),
          currenciesApi.getRates(),
        ]);
        setCurrencyState(profileRes.data.currency || 'MGA');
        setRates(ratesRes.data);
      } catch (error) {
        console.error('Failed to initialize currency context:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initCurrency();
  }, [isAuthenticated]);

  const setCurrency = async (newCurrency: string) => {
    try {
      await authApi.updateSettings({ currency: newCurrency });
      setCurrencyState(newCurrency);
    } catch (error) {
      console.error('Failed to update currency:', error);
      throw error;
    }
  };

  const formatAmount = (amountInMGA: number) => {
    const rate = rates[currency] || 1;
    const converted = amountInMGA * rate;

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === 'MGA' ? 'MGA' : currency,
      // For MGA, custom formatting if needed, but MGA is a valid ISO code
      currencyDisplay: 'symbol',
    }).format(converted).replace('MGA', 'Ar'); // Traditional Ar for Madagascar
  };

  return (
    <CurrencyContext.Provider value={{ currency, rates, formatAmount, setCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
