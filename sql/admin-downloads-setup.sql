-- ═══════════════════════════════════════════
-- Itinerary Downloads Tracking + Admin RPC Functions
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Itinerary downloads tracking table
CREATE TABLE IF NOT EXISTS itinerary_downloads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  user_name text,
  trip text DEFAULT 'Munnar',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_downloads_email ON itinerary_downloads(user_email);

-- RLS
ALTER TABLE itinerary_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access to downloads" ON itinerary_downloads FOR ALL USING (false);

-- ─── RPC: Track itinerary download ───
CREATE OR REPLACE FUNCTION track_download(user_email text, user_name text DEFAULT '', trip text DEFAULT 'Munnar')
RETURNS json AS $$
BEGIN
  INSERT INTO itinerary_downloads (user_email, user_name, trip)
  VALUES (user_email, user_name, trip);
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION track_download(text, text, text) TO anon;

-- ─── RPC: Get all downloads (admin) ───
CREATE OR REPLACE FUNCTION get_downloads()
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(d)), '[]'::json)
    FROM (SELECT * FROM itinerary_downloads ORDER BY created_at DESC) d
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_downloads() TO anon;

-- ─── RPC: Get all registered users (admin) ───
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(u)), '[]'::json)
    FROM (
      SELECT id, email, name, phone, is_new, created_at
      FROM users ORDER BY created_at DESC
    ) u
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_all_users() TO anon;

-- ─── RPC: Get all bookings (admin) ───
CREATE OR REPLACE FUNCTION get_all_bookings()
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json)
    FROM (
      SELECT id, user_name, user_email, user_phone, trip_id, package_type,
             amount_paise, razorpay_order_id, razorpay_payment_id, payment_status, created_at
      FROM bookings ORDER BY created_at DESC
    ) b
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_all_bookings() TO anon;

-- ─── RPC: Get admin stats ───
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json AS $$
DECLARE
  total_users integer;
  total_bookings integer;
  confirmed_bookings integer;
  pending_bookings integer;
  total_revenue bigint;
  total_waitlist integer;
  total_downloads integer;
BEGIN
  SELECT COUNT(*) INTO total_users FROM users;
  SELECT COUNT(*) INTO total_bookings FROM bookings;
  SELECT COUNT(*) INTO confirmed_bookings FROM bookings WHERE payment_status = 'completed';
  SELECT COUNT(*) INTO pending_bookings FROM bookings WHERE payment_status = 'pending';
  SELECT COALESCE(SUM(amount_paise), 0) INTO total_revenue FROM bookings WHERE payment_status = 'completed';
  SELECT COUNT(*) INTO total_waitlist FROM waitlist;
  SELECT COUNT(*) INTO total_downloads FROM itinerary_downloads;

  RETURN json_build_object(
    'total_users', total_users,
    'total_bookings', total_bookings,
    'confirmed_bookings', confirmed_bookings,
    'pending_bookings', pending_bookings,
    'total_revenue', total_revenue,
    'total_waitlist', total_waitlist,
    'total_downloads', total_downloads
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_admin_stats() TO anon;
