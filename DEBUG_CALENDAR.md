# 🔍 Debug Google Calendar

I've added detailed logging to help us figure out why the calendar isn't showing events.

## 🧪 Test It Now:

1. **Open your browser to** `http://localhost:3000`

2. **Open Developer Console:**
   - Press `F12` or `Cmd + Option + J` (Mac) or `Ctrl + Shift + J` (Windows)
   - Go to the **"Console"** tab

3. **Hard Refresh:**
   - Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + F5` (Windows)

4. **Look for these emoji logs** in the console:

   ```
   📅 useCalendarEvents - fetchEvents called { ... }
   📅 useCalendarEvents - Fetching from /api/calendar/sync?days=7
   📅 useCalendarEvents - Response: { ok: true, status: 200, eventCount: X }
   📅 useCalendarEvents - Successfully set X events
   ```

5. **Also check your TERMINAL (where `npm run dev` is running):**

   Look for:
   ```
   📅 Calendar sync - Session check: { ... }
   📅 Fetching events for next 7 days...
   📅 Successfully fetched X events
   ```

---

## 📊 What the Logs Will Tell Us:

### If you see this in BROWSER console:
```
📅 useCalendarEvents - Skipping fetch (not authenticated)
```
**→ You're not signed in with Google**

### If you see this in BROWSER console:
```
📅 useCalendarEvents - Response: { ok: false, status: 401, error: "..." }
```
**→ Session doesn't have access token (need to sign out and sign in again)**

### If you see this in TERMINAL:
```
📅 No access token in session
```
**→ NextAuth session is missing the Google access token**

### If you see this in TERMINAL:
```
📅 Calendar fetch error: invalid_grant
```
**→ Access token expired or invalid (need to re-authorize)**

---

## ⚠️ Most Likely Issue:

The session might not have the `accessToken` and `refreshToken` from Google. This can happen if:

1. **You signed in BEFORE I fixed the navigation** (old session without tokens)
2. **Google Calendar scopes weren't granted** during sign-in
3. **Access token expired** and refresh didn't work

## 🔧 Quick Fix:

1. **Click your profile picture** (top right)
2. **Click "Sign Out"**
3. **Go to** `http://localhost:3000/auth/signin`
4. **Click "Sign in with Google"**
5. **Make sure you CHECK THE BOX** to allow calendar access
6. **After signing in**, check the console logs again

---

## 📝 Send Me:

After you do the above, send me:
1. **What you see in the browser console** (the 📅 logs)
2. **What you see in the terminal** (the 📅 logs)
3. **A screenshot of the Upcoming Events card** (what it shows)

This will help me pinpoint exactly where the issue is!
































