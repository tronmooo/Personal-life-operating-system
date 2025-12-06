# 🔧 Enable Google Drive API

## Quick Steps (5 minutes)

### 1. Go to Google Cloud Console
https://console.cloud.google.com/apis/library/drive.googleapis.com

### 2. Select Your Project
Choose the same project you used for Google Calendar (`lifehub-475301`)

### 3. Enable Google Drive API
Click **"ENABLE"** button

### 4. Verify OAuth Consent Screen

Go to: https://console.cloud.google.com/apis/credentials/consent

**Scopes should now include:**
- ✅ `openid`
- ✅ `email` 
- ✅ `profile`
- ✅ `.../auth/calendar`
- ✅ `.../auth/calendar.events`
- ✅ `.../auth/drive.file` ← NEW
- ✅ `.../auth/drive.appdata` ← NEW

**If the Drive scopes are missing, add them:**

1. Click "EDIT APP"
2. Click "ADD OR REMOVE SCOPES"
3. Filter for "Google Drive API"
4. Check these boxes:
   - ✅ `https://www.googleapis.com/auth/drive.file`
   - ✅ `https://www.googleapis.com/auth/drive.appdata`
5. Click "UPDATE"
6. Click "SAVE AND CONTINUE"

### 5. Test Users (If in Testing Mode)

Make sure your email `tronmoooo@gmail.com` is still in the test users list.

---

## ✅ That's It!

Now when you sign in, Google will request Drive permissions.

Your OAuth scopes in the code already include Drive:

```typescript
// app/api/auth/[...nextauth]/route.ts
scope: [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.file', // ← Already added!
  'https://www.googleapis.com/auth/drive.appdata',
]
```

---

## 🧪 Test It

1. Sign out and sign back in with Google
2. You'll see: **"LifeHub wants to access your Google Drive"**
3. Click "Allow"
4. Upload a test document
5. Check your Google Drive → `LifeHub/` folder created!

---

**Need help?** See `GOOGLE_DRIVE_SETUP.md` for full documentation.
































