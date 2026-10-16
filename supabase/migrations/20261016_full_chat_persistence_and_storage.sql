-- ==============================================================================
-- Six9Chat Database Migration Script
-- Full Realtime Chat, Media Attachments & Supabase Storage Integration
-- ==============================================================================

-- 1. Create or extend `messages` table with full media and reactions support
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

-- Ensure columns exist if table was already created
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_meta JSONB;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

-- Indexes for speedy realtime conversation lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to messages" ON public.messages;
CREATE POLICY "Allow all access to messages"
  ON public.messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Create Storage Bucket for Chat Media Attachments (Photos, Videos, Documents, Audio)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-attachments', 'chat-attachments', true, 52428800) -- 50MB limit
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies for chat-attachments
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public chat attachments view" ON storage.objects;
CREATE POLICY "Public chat attachments view"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Public chat attachments upload" ON storage.objects;
CREATE POLICY "Public chat attachments upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Public chat attachments update" ON storage.objects;
CREATE POLICY "Public chat attachments update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'chat-attachments');

-- 3. Add to Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
