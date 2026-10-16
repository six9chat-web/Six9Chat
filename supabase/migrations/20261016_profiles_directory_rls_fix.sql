-- ==============================================================================
-- Six9Chat Profiles Directory RLS Fix
-- Ensure profiles table has unrestricted public select RLS policy
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Allow anyone to view profiles (needed for directory listing, search, chat contacts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- 2. Allow insert / upsert for profiles without RLS blocking
DROP POLICY IF EXISTS "Allow profile insert" ON public.profiles;
CREATE POLICY "Allow profile insert"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- 3. Allow update for profiles without RLS blocking
DROP POLICY IF EXISTS "Allow profile update" ON public.profiles;
CREATE POLICY "Allow profile update"
  ON public.profiles
  FOR UPDATE
  USING (true);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_uid ON public.profiles(uid);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
