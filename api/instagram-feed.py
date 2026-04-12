from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error

INSTAGRAM_ACCESS_TOKEN = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
INSTAGRAM_USER_ID = os.environ.get("INSTAGRAM_USER_ID", "")


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        try:
            if not INSTAGRAM_ACCESS_TOKEN:
                return self._json(200, {"media": [], "error": "No Instagram token configured"})

            # Fetch latest media from Instagram Graph API
            fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"
            limit = 7

            if INSTAGRAM_USER_ID:
                url = f"https://graph.instagram.com/{INSTAGRAM_USER_ID}/media?fields={fields}&limit={limit}&access_token={INSTAGRAM_ACCESS_TOKEN}"
            else:
                url = f"https://graph.instagram.com/me/media?fields={fields}&limit={limit}&access_token={INSTAGRAM_ACCESS_TOKEN}"

            req = urllib.request.Request(url)
            req.add_header("User-Agent", "NamasteeWanderrlust/1.0")
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode("utf-8"))

            media_items = data.get("data", [])

            # Filter to only VIDEO and CAROUSEL_ALBUM types (reels are VIDEO)
            # Also include IMAGE for posts
            results = []
            for item in media_items:
                media_type = item.get("media_type", "")
                permalink = item.get("permalink", "")

                results.append({
                    "id": item.get("id"),
                    "caption": (item.get("caption") or "")[:100],
                    "media_type": media_type,
                    "thumbnail_url": item.get("thumbnail_url") or item.get("media_url", ""),
                    "media_url": item.get("media_url", ""),
                    "permalink": permalink,
                    "embed_url": permalink + "embed/" if permalink else "",
                    "timestamp": item.get("timestamp", ""),
                })

                if len(results) >= 7:
                    break

            self._json(200, {"media": results})

        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else str(e)
            self._json(200, {"media": [], "error": f"Instagram API error: {e.code}", "details": error_body})
        except Exception as e:
            self._json(200, {"media": [], "error": str(e)})

    def _json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
