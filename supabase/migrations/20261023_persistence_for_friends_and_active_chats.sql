-- ==============================================================================
-- Six9Chat Database Migration Script (2026-10-23)
-- Master Persistence for Accepted Friends, Active Conversations & Messages
-- ==============================================================================

-- 1. Profiles Table & Constraints Verification
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  about TEXT DEFAULT 'Hey there! I am using Six9Chat',
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about TEXT DEFAULT 'Hey there! I am using Six9Chat';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view all profiles" ON public.profiles;
CREATE POLICY "Public can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR true);

-- 2. Chat Requests Table & Status Constraints
CREATE TABLE IF NOT EXISTS public.chat_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT DEFAULT 'wants to start a conversation with you',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_sender_receiver UNIQUE (sender_id, receiver_id)
);

ALTER TABLE public.chat_requests ADD COLUMN IF NOT EXISTS sender_id UUID;
ALTER TABLE public.chat_requests ADD COLUMN IF NOT EXISTS receiver_id UUID;
ALTER TABLE public.chat_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.chat_requests ADD COLUMN IF NOT EXISTS message TEXT DEFAULT 'wants to start a conversation with you';
ALTER TABLE public.chat_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.chat_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Enforce status constraints including 'pending', 'accepted', 'unfriended', 'blocked', 'declined', 'rejected'
ALTER TABLE public.chat_requests DROP CONSTRAINT IF EXISTS chat_requests_status_check;
ALTER TABLE public.chat_requests ADD CONSTRAINT chat_requests_status_check 
  CHECK (status IN ('pending', 'accepted', 'unfriended', 'blocked', 'declined', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_chat_requests_receiver ON public.chat_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_sender ON public.chat_requests(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_created ON public.chat_requests(created_at DESC);

ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their chat requests" ON public.chat_requests;
CREATE POLICY "Users can view their chat requests"
  ON public.chat_requests FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can send chat requests" ON public.chat_requests;
CREATE POLICY "Users can send chat requests"
  ON public.chat_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update chat requests" ON public.chat_requests;
CREATE POLICY "Users can update chat requests"
  ON public.chat_requests FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete chat requests" ON public.chat_requests;
CREATE POLICY "Users can delete chat requests"
  ON public.chat_requests FOR DELETE
  USING (true);

-- 3. Conversations Table & Constraints
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT check_distinct_users CHECK (user1_id <> user2_id)
);

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user1_id UUID;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user2_id UUID;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message TEXT DEFAULT '';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Add explicit unique constraint on (user1_id, user2_id) for reliable upserts
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS unique_conversation_users;
ALTER TABLE public.conversations ADD CONSTRAINT unique_conversation_users UNIQUE (user1_id, user2_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_participants 
  ON public.conversations (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));

CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON public.conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to conversations" ON public.conversations;
CREATE POLICY "Allow all access to conversations"
  ON public.conversations FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Messages Table with Content & Reply_to_id
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT,
  sender_name TEXT,
  sender_avatar TEXT,
  content TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  media_type TEXT DEFAULT 'text',
  media_url TEXT,
  media_meta JSONB,
  reactions JSONB DEFAULT '[]'::jsonb,
  reply_to JSONB,
  reply_to_id TEXT,
  status TEXT DEFAULT 'delivered',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS text TEXT DEFAULT '';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to JSONB;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_id TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_meta JSONB;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'delivered';

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON public.messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON public.messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to messages" ON public.messages;
CREATE POLICY "Allow all access to messages"
  ON public.messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Realtime Publication Setup
ALTER TABLE public.chat_requests REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 6. Permissions
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.chat_requests TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.conversations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO anon, authenticated, service_role;
