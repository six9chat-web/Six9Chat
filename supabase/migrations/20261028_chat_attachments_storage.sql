-- ==============================================================================
-- Six9Chat: Storage Bucket & RLS Policies for Chat Attachments
-- ==============================================================================

-- 1. Create the 'chat-attachments' storage bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  52428800 -- 50MB limit
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- 2. Ensure RLS is active on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public Read Access for chat attachments
DROP POLICY IF EXISTS "Public Attachment View Policy" ON storage.objects;
CREATE POLICY "Public Attachment View Policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

-- 4. Policy: Allow all uploads/inserts for chat attachments
DROP POLICY IF EXISTS "Chat Attachment Insert Policy" ON storage.objects;
CREATE POLICY "Chat Attachment Insert Policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments');

-- 5. Policy: Allow updates/deletes for chat attachments
DROP POLICY IF EXISTS "Chat Attachment Update Policy" ON storage.objects;
CREATE POLICY "Chat Attachment Update Policy"
ON storage.objects FOR UPDATE
USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Chat Attachment Delete Policy" ON storage.objects;
CREATE POLICY "Chat Attachment Delete Policy"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-attachments');
