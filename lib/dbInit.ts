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
          last_message TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_schema = 'public' AND table_name = 'conversations' AND constraint_name = 'unique_conversation_users'
          ) THEN
            ALTER TABLE public.conversations ADD CONSTRAINT unique_conversation_users UNIQUE (user1_id, user2_id);
          END IF;
        EXCEPTION WHEN OTHERS THEN NULL;
        END $$;

        CREATE TABLE IF NOT EXISTS public.messages (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          conversation_id TEXT NOT NULL,
          sender_id TEXT NOT NULL,
          receiver_id TEXT,
          content TEXT DEFAULT '',
          text TEXT DEFAULT '',
          sender_name TEXT,
          sender_avatar TEXT,
          media_type TEXT DEFAULT 'text',
          media_url TEXT,
          media_meta JSONB,
          reactions JSONB DEFAULT '[]'::jsonb,
          reply_to JSONB,
          reply_to_id TEXT,
          status TEXT DEFAULT 'delivered',
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'reply_to'
          ) THEN
            ALTER TABLE public.messages ADD COLUMN reply_to JSONB;
          END IF;
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'reply_to_id'
          ) THEN
            ALTER TABLE public.messages ADD COLUMN reply_to_id TEXT;
          END IF;
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'content'
          ) THEN
            ALTER TABLE public.messages ADD COLUMN content TEXT DEFAULT '';
          END IF;
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_read'
          ) THEN
            ALTER TABLE public.messages ADD COLUMN is_read BOOLEAN DEFAULT false;
          END IF;
        EXCEPTION WHEN OTHERS THEN NULL;
        END $$;

        CREATE TABLE IF NOT EXISTS public.chat_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sender_id UUID NOT NULL,
          receiver_id UUID NOT NULL,
          status TEXT DEFAULT 'pending',
          message TEXT DEFAULT 'wants to start a conversation with you',
          created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
          CONSTRAINT chat_requests_sender_receiver_key UNIQUE (sender_id, receiver_id)
        );

        DO $$
        BEGIN
          ALTER TABLE public.chat_requests DROP CONSTRAINT IF EXISTS chat_requests_status_check;
          ALTER TABLE public.chat_requests ADD CONSTRAINT chat_requests_status_check 
            CHECK (status IN ('pending', 'accepted', 'unfriended', 'blocked', 'declined', 'rejected'));
        EXCEPTION WHEN OTHERS THEN NULL;
        END $$;

        CREATE TABLE IF NOT EXISTS public.blocked_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          blocker_id UUID NOT NULL,
          blocked_id UUID NOT NULL,
          created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
          CONSTRAINT blocked_users_blocker_blocked_key UNIQUE (blocker_id, blocked_id)
        );

        -- Ensure Realtime publication includes messages, conversations and chat_requests
        DO $pub$
        BEGIN
          BEGIN
            ALTER TABLE public.messages REPLICA IDENTITY FULL;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;

          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
            END IF;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;

          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
            END IF;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;

          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' AND tablename = 'chat_requests'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_requests;
            END IF;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
        END $pub$;
      `);
      isInitialized = true;
      return { success: true };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("[ensureDatabaseTablesExist]:", err);
    return { success: false, error: errorMsg };
  }
}
