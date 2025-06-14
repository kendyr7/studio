
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { auth } from '@/lib/firebaseConfig';
import type { User, AuthError, ConfirmationResult, UserCredential } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
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
  signInWithGoogle: () => Promise<void>;
  sendPhoneVerificationCode: (phoneNumber: string, recaptchaContainerID: string) => Promise<ConfirmationResult | null>;
  confirmPhoneVerificationCode: (confirmationResult: ConfirmationResult, verificationCode: string) => Promise<void>;
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

  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      setAuthError((error as AuthError).message || 'Failed to sign in with Google.');
      console.error("Google sign-in error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const sendPhoneVerificationCode = async (phoneNumber: string, recaptchaContainerID: string): Promise<ConfirmationResult | null> => {
    setLoading(true);
    setAuthError(null);
    try {
      // Ensure window.recaptchaVerifier is only created once or handled if it exists
      if (!(window as any).recaptchaVerifierInstance) {
        (window as any).recaptchaVerifierInstance = new RecaptchaVerifier(auth, recaptchaContainerID, {
          'size': 'invisible', // Can be 'normal' or 'compact' or 'invisible'
          'callback': (response: any) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            // This callback is for visible reCAPTCHA. For invisible, it's often not needed here.
          },
          'expired-callback': () => {
            // Response expired. Ask user to solve reCAPTCHA again.
             setAuthError("reCAPTCHA verification expired. Please try sending the code again.");
             if((window as any).recaptchaVerifierInstance) {
                (window as any).recaptchaVerifierInstance.clear(); // Clear the existing instance
                delete (window as any).recaptchaVerifierInstance; // Remove it
             }
          }
        });
      }
      const appVerifier = (window as any).recaptchaVerifierInstance;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setLoading(false);
      return confirmationResult;
    } catch (error) {
      setAuthError((error as AuthError).message || 'Failed to send verification code.');
      console.error("Phone verification send error:", error);
      // Clean up reCAPTCHA if it was created and an error occurred
      if ((window as any).recaptchaVerifierInstance) {
        (window as any).recaptchaVerifierInstance.clear();
        delete (window as any).recaptchaVerifierInstance;
      }
      setLoading(false);
      return null;
    }
  };

  const confirmPhoneVerificationCode = async (confirmationResult: ConfirmationResult, verificationCode: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      await confirmationResult.confirm(verificationCode);
    } catch (error) {
      setAuthError((error as AuthError).message || 'Failed to verify code.');
      console.error("Phone verification confirm error:", error);
    } finally {
      setLoading(false);
       if ((window as any).recaptchaVerifierInstance) {
        (window as any).recaptchaVerifierInstance.clear();
        delete (window as any).recaptchaVerifierInstance;
      }
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
    signInWithGoogle,
    sendPhoneVerificationCode,
    confirmPhoneVerificationCode,
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
