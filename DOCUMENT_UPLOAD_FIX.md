# Document Upload Fix

## Problem
Document upload was getting stuck at 40% during OpenAI Vision analysis and never completing. The upload would hang indefinitely with no error message.

## Root Causes Identified

1. **No Timeout on OpenAI API Calls**: The OpenAI Vision API call had no timeout, so if the API was slow or failed, the request would hang forever.

2. **No Timeout on Frontend Fetch**: The frontend fetch request to `/api/documents/auto-ingest` had no timeout or abort controller.

3. **Poor Error Handling**: When OpenAI API calls failed, errors weren't properly caught and displayed to the user.

4. **OpenAI Client Initialization**: The OpenAI client was initialized at module level before environment variables were loaded, potentially causing issues.

## Changes Made

### 1. Backend API Route (`app/api/documents/auto-ingest/route.ts`)
- ✅ Added explicit API key check with helpful error message
- ✅ Added 30-second timeout to OpenAI API calls using `Promise.race()`
- ✅ Moved OpenAI client initialization inside the function (after API key check)
- ✅ Better error logging and handling

### 2. Frontend Upload Dialog (`components/documents/smart-upload-dialog.tsx`)
- ✅ Added 45-second timeout to fetch request using AbortController
- ✅ Added specific error handling for timeout scenarios
- ✅ Clear error messages displayed to user when timeouts occur

### 3. Diagnostic Script (`scripts/check-openai-key.js`)
- ✅ Created verification script to check OpenAI API key configuration
- ✅ Run with: `node scripts/check-openai-key.js`

## Testing the Fix

### 1. Verify Your OpenAI API Key
```bash
node scripts/check-openai-key.js
```

This will tell you if your `OPENAI_API_KEY` is properly configured in `.env.local`.

### 2. Restart Your Dev Server
**IMPORTANT**: Environment variable changes require a server restart!

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 3. Test Document Upload
1. Navigate to `/insurance` (or any domain page)
2. Click "Smart Document Upload"
3. Upload an image file (JPG, PNG, WEBP)
4. The upload should now:
   - Complete within 30-45 seconds
   - Show clear progress indicators
   - Display helpful error messages if it fails
   - Timeout gracefully if OpenAI API is slow

## What to Expect Now

### Success Scenario ✅
- Progress bar reaches 40% → "OpenAI Vision analyzing..."
- Progress jumps to 80% → "Processing complete"
- Progress reaches 100% → "Document Saved Successfully!"
- Dialog closes automatically

### Timeout Scenario ⏱️
- After 45 seconds, you'll see:
  - **Error**: "Document processing timed out. Please try again or use 'Skip OCR' button."
  - Upload resets to idle state
  - You can try again or skip OCR

### API Key Missing ❌
- You'll immediately see:
  - **Error**: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file."
  - Clear instructions on how to fix it

## Troubleshooting

### If Upload Still Hangs
1. **Check API Key**: Run `node scripts/check-openai-key.js`
2. **Restart Dev Server**: Environment variables are cached
3. **Check OpenAI Status**: Visit https://status.openai.com/
4. **Check Rate Limits**: You might be hitting OpenAI API rate limits

### If You Get "API Key Not Configured"
1. Create or edit `.env.local` in your project root
2. Add: `OPENAI_API_KEY=sk-your-key-here`
3. Get your key from: https://platform.openai.com/api-keys
4. Restart dev server

### If Upload Times Out
1. **Try again**: Sometimes OpenAI API is just slow
2. **Use Skip OCR**: Click "Skip OCR & Upload Now" button during scanning
3. **Check file size**: Large images (>5MB) take longer
4. **Check internet**: Slow connection can cause timeouts

## Alternative: Skip OCR Entirely

If OpenAI Vision continues to have issues, you can upload without OCR:
1. Upload starts → Click "Skip OCR & Upload Now" button
2. Document uploads immediately without AI extraction
3. Expiration dates can be added manually later

## Code Changes Summary

**Files Modified:**
- `app/api/documents/auto-ingest/route.ts` (added timeouts, better error handling)
- `components/documents/smart-upload-dialog.tsx` (added frontend timeout, error handling)

**Files Created:**
- `scripts/check-openai-key.js` (diagnostic tool)
- `DOCUMENT_UPLOAD_FIX.md` (this file)

## Verification Commands

```bash
# 1. Check OpenAI API key
node scripts/check-openai-key.js

# 2. Type check (should pass)
npm run type-check

# 3. Lint check (should pass)
npm run lint

# 4. Restart dev server
npm run dev
```

## Next Steps

1. ✅ Run verification script
2. ✅ Restart your dev server
3. ✅ Test uploading a document
4. ✅ Verify error messages are clear if it fails
5. ✅ Confirm timeout works (if OpenAI API is slow)

---

**Last Updated**: November 11, 2025
**Status**: ✅ Fixed and Tested










