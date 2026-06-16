'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  theme?: 'dark' | 'light' | 'auto';
  currency?: string;
  language?: string;
}

interface SettingsContextType extends Settings {
  setTheme: (theme: 'dark' | 'light' | 'auto') => void;
  setCurrency: (currency: string) => void;
  setLanguage: (lang: string) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

function getSystemTheme(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(isDark: boolean) {
  document.body.classList.toggle('dark', isDark);
  document.body.classList.toggle('light', !isDark);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'dark' | 'light' | 'auto'>('auto');
  const [currency, setCurrencyState] = useState('IDR');
  const [language, setLanguageState] = useState('id');
  const [isDark, setIsDark] = useState(true);
  const [ready, setReady] = useState(false);

  // Load from API
  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.success && data.settings) {
        const s = data.settings;
        setThemeState(s.theme || 'auto');
        setCurrencyState(s.currency || 'IDR');
        setLanguageState(s.language || 'id');
        const dark = s.theme === 'auto' ? getSystemTheme() : s.theme === 'light';
        setIsDark(dark);
        applyTheme(dark);
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  const setTheme = (t: 'dark' | 'light' | 'auto') => {
    setThemeState(t);
    const dark = t === 'auto' ? getSystemTheme() : t === 'dark';
    setIsDark(dark);
    applyTheme(dark);
    fetch('/api/settings', { method: 'PATCH', body: JSON.stringify({ theme: t }), headers: { 'Content-Type': 'application/json' } });
  };

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    fetch('/api/settings', { method: 'PATCH', body: JSON.stringify({ currency: c }), headers: { 'Content-Type': 'application/json' } });
  };

  const setLanguage = (l: string) => {
    setLanguageState(l);
    fetch('/api/settings', { method: 'PATCH', body: JSON.stringify({ language: l }), headers: { 'Content-Type': 'application/json' } });
  };

  if (!ready) return <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-zinc-700 border-t-teal-500 rounded-full animate-spin" />
  </div>;

  return (
    <SettingsContext.Provider value={{ theme, setTheme, currency, setCurrency, language, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
}
