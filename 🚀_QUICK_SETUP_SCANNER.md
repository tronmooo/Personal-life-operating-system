# 🚀 Quick Setup - Smart Document Scanner

## ⚡ 3-Minute Setup

Your smart document scanner is **already built and integrated**! Just need to add one API key.

### Step 1: Get Your Google Cloud Vision API Key

1. Go to **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. Make sure you're in the project where you enabled Cloud Vision API
3. Click **"Create Credentials"** → **"API Key"**
4. **Copy the key** (starts with `AIza...`)
5. ⚠️ **Important**: Click "Restrict Key" → Select "Cloud Vision API" only

### Step 2: Add to Environment

Open your `.env.local` file and add:

```bash
# Google Cloud Vision API (for smart document scanner)
GOOGLE_CLOUD_VISION_API_KEY=AIzaSyC...your_key_here
```

### Step 3: Restart Server

```bash
# Stop current server (Ctrl+C in terminal)
# Restart:
npm run dev
```

## ✅ You're Done!

Now just:
1. Click the **orange upload button** (top navigation)
2. Upload or take a photo of any document
3. AI automatically detects type and extracts data!

---

## 🧪 Test It Now

Try scanning:
- A restaurant receipt
- Your insurance card  
- A prescription bottle
- A utility bill

The AI will automatically:
- Extract all the text
- Identify what kind of document it is
- Pull out structured data (vendor, amount, dates, etc.)
- Suggest which domain to add it to

Then you just click "Approve" and it's saved! 🎉

---

## 🆘 Troubleshooting

**Issue**: "No API key configured"
- **Fix**: Make sure you added `GOOGLE_CLOUD_VISION_API_KEY` to `.env.local`
- **Fix**: Restart the dev server after adding it

**Issue**: Camera not working
- **Fix**: Grant camera permissions when browser asks
- **Fix**: Or just use "Upload Document" instead

**Issue**: API error
- **Fix**: Make sure API key is restricted to Cloud Vision API only
- **Fix**: Check that billing is enabled on your Google Cloud project

---

## 📖 Full Documentation

See `📄_SMART_DOCUMENT_SCANNER.md` for complete details on:
- All document types supported
- How the AI processing works
- Customization options
- Advanced features

---

## 💰 Costs

**Google Cloud Vision**: 
- Free tier: 1,000 requests/month
- After that: $1.50 per 1,000 images
- Very affordable!

**OpenAI**:
- Uses your existing API key
- ~$0.01 per document (GPT-4)

---

That's it! You're ready to start scanning documents with AI! 📸✨






























