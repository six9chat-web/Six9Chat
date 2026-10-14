-- ==============================================================================
-- Six9Chat: Supabase Storage Bucket & RLS Policies for Profile Avatars
-- ==============================================================================

-- 1. Create the 'avatars' storage bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Ensure RLS is active on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public Read Access (Anyone can view avatars)
DROP POLICY IF EXISTS "Public Avatar View Policy" ON storage.objects;
CREATE POLICY "Public Avatar View Policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 4. Policy: Authenticated User Upload (Users can ONLY upload into their own folder: userId/*)
DROP POLICY IF EXISTS "User Avatar Upload Policy" ON storage.objects;
CREATE POLICY "User Avatar Upload Policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 5. Policy: Authenticated User Update (Users can ONLY overwrite/update their own avatar files)
DROP POLICY IF EXISTS "User Avatar Update Policy" ON storage.objects;
CREATE POLICY "User Avatar Update Policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 6. Policy: Authenticated User Delete (Users can ONLY delete their own avatar files)
DROP POLICY IF EXISTS "User Avatar Delete Policy" ON storage.objects;
CREATE POLICY "User Avatar Delete Policy"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
