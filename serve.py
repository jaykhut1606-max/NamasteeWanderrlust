#!/usr/bin/env python3
"""
Local dev server with API endpoints for auth, waitlist, and profiles.
"""
import http.server
import socketserver
import os
import sys
import json
import urllib.request
import urllib.error

PORT = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else 3000))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# ─── Configuration ───
SUPABASE_URL = "https://aczvtyyjliocxtmfhflx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjenZ0eXlqbGlvY3h0bWZoZmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTA1MDMsImV4cCI6MjA5MTQ2NjUwM30.NNDnAMOxCEzBYCDcJVQGV6vGi8aLFAIK_2m5Ipa9_UQ"
RESEND_API_KEY = "re_iui32uhz_HZoPRGSBF62C1o7o8SEJjzKh"
FROM_EMAIL = "NamasteeWanderrlust <hello@namasteewanderrlust.com>"


def supabase_rpc(function_name, params):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{function_name}"
    data = json.dumps(params).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("apikey", SUPABASE_ANON_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_ANON_KEY}")
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode("utf-8"))


def send_email(to_email, subject, html):
    url = "https://api.resend.com/emails"
    payload = {"from": FROM_EMAIL, "to": [to_email], "subject": subject, "html": html}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {RESEND_API_KEY}")
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode("utf-8"))


OTP_EMAIL = """
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
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
</table></td></tr></table></body></html>
"""

WELCOME_EMAIL = """
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
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
</table></td></tr></table></body></html>
"""


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def _json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length)) if length else {}

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        routes = {
            "/api/send-otp": self._send_otp,
            "/api/verify-otp": self._verify_otp,
            "/api/register": self._register,
            "/api/login": self._login,
            "/api/profile": self._profile,
            "/api/waitlist": self._waitlist,
        }
        handler = routes.get(self.path)
        if handler:
            handler()
        else:
            self._json(404, {"error": "Not found"})

    def _send_otp(self):
        try:
            body = self._body()
            email = body.get("email", "").strip().lower()
            if not email or "@" not in email:
                return self._json(400, {"error": "Invalid email"})

            otp = supabase_rpc("generate_otp", {"user_email": email})
            print(f"[OTP] {email}: {otp}")
            send_email(email, f"{otp} is your NamasteeWanderrlust verification code", OTP_EMAIL.replace("{{OTP}}", otp))

            user_info = supabase_rpc("check_user", {"user_email": email})
            self._json(200, {"success": True, "user_exists": user_info.get("exists", False), "has_password": user_info.get("has_password", False)})
        except Exception as e:
            print(f"[ERROR] {e}")
            self._json(500, {"error": str(e)})

    def _verify_otp(self):
        try:
            body = self._body()
            email = body.get("email", "").strip().lower()
            code = body.get("code", "").strip()
            if not email or not code:
                return self._json(400, {"error": "Email and code required"})

            valid = supabase_rpc("verify_otp", {"user_email": email, "user_code": code})
            if valid:
                user_info = supabase_rpc("check_user", {"user_email": email})
                self._json(200, {"success": True, "verified": True, "user_exists": user_info.get("exists", False), "has_password": user_info.get("has_password", False)})
            else:
                self._json(401, {"error": "Invalid or expired OTP"})
        except Exception as e:
            self._json(500, {"error": str(e)})

    def _register(self):
        try:
            body = self._body()
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            name = body.get("name", "").strip()
            phone = body.get("phone", "").strip()

            if not email or not password or not name:
                return self._json(400, {"error": "Email, password, and name required"})
            if len(password) < 6:
                return self._json(400, {"error": "Password must be at least 6 characters"})

            result = supabase_rpc("register_user", {"user_email": email, "user_password": password, "user_name": name, "user_phone": phone})
            if isinstance(result, dict) and result.get("error"):
                return self._json(400, {"error": result["error"]})

            # Send welcome email
            try:
                first_name = name.split()[0]
                send_email(email, f"Welcome aboard, {first_name}! Your adventure begins here", WELCOME_EMAIL.replace("{{NAME}}", first_name))
            except Exception:
                pass

            self._json(200, {"success": True, "user": result})
        except Exception as e:
            self._json(500, {"error": str(e)})

    def _login(self):
        try:
            body = self._body()
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            if not email or not password:
                return self._json(400, {"error": "Email and password required"})

            result = supabase_rpc("login_user", {"user_email": email, "user_password": password})
            if isinstance(result, dict) and result.get("error"):
                return self._json(401, {"error": result["error"]})

            self._json(200, {"success": True, "user": result})
        except Exception as e:
            self._json(500, {"error": str(e)})

    def _profile(self):
        try:
            body = self._body()
            email = body.get("email", "").strip().lower()
            if not email:
                return self._json(400, {"error": "Email required"})

            result = supabase_rpc("get_user_profile", {"user_email": email})
            if isinstance(result, dict) and result.get("error"):
                return self._json(404, {"error": result["error"]})

            self._json(200, {"success": True, "profile": result})
        except Exception as e:
            self._json(500, {"error": str(e)})

    def _waitlist(self):
        try:
            body = self._body()
            email = body.get("email", "").strip().lower()
            trip = body.get("trip", "General")
            if not email or "@" not in email:
                return self._json(400, {"error": "Invalid email"})

            result = supabase_rpc("add_to_waitlist", {"user_email": email, "trip": trip})
            self._json(200, result)
        except Exception as e:
            self._json(500, {"error": str(e)})


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"✨ NamasteeWanderrlust server at http://localhost:{PORT}")
    print(f"   APIs: /api/send-otp, /api/verify-otp, /api/register, /api/login, /api/profile, /api/waitlist")
    httpd.serve_forever()
