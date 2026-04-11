"""Vercel Serverless Function: Generate OTP and send via Resend."""
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


def send_otp_email(to_email, otp_code):
    url = "https://api.resend.com/emails"
    payload = {
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": f"{otp_code} is your NamasteeWanderrlust verification code",
        "html": OTP_EMAIL_TEMPLATE.replace("{{OTP_CODE}}", otp_code)
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {RESEND_API_KEY}")
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode("utf-8"))


OTP_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#d4773b,#c49a4e);padding:32px 32px 24px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:26px;letter-spacing:1px;font-weight:700;">NamasteeWanderrlust</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px;letter-spacing:0.5px;">Travel the World with Your Favorite Influencer</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:40px 32px;text-align:center;">
    <p style="color:#f5f0e8;font-size:16px;margin:0 0 6px;font-weight:500;">Your verification code</p>
    <p style="color:#9b9384;font-size:13px;margin:0 0 24px;">Enter this code to continue with your booking</p>
    <div style="background:#2c2418;border:2px solid #d4a743;border-radius:12px;padding:24px;margin:0 auto;max-width:280px;">
      <span style="font-size:42px;font-weight:700;letter-spacing:12px;color:#d4a743;font-family:'Courier New',monospace;">{{OTP_CODE}}</span>
    </div>
    <p style="color:#9b9384;font-size:12px;margin:24px 0 0;">This code expires in <strong style="color:#f5f0e8;">10 minutes</strong></p>
  </td></tr>
  <!-- Divider -->
  <tr><td style="padding:0 32px;"><div style="border-top:1px solid rgba(255,255,255,0.08);"></div></td></tr>
  <!-- Security note -->
  <tr><td style="padding:20px 32px;text-align:center;">
    <p style="color:#6b6356;font-size:11px;margin:0;line-height:1.6;">If you didn't request this code, you can safely ignore this email.<br>Never share your verification code with anyone.</p>
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#111;padding:20px 32px;text-align:center;">
    <p style="color:#d4773b;font-size:12px;margin:0 0 4px;font-weight:600;">NamasteeWanderrlust</p>
    <p style="color:#6b6356;font-size:10px;margin:0;">namasteewanderrlust@gmail.com &middot; 07208301453 &middot; @namasteewanderrlust</p>
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

        if not email or "@" not in email:
            return {"statusCode": 400, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Invalid email address"})}

        otp_code = supabase_rpc("generate_otp", {"user_email": email})
        send_otp_email(email, otp_code)

        # Check if user exists
        user_info = supabase_rpc("check_user", {"user_email": email})

        return {"statusCode": 200, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"success": True, "message": "OTP sent", "user_exists": user_info.get("exists", False), "has_password": user_info.get("has_password", False)})}

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        return {"statusCode": 500, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": f"Failed to send OTP: {error_body}"})}
    except Exception as e:
        return {"statusCode": 500, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": str(e)})}
