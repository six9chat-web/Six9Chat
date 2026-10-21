import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool | null {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

let isInitialized = false;

/**
 * Ensures standard tables:
 * - profiles (id, username, full_name, avatar_url, ...)
 * - conversations (id, user1_id, user2_id, last_message, updated_at)
 * - messages (id, conversation_id, sender_id, receiver_id, content, created_at, ...)
 * are initialized in Postgres/Supabase.
 */
export async function ensureDatabaseTablesExist() {
  if (isInitialized) return { success: true, message: "Already initialized" };

  const p = getPool();
  if (!p) {
    return { success: false, error: "DATABASE_URL is not configured" };
  }

  try {
    const client = await p.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY,
          username TEXT UNIQUE,
          full_name TEXT,
          avatar_url TEXT,
          about TEXT DEFAULT 'Hey there! I am using Six9Chat',
          email TEXT,
          phone TEXT,
          created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS public.conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user1_id UUID NOT NULL,
          user2_id UUID NOT NULL,
          last_message TEXT,
          updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS public.messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID,
          sender_id UUID NOT NULL,
          receiver_id UUID,
          content TEXT,
          text TEXT,
          media_type TEXT DEFAULT 'text',
          media_url TEXT,
          media_meta JSONB,
          reactions JSONB DEFAULT '[]'::jsonb,
          status TEXT DEFAULT 'delivered',
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS public.chat_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sender_id UUID NOT NULL,
          receiver_id UUID NOT NULL,
          status TEXT DEFAULT 'pending',
          message TEXT,
          created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
      isInitialized = true;
      return { success: true };
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn("[ensureDatabaseTablesExist]:", err);
    return { success: false, error: err?.message };
  }
}
