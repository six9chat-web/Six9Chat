import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rjoxghjmtrsfdhbfkodr.supabase.co";
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

export const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "";

/**
 * Privileged Supabase Admin Client using Service Role Key.
 * Reads SUPABASE_SERVICE_ROLE_KEY securely from environment variables.
 * NEVER expose to the browser; used only in server routes, actions, and services to bypass RLS.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || "service-role-key-required",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export default supabaseAdmin;
