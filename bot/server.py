"""
CodeRaksh Company — Autonomous AI CEO Phone Chatbot Server
FastAPI Webhook server bridging WhatsApp Cloud API and Telegram Bot
directly with the Claude 3.5 Sonnet Executive Brain.
"""

import os
import json
import urllib.request
from datetime import datetime
from fastapi import FastAPI, Request, Response, BackgroundTasks
import uvicorn

app = FastAPI(title="CodeRaksh AI CEO Chatbot", version="3.0")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "coderaksh_secure_verify_2026")

def ask_claude_ceo(query: str, sender: str = "Founder") -> str:
    """Invokes Claude 3.5 Sonnet to answer as the CodeRaksh AI CEO."""
    if not ANTHROPIC_API_KEY:
        return f"👑 [CodeRaksh CEO Quick Radar]\nFounder, I received your query: '{query}'.\n• System Status: All 26 AI Agents Active\n• Health Score: 88/100 (HEALTHY)\n• Today's Hot Deals: FinTech Solutions (₹1.5L), EduTech Labs (₹75K)\n(Connect ANTHROPIC_API_KEY for dynamic real-time reasoning)."

    url = "https://api.anthropic.com/v1/messages"
    prompt = f"""You are the Chief Executive Officer (CEO) of CodeRaksh Company.
The Founder ({sender}) has messaged you via mobile chat (WhatsApp/Telegram).
Founder's Message: "{query}"

Context:
- Company: CodeRaksh Company (Cyber Security, DevSecOps & AI Software)
- 26 Active AI Agents (Sales, Support, Marketing, Finance, Ops, DevSecOps)
- Today's Health Score: 88/100
- 2 Hot Leads pending callback: Amit Sharma (FinTech Solutions), Neha Patil (EduTech Labs)
- Overdue Receivables: ₹2,35,000 across 2 invoices

Reply directly, warmly, and concisely (max 6-8 lines) with exact numbers and clear executive recommendations.
Support Marathi, Hinglish, or English naturally as used by the founder."""

    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 400,
        "temperature": 0.25,
        "messages": [{"role": "user", "content": prompt}]
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["content"][0]["text"]
    except Exception as e:
        return f"👑 [CodeRaksh CEO Radar]\nHealth: 88/100 · 2 Hot Leads Pending · ₹2.35L Overdue.\n(AI reasoning error: {str(e)})"

def send_whatsapp_message(to_number: str, text: str):
    if not (WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN):
        print(f"[Mock WhatsApp to {to_number}]: {text}")
        return

    url = f"https://graph.facebook.com/v19.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    body = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": text}
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"WhatsApp send error: {e}")

@app.get("/")
def root():
    return {
        "system": "CodeRaksh AI CEO Chatbot Server",
        "status": "online",
        "health_score": "88/100",
        "active_agents": 26,
        "endpoints": ["/whatsapp-webhook", "/telegram-webhook"]
    }

# WhatsApp Webhook Verification
@app.get("/whatsapp-webhook")
def verify_whatsapp(request: Request):
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    if mode == "subscribe" and token == VERIFY_TOKEN:
        return Response(content=challenge, media_type="text/plain")
    return Response(content="Forbidden", status_code=403)

# WhatsApp Incoming Messages
@app.post("/whatsapp-webhook")
async def handle_whatsapp(request: Request, bg: BackgroundTasks):
    data = await request.json()
    try:
        entry = data.get("entry", [])[0]
        change = entry.get("changes", [])[0]["value"]
        messages = change.get("messages", [])
        if messages:
            msg = messages[0]
            from_num = msg["from"]
            text = msg.get("text", {}).get("body", "")
            
            def process_chat():
                reply = ask_claude_ceo(text, sender=from_num)
                send_whatsapp_message(from_num, reply)
                
            bg.add_task(process_chat)
    except Exception as e:
        print("Error handling WhatsApp:", e)
    return {"status": "received"}

# Telegram Webhook
@app.post("/telegram-webhook")
async def handle_telegram(request: Request, bg: BackgroundTasks):
    data = await request.json()
    message = data.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    text = message.get("text", "")

    if chat_id and text:
        def reply_tg():
            reply = ask_claude_ceo(text, sender=str(chat_id))
            if TELEGRAM_BOT_TOKEN:
                tg_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
                payload = {"chat_id": chat_id, "text": reply}
                req = urllib.request.Request(
                    tg_url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                try:
                    urllib.request.urlopen(req, timeout=10)
                except Exception as e:
                    print("Telegram error:", e)
            else:
                print(f"[Mock Telegram to {chat_id}]: {reply}")

        bg.add_task(reply_tg)

    return {"status": "ok"}

if __name__ == "__main__":
    print("🚀 Starting CodeRaksh AI CEO Chatbot on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
