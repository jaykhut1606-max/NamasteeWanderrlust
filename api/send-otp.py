from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://aczvtyyjliocxtmfhflx.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "NamasteeWanderrlust <hello@namasteewanderrlust.com>")


def supabase_rpc(fn, params):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{fn}"
    data = json.dumps(params).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "NamasteeWanderrlust/1.0")
    req.add_header("apikey", SUPABASE_ANON_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_ANON_KEY}")
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode("utf-8"))


OTP_TEMPLATE = """<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#d4773b,#c49a4e);padding:32px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:26px;">NamasteeWanderrlust</h1>
<p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px;">Travel the World with Your Favorite Influencer</p></td></tr>
<tr><td style="padding:40px 32px;text-align:center;">
<p style="color:#f5f0e8;font-size:16px;margin:0 0 6px;">Your verification code</p>
<p style="color:#9b9384;font-size:13px;margin:0 0 24px;">Enter this code to continue</p>
<div style="background:#2c2418;border:2px solid #d4a743;border-radius:12px;padding:24px;margin:0 auto;max-width:280px;">
<span style="font-size:42px;font-weight:700;letter-spacing:12px;color:#d4a743;font-family:'Courier New',monospace;">{{OTP}}</span></div>
<p style="color:#9b9384;font-size:12px;margin:24px 0 0;">Expires in <strong style="color:#f5f0e8;">10 minutes</strong></p></td></tr>
<tr><td style="padding:0 32px;"><div style="border-top:1px solid rgba(255,255,255,0.08);"></div></td></tr>
<tr><td style="padding:20px 32px;text-align:center;"><p style="color:#6b6356;font-size:11px;margin:0;">If you didn't request this, ignore this email.</p></td></tr>
<tr><td style="background:#111;padding:16px 32px;text-align:center;"><p style="color:#6b6356;font-size:10px;margin:0;">namasteewanderrlust@gmail.com &middot; 07208301453</p></td></tr>
</table></td></tr></table></body></html>"""


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
            email = body.get("email", "").strip().lower()

            if not email or "@" not in email:
                return self._json(400, {"error": "Invalid email address"})

            otp_code = supabase_rpc("generate_otp", {"user_email": email})

            # Send email via Resend
            payload = {
                "from": FROM_EMAIL,
                "to": [email],
                "subject": f"{otp_code} is your NamasteeWanderrlust verification code",
                "html": OTP_TEMPLATE.replace("{{OTP}}", str(otp_code))
            }
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request("https://api.resend.com/emails", data=data, method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("Authorization", f"Bearer {RESEND_API_KEY}")
            req.add_header("User-Agent", "NamasteeWanderrlust/1.0")
            urllib.request.urlopen(req)

            user_info = supabase_rpc("check_user", {"user_email": email})
            self._json(200, {"success": True, "user_exists": user_info.get("exists", False), "has_password": user_info.get("has_password", False)})

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            self._json(500, {"error": f"Failed: {error_body}"})
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
