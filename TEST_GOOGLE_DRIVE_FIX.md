# 🧪 Quick Test: Is Google Drive Working?

## Run This in Browser Console (F12 → Console Tab)

### 1. Check Your Session
```javascript
fetch('/api/debug/session-check')
  .then(r => r.json())
  .then(data => {
    console.log('=== SESSION CHECK ===')
    console.log('Status:', data.status)
    console.log('Provider Token:', data.provider_token)
    console.log('Provider:', data.provider)
    console.log('Is Google OAuth:', data.is_google_oauth)
    console.log('Full Data:', data)
    
    // Visual result
    if (data.provider_token?.includes('EXISTS')) {
      console.log('✅ GOOGLE DRIVE SHOULD WORK!')
    } else {
      console.log('❌ GOOGLE DRIVE WILL NOT WORK')
      console.log('👉 You need to:')
      console.log('   1. Add Drive scopes to Supabase Dashboard')
      console.log('   2. Sign out and sign back in')
    }
  })
```

## What You Should See

### ✅ If Working (GOOD):
```
=== SESSION CHECK ===
Status: authenticated
Provider Token: ✅ EXISTS
Provider: google
Is Google OAuth: true
✅ GOOGLE DRIVE SHOULD WORK!
```

### ❌ If Broken (NEEDS FIX):
```
=== SESSION CHECK ===
Status: authenticated
Provider Token: ❌ MISSING
Provider: email
Is Google OAuth: false
❌ GOOGLE DRIVE WILL NOT WORK
👉 You need to:
   1. Add Drive scopes to Supabase Dashboard
   2. Sign out and sign back in
```

---

## The Fix (If Broken)

### Go to Supabase Dashboard:

1. **Open**: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/auth/providers
   - This is a direct link to your Google OAuth settings!

2. **Find "Google" provider** and click to expand

3. **In the "Scopes" field**, paste this (all one line):
   ```
   email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata
   ```

4. **Click "Save"**

5. **Sign out** of your app

6. **Sign in** with Google again

7. **Run the test again** (above)

---

## Test Upload After Fixing

### 2. Test a Photo Upload

After confirming provider token exists:

1. Go to any page with upload (Insurance, Pets, Documents)
2. Upload a photo
3. Watch the console for these messages:
   ```
   ✅ File uploaded to Supabase Storage: https://...
   🔑 Google provider token found - attempting Google Drive upload...
   ✅ File also uploaded to Google Drive: https://drive.google.com/...
   ```

### 3. Check Google Drive

1. Open https://drive.google.com
2. Look for "LifeHub" folder
3. Find your uploaded file inside

---

## One-Line Quick Test

Paste this in console and press Enter:

```javascript
fetch('/api/debug/session-check').then(r=>r.json()).then(d=>console.log(d.provider_token?.includes('EXISTS')?'✅ WORKING':'❌ BROKEN - Update Supabase Dashboard'))
```

**Result:**
- `✅ WORKING` → You're good! Upload a photo to test.
- `❌ BROKEN - Update Supabase Dashboard` → Follow the fix steps above.

---

## Direct Links

- **Supabase Auth Providers**: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/auth/providers
- **Your Google Drive**: https://drive.google.com
- **Google Account Permissions**: https://myaccount.google.com/permissions
- **Local App**: http://localhost:3000

---

## Need Help?

Run this and share the output:
```javascript
fetch('/api/debug/session-check').then(r=>r.json()).then(console.table)
```

This will show a nice table with all session details!







