-- ==============================================================================
-- Fix Profiles RLS SELECT Access for User Search & Discovery
-- Ensure public.profiles table has unrestricted SELECT policy for all users
-- ==============================================================================

-- 1. Ensure table permissions are granted to anon, authenticated, and service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, service_role;

-- 2. Ensure RLS is active on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop all potentially restrictive SELECT policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;

-- 4. Create explicit unrestricted SELECT policy for everyone (authenticated & anonymous)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  TO public
  USING (true);
