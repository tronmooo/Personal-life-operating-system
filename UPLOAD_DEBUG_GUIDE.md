# 🔍 Document Upload Debugging Guide

## Problem: Upload Not Working - Enhanced Logging Added

I've added **comprehensive logging** to help us find exactly where it's failing.

---

## Step 1: Restart Your Dev Server (CRITICAL!)

```bash
# Press Ctrl+C in your terminal to stop the server
npm run dev
```

**Why?** Environment variables and code changes require a full restart!

---

## Step 2: Open Browser Developer Tools

1. Open your app: http://localhost:3009/insurance
2. Press **F12** (or Cmd+Option+I on Mac)
3. Click the **Console** tab
4. Clear the console (trash icon)

---

## Step 3: Try Uploading a Document

1. Click "Smart Document Upload"
2. Select any image file (JPG, PNG)
3. Watch the console carefully

---

## Step 4: What You Should See in Console

### ✅ SUCCESSFUL UPLOAD:
```
🤖 Starting document upload...
📄 File details: {name: "test.jpg", type: "image/jpeg", size: "0.05 MB"}
📡 Calling /api/documents/auto-ingest...
📡 Response received!
   Status: 200
   Status Text: OK
📝 Response body (raw): {"success":true,"message":"Document uploaded..."
✅ Auto-ingest SUCCESS: {document: {...}}
```

### ❌ TIMEOUT (45 seconds):
```
🤖 Starting document upload...
📄 File details: ...
📡 Calling /api/documents/auto-ingest...
⏱️ Request timeout triggered (45 seconds)
❌ Fetch error: [AbortError]
```
**Means**: OpenAI API is taking too long or not responding

### ❌ API ERROR:
```
🤖 Starting document upload...
📄 File details: ...
📡 Calling /api/documents/auto-ingest...
📡 Response received!
   Status: 500
   Status Text: Internal Server Error
❌ Auto-ingest FAILED: {error: "OpenAI API key not configured"}
```
**Means**: Server-side error (check server terminal)

### ❌ NETWORK ERROR:
```
🤖 Starting document upload...
📄 File details: ...
📡 Calling /api/documents/auto-ingest...
❌ Fetch error: TypeError: Failed to fetch
```
**Means**: Dev server is down or network issue

---

## Step 5: Check Server Terminal (where npm run dev is running)

Look for these logs:

### ✅ GOOD - Working Upload:
```
📄 Auto-ingesting file: test.jpg image/jpeg 0.05 MB
🤖 Calling OpenAI Vision...
🤖 OpenAI Vision response: {"documentTitle":"..."}
✅ Extracted data: {...}
✅ File uploaded to: https://...
✅ Document saved to database: abc-123
✅ Domain entry created
```

### ❌ BAD - API Key Missing:
```
📄 Auto-ingesting file: test.jpg image/jpeg 0.05 MB
🤖 Calling OpenAI Vision...
Error: OpenAI API key not configured
```
**Fix**: Add `OPENAI_API_KEY` to `.env.local` and restart

### ❌ BAD - OpenAI Timeout:
```
📄 Auto-ingesting file: test.jpg image/jpeg 0.05 MB
🤖 Calling OpenAI Vision...
[...30 seconds of silence...]
Error: OpenAI API request timed out after 30 seconds
```
**Fix**: Check OpenAI API status or try smaller image

---

## Step 6: Test Basic Connectivity

Run this test endpoint to verify your setup WITHOUT OpenAI:

```bash
# Create a test image file (any small JPG/PNG)
curl -X POST http://localhost:3009/api/documents/test-upload \
  -F "file=@/path/to/test-image.jpg"
```

### Expected Response:
```json
{
  "success": true,
  "message": "Test endpoint working!",
  "data": {
    "fileName": "test.jpg",
    "fileType": "image/jpeg",
    "fileSize": 51234,
    "userEmail": "your@email.com",
    "openAIConfigured": true
  }
}
```

If this FAILS, the problem is NOT OpenAI - it's basic auth or file handling.

---

## Common Issues & Fixes

### Issue 1: "OpenAI API key not configured"
**Fix:**
```bash
# 1. Check if key is set
node scripts/check-openai-key.js

# 2. If missing, add to .env.local:
echo "OPENAI_API_KEY=sk-your-key-here" >> .env.local

# 3. Restart server
npm run dev
```

### Issue 2: Upload times out after 45 seconds
**Causes:**
- OpenAI API is slow (check https://status.openai.com/)
- Image is too large (try < 1MB)
- Internet connection is slow

**Workaround:**
- Click "Skip OCR & Upload Now" button during upload
- This uploads without AI extraction (you can add expiration date manually)

### Issue 3: "Failed to fetch" or Network Error
**Causes:**
- Dev server is not running
- Port 3009 is blocked or used by another app
- Browser has stale cache

**Fix:**
```bash
# 1. Stop all node processes
killall node

# 2. Clear Next.js cache
rm -rf .next

# 3. Restart dev server
npm run dev
```

### Issue 4: No error shown, just hangs forever
**This means**: The error state is not being set properly

**Debug:**
1. Check browser console for red errors
2. Check Network tab in DevTools for failed requests
3. Look for CORS errors or 401/403 responses
4. Make sure you're logged in (check Supabase auth)

---

## Advanced Debugging

### Check Network Tab in DevTools:

1. Open DevTools → **Network** tab
2. Try upload again
3. Look for request to `/api/documents/auto-ingest`
4. Click on it and check:
   - **Status**: Should be 200 (success) or 500 (error)
   - **Response**: Click "Response" tab to see full error
   - **Timing**: If > 45 seconds, it timed out

### Check Supabase Auth:

```javascript
// Paste this in browser console:
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
)
const { data } = await supabase.auth.getSession()
console.log('Current user:', data.session?.user?.email)
```

If this returns `null`, you need to log in again.

---

## Still Not Working?

### Share These Logs:

1. **Browser Console Output** (all lines starting with 🤖 📄 📡 ❌)
2. **Server Terminal Output** (all lines from upload attempt)
3. **Network Tab Screenshot** (showing the failed request)
4. **Result of**: `node scripts/check-openai-key.js`

With these 4 pieces of information, we can pinpoint the exact problem!

---

## Quick Test Checklist:

- [ ] Dev server is running (`npm run dev`)
- [ ] Browser console is open (F12)
- [ ] Logged into the app (check top-right)
- [ ] OpenAI API key is configured (`node scripts/check-openai-key.js`)
- [ ] Image file is < 5MB
- [ ] No red errors in console before upload
- [ ] Test endpoint works (`curl` command above)

---

**Updated**: November 11, 2025  
**Status**: 🔍 Enhanced Logging Added - Ready to Debug









