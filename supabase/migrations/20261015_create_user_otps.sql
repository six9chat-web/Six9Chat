-- Migration: Create user_otps table for custom database OTP engine
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

-- Enable RLS
ALTER TABLE public.user_otps ENABLE ROW LEVEL SECURITY;

-- Allow service and anon access for OTP handling
DROP POLICY IF EXISTS "Allow all access to user_otps" ON public.user_otps;
CREATE POLICY "Allow all access to user_otps"
  ON public.user_otps
  FOR ALL
  USING (true)
  WITH CHECK (true);
