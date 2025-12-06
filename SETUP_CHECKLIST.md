# 🚀 Quick Setup Checklist

Complete these steps to get your Supabase + Vapi integration running.

## ✅ 1. Database Setup (Supabase)

### Apply Migrations
```bash
cd supabase
supabase db push
```

**This creates:**
- ✅ `call_history` table - AI Concierge calls
- ✅ `user_locations` table - Location tracking  
- ✅ `user_preferences` table - User settings
- ✅ RLS policies - Security for all tables

**Verify:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('call_history', 'user_locations', 'user_preferences');

-- Should return 3 rows
```

## ✅ 2. Environment Variables

Create `.env.local` in project root:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Vapi AI Concierge
NEXT_PUBLIC_VAPI_KEY=pk_live_your_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id
VAPI_ASSISTANT_ID=your_assistant_id
VAPI_API_KEY=sk_live_your_secret_key
VAPI_PHONE_NUMBER_ID=your_phone_number_id
VAPI_AUTH_TOKEN=random_secure_string_here
```

**Get Vapi Values:**
1. Go to https://dashboard.vapi.ai
2. Copy keys from Settings → API Keys
3. Copy Assistant ID from Assistants section
4. Copy Phone Number ID from Phone Numbers section

## ✅ 3. Configure Vapi Webhook

**In Vapi Dashboard:**
1. Go to your Assistant
2. Settings → Webhooks
3. Set URL: `https://your-domain.com/api/vapi/webhook`
4. For local dev, use ngrok:
   ```bash
   ngrok http 3000
   # Use the https URL
   ```

## ✅ 4. Test the Migration

### Test User Preferences
```typescript
// In any component
import { useUserPreferences } from '@/lib/hooks/use-user-preferences'

const { value, setValue } = useUserPreferences('test-key', { test: true })
await setValue({ test: false })
// Check Supabase dashboard - should see in user_preferences table
```

### Test Call History
1. Visit `/call-history` page
2. Make a test call (if Vapi configured)
3. Call should appear in the list
4. Check Supabase dashboard - should see in `call_history` table

### Test Dashboard Configuration
1. Visit customizable dashboard
2. Rearrange widgets
3. Click Save
4. Refresh page - layout should persist
5. Check Supabase - should see in `user_preferences` table

### Test Connections
1. Visit `/connections` page
2. Connect a service
3. Refresh page - should still be connected
4. Check Supabase - should see in `user_preferences` table

## ✅ 5. Verify No localStorage Usage

**These should now be empty:**
- ❌ `vapi-call-history` 
- ❌ `vapi-call-stats`
- ❌ `lifehub-dashboard-config`
- ❌ `lifehub-connections`
- ❌ `lifehub-*` (any domain keys)

**Check in browser:**
```javascript
// Open DevTools Console
Object.keys(localStorage).filter(k => 
  k.includes('vapi') || 
  k.includes('lifehub')
)
// Should return empty array []
```

## ✅ 6. Run One-Time Migration (Optional)

**If you have existing localStorage data:**

```typescript
import { localStorageMigration } from '@/lib/migrate-localStorage-to-supabase-final'

// Check if migration needed
const needsMigration = await localStorageMigration.needsMigration()

if (needsMigration) {
  const result = await localStorageMigration.migrateAllData()
  console.log('Migrated:', result.migratedKeys)
  console.log('Errors:', result.errors)
}
```

## 🧪 Testing Checklist

- [ ] Supabase tables created successfully
- [ ] Can log in with Supabase auth
- [ ] Dashboard configuration saves and persists
- [ ] Connections page saves and persists
- [ ] Call history (if using Vapi) saves to Supabase
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] localStorage is empty of migrated keys
- [ ] Data syncs across devices/browsers

## 🐛 Common Issues

### "Cannot find name 'use'" error
**Fix:** Already fixed - `params` now typed correctly, not as Promise

### Supabase RLS errors
**Fix:** Ensure user is authenticated before accessing data
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  // Handle not authenticated
}
```

### Webhook not receiving events
**Fix:** 
1. Use ngrok for local dev
2. Verify webhook URL in Vapi dashboard
3. Check server logs at `/api/vapi/webhook`

### Data not saving
**Fix:**
1. Check browser console for errors
2. Verify Supabase connection
3. Check RLS policies allow inserts
4. Verify user is authenticated

## 📊 Architecture Overview

```
Browser (Client)
    ↓
useUserPreferences Hook → Supabase user_preferences table
useData Hook → Supabase domain tables
callHistoryStorage → Supabase call_history table
    ↓
All Protected by RLS
    ↓
User can only access their own data
```

## 🎯 What's Been Migrated

### ✅ Completed
1. **Call History System**
   - `app/call-history/page.tsx`
   - `app/api/vapi/webhook/route.ts`
   - `lib/call-history-storage-supabase.ts`

2. **Customizable Dashboard**
   - `components/dashboard/customizable-dashboard.tsx`
   - Configuration + Widget data

3. **Connections Page**
   - `app/connections/page.tsx`
   - All connection settings

### 🔄 Remaining (Optional)
- AI Concierge location tracker
- Documents page (if not using DataProvider)
- Finance components (if not using DataProvider)
- Career page (if not using DataProvider)

## 📚 Documentation

- `MIGRATION_GUIDE.md` - Complete migration documentation
- `VAPI_SETUP.md` - Vapi configuration guide
- `plan.md` - Migration progress tracker

## 🚀 Deploy to Production

1. ✅ Set environment variables in hosting platform
2. ✅ Update Vapi webhook URL to production domain
3. ✅ Run Supabase migrations on production database
4. ✅ Test all features in production
5. ✅ Monitor logs for errors

---

**Status**: ✅ Core migrations complete - System is cloud-native!
**Next**: Test thoroughly, then deploy to production









