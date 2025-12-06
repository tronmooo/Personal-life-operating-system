# 📧 Gmail Smart Parsing - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Run Database Migration (Required)

**Copy this SQL and run it in Supabase Dashboard:**

1. Open your Supabase project: https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Click "New Query"
4. Copy and paste the entire contents of `supabase/migrations/20250117_processed_emails.sql`
5. Click **RUN** (or press Cmd/Ctrl + Enter)

You should see: ✅ Success. No rows returned

---

### Step 2: Enable Gmail API in Google Cloud

1. **Go to:** https://console.cloud.google.com/
2. **Select your project** (or create one)
3. Click **"Enable APIs and Services"**
4. Search for **"Gmail API"**
5. Click **ENABLE**

---

### Step 3: Configure Google OAuth

1. In Google Cloud Console, go to **"APIs & Services" → "OAuth consent screen"**
2. Add these scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.modify
   ```

3. Go to **"Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"**
4. Application type: **Web application**
5. Add Authorized redirect URIs:
   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback
   ```
6. **Copy the Client ID and Client Secret**

---

### Step 4: Update Supabase Auth Settings

1. Go to your Supabase Dashboard
2. Navigate to **Authentication → Providers**
3. Find **Google** provider
4. Enable it and add:
   - **Client ID**: (from Google Cloud)
   - **Client Secret**: (from Google Cloud)
5. Click **Save**

---

### Step 5: Verify OpenAI Key

Make sure your `.env.local` has:

```bash
OPENAI_API_KEY=sk-your-openai-key-here
```

---

### Step 6: Restart Your Dev Server

```bash
npm run dev
```

---

## ✅ Testing

1. **Go to Command Center:** http://localhost:3000
2. **Look for "Smart Inbox" card** in the top row
3. **Click the refresh icon** to sync Gmail
4. **Grant permissions** when prompted
5. **Wait for AI to analyze** your emails (takes 10-30 seconds)
6. **See suggestions appear!**

---

## 🎯 What You'll See

### Before Sync
```
┌─────────────────────┐
│   Smart Inbox   🔄  │
│                     │
│  📭 No pending      │
│     suggestions     │
│                     │
│   [Sync Gmail]      │
└─────────────────────┘
```

### After Sync
```
┌─────────────────────┐
│   Smart Inbox   🔄  │
│        (3)          │
├─────────────────────┤
│ 💵 Add $150 bill    │
│    due Oct 20?      │
│    [✅] [❌]        │
├─────────────────────┤
│ 🩺 Dr. Smith appt   │
│    Oct 25, 2pm?     │
│    [✅] [❌]        │
├─────────────────────┤
│ 🔧 Oil change for   │
│    Honda Civic?     │
│    [✅] [❌]        │
└─────────────────────┘
```

---

## 🔧 Troubleshooting

### "Unauthorized" Error
→ Sign in with Google first (make sure Google provider is enabled in Supabase)

### No Suggestions Appearing
→ Check browser console for errors
→ Verify OpenAI API key is valid
→ Make sure you have emails from last 7 days

### Gmail API Error
→ Double-check Gmail API is enabled in Google Cloud
→ Verify OAuth scopes include `gmail.readonly` and `gmail.modify`

### Database Error
→ Make sure you ran the migration SQL
→ Check Supabase logs for RLS policy issues

---

## 📊 Example API Usage

### Sync Gmail (Manual)
```typescript
const response = await fetch('/api/gmail/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: session.provider_token,
    daysBack: 7
  })
})

const data = await response.json()
console.log(`Found ${data.newSuggestions} new suggestions!`)
```

### Get Suggestions
```typescript
const response = await fetch('/api/gmail/suggestions')
const data = await response.json()
console.log('Pending suggestions:', data.suggestions)
```

### Approve Suggestion
```typescript
const response = await fetch('/api/gmail/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    suggestionId: 'uuid-here'
  })
})

const data = await response.json()
console.log('Added to domain:', data.domain)
```

---

## 🎨 Customization

### Change Days to Scan
Edit `components/dashboard/smart-inbox-card.tsx`:
```typescript
body: JSON.stringify({
  accessToken: session.provider_token,
  daysBack: 14  // Change from 7 to 14, 30, etc.
})
```

### Adjust AI Confidence
Edit `lib/ai/email-classifier.ts`:
```typescript
temperature: 0.2  // Lower = more conservative (0.1 - 0.5)
```

---

## 📞 Need Help?

1. **Check the comprehensive guide:** `📧_GMAIL_SMART_PARSING_COMPLETE.md`
2. **Review code comments** in the files
3. **Check Supabase logs** for database issues
4. **Check browser console** for frontend errors
5. **Check API logs** in terminal for backend issues

---

## 🚀 You're Ready!

Once you complete these steps, your Gmail Smart Parsing will be fully operational!

**The AI will automatically:**
- 🔍 Scan your recent emails
- 🤖 Classify them by type
- 📋 Extract relevant data
- 💡 Suggest smart actions
- ✅ Add to domains with one click

**Enjoy your intelligent email assistant!** ✨






























