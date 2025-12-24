# 📞 How to Make ACTUAL Phone Calls Work

Your app has full Twilio + OpenAI Realtime API integration ready. Here's how to enable it:

## 🚨 Important: Vercel Limitation

Your app is deployed on **Vercel**, which doesn't support WebSockets. The phone calling feature requires WebSocket streaming for real-time audio.

**For Production**: You'll need to deploy the voice server separately (see Option 2 below).
**For Testing**: Use ngrok locally (Option 1).

---

## Option 1: Test Locally with ngrok (Recommended First)

### Step 1: Set up ngrok (one-time)

```bash
# Sign up at https://dashboard.ngrok.com/signup (free)
# Then add your authtoken:
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### Step 2: Start ngrok tunnel

```bash
ngrok http 3000
```

You'll see something like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

Copy the `https://...ngrok-free.app` URL.

### Step 3: Configure Twilio Webhooks

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/active
2. Click your number: **+1 (727) 966-2653**
3. Scroll to **Voice Configuration**
4. Set:
   - **A call comes in**: `https://YOUR-NGROK-URL/api/voice/twiml` (POST)
   - **Call status changes**: `https://YOUR-NGROK-URL/api/voice/status` (POST)
5. Click **Save**

### Step 4: Start the server

```bash
node server.js
```

You should see:
```
✅ LifeHub AI Concierge Server Ready!
🌐 Web:       http://localhost:3000
🔌 WebSocket: ws://localhost:3000/api/voice/stream
```

### Step 5: Test a call

1. Open http://localhost:3000
2. Click the 📞 AI Concierge button
3. Type: "Call a nearby pizza place and get a quote"
4. Allow location access (or enter an address)
5. Select a business and confirm the call

The AI will actually call the business and talk to them!

---

## Option 2: Production Deployment (WebSocket-Compatible Host)

For production phone calls, deploy the voice server to a WebSocket-compatible platform:

### Recommended: Railway.app (Easy)

1. Sign up at https://railway.app
2. Create new project → Deploy from GitHub
3. Set environment variables:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Railway URL)
4. Custom start command: `node server.js`
5. Update Twilio webhooks to your Railway URL

### Alternative: Fly.io, Render, DigitalOcean App Platform

All support WebSockets and work similarly.

---

## 🧪 Quick Test Command

Test the API directly:

```bash
curl -X POST http://localhost:3000/api/voice/initiate-call \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+15551234567",
    "businessName": "Test Business",
    "userRequest": "I am testing my AI calling system",
    "category": "test"
  }'
```

---

## ✅ Your Current Setup Status

- ✅ Twilio Account SID: Configured
- ✅ Twilio Auth Token: Configured  
- ✅ Twilio Phone Number: +17279662653
- ✅ OpenAI API Key: Configured
- ✅ Voice Server Code: Ready (`server.js`)
- ✅ API Routes: Ready (`/api/voice/*`)
- ⚠️ Twilio Webhooks: Need to point to ngrok or production URL
- ⚠️ WebSocket Host: Need ngrok (local) or WebSocket-compatible host (production)

---

## 🔧 Troubleshooting

### "Call failed" or "Error initiating call"
- Check Twilio webhooks point to correct URL
- Make sure `node server.js` is running (not `npm run dev`)
- Check ngrok is still running (free tier expires after 2 hours)

### "OpenAI WebSocket error"
- Verify your OpenAI account has access to `gpt-4o-realtime-preview`
- Check API key is valid: https://platform.openai.com/api-keys

### "No businesses found"
- Make sure location is set (enable browser location or enter address)
- Google Places API key may be needed for business search

### Webhook not receiving calls
- Twilio needs HTTPS URLs only
- Check ngrok URL is correct in Twilio Console
- Look at Twilio logs: https://console.twilio.com/us1/monitor/logs/debugger

---

## 📞 What Happens During a Call

1. **You request a call** → App searches for nearby businesses
2. **Business selected** → Twilio makes actual phone call
3. **Call connects** → WebSocket streams audio to OpenAI
4. **AI talks** → OpenAI Realtime API has conversation
5. **Data extracted** → Quotes, appointments, etc. captured
6. **Call ends** → Summary saved to your dashboard

The AI introduces itself, states your request, asks for quotes, and politely ends the call. All transcripts are saved!













