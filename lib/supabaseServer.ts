import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseUrl, supabaseAnonKey } from "./supabaseClient";

/**
 * Server-side Supabase client for Server Components, Server Actions, and Route Handlers.
 * Note: In Next.js 15 & 16, cookies() is asynchronous and must be awaited.
 */
export async function createClientServer() {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when invoked from Server Component where cookies cannot be set
          }
        },
      },
    }
  );
}

/**
 * Helper to get authenticated user in Server Components
 */
export async function getServerUser() {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}
