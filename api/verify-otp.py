from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://aczvtyyjliocxtmfhflx.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")


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
            code = body.get("code", "").strip()

            if not email or not code:
                return self._json(400, {"error": "Email and code are required"})

            is_valid = supabase_rpc("verify_otp", {"user_email": email, "user_code": code})

            if is_valid:
                user_info = supabase_rpc("check_user", {"user_email": email})
                self._json(200, {"success": True, "verified": True, "user_exists": user_info.get("exists", False), "has_password": user_info.get("has_password", False)})
            else:
                self._json(401, {"success": False, "error": "Invalid or expired OTP"})
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
