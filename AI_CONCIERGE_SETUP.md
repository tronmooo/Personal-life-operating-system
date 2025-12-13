# 🎙️ AI Concierge - Real Phone Calls Setup

Your AI Concierge is ready to make **real phone calls** to businesses! Here's how to set it up.

## ✅ What's Been Updated

1. **server.js** - Now fully integrates Twilio ↔ OpenAI Realtime API
   - Receives audio from Twilio phone calls
   - Converts μ-law 8kHz ↔ PCM16 24kHz in real-time
   - Sends to OpenAI Realtime for speech-to-speech AI
   - AI speaks back through the phone call

2. **TwiML Route** - Updated to use bidirectional streaming
   - Uses `<Connect><Stream>` for true two-way audio
   - AI handles the conversation naturally

---

## 🔧 Required Environment Variables

Make sure these are set in your `.env.local`:

```bash
# OpenAI - For the voice AI (REQUIRED)
OPENAI_API_KEY=sk-your-openai-api-key

# Twilio - For making phone calls (REQUIRED)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Your Public Domain (REQUIRED for Twilio webhooks)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Google Places - For finding businesses (optional but recommended)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your-google-places-key
# OR
GOOGLE_PLACES_API_KEY=your-google-places-key
```

---

## 🚀 Running the Server

**Important**: Use the custom server (not standard `npm run dev`) for WebSocket support:

```bash
# Stop any running dev server first, then:
npm run dev:server
```

This starts the server with:
- ✅ Next.js for the web app
- ✅ WebSocket server for Twilio Media Streams
- ✅ OpenAI Realtime API integration

---

## 📞 Configure Twilio Webhooks

In your Twilio Console (https://console.twilio.com):

1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Click your phone number
3. Under **Voice & Fax**, set:
   - **A CALL COMES IN**: Webhook, `https://your-domain.com/api/voice/twiml`
   - **STATUS CALLBACK URL**: `https://your-domain.com/api/voice/status`

For outbound calls (AI calling businesses), the webhooks are automatically configured.

---

## 🧪 Testing the AI Concierge

1. Start the custom server: `npm run dev:server`
2. Open your app at your domain
3. Click the AI Concierge button (usually in the nav or floating button)
4. Say something like: "I need an oil change for my car"
5. The AI will:
   - Ask clarifying questions
   - Find nearby businesses
   - Let you pick one to call
   - Make the actual phone call
   - Have a real AI conversation with the business

---

## 🎯 What Happens During a Call

```
User clicks "Call Now"
       ↓
API initiates Twilio call to business phone
       ↓
Business answers
       ↓
Twilio opens WebSocket to your server
       ↓
Server connects to OpenAI Realtime API
       ↓
Audio streams bidirectionally:
  Business speaks → Your server → OpenAI → AI responds → Your server → Business hears
       ↓
AI extracts quotes, schedules appointments, etc.
       ↓
Call ends, results shown to user
```

---

## 🔍 Debugging

Check the server console for:
- `📞 New WebSocket connection from Twilio` - Twilio connected
- `✅ Connected to OpenAI Realtime API` - OpenAI ready
- `📝 OpenAI session configured` - Session initialized
- `🤖 AI:` - What the AI is saying
- `👤 Human:` - What the business person said
- `💰 Quote extracted:` - Price quotes captured

Common issues:
- `❌ OPENAI_API_KEY not configured!` - Set your OpenAI key
- `❌ Failed to connect to OpenAI` - Check your API key/network
- No audio - Make sure `NEXT_PUBLIC_APP_URL` is set to your public domain

---

## 📊 Production Deployment

For production with your domain:

1. Set `NODE_ENV=production`
2. Use `npm run start:server` instead of `dev:server`
3. Make sure your domain has valid HTTPS (required for Twilio)
4. Set `NEXT_PUBLIC_APP_URL` to your production domain

---

## 💡 Tips

- **Google Places API**: Enable "Places API" and "Geocoding API" in Google Cloud Console
- **Twilio**: Use a local (not toll-free) number for better business answer rates
- **OpenAI**: The Realtime API uses `gpt-4o-realtime-preview` model
- **Audio Quality**: The server handles format conversion automatically

Happy calling! 🎉


