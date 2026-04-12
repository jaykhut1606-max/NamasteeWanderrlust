from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error
import base64

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")


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

            amount = body.get("amount")  # in paise
            trip_id = body.get("trip_id", "")
            trip_name = body.get("trip_name", "")
            package_type = body.get("package_type", "")
            user_name = body.get("user_name", "")
            user_email = body.get("user_email", "")
            user_phone = body.get("user_phone", "")

            if not amount or not user_email:
                return self._json(400, {"error": "Missing required fields"})

            # Create Razorpay order
            auth = base64.b64encode(f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode()).decode()
            order_data = json.dumps({
                "amount": amount,
                "currency": "INR",
                "receipt": f"nw_{user_email[:10]}_{amount}",
                "notes": {
                    "trip": trip_name,
                    "package": package_type,
                    "email": user_email
                }
            }).encode("utf-8")

            req = urllib.request.Request("https://api.razorpay.com/v1/orders", data=order_data, method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("Authorization", f"Basic {auth}")
            req.add_header("User-Agent", "NamasteeWanderrlust/1.0")
            resp = urllib.request.urlopen(req)
            order = json.loads(resp.read().decode("utf-8"))

            razorpay_order_id = order["id"]

            # Create pending booking in Supabase
            booking = supabase_rpc("create_booking", {
                "p_trip_id": trip_id,
                "p_user_name": user_name,
                "p_user_email": user_email,
                "p_user_phone": user_phone,
                "p_package_type": package_type,
                "p_amount_paise": amount,
                "p_razorpay_order_id": razorpay_order_id
            })

            self._json(200, {
                "order_id": razorpay_order_id,
                "booking_id": booking.get("id", ""),
                "amount": amount,
                "currency": "INR",
                "key_id": RAZORPAY_KEY_ID
            })

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
