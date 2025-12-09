# ⚡ QUICK FIX: Google Calendar & Gmail (3 Minutes)

## 🎯 The Issue

Google Calendar and Gmail don't work because your login doesn't have the right permissions.

## ✅ THE FIX (Copy/Paste Instructions)

### 1️⃣ Update Supabase (2 minutes)

**Open This URL:**
```
https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/auth/providers
```

**Steps:**
1. Click on **"Google"** provider (should be enabled already)
2. Scroll to **"Scopes"** field
3. **REPLACE** the current scopes with this:
```
email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata
```
4. Click **"Save"**

### 2️⃣ Re-Authenticate (1 minute)

**Open This URL:**
```
https://life-hub.me
```

**Steps:**
1. Click your profile picture (top right)
2. Click **"Sign Out"**
3. Click **"Continue with Google"**
4. ⚠️ **CRITICAL**: When Google asks for permissions, click **"Allow All"**
   - Must allow: Calendar, Gmail, Drive access

### 3️⃣ Test (30 seconds)

**Test Gmail:**
```
1. Go to home page (Command Center)
2. Find "Smart Inbox" card (📬)
3. Click "Sync Gmail" button
4. Wait ~30 seconds
5. Should see email suggestions!
```

**Test Calendar:**
```
1. Find "Upcoming Events" card (📅)
2. Should show your Google Calendar events
3. Click refresh icon to sync
```

---

## 🚨 Common Issues

### "Gmail sync unavailable - Not signed in"
→ You didn't click "Allow All" when signing in. Go to https://myaccount.google.com/permissions, remove "LifeHub", sign in again.

### "Calendar access needs to be refreshed"  
→ Same as above - missing permissions. Revoke and re-authorize.

### Still not working?
→ Check browser console (F12) for error messages and share them.

---

## ✨ Why This Works

- Supabase needs to **request** these scopes from Google
- Your browser needs to **grant** these scopes  
- Once granted, the OAuth token has the right permissions
- Then Calendar and Gmail APIs will work

---

## 📊 Success Criteria

After following these steps, you should see:

✅ Smart Inbox showing email suggestions  
✅ Google Calendar events displaying  
✅ No "needs to be refreshed" messages  
✅ No "not authenticated" errors  

**Total Time:** ~3 minutes  
**Difficulty:** Copy/paste + 2 clicks

