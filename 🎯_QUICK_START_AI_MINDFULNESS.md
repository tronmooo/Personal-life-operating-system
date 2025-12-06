# 🎯 Quick Start: AI Mindfulness

## ✅ What's Ready

Your **Mindfulness domain** now has **real AI integration**:

1. **AI Journal Feedback** - Memorable, therapeutic insights
2. **AI Therapy Chat** - Real conversations with context memory

---

## 🚀 3-Minute Setup

### Step 1: Get FREE Gemini API Key (2 mins)

1. Go to: **https://makersuite.google.com/app/apikey**
2. Click **"Create API Key"**
3. Copy the key

### Step 2: Add to Environment (30 secs)

```bash
# Open .env.local file and add:
GEMINI_API_KEY=your-gemini-api-key-here
```

### Step 3: Restart Server (30 secs)

```bash
# Stop server (Ctrl+C) then restart:
npm run dev
```

---

## ✨ Test It Now!

### 1. Login First
Go to: http://localhost:3000/auth/signin

### 2. Test Journal Feedback

1. Go to: http://localhost:3000/domains/mindfulness
2. Click **"Journal"** tab
3. Write this:
   ```
   I'm feeling stressed about my work deadlines and overwhelmed 
   with everything I need to do.
   ```
4. Click **"AI Feedback"** button
5. Watch the magic! 🪄

**Expected Result:**
You'll see a purple card with a memorable insight using metaphors like:
> "Your stress is like an overfilled cup - trying to add more only spills over..."

### 3. Test Therapy Chat

1. Click **"Chat"** tab
2. Type: `"I've been feeling really anxious lately"`
3. Click Send
4. Continue the conversation - it remembers context!

**Expected Result:**
The AI therapist will:
- Validate your feelings
- Ask thoughtful questions
- Remember what you said before
- Help you explore your thoughts

---

## 💰 Cost

**Gemini API (Recommended):**
- **FREE**
- 60 requests per minute
- 1,500 requests per day
- Perfect for personal use

**Alternative: OpenAI**
- ~$0.0002 per journal insight
- ~$0.0005 per chat message
- Add `OPENAI_API_KEY` to `.env.local`

**No API Key?**
- Still works with smart local fallback
- 50+ varied responses
- Not as personalized, but still good

---

## 🎯 Key Features

### Journal Feedback:
✅ Memorable insights with metaphors
✅ Validates feelings genuinely  
✅ Provides perspective shifts  
✅ Suggests specific actions  
✅ Different response every time  

### Therapy Chat:
✅ Conversation memory (last 10 exchanges)  
✅ CBT, DBT, person-centered techniques  
✅ Warm, human responses  
✅ Asks thoughtful questions  
✅ Never diagnoses or prescribes  

---

## 🐛 Quick Troubleshooting

**"Unauthorized" error?**
→ You need to login first: `/auth/signin`

**"AI Feedback" button does nothing?**
→ Check browser console (F12) for errors
→ Make sure `GEMINI_API_KEY` is in `.env.local`
→ Restart server after adding key

**Responses seem generic?**
→ Means no API key configured
→ Add Gemini key for personalized AI

**Chat doesn't remember context?**
→ Thread ID should persist in browser
→ Check console for "Thread ID" logs
→ Server restart clears memory

---

## 📚 Full Documentation

See `🧠_AI_MINDFULNESS_COMPLETE.md` for:
- Detailed implementation
- Prompt engineering details
- Conversation memory system
- Production deployment tips
- Optional enhancements

---

## 🎉 You're Done!

**The mindfulness domain is now AI-powered!** 🧠💜

1. Add `GEMINI_API_KEY` to `.env.local`
2. Restart server
3. Login
4. Go to Mindfulness domain
5. Try it out!

Questions? Check the full docs or the code comments.

