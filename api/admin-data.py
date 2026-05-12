from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error
import time
import urllib.parse
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://aczvtyyjliocxtmfhflx.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")


def supabase_rpc(fn, params=None):
    """Use `requests` (urllib3) to bypass Vercel Python 3.12 cold-start
    DNS EBUSY bug in stdlib urllib."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/{fn}"
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "User-Agent": "NamasteeWanderrlust/1.0",
    }
    last_err = None
    for attempt in range(4):
        try:
            r = requests.post(url, json=(params or {}), headers=headers, timeout=15)
            r.raise_for_status()
            return r.json()
        except requests.HTTPError:
            raise
        except requests.RequestException as e:
            last_err = e
            if attempt < 3:
                time.sleep(0.3 * (2 ** attempt))
    raise last_err


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
            action = body.get("action", "")

            if action == "stats":
                result = supabase_rpc("get_admin_stats")
                self._json(200, result)
            elif action == "users":
                result = supabase_rpc("get_all_users")
                self._json(200, {"users": result})
            elif action == "bookings":
                result = supabase_rpc("get_all_bookings")
                self._json(200, {"bookings": result})
            elif action == "waitlist":
                result = supabase_rpc("get_waitlist")
                self._json(200, {"waitlist": result})
            elif action == "downloads":
                result = supabase_rpc("get_downloads")
                self._json(200, {"downloads": result})
            else:
                self._json(400, {"error": "Invalid action"})
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
