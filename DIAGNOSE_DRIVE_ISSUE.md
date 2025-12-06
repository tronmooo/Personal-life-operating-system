# 🔍 Diagnosing Your Google Drive Upload Issue

Since you say it was working a month ago and the scopes aren't the problem, let's diagnose the actual issue systematically.

## Step 1: Open the Test Page

**I created a test page for you:** http://localhost:3000/test-drive-upload.html

1. **Open that link** in your browser (while signed in to your app)
2. The page will auto-check your session
3. Look at the results

## Step 2: What to Look For

### ✅ If you see this (GOOD):
```
✅ Authenticated as: your@email.com
✅ Provider token EXISTS - Google Drive should work!
Provider: google
Is Google OAuth: true
```
**→ Provider token is working, the issue is elsewhere**

### ❌ If you see this (PROBLEM):
```
✅ Authenticated as: your@email.com
❌ Provider token MISSING - Google Drive will NOT work
Provider: email (or something other than 'google')
Is Google OAuth: false
```
**→ You're not signed in with Google OAuth**

## Step 3: Click Each Button in Order

1. **"1. Check Session & Provider Token"** - Verifies authentication
2. **"2. Test Drive API Access"** - Tests if you can access Drive at all
3. **Select a test photo**
4. **"3b. Upload via /api/drive/upload"** - This is the endpoint insurance uses

## Common Issues & Fixes

### Issue 1: "Provider token MISSING"

**Problem:** You're signed in with email/password, not Google OAuth

**Fix:**
1. Sign out completely
2. Sign in using "Sign in with Google" button
3. Accept all permissions
4. Run test again

### Issue 2: "No Google access token"

**Problem:** Session doesn't have provider_token even though you used Google

**Possible causes:**
- Google Client ID/Secret not configured in environment
- Supabase OAuth provider not configured properly
- Token expired

**Fix:**
```bash
# Check if these are set in your .env.local:
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

If missing, you need to:
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add to `.env.local`
4. Restart dev server

### Issue 3: Drive Upload Fails with Error

**Look at the console logs when you click upload**

Common errors:
- `"insufficient permissions"` → Need to revoke and re-grant permissions
- `"API not enabled"` → Google Drive API not enabled in Google Cloud
- `"folder creation failed"` → Permission issue or API quota

## Step 4: Check Browser Console

While testing uploads, **open Browser Console** (F12 → Console tab)

**Good logs:**
```
🔍 Searching for LifeHub folder in Google Drive...
✅ Found existing LifeHub folder: 1234abcd
📤 Uploaded file to Drive: document.pdf
```

**Bad logs:**
```
❌ Error ensuring root folder: Request failed with status code 403
```
or
```
⚠️ No Google provider token found
```

## Step 5: Share Your Results

After running the tests, tell me:

1. **What does "Check Session" show?**
   - Provider token: EXISTS or MISSING?
   - Provider: google or email?
   - Is Google OAuth: true or false?

2. **What does "Test Drive API Access" show?**
   - Success or error?
   - What error message?

3. **What happens when you upload?**
   - Which endpoint worked/failed?
   - What error appeared in console?

## Quick Environment Check

Run these in terminal to verify your setup:

```bash
# Check if Google credentials are set
cd "/Users/robertsennabaum/new project"
grep "GOOGLE_CLIENT_ID\|GOOGLE_CLIENT_SECRET" .env.local

# Check if NEXTAUTH_URL is set
grep "NEXTAUTH_URL" .env.local
```

**Expected output:**
```
GOOGLE_CLIENT_ID=your-google-client-id...
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret...
NEXTAUTH_URL=http://localhost:3000
```

If any are missing or say `your-value-here`, that's the problem!

## What Was Working Before?

You mentioned it worked a month ago. Think about:
- **Did you change your Google account?**
- **Did you revoke app permissions in Google?**
- **Did environment variables get reset?**
- **Did you switch from signing in with Google to email/password?**

## Next Steps Based on Results

### If provider_token EXISTS but upload still fails:
→ Check browser console for the specific error
→ Likely a Google Drive API or folder permission issue

### If provider_token MISSING:
→ You're not using Google OAuth to sign in
→ Sign out and use "Sign in with Google"

### If you get "No Google access token" error:
→ Environment variables (GOOGLE_CLIENT_ID/SECRET) are missing
→ Need to configure OAuth credentials

---

**Run the test page and let me know what you see!** 🔍

http://localhost:3000/test-drive-upload.html







