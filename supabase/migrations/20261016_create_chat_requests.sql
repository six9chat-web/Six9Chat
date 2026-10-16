-- ==============================================================================
-- Six9Chat Database Migration Script
-- Pending Chat Requests Table & Real-time Policies
-- ==============================================================================

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

-- Index for speedy realtime polling & lookups
CREATE INDEX IF NOT EXISTS idx_chat_requests_receiver ON public.chat_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_sender ON public.chat_requests(sender_id);

-- Enable RLS
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;

-- 1. View Requests: Either sender or receiver can see the request
DROP POLICY IF EXISTS "Users can view their chat requests" ON public.chat_requests;
CREATE POLICY "Users can view their chat requests"
  ON public.chat_requests
  FOR SELECT
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- 2. Send Request: Authenticated user can send requests as sender
DROP POLICY IF EXISTS "Users can send chat requests" ON public.chat_requests;
CREATE POLICY "Users can send chat requests"
  ON public.chat_requests
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- 3. Accept/Reject Request: Receiver (or sender) can update status
DROP POLICY IF EXISTS "Users can update chat requests" ON public.chat_requests;
CREATE POLICY "Users can update chat requests"
  ON public.chat_requests
  FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id)
  WITH CHECK (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- 4. Delete Request: Receiver or sender can cancel / delete
DROP POLICY IF EXISTS "Users can delete chat requests" ON public.chat_requests;
CREATE POLICY "Users can delete chat requests"
  ON public.chat_requests
  FOR DELETE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Enable Realtime publication for chat_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_requests;
