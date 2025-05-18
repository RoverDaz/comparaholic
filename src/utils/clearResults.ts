import { supabase } from '../lib/supabase';

interface ClearResultsOptions {
  category: string;
  useStoredProcedure?: boolean;
  procedureName?: string;
}

export async function clearResults({ 
  category, 
  useStoredProcedure = false, 
  procedureName 
}: ClearResultsOptions): Promise<{ success: boolean; error?: any }> {
  try {
    console.log('Starting deletion process...');
    console.log('Category:', category);
    console.log('Using stored procedure:', useStoredProcedure);

    if (useStoredProcedure && procedureName) {
      // Use stored procedure if specified
      const { error } = await supabase.rpc(procedureName);
      
      if (error) {
        console.error('Error clearing data:', error);
        return { success: false, error };
      }
    } else {
      // Use direct table operations
      console.log('Deleting visitor submissions...');
      const { error: visitorError } = await supabase
        .from('visitor_submissions')
        .delete()
        .eq('category', category);

      if (visitorError) {
        console.error('Error deleting visitor submissions:', visitorError);
        return { success: false, error: visitorError };
      }

      console.log('Deleting user form responses...');
      const { error: userError } = await supabase
        .from('user_form_responses')
        .delete()
        .eq('category', category);

      if (userError) {
        console.error('Error deleting user form responses:', userError);
        return { success: false, error: userError };
      }
    }

    console.log('All data cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in deletion process:', error);
    return { success: false, error };
  }
} 