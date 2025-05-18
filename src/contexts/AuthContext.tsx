import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useFormStore } from '../store/formStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearFormState, migrateVisitorData } = useFormStore();

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (!session) {
          console.log('No session found');
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // Get the user profile
        const { data: { user: profile }, error: profileError } = await supabase.auth.getUser();
        
        if (profileError) {
          console.error('Error getting user profile:', profileError);
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          console.log('Setting initial user profile:', profile);
          setUser(profile);
          if (profile) {
            try {
              await migrateVisitorData(profile.id);
            } catch (error) {
              console.error('Error migrating visitor data:', error);
            }
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed in context:', { event, session });
      if (isMounted) {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          try {
            await migrateVisitorData(session.user.id);
          } catch (error) {
            console.error('Error migrating visitor data:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          clearFormState();
          localStorage.removeItem('comparisons_count');
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [migrateVisitorData, clearFormState]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ 
      email, 
      password
    });
    if (error) throw error;
    if (data.user) {
      try {
        await migrateVisitorData(data.user.id);
      } catch (error) {
        console.error('Error migrating visitor data:', error);
      }
    }
  }, [migrateVisitorData]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    // First, check if the name is already taken
    const { data: nameExists, error: checkError } = await supabase
      .rpc('check_duplicate_name', { name });

    if (checkError) throw checkError;
    if (nameExists) throw new Error('This name is already taken');

    // Create the user
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (signUpError) throw signUpError;

    // Set the user's name using our custom function
    const { error: setNameError } = await supabase
      .rpc('set_user_name', {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        name: name
      });

    if (setNameError) throw setNameError;
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('Starting sign out from AuthContext...');
      
      // First clear local state
      clearFormState();
      localStorage.removeItem('comparisons_count');
      localStorage.removeItem('comparaholic-auth');
      sessionStorage.clear();
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
        throw error;
      }
      
      // Force clear the user state
      setUser(null);
      
      console.log('Sign out completed from AuthContext');
    } catch (error) {
      console.error('Error in signOut:', error);
      // Even if there's an error, try to clear the user state
      setUser(null);
    }
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