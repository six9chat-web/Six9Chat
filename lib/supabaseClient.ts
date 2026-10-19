import { createBrowserClient } from '@supabase/ssr';

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

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = supabaseUrl || 'https://rjoxghjmtrsfdhbfkodr.supabase.co';
  const key = supabaseAnonKey || 'sb_publishable_uFcHccTx94Y8Kx2Qy1AsHQ_V-qovUQw';

  if (typeof window === 'undefined') {
    return createBrowserClient(url, key);
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient(url, key, {
      cookieOptions: {
        path: '/',
        sameSite: 'lax',
        maxAge: 400 * 24 * 60 * 60,
      },
    });
  }

  return clientInstance;
}

/**
 * Singleton browser client instance for quick imports
 */
export const supabase = createClient();
