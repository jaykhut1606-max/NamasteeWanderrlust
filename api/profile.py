"""Vercel Serverless Function: Get user profile with bookings."""
import json
import os
import urllib.request
import urllib.error

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://aczvtyyjliocxtmfhflx.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")


def supabase_rpc(function_name, params):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{function_name}"
    data = json.dumps(params).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("apikey", SUPABASE_ANON_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_ANON_KEY}")
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode("utf-8"))


def handler(request):
    if request.method == "OPTIONS":
        return {"statusCode": 204, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"}}

    if request.method != "POST":
        return {"statusCode": 405, "body": json.dumps({"error": "Method not allowed"})}

    try:
        body = json.loads(request.body)
        email = body.get("email", "").strip().lower()

        if not email:
            return {"statusCode": 400, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Email is required"})}

        result = supabase_rpc("get_user_profile", {"user_email": email})

        if isinstance(result, dict) and result.get("error"):
            return {"statusCode": 404, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": result["error"]})}

        return {"statusCode": 200, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"success": True, "profile": result})}

    except Exception as e:
        return {"statusCode": 500, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": str(e)})}
