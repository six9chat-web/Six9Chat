import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables with URL sanitization (handles base URL or /rest/v1 endpoints cleanly)
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rjoxghjmtrsfdhbfkodr.supabase.co';
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_uFcHccTx94Y8Kx2Qy1AsHQ_V-qovUQw';

/**
 * Check if current Supabase environment variables are properly configured
 */
export function isSupabaseConfigured(): boolean {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseAnonKey.includes('placeholder')
  );
}

let clientInstance: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  const url = supabaseUrl || 'https://rjoxghjmtrsfdhbfkodr.supabase.co';
  const key = supabaseAnonKey || 'sb_publishable_uFcHccTx94Y8Kx2Qy1AsHQ_V-qovUQw';

  if (!clientInstance) {
    clientInstance = createSupabaseClient(url, key, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }

  return clientInstance;
}

/**
 * Singleton browser client instance for quick imports
 */
export const supabase = createClient();
