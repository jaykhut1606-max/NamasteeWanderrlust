"""Vercel Serverless Function: Generate OTP and send via Resend."""
import json
import os
import urllib.request
import urllib.error

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://aczvtyyjliocxtmfhflx.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")


def supabase_rpc(function_name, params):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{function_name}"
    data = json.dumps(params).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("apikey", SUPABASE_ANON_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_ANON_KEY}")
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read().decode("utf-8"))


def send_email_via_resend(to_email, otp_code):
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
                <p style="color: #6b6356; font-size: 11px; margin: 0;">&copy; 2026 NamasteeWanderrlust &middot; namasteewanderrlust@gmail.com</p>
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


def handler(request):
    from http.server import BaseHTTPRequestHandler

    # CORS preflight
    if request.method == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        }

    if request.method != "POST":
        return {"statusCode": 405, "body": json.dumps({"error": "Method not allowed"})}

    try:
        body = json.loads(request.body)
        email = body.get("email", "").strip().lower()

        if not email or "@" not in email:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "Invalid email address"}),
            }

        # 1. Generate OTP via Supabase RPC
        otp_code = supabase_rpc("generate_otp", {"user_email": email})

        # 2. Send email via Resend
        send_email_via_resend(email, otp_code)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"success": True, "message": "OTP sent to your email"}),
        }

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": f"Failed to send OTP: {error_body}"}),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)}),
        }
