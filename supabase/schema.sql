-- ==============================================================================
-- Six9Chat Database Migration Script
-- Profiles Table & Auth Automation for Supabase
-- ==============================================================================

-- 1. Create the `profiles` table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'Hey there! I am using Six9Chat',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index frequently queried columns
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies
-- Allow anyone to view profiles (needed for search, chat contacts, and presence)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Trigger Function: Automatically create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
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
BEGIN
  -- Extract metadata or set defaults
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Six9 User'
  );

  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(REPLACE(split_part(NEW.email, '@', 1), '.', '_')) || '_' || SUBSTRING(NEW.id::text, 1, 4)
  );

  v_phone := COALESCE(
    NEW.phone,
    NEW.raw_user_meta_data->>'phone',
    ''
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    ''
  );

  INSERT INTO public.profiles (id, username, full_name, avatar_url, phone, status)
  VALUES (
    NEW.id,
    v_username,
    v_full_name,
    v_avatar_url,
    v_phone,
    'Hey there! I am using Six9Chat'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    avatar_url = CASE WHEN profiles.avatar_url IS NULL OR profiles.avatar_url = '' THEN EXCLUDED.avatar_url ELSE profiles.avatar_url END,
    phone = CASE WHEN profiles.phone IS NULL OR profiles.phone = '' THEN EXCLUDED.phone ELSE profiles.phone END,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

-- 5. Attach trigger to `auth.users`
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Storage Bucket for Avatars (Optional, creates if bucket does not exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can update their avatars" ON storage.objects;
CREATE POLICY "Authenticated users can update their avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 7. Custom OTP Table for Email OTP Engine
CREATE TABLE IF NOT EXISTS public.user_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  verified BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_user_otps_email ON public.user_otps(email);
CREATE INDEX IF NOT EXISTS idx_user_otps_code ON public.user_otps(otp_code);

ALTER TABLE public.user_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to user_otps" ON public.user_otps;
CREATE POLICY "Allow all access to user_otps"
  ON public.user_otps
  FOR ALL
  USING (true)
  WITH CHECK (true);
