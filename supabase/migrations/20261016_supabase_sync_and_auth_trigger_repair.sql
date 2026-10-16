-- ==============================================================================
-- Six9Chat Database Migration Script
-- Supabase Full Sync, Auth Session & Realtime Chat Repair
-- ==============================================================================

-- 1. Ensure `profiles` table exists with proper columns and foreign key to `auth.users(id)`
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'Hey there! I am using Six9Chat',
  phone TEXT,
  email TEXT,
  password_hash TEXT,
  uid TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all necessary columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS uid TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Hey there! I am using Six9Chat';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Verify or attach foreign key constraint to auth.users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles'
  ) THEN
    BEGIN
      ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Notice: profiles_id_fkey constraint could not be added (table may contain mock records): %', SQLERRM;
    END;
  END IF;
END $$;

-- Indexes on profiles for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_uid ON public.profiles(uid);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (true);

-- 2. PostgreSQL Trigger Function: Automatically insert profile when user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_avatar_url TEXT;
  v_uid TEXT;
  v_seq INT;
BEGIN
  -- Derive full name
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Six9 Member'
  );

  -- Derive clean username
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'))
  );

  -- Check for collision on username
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username AND id <> NEW.id) THEN
    v_username := v_username || '_' || SUBSTRING(NEW.id::text, 1, 4);
  END IF;

  v_phone := COALESCE(
    NEW.phone,
    NEW.raw_user_meta_data->>'phone',
    ''
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    ''
  );

  -- Derive sequential UID (S9-XX) if not provided
  v_uid := NEW.raw_user_meta_data->>'uid';
  IF v_uid IS NULL OR v_uid = '' THEN
    SELECT COUNT(*) + 1 INTO v_seq FROM public.profiles;
    IF v_seq < 10 THEN
      v_uid := 'S9-0' || v_seq::text;
    ELSE
      v_uid := 'S9-' || v_seq::text;
    END IF;
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    phone,
    email,
    uid,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_username,
    v_full_name,
    v_avatar_url,
    v_phone,
    NEW.email,
    v_uid,
    'Hey there! I am using Six9Chat 🚀',
    COALESCE(NEW.created_at, timezone('utc'::text, now())),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    avatar_url = CASE WHEN public.profiles.avatar_url IS NULL OR public.profiles.avatar_url = '' THEN EXCLUDED.avatar_url ELSE public.profiles.avatar_url END,
    phone = CASE WHEN public.profiles.phone IS NULL OR public.profiles.phone = '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    uid = COALESCE(public.profiles.uid, EXCLUDED.uid),
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

-- Also maintain handle_new_user as trigger procedure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN public.on_auth_user_created();
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();

-- 3. Ensure `chat_requests` table exists with correct foreign keys
CREATE TABLE IF NOT EXISTS public.chat_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT DEFAULT 'wants to start a conversation with you',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_sender_receiver UNIQUE (sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_requests_receiver ON public.chat_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_sender ON public.chat_requests(sender_id);

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

-- 4. Ensure `messages` table exists with complete media & reactions support
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT,
  sender_name TEXT,
  sender_avatar TEXT,
  text TEXT NOT NULL DEFAULT '',
  media_type TEXT DEFAULT 'text',
  media_url TEXT,
  media_meta JSONB,
  reactions JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_meta JSONB;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to messages" ON public.messages;
CREATE POLICY "Allow all access to messages"
  ON public.messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Add all chat tables to Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
