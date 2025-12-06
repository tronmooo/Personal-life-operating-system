# ✅ Test Google Drive in Your Real App

The test worked! Now let's test in your actual app with detailed logging.

## 🎯 Test 1: Insurance Domain (Direct Drive Upload)

### Steps:
1. **Go to:** http://localhost:3000/domains/insurance
2. **Click:** "Add Policy" button
3. **Fill out the form:**
   - Policy Type: Auto Insurance (or any type)
   - Policy Number: TEST123
   - Provider: Test Provider
   - Start/End dates: Any dates
4. **Upload a photo/document**
5. **Click "Save Policy"**

### What to Watch:
**Open Browser Console (F12) and look for:**

**✅ Success logs:**
```
📤 Uploading test.jpg to Google Drive (insurance)...
   Access token exists: ya29.a0AfB_byBQWx...
   GOOGLE_CLIENT_ID exists: true
   GOOGLE_CLIENT_SECRET exists: true
   Domain folder: insurance
   ✅ GoogleDriveService initialized
🔍 Searching for LifeHub folder in Google Drive...
✅ Found existing LifeHub folder: 1Abc123...
📤 Uploaded file to Drive: test.jpg
```

**❌ If you see errors:**
- `GOOGLE_CLIENT_ID exists: false` → Server didn't restart properly
- `No Google access token` → Need to sign in with Google
- `Invalid Credentials` → OAuth setup issue

---

## 🎯 Test 2: Pet Profile Photo (Simple Upload)

### Steps:
1. **Go to:** http://localhost:3000/domains/pets
2. **Click on any pet** (or create one)
3. **Click the camera icon** or "Upload Photo"
4. **Select a photo**

### What to Watch:
**Console logs:**
```
✅ File uploaded to Supabase Storage: https://...
🔑 Google provider token found - attempting Google Drive upload...
   Provider token exists: ya29.a0AfB_byBQWx...
   GOOGLE_CLIENT_ID exists: true
   GOOGLE_CLIENT_SECRET exists: true
   Uploading to folder: pets
✅ File also uploaded to Google Drive!
   Drive File ID: 1Xyz789...
   Drive Link: https://drive.google.com/file/d/...
```

---

## 🎯 Test 3: Document Upload (Dual Upload)

### Steps:
1. **Go to:** http://localhost:3000/domains
2. **Click any domain** (Health, Insurance, Vehicles, etc.)
3. **Go to "Documents" tab**
4. **Upload a document**

### What to Watch:
**Console logs:**
```
✅ File uploaded to Supabase Storage: https://...
🔑 Google provider token found - attempting Google Drive upload...
   Provider token exists: ya29.a0AfB_byBQWx...
   GOOGLE_CLIENT_ID exists: true
   GOOGLE_CLIENT_SECRET exists: true
   Domain folder: health (or whichever domain)
✅ File also uploaded to Google Drive!
   Drive File ID: 1Abc456...
   Drive View Link: https://drive.google.com/file/d/...
   Drive Download Link: https://drive.google.com/uc?id=...
```

---

## 🔍 Verify in Google Drive

After uploading, check your Google Drive:

1. **Go to:** https://drive.google.com
2. **Look for:** "LifeHub" folder
3. **Open it** - you should see subfolders:
   - Insurance
   - Pets
   - Health
   - Home
   - Vehicles
   - Miscellaneous
   - Photos
   - etc.
4. **Open the relevant subfolder**
5. **Your uploaded file should be there!**

---

## ⚠️ Common Issues

### Issue: "GOOGLE_CLIENT_ID exists: false"

**Problem:** Environment variables didn't reload

**Fix:**
```bash
# Stop the server
pkill -f "next dev"

# Verify credentials are in file
tail -5 .env.local
# Should show GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

# Restart server
cd "/Users/robertsennabaum/new project"
npm run dev
```

### Issue: "No Google access token"

**Problem:** Not signed in with Google OAuth

**Fix:**
1. Sign out of your app
2. Sign back in using "Sign in with Google"
3. Try uploading again

### Issue: "ℹ️ No Google provider token - skipping Google Drive upload"

**Problem:** Session doesn't have provider_token

**Fix:**
- You're signed in with email/password, not Google OAuth
- Must use Google OAuth to get Drive access
- Sign out and sign back in with Google

### Issue: Upload succeeds but file not in Drive

**Possible causes:**
1. **Check console for silent errors** - might say "⚠️ Google Drive upload failed"
2. **Check the specific error** - console will show details
3. **API quota exceeded** - wait a minute and try again
4. **Wrong folder** - make sure you're looking in the right subfolder

---

## 📊 Success Checklist

After uploading, you should see:

- [ ] "✅ File uploaded to Supabase Storage" in console
- [ ] "🔑 Google provider token found" in console
- [ ] "✅ File also uploaded to Google Drive!" in console
- [ ] Drive File ID logged in console
- [ ] Drive Link logged in console
- [ ] File appears in Google Drive under LifeHub/[Domain] folder
- [ ] No error messages in console

---

## 🚀 What Changed

I updated these API routes to work like the test:

1. **`/api/upload`** - Used by: Pets, Home Assets, Vehicles
2. **`/api/documents/upload`** - Used by: All domain Documents tabs
3. **`/api/drive/upload`** - Used by: Insurance policy forms

All three now:
- Check for Google provider token
- Initialize GoogleDriveService with correct credentials
- Upload to appropriate folder in Drive
- Log detailed progress
- Handle errors gracefully

---

## 🎉 Expected Result

**When it works, you'll see:**

1. **In Console:** All ✅ checkmarks and Drive link
2. **In App:** Upload succeeds normally
3. **In Google Drive:** File appears in LifeHub/[Domain] folder
4. **No errors:** Clean console logs

**Every photo you upload will now be saved to BOTH:**
- ✅ Supabase Storage (primary, always works)
- ✅ Google Drive (backup, works when signed in with Google)

---

**Try uploading in each of those 3 places and tell me what you see in the console!** 🚀







