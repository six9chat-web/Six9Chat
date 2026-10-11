import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

/**
 * Client-side Supabase client for use in Browser / React Client Components ('use client')
 */
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy/fallback client if env vars are missing to prevent crash during initial setup
    return createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Singleton browser client instance for quick imports
 */
export const supabase = createClient();
