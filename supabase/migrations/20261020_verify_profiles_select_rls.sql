-- ==============================================================================
-- Migration: Verify Profiles SELECT RLS Policy and Role Permissions
-- Ensures public.profiles table has explicit SELECT policies for authenticated users
-- ==============================================================================

-- 1. Ensure schema and table privileges are granted to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, service_role;

-- 2. Ensure Row Level Security (RLS) is enabled on public.profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Clean up any existing duplicate / restrictive SELECT policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;

-- 4. Explicit SELECT policy allowing authenticated users to read profile records
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Also allow anonymous users to view public profiles for unauthenticated search/login discovery
CREATE POLICY "Public profiles are viewable by anon"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);
