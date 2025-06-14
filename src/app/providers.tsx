
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';

export type Theme = 'dark' | 'theme-obsidian-dark' | 'theme-arctic-light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeInternal] = useLocalStorage<Theme>('app-theme', 'dark');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.className = theme;
    }
  }, [theme, isMounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeInternal(newTheme);
  }, [setThemeInternal]);

  if (!isMounted) {
    // To prevent hydration mismatch, render nothing or a loader until mounted
    // For simplicity, returning children but applying class only after mount
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
