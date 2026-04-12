from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error
import hmac
import hashlib

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "NamasteeWanderrlust <hello@namasteewanderrlust.com>")


def supabase_rpc(fn, params):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{fn}"
    data = json.dumps(params).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("apikey", SUPABASE_ANON_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_ANON_KEY}")
    req.add_header("User-Agent", "NamasteeWanderrlust/1.0")
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode("utf-8"))


CONFIRMATION_TEMPLATE = """<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;">

<tr><td style="background:linear-gradient(135deg,#d4773b,#c49a4e);padding:32px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:26px;">NamasteeWanderrlust</h1>
<p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;">Travel the World with Your Favorite Influencer</p>
</td></tr>

<tr><td style="padding:36px 32px 20px;text-align:center;">
<div style="width:56px;height:56px;margin:0 auto 16px;background:#2c2418;border-radius:50%;line-height:56px;font-size:28px;">&#10003;</div>
<h2 style="color:#d4a743;margin:0 0 4px;font-size:24px;">Booking Confirmed!</h2>
<p style="color:#9b9384;font-size:14px;margin:0;">Thank you for your payment, {{NAME}}</p>
</td></tr>

<tr><td style="padding:0 32px 28px;">
<div style="background:#2c2418;border-radius:12px;padding:24px;margin:0 auto;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
<span style="color:#9b9384;font-size:12px;">Trip</span><br>
<span style="color:#f5f0e8;font-size:15px;font-weight:600;">{{TRIP_NAME}}</span>
</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
<span style="color:#9b9384;font-size:12px;">Package</span><br>
<span style="color:#f5f0e8;font-size:15px;font-weight:600;">{{PACKAGE}}</span>
</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
<span style="color:#9b9384;font-size:12px;">Amount Paid</span><br>
<span style="color:#d4a743;font-size:20px;font-weight:700;">{{AMOUNT}}</span>
</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
<span style="color:#9b9384;font-size:12px;">Payment ID</span><br>
<span style="color:#f5f0e8;font-size:13px;font-family:monospace;">{{PAYMENT_ID}}</span>
</td></tr>
<tr><td style="padding:8px 0;">
<span style="color:#9b9384;font-size:12px;">Booking ID</span><br>
<span style="color:#f5f0e8;font-size:13px;font-family:monospace;">{{BOOKING_ID}}</span>
</td></tr>
</table>
</div>
</td></tr>

<tr><td style="padding:0 32px 28px;">
<h3 style="color:#f5f0e8;font-size:16px;margin:0 0 12px;">What's Next?</h3>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:6px 0;"><span style="color:#d4a743;font-size:14px;margin-right:8px;">&#10148;</span><span style="color:#9b9384;font-size:13px;">You'll be added to the exclusive trip WhatsApp group</span></td></tr>
<tr><td style="padding:6px 0;"><span style="color:#d4a743;font-size:14px;margin-right:8px;">&#10148;</span><span style="color:#9b9384;font-size:13px;">Detailed day-wise itinerary will be shared soon</span></td></tr>
<tr><td style="padding:6px 0;"><span style="color:#d4a743;font-size:14px;margin-right:8px;">&#10148;</span><span style="color:#9b9384;font-size:13px;">Travel tips & packing checklist before the trip</span></td></tr>
<tr><td style="padding:6px 0;"><span style="color:#d4a743;font-size:14px;margin-right:8px;">&#10148;</span><span style="color:#9b9384;font-size:13px;">Meet your fellow travelers & influencer hosts</span></td></tr>
</table>
</td></tr>

<tr><td style="padding:0 32px 24px;text-align:center;">
<a href="https://namasteewanderrlust.com" style="display:inline-block;padding:14px 32px;background:#d4773b;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">View My Bookings</a>
</td></tr>

<tr><td style="padding:0 32px;"><div style="border-top:1px solid rgba(255,255,255,0.08);"></div></td></tr>
<tr><td style="padding:16px 32px;text-align:center;">
<p style="color:#6b6356;font-size:11px;margin:0;">Questions? Reply to this email or call us at +91 72083 01453</p>
</td></tr>
<tr><td style="background:#111;padding:16px 32px;text-align:center;">
<p style="color:#6b6356;font-size:10px;margin:0;">NamasteeWanderrlust &middot; hello@namasteewanderrlust.com &middot; +91 72083 01453</p>
</td></tr>
</table></td></tr></table></body></html>"""


PACKAGE_LABELS = {
    "per_person": "Per Person (Solo)",
    "per_couple": "Per Couple",
    "twin_sharing": "Twin Sharing Room",
    "single_with_flight": "Single Occupancy (With Flight)",
    "couple_with_flight": "Couple (With Flight)",
    "twin_with_flight": "Twin Sharing (With Flight)",
    "single_without_flight": "Single Occupancy (Without Flight)",
    "couple_without_flight": "Couple (Without Flight)",
    "twin_without_flight": "Twin Sharing (Without Flight)",
}


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}

            razorpay_order_id = body.get("razorpay_order_id", "")
            razorpay_payment_id = body.get("razorpay_payment_id", "")
            razorpay_signature = body.get("razorpay_signature", "")
            booking_id = body.get("booking_id", "")
            # Extra details for email
            user_name = body.get("user_name", "Traveler")
            user_email = body.get("user_email", "")
            trip_name = body.get("trip_name", "")
            package_type = body.get("package_type", "")
            amount = body.get("amount", 0)

            if not razorpay_payment_id or not razorpay_order_id:
                return self._json(400, {"error": "Missing payment details"})

            # Verify Razorpay signature
            message = f"{razorpay_order_id}|{razorpay_payment_id}"
            expected_signature = hmac.new(
                RAZORPAY_KEY_SECRET.encode("utf-8"),
                message.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()

            if expected_signature != razorpay_signature:
                return self._json(400, {"error": "Payment verification failed — invalid signature"})

            # Update booking in Supabase
            result = supabase_rpc("complete_booking", {
                "p_booking_id": booking_id,
                "p_razorpay_payment_id": razorpay_payment_id,
                "p_razorpay_order_id": razorpay_order_id,
                "p_razorpay_signature": razorpay_signature
            })

            # Send confirmation email (non-blocking)
            try:
                amount_display = f"₹{amount // 100:,}" if amount else "—"
                package_label = PACKAGE_LABELS.get(package_type, package_type.replace("_", " ").title())

                html = CONFIRMATION_TEMPLATE
                html = html.replace("{{NAME}}", user_name)
                html = html.replace("{{TRIP_NAME}}", trip_name)
                html = html.replace("{{PACKAGE}}", package_label)
                html = html.replace("{{AMOUNT}}", amount_display)
                html = html.replace("{{PAYMENT_ID}}", razorpay_payment_id)
                html = html.replace("{{BOOKING_ID}}", booking_id[:8] + "...")

                email_payload = json.dumps({
                    "from": FROM_EMAIL,
                    "to": [user_email],
                    "subject": f"Booking Confirmed! Your {trip_name} trip is booked 🎉",
                    "html": html
                }).encode("utf-8")

                req = urllib.request.Request("https://api.resend.com/emails", data=email_payload, method="POST")
                req.add_header("Content-Type", "application/json")
                req.add_header("Authorization", f"Bearer {RESEND_API_KEY}")
                req.add_header("User-Agent", "NamasteeWanderrlust/1.0")
                urllib.request.urlopen(req)
            except Exception as email_err:
                pass  # Don't fail payment verification if email fails

            self._json(200, {
                "success": True,
                "verified": True,
                "booking_id": booking_id,
                "payment_id": razorpay_payment_id
            })

        except Exception as e:
            import traceback
            self._json(500, {"error": str(e), "trace": traceback.format_exc()})

    def _json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
