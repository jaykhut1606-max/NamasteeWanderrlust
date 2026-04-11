-- ═══════════════════════════════════════════
-- OTP Codes Table & Functions
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Table to store OTP codes
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email, verified);

-- Auto-delete expired OTPs (cleanup)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate OTP function (called from server)
CREATE OR REPLACE FUNCTION generate_otp(user_email text)
RETURNS text AS $$
DECLARE
  otp_code text;
BEGIN
  -- Delete old OTPs for this email
  DELETE FROM otp_codes WHERE email = user_email;

  -- Generate 6-digit code
  otp_code := lpad(floor(random() * 1000000)::text, 6, '0');

  -- Store it
  INSERT INTO otp_codes (email, code) VALUES (user_email, otp_code);

  RETURN otp_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify OTP function (called from client)
CREATE OR REPLACE FUNCTION verify_otp(user_email text, user_code text)
RETURNS boolean AS $$
DECLARE
  is_valid boolean;
BEGIN
  -- Check if valid unexpired OTP exists
  SELECT EXISTS(
    SELECT 1 FROM otp_codes
    WHERE email = user_email
      AND code = user_code
      AND verified = false
      AND expires_at > now()
  ) INTO is_valid;

  IF is_valid THEN
    -- Mark as verified
    UPDATE otp_codes SET verified = true WHERE email = user_email AND code = user_code;
  END IF;

  RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: Allow anonymous to call verify_otp via RPC (read-only)
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- No direct table access from client
CREATE POLICY "No direct access" ON otp_codes FOR ALL USING (false);

-- Grant execute on functions to anon role
GRANT EXECUTE ON FUNCTION verify_otp(text, text) TO anon;
GRANT EXECUTE ON FUNCTION generate_otp(text) TO anon;
