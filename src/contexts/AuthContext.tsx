import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useFormStore } from '../store/formStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearFormState, migrateVisitorData } = useFormStore();

  useEffect(() => {
    let mounted = true;

    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          migrateVisitorData(session.user.id);
        }
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          await migrateVisitorData(session.user.id);
        } else {
          clearFormState();
          localStorage.removeItem('comparisons_count');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearFormState, migrateVisitorData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    if (data.user) {
      await migrateVisitorData(data.user.id);
    }
  }, [migrateVisitorData]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          email_confirm_url: `${window.location.origin}/auth/callback`
        }
      }
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    clearFormState();
    localStorage.removeItem('comparisons_count');
  }, [clearFormState]);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}