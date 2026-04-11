#!/usr/bin/env python3
"""
Local dev server with API endpoints for OTP email authentication.
- Serves static files
- POST /api/send-otp  → generates OTP via Supabase RPC, sends email via Resend
- POST /api/verify-otp → verifies OTP via Supabase RPC
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


def supabase_rpc(function_name, params):
    """Call a Supabase RPC function."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/{function_name}"
    data = json.dumps(params).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("apikey", SUPABASE_ANON_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_ANON_KEY}")

    resp = urllib.request.urlopen(req)
    body = resp.read().decode("utf-8")
    # RPC returns the value directly (e.g. "\"123456\"" for text, "true" for boolean)
    return json.loads(body)


def send_email_via_resend(to_email, otp_code):
    """Send OTP email using Resend HTTP API."""
    url = "https://api.resend.com/emails"
    payload = {
        "from": "NamasteeWanderrlust <onboarding@resend.dev>",
        "to": [to_email],
        "subject": f"Your NamasteeWanderrlust verification code: {otp_code}",
        "html": f"""
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #d4773b, #c49a4e); padding: 30px 24px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px;">NamasteeWanderrlust</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Travel the World with Your Favorite Influencer</p>
            </div>
            <div style="padding: 32px 24px; text-align: center;">
                <p style="color: #f5f0e8; font-size: 15px; margin: 0 0 8px;">Your verification code is:</p>
                <div style="background: #2c2418; border: 2px solid #d4a743; border-radius: 10px; padding: 18px; margin: 16px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d4a743;">{otp_code}</span>
                </div>
                <p style="color: #9b9384; font-size: 13px; margin: 16px 0 0;">This code expires in <strong style="color:#f5f0e8;">10 minutes</strong>.</p>
                <p style="color: #6b6356; font-size: 12px; margin: 20px 0 0;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
            <div style="background: #111; padding: 16px 24px; text-align: center;">
                <p style="color: #6b6356; font-size: 11px; margin: 0;">© 2026 NamasteeWanderrlust · namasteewanderrlust@gmail.com</p>
            </div>
        </div>
        """
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {RESEND_API_KEY}")

    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode("utf-8"))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def _send_json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length)) if length else {}

    # ─── CORS preflight ───
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    # ─── API Routes ───
    def do_POST(self):
        if self.path == "/api/send-otp":
            self._handle_send_otp()
        elif self.path == "/api/verify-otp":
            self._handle_verify_otp()
        else:
            self._send_json(404, {"error": "Not found"})

    def _handle_send_otp(self):
        try:
            body = self._read_body()
            email = body.get("email", "").strip().lower()

            if not email or "@" not in email:
                self._send_json(400, {"error": "Invalid email address"})
                return

            # 1. Generate OTP via Supabase RPC
            otp_code = supabase_rpc("generate_otp", {"user_email": email})
            print(f"[OTP] Generated code for {email}: {otp_code}")

            # 2. Send email via Resend
            result = send_email_via_resend(email, otp_code)
            print(f"[Resend] Email sent: {result}")

            self._send_json(200, {"success": True, "message": "OTP sent to your email"})

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            print(f"[ERROR] HTTP {e.code}: {error_body}")
            self._send_json(500, {"error": f"Failed to send OTP: {error_body}"})
        except Exception as e:
            print(f"[ERROR] {e}")
            self._send_json(500, {"error": str(e)})

    def _handle_verify_otp(self):
        try:
            body = self._read_body()
            email = body.get("email", "").strip().lower()
            code = body.get("code", "").strip()

            if not email or not code:
                self._send_json(400, {"error": "Email and code are required"})
                return

            # Verify via Supabase RPC
            is_valid = supabase_rpc("verify_otp", {"user_email": email, "user_code": code})
            print(f"[OTP] Verify {email} with {code}: {is_valid}")

            if is_valid:
                self._send_json(200, {"success": True, "verified": True})
            else:
                self._send_json(401, {"success": False, "error": "Invalid or expired OTP"})

        except Exception as e:
            print(f"[ERROR] {e}")
            self._send_json(500, {"error": str(e)})


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"✨ NamasteeWanderrlust server running at http://localhost:{PORT}")
    print(f"   API endpoints: /api/send-otp, /api/verify-otp")
    httpd.serve_forever()
