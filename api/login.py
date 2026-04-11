"""Vercel Serverless Function: Login with email + password."""
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
        password = body.get("password", "")

        if not email or not password:
            return {"statusCode": 400, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": "Email and password are required"})}

        result = supabase_rpc("login_user", {"user_email": email, "user_password": password})

        if isinstance(result, dict) and result.get("error"):
            return {"statusCode": 401, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": result["error"]})}

        return {"statusCode": 200, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"success": True, "user": result})}

    except Exception as e:
        return {"statusCode": 500, "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, "body": json.dumps({"error": str(e)})}
