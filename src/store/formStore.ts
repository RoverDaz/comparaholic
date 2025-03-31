import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import Cookies from 'js-cookie';

interface FormState {
  [key: string]: string;
}

interface FormStore {
  formState: FormState;
  updateFormState: (key: string, value: string) => void;
  setFullFormState: (state: FormState) => void;
  clearFormState: () => void;
  loadUserResponses: (category: string) => Promise<void>;
  saveUserResponses: (category: string) => Promise<void>;
  migrateVisitorData: (userId: string) => Promise<void>;
}

export const useFormStore = create<FormStore>((set, get) => ({
  formState: {},
  
  updateFormState: (key, value) => {
    const newState = { ...get().formState, [key]: value };
    set({ formState: newState });
  },
  
  setFullFormState: (state) => {
    set({ formState: state });
  },
  
  clearFormState: () => {
    set({ formState: {} });
  },

  loadUserResponses: async (category) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // For authenticated users, load from database
        const { data } = await supabase
          .from('user_form_responses')
          .select('form_data')
          .eq('category', category)
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (data?.form_data) {
          set({ formState: data.form_data });
          return;
        }
      }

      // For visitors, check visitor_submissions
      const visitorId = Cookies.get('visitor_id');
      if (visitorId) {
        const { data: submission } = await supabase
          .from('visitor_submissions')
          .select('form_data')
          .eq('category', category)
          .eq('visitor_id', visitorId)
          .is('claimed_by', null)
          .maybeSingle();

        if (submission?.form_data) {
          set({ formState: submission.form_data });
        }
      }
    } catch (error) {
      console.error('Error loading responses:', error);
    }
  },

  saveUserResponses: async (category) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formState = get().formState;
      
      if (!formState || Object.keys(formState).length === 0) {
        return;
      }

      if (session?.user) {
        // Save to database for authenticated users
        await supabase
          .from('user_form_responses')
          .upsert({
            user_id: session.user.id,
            category,
            form_data: formState,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,category'
          });
      } else {
        // Save to visitor_submissions for visitors
        let visitorId = Cookies.get('visitor_id');
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          Cookies.set('visitor_id', visitorId, { expires: 7 }); // 7 days expiry
        }

        await supabase
          .from('visitor_submissions')
          .upsert({
            visitor_id: visitorId,
            category,
            form_data: formState
          }, {
            onConflict: 'visitor_id,category'
          });
      }
    } catch (error) {
      console.error('Error saving responses:', error);
    }
  },

  migrateVisitorData: async (userId: string) => {
    const visitorId = Cookies.get('visitor_id');
    if (!visitorId) return;

    try {
      // Get all visitor submissions
      const { data: submissions } = await supabase
        .from('visitor_submissions')
        .select('*')
        .eq('visitor_id', visitorId)
        .is('claimed_by', null);

      if (!submissions?.length) return;

      // Migrate each submission to user_form_responses
      for (const submission of submissions) {
        await supabase
          .from('user_form_responses')
          .upsert({
            user_id: userId,
            category: submission.category,
            form_data: submission.form_data,
            created_at: submission.created_at,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,category'
          });

        // Mark submission as claimed
        await supabase
          .from('visitor_submissions')
          .update({
            claimed_by: userId,
            claimed_at: new Date().toISOString()
          })
          .eq('id', submission.id);
      }

      // Clear visitor cookie
      Cookies.remove('visitor_id');
    } catch (error) {
      console.error('Error migrating visitor data:', error);
    }
  }
}));