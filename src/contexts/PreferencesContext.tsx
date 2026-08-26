import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'light' | 'dark' | 'system';
export type LangType = 'id' | 'en';

interface PreferencesContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  lang: LangType;
  setLang: (lang: LangType) => void;
}

const PreferencesContext = createContext<PreferencesContextProps | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>(() => (localStorage.getItem('theme') as ThemeType) || 'system');
  const [lang, setLang] = useState<LangType>(() => (localStorage.getItem('lang') as LangType) || 'id');

  // Efek merubah tema HTML (Berlaku untuk seluruh aplikasi)
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Efek menyimpan bahasa
  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  return (
    <PreferencesContext.Provider value={{ theme, setTheme, lang, setLang }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences harus digunakan di dalam PreferencesProvider');
  return context;
};