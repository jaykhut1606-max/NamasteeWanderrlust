-- ═══════════════════════════════════════════
-- Booking RPC Functions for Razorpay Integration
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════

-- 1) create_booking: called when Razorpay order is created (payment pending)
CREATE OR REPLACE FUNCTION create_booking(
  p_trip_id TEXT,
  p_user_name TEXT,
  p_user_email TEXT,
  p_user_phone TEXT,
  p_package_type TEXT,
  p_amount_paise BIGINT,
  p_razorpay_order_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  INSERT INTO bookings (
    trip_id, user_name, user_email, user_phone,
    package_type, amount_paise, razorpay_order_id, payment_status
  ) VALUES (
    p_trip_id, p_user_name, p_user_email, p_user_phone,
    p_package_type, p_amount_paise, p_razorpay_order_id, 'pending'
  )
  RETURNING id INTO v_booking_id;

  RETURN json_build_object('id', v_booking_id);
END;
$$;

-- 2) complete_booking: called after Razorpay signature is verified
CREATE OR REPLACE FUNCTION complete_booking(
  p_booking_id UUID,
  p_razorpay_payment_id TEXT,
  p_razorpay_order_id TEXT,
  p_razorpay_signature TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE bookings
  SET payment_status = 'completed',
      razorpay_payment_id = p_razorpay_payment_id,
      razorpay_signature = p_razorpay_signature,
      updated_at = NOW()
  WHERE id = p_booking_id
    AND razorpay_order_id = p_razorpay_order_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Booking not found or order mismatch');
  END IF;

  RETURN json_build_object('success', true, 'booking_id', p_booking_id);
END;
$$;

-- 3) Grant execute permissions to anon role
GRANT EXECUTE ON FUNCTION create_booking TO anon;
GRANT EXECUTE ON FUNCTION complete_booking TO anon;

-- 4) Make sure bookings table has the razorpay_signature column
-- (add it if missing — safe to run even if it exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'razorpay_signature'
  ) THEN
    ALTER TABLE bookings ADD COLUMN razorpay_signature TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;
