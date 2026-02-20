"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

// ============================================================
// ⚠️  DEMO MODE FLAG
// Set DEMO_MODE = false (and remove mock imports) to restore
// real Supabase authentication.
// ============================================================
import { MOCK_USER, MOCK_EMAIL, MOCK_PASSWORD } from '../lib/mockData';
const DEMO_MODE = true;
// ============================================================

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // ===DEMO MODE=== skip real Supabase session check
    if (DEMO_MODE) {
      // Check if the user was previously "logged in" via demo mode
      const demoLoggedIn = sessionStorage.getItem('demo_logged_in');
      if (demoLoggedIn === 'true') {
        setUser(MOCK_USER as unknown as User);
        setSession({ user: MOCK_USER } as unknown as Session);
      }
      setIsLoading(false);
      return;
    }
    // ===END DEMO MODE===

    const setData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error retrieving session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // ===DEMO MODE=== accept ANY non-empty email and password
    if (DEMO_MODE) {
      if (!email.trim() || !password.trim()) {
        return { error: { message: 'Email and password are required' } as AuthError };
      }
      // Simulate a brief network delay for realism
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockUser = { ...MOCK_USER, email: email.trim() } as unknown as User;
      setUser(mockUser);
      setSession({ user: mockUser } as unknown as Session);
      sessionStorage.setItem('demo_logged_in', 'true');
      router.push('/devices');
      return { error: null };
    }
    // ===END DEMO MODE===

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data?.user) {
      setUser(data.user);
      router.push('/devices');
    }

    return { error };
  };

  const signOut = async () => {
    // ===DEMO MODE===
    if (DEMO_MODE) {
      setUser(null);
      setSession(null);
      sessionStorage.removeItem('demo_logged_in');
      window.location.href = '/signin';
      return;
    }
    // ===END DEMO MODE===

    let logoutInProgress = true;
    setIsLoading(true);
    setUser(null);
    setSession(null);

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      if (logoutInProgress) {
        logoutInProgress = false;
        window.location.href = '/signin';
      }
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
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