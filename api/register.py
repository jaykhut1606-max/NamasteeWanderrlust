from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://aczvtyyjliocxtmfhflx.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
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


WELCOME_TEMPLATE = """<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 20px;"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#d4773b,#c49a4e);padding:40px 32px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">Welcome Aboard!</h1>
<p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:14px;">NamasteeWanderrlust</p></td></tr>
<tr><td style="padding:40px 32px;">
<p style="color:#f5f0e8;font-size:18px;margin:0 0 16px;font-weight:600;">Hey {{NAME}}! &#127796;</p>
<p style="color:#c4a97d;font-size:14px;margin:0 0 24px;line-height:1.7;">Welcome to NamasteeWanderrlust! We're thrilled to have you join a community of travel enthusiasts exploring the world with their favorite influencers.</p>
<div style="background:#2c2418;border-radius:12px;padding:24px;margin:0 0 24px;">
<p style="color:#d4a743;font-size:14px;font-weight:700;margin:0 0 12px;">What's next:</p>
<p style="color:#f5f0e8;font-size:13px;margin:4px 0;">&#10003; Browse upcoming trips</p>
<p style="color:#f5f0e8;font-size:13px;margin:4px 0;">&#10003; Book your dream adventure</p>
<p style="color:#f5f0e8;font-size:13px;margin:4px 0;">&#10003; Follow us @namasteewanderrlust</p>
<p style="color:#f5f0e8;font-size:13px;margin:4px 0;">&#10003; Join our WhatsApp community</p></div>
<table width="100%"><tr><td align="center">
<a href="https://namasteewanderrlust.com" style="display:inline-block;background:linear-gradient(135deg,#d4773b,#c49a4e);color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:14px;font-weight:700;">Explore Trips</a>
</td></tr></table></td></tr>
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
            password = body.get("password", "")
            name = body.get("name", "").strip()
            phone = body.get("phone", "").strip()

            if not email or not password or not name:
                return self._json(400, {"error": "Email, password, and name are required"})
            if len(password) < 6:
                return self._json(400, {"error": "Password must be at least 6 characters"})

            result = supabase_rpc("register_user", {
                "user_email": email, "user_password": password,
                "user_name": name, "user_phone": phone
            })

            if isinstance(result, dict) and result.get("error"):
                return self._json(400, {"error": result["error"]})

            # Send welcome email
            try:
                first_name = name.split()[0]
                payload = {
                    "from": FROM_EMAIL, "to": [email],
                    "subject": f"Welcome aboard, {first_name}! Your adventure begins here",
                    "html": WELCOME_TEMPLATE.replace("{{NAME}}", first_name)
                }
                data = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request("https://api.resend.com/emails", data=data, method="POST")
                req.add_header("Content-Type", "application/json")
                req.add_header("Authorization", f"Bearer {RESEND_API_KEY}")
                urllib.request.urlopen(req)
            except Exception:
                pass

            self._json(200, {"success": True, "user": result})
        except Exception as e:
            self._json(500, {"error": str(e)})

    def _json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
