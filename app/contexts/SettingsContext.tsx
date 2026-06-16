'use client';

import { createContext, useEffect, useState, useCallback, useContext, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'auto';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  formatCurrency: (amount: number) => string;
  isDark: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function getSystemTheme(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark').matches;
}

function applyTheme(isDark: boolean) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('dark', isDark);
  document.body.classList.toggle('light', !isDark);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, _setTheme] = useState<Theme>('auto');
  const [currency, setCurrencyState] = useState('IDR');
  const [language, setLanguageState] = useState('id');
  const [isDark, setIsDark] = useState(true);

  // Initialize from localStorage and system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('equilibria_theme') as Theme | null;
    const savedCurrency = localStorage.getItem('equilibria_currency');
    const savedLanguage = localStorage.getItem('equilibria_lang');

    if (savedCurrency) setCurrencyState(savedCurrency);
    if (savedLanguage) setLanguageState(savedLanguage);

    const effectiveTheme = savedTheme || 'auto';
    _setTheme(effectiveTheme);

    const dark = effectiveTheme === 'auto' ? getSystemTheme() : effectiveTheme === 'dark';
    setIsDark(dark);
    applyTheme(dark);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const storedTheme = localStorage.getItem('equilibria_theme');
      if (storedTheme === 'auto' || !storedTheme) {
        const newDark = getSystemTheme();
        setIsDark(newDark);
        applyTheme(newDark);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    _setTheme(newTheme);
    localStorage.setItem('equilibria_theme', newTheme);
    const dark = newTheme === 'auto' ? getSystemTheme() : newTheme === 'dark';
    setIsDark(dark);
    applyTheme(dark);
    window.dispatchEvent(new Event('themeChanged'));
  }, []);

  const setCurrency = useCallback((curr: string) => {
    setCurrencyState(curr);
    localStorage.setItem('equilibria_currency', curr);
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('equilibria_lang', lang);
  }, []);

  const formatCurrency = useCallback((amount: number): string => {
    switch (currency) {
      case 'USD':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
      case 'EUR':
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
      case 'IDR':
      default:
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    }
  }, [currency]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, currency, setCurrency, language, setLanguage, formatCurrency, isDark }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
