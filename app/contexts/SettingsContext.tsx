'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type SettingsContextType = {
  theme: string;
  currency: string;
  language: string;
  formatCurrency: (amount: number) => string;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('dark');
  const [currency, setCurrency] = useState('IDR');
  const [language, setLanguage] = useState('id');

  useEffect(() => {
    // Read from localStorage on mount
    const t = localStorage.getItem('equilibria_theme');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t) setTheme(t);
    const c = localStorage.getItem('equilibria_currency');
    if (c) setCurrency(c);
    const l = localStorage.getItem('equilibria_lang');
    if (l) setLanguage(l);

    // Apply theme
    if (t === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    
    // Listen for storage changes from SettingsClient
    const handleStorageChange = () => {
      const t2 = localStorage.getItem('equilibria_theme');
      if (t2) {
        setTheme(t2);
        if (t2 === 'light') {
          document.body.classList.add('light-mode');
        } else {
          document.body.classList.remove('light-mode');
        }
      }
      const c2 = localStorage.getItem('equilibria_currency');
      if (c2) setCurrency(c2);
      const l2 = localStorage.getItem('equilibria_lang');
      if (l2) setLanguage(l2);
    };

    window.addEventListener('storage', handleStorageChange);
    // Custom event for same-window updates
    window.addEventListener('settingsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleStorageChange);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    switch (currency) {
      case 'USD':
        return '$ ' + amount.toLocaleString('en-US');
      case 'EUR':
        return '€ ' + amount.toLocaleString('de-DE');
      case 'IDR':
      default:
        return 'Rp ' + amount.toLocaleString('id-ID');
    }
  };

  return (
    <SettingsContext.Provider value={{ theme, currency, language, formatCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
