"""Vercel Serverless Function: Register user (set password after OTP verification)."""
import json
import os
import urllib.request
import urllib.error

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://aczvtyyjliocxtmfhflx.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "NamasteeWanderrlust <hello@namasteewanderrlust.com>")


def supabase_rpc(function_name, params):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{function_name}"
    data = json.dumps(params).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("apikey", SUPABASE_ANON_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_ANON_KEY}")
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode("utf-8"))


def send_welcome_email(to_email, user_name):
    url = "https://api.resend.com/emails"
    first_name = user_name.split()[0] if user_name else "Traveler"
    payload = {
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": f"Welcome aboard, {first_name}! Your adventure begins here",
        "html": WELCOME_EMAIL_TEMPLATE.replace("{{USER_NAME}}", first_name)
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {RESEND_API_KEY}")
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode("utf-8"))


WELCOME_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
  <!-- Header with gradient -->
  <tr><td style="background:linear-gradient(135deg,#d4773b,#c49a4e);padding:40px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:1px;font-weight:700;">Welcome Aboard!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:14px;">NamasteeWanderrlust</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:40px 32px;">
    <p style="color:#f5f0e8;font-size:18px;margin:0 0 16px;font-weight:600;">Hey {{USER_NAME}}! &#127796;</p>
    <p style="color:#c4a97d;font-size:14px;margin:0 0 24px;line-height:1.7;">Welcome to the NamasteeWanderrlust family! We're thrilled to have you join a community of travel enthusiasts who believe in exploring the world with their favorite influencers.</p>

    <!-- What's next box -->
    <div style="background:#2c2418;border-radius:12px;padding:24px;margin:0 0 24px;">
      <p style="color:#d4a743;font-size:14px;font-weight:700;margin:0 0 16px;">Here's what you can do next:</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="padding:6px 0;"><span style="color:#d4773b;font-size:14px;">&#10003;</span> <span style="color:#f5f0e8;font-size:13px;">Browse our upcoming trips</span></td></tr>
        <tr><td style="padding:6px 0;"><span style="color:#d4773b;font-size:14px;">&#10003;</span> <span style="color:#f5f0e8;font-size:13px;">Book your dream adventure</span></td></tr>
        <tr><td style="padding:6px 0;"><span style="color:#d4773b;font-size:14px;">&#10003;</span> <span style="color:#f5f0e8;font-size:13px;">Follow us on Instagram for updates</span></td></tr>
        <tr><td style="padding:6px 0;"><span style="color:#d4773b;font-size:14px;">&#10003;</span> <span style="color:#f5f0e8;font-size:13px;">Join our WhatsApp community</span></td></tr>
      </table>
    </div>

    <!-- CTA Button -->
    <table cellpadding="0" cellspacing="0" width="100%">
    <tr><td align="center">
      <a href="https://namasteewanderrlust.com" style="display:inline-block;background:linear-gradient(135deg,#d4773b,#c49a4e);color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:0.5px;">Explore Trips</a>
    </td></tr>
    </table>
  </td></tr>
  <!-- Social -->
  <tr><td style="padding:0 32px 24px;text-align:center;">
    <p style="color:#6b6356;font-size:12px;margin:0 0 8px;">Follow us for travel inspiration</p>
    <a href="https://instagram.com/namasteewanderrlust" style="color:#d4773b;font-size:12px;text-decoration:none;font-weight:600;">@namasteewanderrlust</a>
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#111;padding:20px 32px;text-align:center;">
    <p style="color:#d4773b;font-size:12px;margin:0 0 4px;font-weight:600;">NamasteeWanderrlust</p>
    <p style="color:#6b6356;font-size:10px;margin:0;">Travel the World with Your Favorite Influencer</p>
    <p style="color:#6b6356;font-size:10px;margin:6px 0 0;">namasteewanderrlust@gmail.com &middot; 07208301453</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
"""


def handler(request):
    if request.method == "OPTIONS":
        return {"statusCode": 204, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"}}

    if request.method != "POST":
        return {"statusCode": 405, "body": json.dumps({"error": "Method not allowed"})}

    try:
        body = json.loads(request.body)
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        name = body.get("name", "").strip()
        phone = body.get("phone", "").strip()

        if not email or not password or not name:
            return {"statusCode": 400, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Email, password, and name are required"})}

        if len(password) < 6:
            return {"statusCode": 400, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Password must be at least 6 characters"})}

        # Register user
        result = supabase_rpc("register_user", {
            "user_email": email,
            "user_password": password,
            "user_name": name,
            "user_phone": phone
        })

        if isinstance(result, dict) and result.get("error"):
            return {"statusCode": 400, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": result["error"]})}

        # Send welcome email (non-blocking — don't fail if email fails)
        try:
            send_welcome_email(email, name)
        except Exception:
            pass

        return {"statusCode": 200, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"success": True, "user": result})}

    except Exception as e:
        return {"statusCode": 500, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": str(e)})}
