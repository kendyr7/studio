
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { auth } from '@/lib/firebaseConfig';
import type { User, AuthError } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';

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

// Auth Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser && (window.location.pathname === '/auth' || window.location.pathname === '/auth/')) {
         router.push('/'); 
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      setAuthError((error as AuthError).message || 'Failed to login.');
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      setAuthError((error as AuthError).message || 'Failed to sign up.');
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
      router.push('/auth'); 
    } catch (error) {
      setAuthError((error as AuthError).message || 'Failed to logout.');
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = { 
    user, 
    loading, 
    login, 
    signup, 
    logout, 
    authError, 
    setAuthError 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// App Providers
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
