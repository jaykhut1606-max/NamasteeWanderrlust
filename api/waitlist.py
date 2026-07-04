from http.server import BaseHTTPRequestHandler
import json
import os
import time
from datetime import datetime, timezone, timedelta
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://aczvtyyjliocxtmfhflx.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
NOTIFY_EMAIL = os.environ.get("NOTIFY_EMAIL", "namasteewanderrlust@gmail.com")
NOTIFY_FROM = os.environ.get("NOTIFY_FROM", "NamasteeWanderrlust <onboarding@resend.dev>")


def supabase_rpc(fn, params):
    """Call a Supabase RPC using `requests` (urllib3 under the hood).
    Switched from urllib.request to bypass Vercel Python 3.12 cold-start
    DNS bug where _socket.getaddrinfo returns [Errno 16] Device or
    resource busy consistently for the first ~seconds of a fresh container."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/{fn}"
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "User-Agent": "NamasteeWanderrlust/1.0",
    }
    # Retry on transient connection errors (separate from HTTP-level errors).
    last_err = None
    for attempt in range(4):
        try:
            r = requests.post(url, json=params, headers=headers, timeout=15)
            r.raise_for_status()
            return r.json()
        except requests.HTTPError:
            # Bubble 4xx/5xx without retry — auth failures shouldn't retry.
            raise
        except requests.RequestException as e:
            last_err = e
            if attempt < 3:
                time.sleep(0.3 * (2 ** attempt))
    raise last_err


def build_enquiry_email(kind, email, name, trip):
    ist = datetime.now(timezone(timedelta(hours=5, minutes=30)))
    when = ist.strftime("%d %b %Y, %I:%M %p IST")
    name_row = f'<tr><td style="padding:6px 0;color:#6b6356;">Name</td><td style="padding:6px 0;color:#2c2418;font-weight:600;">{name}</td></tr>' if name else ""
    return f"""
<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="440" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#d4773b,#c49a4e);padding:20px 28px;">
<p style="color:#fff;margin:0;font-size:17px;font-weight:700;">New enquiry &middot; {kind}</p></td></tr>
<tr><td style="padding:24px 28px;">
<table width="100%" style="font-size:14px;">
<tr><td style="padding:6px 0;color:#6b6356;width:90px;">Email</td><td style="padding:6px 0;"><a href="mailto:{email}" style="color:#d4773b;font-weight:600;">{email}</a></td></tr>
{name_row}
<tr><td style="padding:6px 0;color:#6b6356;">Trip</td><td style="padding:6px 0;color:#2c2418;font-weight:600;">{trip}</td></tr>
<tr><td style="padding:6px 0;color:#6b6356;">When</td><td style="padding:6px 0;color:#2c2418;">{when}</td></tr>
</table></td></tr>
<tr><td style="background:#f5f0e8;padding:14px 28px;"><p style="color:#6b6356;font-size:11px;margin:0;">namasteewanderrlust.com enquiry alert</p></td></tr>
</table></td></tr></table></body></html>
"""


def send_enquiry_alert(subject, html):
    """Email the site owner about a new enquiry. Best-effort: returns
    False (never raises) so a mail failure can't block the visitor."""
    if not RESEND_API_KEY:
        return False
    try:
        r = requests.post(
            "https://api.resend.com/emails",
            json={"from": NOTIFY_FROM, "to": [NOTIFY_EMAIL], "subject": subject, "html": html},
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            timeout=15,
        )
        return r.status_code < 300
    except requests.RequestException:
        return False


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
            trip = body.get("trip", "General")

            if not email or "@" not in email:
                return self._json(400, {"error": "Invalid email address"})

            # Best-effort database write — the DB being down must not block anything
            stored = False
            try:
                supabase_rpc("add_to_waitlist", {"user_email": email, "trip": trip})
                stored = True
            except Exception:
                pass

            notified = send_enquiry_alert(
                f"New waitlist signup — {trip} ({email})",
                build_enquiry_email("Waitlist", email, "", trip),
            )

            self._json(200, {"success": True, "stored": stored, "notified": notified})
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
