# 🔧 How to Fix Google Calendar & Gmail Integration

## ⚠️ THE PROBLEM

Google Calendar and Gmail aren't working because your current login session doesn't have the necessary permissions (OAuth scopes).

## ✅ THE SOLUTION (2 MINUTES)

### Step 1: Update Supabase Google Provider

1. Go to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/auth/providers

2. Click on **Google** provider

3. Find the **Scopes** field and add these scopes:
   ```
   email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata
   ```

4. Click **Save**

### Step 2: Force Re-authentication

**Option A: Sign Out & Back In (Easiest)**

1. Go to https://life-hub.me
2. Click your profile icon (top right)
3. Click **Sign Out**
4. Click **Sign In with Google**
5. **IMPORTANT**: Grant ALL permissions when Google asks (Calendar, Gmail, Drive)

**Option B: Revoke Access (Nuclear Option)**

1. Go to: https://myaccount.google.com/permissions
2. Find "LifeHub" and click **Remove Access**
3. Go to https://life-hub.me
4. Sign in with Google again
5. Grant all permissions

### Step 3: Test

#### Test Gmail Smart Inbox:
1. Go to Command Center (home page)
2. Find "Smart Inbox" card  
3. Click **"Sync Gmail"** button
4. Wait 10-30 seconds
5. See email suggestions appear! ✨

#### Test Google Calendar:
1. Look for "Upcoming Events" card (📅)
2. Should show your Google Calendar events
3. Click the refresh icon to sync

---

## 🎉 What Will Work After This

### Gmail Smart Inbox:
- AI automatically reads your recent emails
- Detects bills, appointments, receipts
- Suggests adding them to appropriate domains
- One-click approve/reject

### Google Calendar:
- Shows your upcoming Google Calendar events
- Syncs automatically
- Can create events from the AI Assistant
- Displays on Command Center

---

## 🐛 If It Still Doesn't Work

### Check Your Supabase Logs:
https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/logs/explorer

### Check Environment Variables in Vercel:
https://vercel.com/your-project/settings/environment-variables

Make sure these are set:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` (should be https://life-hub.me)
- `NEXTAUTH_SECRET`

### Still Broken?

The issue is 99% that your OAuth token doesn't have the right scopes. You MUST:
1. Sign out completely
2. Sign back in with Google
3. Grant ALL permissions when asked

Google only asks for permissions once. If you denied them before, you need to revoke access at https://myaccount.google.com/permissions

