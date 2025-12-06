# 🎤 QUICK START - Voice Agent Setup (5 Minutes)

## What I Need From You (Only 3 Things!)

### 1. Get Your Full Twilio Auth Token
- Go to: https://console.twilio.com/
- Click **"Show"** next to Auth Token
- Copy the FULL token

### 2. Update `.env.local`
Add these 3 lines (replace the auth token with yours):

```bash
TWILIO_ACCOUNT_SID=ACbe0fd20294a9
TWILIO_AUTH_TOKEN=YOUR_FULL_TOKEN_HERE
TWILIO_PHONE_NUMBER=+17279662653
```

### 3. Update Twilio Webhooks

**Quick way with ngrok:**
```bash
# Install ngrok
npm install -g ngrok

# Run it
ngrok http 3000

# Copy the https URL it gives you
# Update Twilio webhooks at:
# https://console.twilio.com/us1/develop/phone-numbers/manage/active

# Click your number (+17279662653)
# Change "A call comes in" to:
# https://YOUR-NGROK-URL.ngrok.io/api/voice/twiml

# Change "Call status changes" to:
# https://YOUR-NGROK-URL.ngrok.io/api/voice/status

# Click Save
```

---

## Start the Server

```bash
node server.js
```

**That's it!** 🎉

---

## Test It

Open http://localhost:3000 and use the AI Concierge!

Or test with curl:
```bash
curl -X POST http://localhost:3000/api/voice/initiate-call \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+15555551234",
    "businessName": "Test Business",
    "userRequest": "Get a quote",
    "category": "general"
  }'
```

---

**See `TWILIO_SETUP_INSTRUCTIONS.md` for detailed troubleshooting.**






