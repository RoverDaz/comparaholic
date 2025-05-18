import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Log the configuration (without exposing the key)
console.log('Initializing Supabase client with:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey.length
});

// Create a singleton instance
let supabaseInstance: SupabaseClient | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'comparaholic-auth'
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-application-name': 'comparaholic'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

    // Add error handler
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', { event, hasSession: !!session });
    });

    // Test the connection
    async function testConnection() {
      try {
        const { count, error } = await supabaseInstance!
          .from('product_categories')
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          console.error('Initial connection test failed:', error);
        } else {
          console.log('Initial connection test successful, count:', count);
        }
      } catch (err: unknown) {
        console.error('Unexpected error during connection test:', err);
      }
    }

    testConnection();
  }

  return supabaseInstance;
})();