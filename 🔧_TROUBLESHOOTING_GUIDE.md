# 🔧 Troubleshooting Guide - AI Phone Concierge

## 🚨 Current Issues & Fixes

### Issue 1: Google Places API - Billing Not Enabled ⚠️

**Error:**
```
REQUEST_DENIED You must enable Billing on the Google Cloud Project
```

**Solution:**

**Option A: Enable Billing (Recommended)**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **Billing** → **Link a Billing Account**
4. **Google gives $200 free credit!**
5. Enable **Places API**

**Option B: Use Mock Data (Testing)**
- System automatically falls back to mock business data
- Phone numbers work but businesses aren't real
- Good for testing the calling system

**Cost with billing enabled:**
- $200/month free credit
- ~$0.05 per business search
- Very affordable for personal use

---

### Issue 2: ElevenLabs API Endpoint Fixed ✅

**Problem:**
- Used wrong API endpoint format
- Caused "Not Found" error

**Solution:**
- Updated to correct ElevenLabs Conversational AI endpoint
- Changed from `/v1/convai/conversation/phone` to `/v1/convai/conversations`
- Added proper request body format with `mode` object

**Status:** Fixed in latest code ✅

---

## 🧪 Testing Checklist

### 1. **Test with Mock Data First**
```
✓ Google Places disabled (billing not enabled)
✓ Uses fallback mock businesses
✓ Tests ElevenLabs calling system
✓ Verifies UI works
```

### 2. **Verify ElevenLabs Configuration**

**Check your ElevenLabs dashboard:**
- Agent ID: `agent_6901k726zn05ewsbet5vmnkp549y`
- Phone number assigned: `+17279662653`
- Agent has system prompt configured
- Voice selected

**Test call manually in dashboard:**
1. Go to your agent
2. Click "Test Call"
3. Enter your personal number
4. Verify it calls you successfully

---

## 🔍 Debugging Steps

### If Call Fails:

**1. Check Terminal Logs**
```bash
# Look for these messages:
🤖 Smart Call Request: [your request]
📍 User Location: [location data]
🔍 Searching Google Places for: [query]
✅ Found business: [name]
📞 Phone number: [number]
📞 Making ElevenLabs call...
✅ Call initiated successfully
```

**2. Check ElevenLabs Dashboard**
- Go to [ElevenLabs Dashboard](https://elevenlabs.io/dashboard)
- Check "Conversations" or "Call History"
- Look for recent calls
- Listen to recordings if available

**3. Verify Environment Variables**
```bash
# Check .env.local has:
ELEVENLABS_API_KEY=sk_9531d...
ELEVENLABS_AGENT_ID=agent_6901...
ELEVENLABS_PHONE_NUMBER=+17279662653
```

---

## 📞 ElevenLabs Configuration

### Agent Setup Checklist:

**1. System Prompt** (in ElevenLabs Dashboard)
```
You are an AI concierge making phone calls on behalf of your client.

Your role:
- Introduce yourself as calling on behalf of your client
- State the purpose clearly (ordering, booking, inquiring)
- Gather information naturally through conversation
- Confirm details (prices, times, confirmation numbers)
- Be polite, professional, and efficient

Opening: "Hi, I'm calling on behalf of my client regarding [PURPOSE]. They're located in [LOCATION]."

Always:
- Get pricing information
- Ask about availability/timing  
- Request confirmation numbers if applicable
- Clarify next steps
- End professionally after getting all info
```

**2. Agent Settings:**
- **Voice**: Select clear, professional voice
- **Language**: English (US)
- **Stability**: 0.5-0.7
- **Clarity**: 0.7-0.8
- **Style**: Professional/Friendly

**3. Phone Number:**
- Must be assigned to your agent
- Verify it's active
- Test it first in dashboard

---

## 🧩 Common Errors & Solutions

### Error: "Not Found" (ElevenLabs)

**Cause:** API endpoint incorrect

**Solution:** ✅ Already fixed! Updated to correct endpoint.

---

### Error: "REQUEST_DENIED" (Google Places)

**Cause:** Billing not enabled

**Solutions:**
1. Enable billing (gets $200 free)
2. Use mock data (automatic fallback)

---

### Error: "Failed to make call"

**Possible Causes:**

**1. Agent Not Configured**
- Go to ElevenLabs dashboard
- Configure system prompt
- Save agent settings

**2. Phone Number Not Assigned**
- Assign +17279662653 to your agent
- Verify in dashboard

**3. API Key Invalid**
- Check `.env.local` has correct key
- Verify key is active in dashboard

**4. Phone Number Format Wrong**
- Should be: `+1XXXXXXXXXX`
- With country code
- No spaces or dashes

---

## 🎯 Quick Fixes

### Fix 1: Restart Server
```bash
# Kill old servers
lsof -ti :3000 | xargs kill -9

# Clear cache
rm -rf .next

# Restart
npm run dev
```

### Fix 2: Check API Keys
```bash
# Verify .env.local
cat .env.local | grep ELEVENLABS
```

### Fix 3: Test ElevenLabs Directly

**Manual test via curl:**
```bash
curl -X POST https://api.elevenlabs.io/v1/convai/conversations \
  -H "xi-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent_6901k726zn05ewsbet5vmnkp549y",
    "mode": {
      "type": "phone_call",
      "phone_number": "+1XXXXXXXXXX"
    },
    "initial_message": "Test message"
  }'
```

---

## 📊 Success Indicators

### Call Working:
```
✅ Terminal shows: "Call initiated successfully"
✅ ElevenLabs dashboard shows active call
✅ UI switches to "Active Call" tab
✅ Transcription appears
✅ Progress tracker updates
```

### Mock Data Working:
```
✅ "No phone number found in Google Places, falling back to mock"
✅ Uses Pizza Hut +17275553333
✅ Still makes ElevenLabs call
✅ Tests calling system
```

---

## 🔄 Current Workflow

### What Happens When You Click "Make Call":

**1. User Input**
- You: "Order pizza from Pizza Hut"

**2. Google Places Search** (if billing enabled)
- Searches: "pizza delivery [your city]"
- Finds: Real Pizza Hut with phone number
- OR: Falls back to mock data

**3. ElevenLabs Call**
- Posts to: `/v1/convai/conversations`
- Includes: agent_id, phone_number, initial_message
- Returns: conversation_id

**4. UI Update**
- Switches to "Active Call" tab
- Shows business info
- Displays mock transcription (real coming soon)
- Shows results

---

## 🎯 Next Steps

### To Get Fully Working:

**1. Enable Google Places Billing** (Optional)
- $200 free credit
- Real business search
- Worth it for production

**2. Test Agent in ElevenLabs**
- Manual test call first
- Verify it works before using in app
- Listen to voice quality

**3. Configure System Prompt**
- Add specific instructions
- Test different prompts
- Optimize for your use case

---

## 💡 Testing Strategy

### Start Simple:

**1. Test with Mock Data**
```
✓ Click "Pizza Order"
✓ Should use mock Pizza Hut
✓ Tests ElevenLabs integration
✓ Verifies UI works
```

**2. Check Logs**
```bash
# Watch terminal for:
- Request received
- Location detected
- Business found (mock or real)
- ElevenLabs call initiated
```

**3. Verify UI**
```
- Button shows "Finding & Calling..."
- Switches to "Active Call" tab
- Shows business name and number
- Displays progress
```

---

## 🎊 When It Works

You'll see:
```
🤖 Smart Call Request: Order pizza...
📍 User Location: Tampa, FL
🔍 Searching Google Places...
⚠️ Falling back to mock (or ✅ Found real business)
📞 Making ElevenLabs call...
✅ Call initiated successfully: {conversation_id: "..."}
```

And in the UI:
- **Active Call** tab opens
- Business name shown
- Phone number displayed
- Progress tracker active
- (Mock) transcription visible

---

## 🔧 Still Not Working?

### Get More Debug Info:

**1. Check Full Error**
```bash
# In terminal, look for full stack trace
# Copy error message
```

**2. Test ElevenLabs Separately**
- Log into dashboard
- Try test call
- Verify agent works

**3. Verify All Keys**
```bash
# Check each one:
echo $ELEVENLABS_API_KEY
echo $ELEVENLABS_AGENT_ID
echo $ELEVENLABS_PHONE_NUMBER
```

**4. Share Error with Me**
- Copy terminal logs
- Note what you clicked
- Describe what happened

---

**Latest fix applied! Try clicking "Make Call" again!** 🔧✨























