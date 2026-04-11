-- ═══════════════════════════════════════════
-- Users & Waitlist Tables
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Users table (custom auth — not Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text,
  name text,
  phone text,
  is_new boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  trip_interest text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- ─── RPC: Register user (set password after OTP) ───
CREATE OR REPLACE FUNCTION register_user(
  user_email text,
  user_password text,
  user_name text,
  user_phone text
)
RETURNS json AS $$
DECLARE
  existing_user users%ROWTYPE;
  new_user users%ROWTYPE;
BEGIN
  -- Check if user already exists
  SELECT * INTO existing_user FROM users WHERE email = user_email;

  IF existing_user.id IS NOT NULL THEN
    -- Update existing user
    UPDATE users SET
      password_hash = crypt(user_password, gen_salt('bf')),
      name = user_name,
      phone = user_phone,
      is_new = false,
      updated_at = now()
    WHERE email = user_email
    RETURNING * INTO new_user;
  ELSE
    -- Create new user
    INSERT INTO users (email, password_hash, name, phone, is_new)
    VALUES (user_email, crypt(user_password, gen_salt('bf')), user_name, user_phone, false)
    RETURNING * INTO new_user;
  END IF;

  RETURN json_build_object(
    'id', new_user.id,
    'email', new_user.email,
    'name', new_user.name,
    'phone', new_user.phone,
    'is_new', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RPC: Login with password ───
CREATE OR REPLACE FUNCTION login_user(user_email text, user_password text)
RETURNS json AS $$
DECLARE
  found_user users%ROWTYPE;
BEGIN
  SELECT * INTO found_user FROM users
  WHERE email = user_email
    AND password_hash = crypt(user_password, password_hash);

  IF found_user.id IS NULL THEN
    RETURN json_build_object('error', 'Invalid email or password');
  END IF;

  RETURN json_build_object(
    'id', found_user.id,
    'email', found_user.email,
    'name', found_user.name,
    'phone', found_user.phone,
    'is_new', found_user.is_new
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RPC: Check if user exists (to determine login vs signup flow) ───
CREATE OR REPLACE FUNCTION check_user(user_email text)
RETURNS json AS $$
DECLARE
  found_user users%ROWTYPE;
BEGIN
  SELECT * INTO found_user FROM users WHERE email = user_email;

  IF found_user.id IS NULL THEN
    RETURN json_build_object('exists', false, 'has_password', false);
  END IF;

  RETURN json_build_object(
    'exists', true,
    'has_password', found_user.password_hash IS NOT NULL,
    'name', found_user.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RPC: Get user profile with bookings ───
CREATE OR REPLACE FUNCTION get_user_profile(user_email text)
RETURNS json AS $$
DECLARE
  found_user users%ROWTYPE;
  user_bookings json;
BEGIN
  SELECT * INTO found_user FROM users WHERE email = user_email;

  IF found_user.id IS NULL THEN
    RETURN json_build_object('error', 'User not found');
  END IF;

  -- Get bookings for this user
  SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json)
  INTO user_bookings
  FROM (
    SELECT id, trip_id, user_name, package_type, amount_paise,
           razorpay_payment_id, payment_status, created_at
    FROM bookings
    WHERE user_email = found_user.email
    ORDER BY created_at DESC
  ) b;

  RETURN json_build_object(
    'id', found_user.id,
    'email', found_user.email,
    'name', found_user.name,
    'phone', found_user.phone,
    'created_at', found_user.created_at,
    'bookings', user_bookings
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RPC: Add to waitlist ───
CREATE OR REPLACE FUNCTION add_to_waitlist(user_email text, trip text DEFAULT 'Bali')
RETURNS json AS $$
DECLARE
  existing waitlist%ROWTYPE;
BEGIN
  SELECT * INTO existing FROM waitlist WHERE email = user_email AND trip_interest = trip;

  IF existing.id IS NOT NULL THEN
    RETURN json_build_object('success', true, 'message', 'Already on waitlist');
  END IF;

  INSERT INTO waitlist (email, trip_interest) VALUES (user_email, trip);
  RETURN json_build_object('success', true, 'message', 'Added to waitlist');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RLS ───
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to users" ON users FOR ALL USING (false);
CREATE POLICY "No direct access to waitlist" ON waitlist FOR ALL USING (false);

-- ─── Grants ───
GRANT EXECUTE ON FUNCTION register_user(text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION login_user(text, text) TO anon;
GRANT EXECUTE ON FUNCTION check_user(text) TO anon;
GRANT EXECUTE ON FUNCTION get_user_profile(text) TO anon;
GRANT EXECUTE ON FUNCTION add_to_waitlist(text, text) TO anon;

-- ─── Enable pgcrypto for password hashing ───
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Admin access to waitlist (for admin dashboard) ───
-- Admins query via service key or RPC
CREATE OR REPLACE FUNCTION get_waitlist()
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(w)), '[]'::json)
    FROM (SELECT * FROM waitlist ORDER BY created_at DESC) w
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_waitlist() TO anon;
