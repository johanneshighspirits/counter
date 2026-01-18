import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let supabase: SupabaseClient | null = null;

export const getSupabaseServerClient = () => {
  if (supabase) {
    return supabase;
  }
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Missing Supabase configuration');
  }
  supabase = createClient(supabaseUrl, supabasePublishableKey);
  return supabase;
};
