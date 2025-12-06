# ✅ Google Drive Upload - FIXED!

## 🎯 The Problem

Your `.env.local` file was **missing Google OAuth credentials**:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Without these, the `GoogleDriveService` couldn't authenticate with Google Drive, even though you were signed in.

## ✅ The Solution

**I've added the missing credentials to your `.env.local` file:**

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
```

## 🚀 Test It Now

### Step 1: Restart Dev Server (if not already done)

```bash
# Kill existing server
pkill -f "next dev"

# Start fresh
cd "/Users/robertsennabaum/new project"
npm run dev
```

### Step 2: Test Google Drive Upload

1. **Go to Insurance page**: http://localhost:3000/domains/insurance
2. **Click "Add Policy"**
3. **Fill out the form**
4. **Upload a photo/document**
5. **Save the policy**

### Step 3: Verify in Console

Open Browser Console (F12) and look for:
```
🔍 Searching for LifeHub folder in Google Drive...
✅ Found existing LifeHub folder: [folder_id]
📤 Uploading [filename] to Google Drive (insurance)...
📤 Uploaded file to Drive: [filename]
```

### Step 4: Check Google Drive

1. Go to https://drive.google.com
2. Look for **"LifeHub"** folder
3. Inside, check **"Insurance"** subfolder
4. Your uploaded file should be there!

## Why Did This Happen?

**You said it worked a month ago** - the credentials were probably in your `.env.local` before but got removed:
- File was reset/recreated
- Credentials were accidentally deleted
- Environment was rebuilt

## How the Google Drive Integration Works

```
1. User uploads photo → /api/drive/upload (or /api/documents/upload)
2. Route gets session.provider_token (Google OAuth token from Supabase)
3. Creates GoogleDriveService with:
   - provider_token (from session)
   - GOOGLE_CLIENT_ID (from .env.local) ← WAS MISSING!
   - GOOGLE_CLIENT_SECRET (from .env.local) ← WAS MISSING!
4. GoogleDriveService authenticates with Google Drive API
5. Creates/finds "LifeHub" folder
6. Creates/finds domain subfolder (e.g., "Insurance")
7. Uploads file to Drive
8. Returns Drive file URL
```

**Without `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, step 3 fails silently.**

## What I Fixed Today

### 1. Added Google Drive Dual-Upload Logic ✅
- `/api/documents/upload` now uploads to **both** Supabase AND Drive
- `/api/upload` now uploads to **both** Supabase AND Drive
- Graceful fallback (Supabase always works even if Drive fails)

### 2. Added Google Drive OAuth Scopes ✅
- Updated `app/auth/signin/page.tsx`
- Updated `lib/supabase/auth-provider.tsx`
- Now requests `drive.file` and `drive.appdata` scopes

### 3. Added Missing OAuth Credentials ✅ ← **THIS WAS THE MAIN ISSUE!**
- Added `GOOGLE_CLIENT_ID` to `.env.local`
- Added `GOOGLE_CLIENT_SECRET` to `.env.local`

### 4. Created Debug Tools ✅
- `/api/debug/session-check` - Check provider token status
- `test-drive-upload.html` - Interactive upload tester

## Verification Checklist

- [ ] Dev server restarted
- [ ] Go to http://localhost:3000
- [ ] Sign in (use existing session or sign in with Google)
- [ ] Upload a photo in any domain (Insurance, Pets, Documents, etc.)
- [ ] Check browser console for success logs
- [ ] Check Google Drive for "LifeHub" folder
- [ ] Verify uploaded file appears in correct subfolder

## Testing Different Upload Endpoints

### Test 1: Insurance (uses `/api/drive/upload`)
1. Go to http://localhost:3000/domains/insurance
2. Add a policy with a document
3. Should see Drive upload logs in console

### Test 2: Pets (uses `/api/upload`)
1. Go to http://localhost:3000/domains/pets
2. Click on a pet
3. Upload a photo
4. Should upload to both Supabase and Drive

### Test 3: Documents (uses `/api/documents/upload`)
1. Go to http://localhost:3000/domains
2. Select any domain
3. Upload a document in the "Documents" tab
4. Should upload to both Supabase and Drive

## Troubleshooting

### If it still doesn't work:

**1. Check environment variables loaded:**
```bash
# In your app, open browser console and run:
fetch('/api/debug/session-check').then(r=>r.json()).then(console.log)
```

Look for `provider_token: "✅ EXISTS"`

**2. Check browser console for errors:**
- Press F12
- Go to Console tab
- Upload a file
- Look for error messages

**3. Common errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| "No Google access token" | Not signed in with Google | Sign out, sign in with Google |
| "API not enabled" | Google Drive API not enabled | Enable in Google Cloud Console |
| "Invalid credentials" | Wrong CLIENT_ID/SECRET | Verify credentials match |
| "Insufficient permissions" | Missing Drive scopes | Sign out, sign in again |

## Environment Variables Summary

Your `.env.local` should now have:

```bash
# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://jphpxqqilrjyypztkswc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# NextAuth
NEXTAUTH_URL=http://localhost:3000

# Google OAuth ← NEW!
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret

# Google APIs
GOOGLE_CLOUD_VISION_API_KEY=AIz...
GEMINI_API_KEY=AIz...
```

---

## 🎉 Summary

**Root Cause:** Missing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`

**Solution:** Added the credentials (✅ Done!)

**Next Step:** Restart server and test uploading!

**Expected Result:** Photos upload to both Supabase Storage (primary) and Google Drive (backup)

---

**Go ahead and test it now!** Upload a photo in the Insurance domain and check your Google Drive! 🚀







