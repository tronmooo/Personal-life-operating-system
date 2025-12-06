# 🚀 Quick Start: Google Calendar Integration

## ✅ What's Done
- ✅ Google Sign-In button created
- ✅ NextAuth.js OAuth configured
- ✅ Calendar sync service built
- ✅ Database table ready
- ✅ Calendar page created (`/calendar`)
- ✅ Command Center card added
- ✅ Background sync job implemented
- ✅ All environment variables set

---

## ⚡ 3 Steps to Get It Working

### Step 1: Add Supabase Callback (2 minutes)

**Go here:**
https://console.cloud.google.com/apis/credentials/oauthclient/your-google-client-id.apps.googleusercontent.com

**Add this URL:**
```
https://jphpxqqilrjyypztkswc.supabase.co/auth/v1/callback
```

**Click "SAVE"**

---

### Step 2: Enable Google in Supabase (2 minutes)

**Go here:**
https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/auth/providers

**Enable Google provider and add:**
- Client ID: `your-google-client-id.apps.googleusercontent.com`
- Client Secret: `GOCSPX-your-google-client-secret`

**Click "SAVE"**

---

### Step 3: Run Database Migration (1 minute)

**Go here:**
https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql

**Copy contents of:**
`supabase/migrations/20250116_calendar_sync_log.sql`

**Paste and click "RUN"**

---

## 🎉 That's It!

### Test It Out:

1. **Restart server:**
   ```bash
   npm run dev
   ```

2. **Sign in:**
   - Look for "Sign in with Google" button
   - Click it and authorize

3. **View calendar:**
   - Visit: http://localhost:3000/calendar
   - See your Google Calendar events!

4. **Check Command Center:**
   - Go to dashboard
   - See "Upcoming Events" card with Google Calendar data

5. **Test auto-sync:**
   - Add a health appointment with a date
   - Check your Google Calendar - it's there!

---

## 📦 What You Got

### Sign-In Component
```typescript
import { GoogleSignInButton } from '@/components/auth/google-signin-button'

<GoogleSignInButton />
```

### Calendar Hook
```typescript
import { useCalendarEvents } from '@/hooks/use-calendar-events'

const { events, loading, refetch } = useCalendarEvents(30) // next 30 days
```

### Manual Sync
```typescript
// Sync a specific record
await fetch('/api/calendar/sync', {
  method: 'POST',
  body: JSON.stringify({
    domain: 'health',
    recordId: 'record-id'
  })
})
```

### Dashboard Card
```typescript
import { GoogleCalendarCard } from '@/components/dashboard/google-calendar-card'

<GoogleCalendarCard />
```

---

## 📖 Full Documentation

See `GOOGLE_CALENDAR_SETUP_COMPLETE.md` for:
- Detailed feature list
- Auto-sync examples for all domains
- Troubleshooting guide
- Production deployment
- Cron job setup

---

## 🐛 Quick Troubleshooting

**"Unauthorized" error?**
- Complete Steps 1 & 2 above
- Restart server
- Try signing out and back in

**Events not showing?**
- Check your Google Calendar has events
- Refresh the page
- Click the refresh button

**Auto-sync not working?**
- Check domain records have date fields
- Check Supabase table for sync logs
- Run manual sync to test

---

**You're ready to go! 🎊**
































