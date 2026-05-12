from http.server import BaseHTTPRequestHandler
import json
import os
import time
import urllib.request
import urllib.error

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://aczvtyyjliocxtmfhflx.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")


def supabase_rpc(fn, params):
    """Call a Supabase RPC. Retries on transient Vercel cold-start network
    errors like '[Errno 16] Device or resource busy' which surface from
    urllib.request when DNS / socket setup contends with another request."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/{fn}"
    data = json.dumps(params).encode("utf-8")
    last_err = None
    # 5 attempts with progressive backoff: 0.3s, 0.6s, 1.2s, 2.4s (~4.5s total)
    # Targets Vercel Python cold-start DNS EBUSY from _socket.getaddrinfo.
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, data=data, method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("apikey", SUPABASE_ANON_KEY)
            req.add_header("Authorization", f"Bearer {SUPABASE_ANON_KEY}")
            req.add_header("User-Agent", "NamasteeWanderrlust/1.0")
            resp = urllib.request.urlopen(req, timeout=15)
            return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError:
            # Non-2xx — surface to caller without retrying
            raise
        except (urllib.error.URLError, OSError) as e:
            last_err = e
            if attempt < 4:
                time.sleep(0.3 * (2 ** attempt))
    raise last_err  # type: ignore[misc]


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

            if not email or not password:
                return self._json(400, {"error": "Email and password are required"})

            result = supabase_rpc("admin_login", {
                "admin_email": email,
                "admin_password": password
            })

            if isinstance(result, dict) and result.get("error"):
                return self._json(401, {"error": result["error"]})

            self._json(200, {"success": True, "email": result.get("email", email)})
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
