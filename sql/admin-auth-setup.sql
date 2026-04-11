-- ═══════════════════════════════════════════
-- Admin Auth Setup
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Drop old admins table if it exists (was just email allowlist)
DROP TABLE IF EXISTS admins;

-- New admins table with password
CREATE TABLE admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access to admins" ON admins FOR ALL USING (false);

-- Insert the admin account
INSERT INTO admins (email, password_hash)
VALUES ('admin@namasteewanderrlust.com', crypt('Seeyoulaters123!', gen_salt('bf')));

-- Admin login RPC
CREATE OR REPLACE FUNCTION admin_login(admin_email text, admin_password text)
RETURNS json AS $$
DECLARE
  found_admin admins%ROWTYPE;
BEGIN
  SELECT * INTO found_admin FROM admins
  WHERE email = admin_email
    AND password_hash = crypt(admin_password, password_hash);

  IF found_admin.id IS NULL THEN
    RETURN json_build_object('error', 'Invalid credentials');
  END IF;

  RETURN json_build_object('success', true, 'email', found_admin.email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_login(text, text) TO anon;
