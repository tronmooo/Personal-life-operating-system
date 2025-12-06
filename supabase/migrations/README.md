# LifeHub Database Migrations

This directory contains SQL migrations to fix critical bugs and add missing database infrastructure.

## Quick Start

### 1. Open Supabase SQL Editor
Navigate to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql

### 2. Run Migrations in Order

**IMPORTANT:** Run these migrations in the order listed below!

#### Migration 1: Fix DELETE RLS Policy (CRITICAL)
**File:** `fix-delete-rls-policy.sql`  
**Issue:** DELETE operations return 204 success but don't actually delete records  
**Impact:** Users can't permanently delete vehicles, workouts, relationships, etc.

**What it does:**
- Adds RLS DELETE policy for `domain_entries` table
- Ensures all CRUD policies (SELECT, INSERT, UPDATE, DELETE) are in place
- Displays all policies for verification

**How to run:**
1. Open `fix-delete-rls-policy.sql`
2. Copy all contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Verify output shows DELETE policy created

#### Migration 2: Fix Double-Nested Metadata
**File:** `fix-double-nested-metadata.sql`  
**Issue:** Some records have `metadata.metadata` structure causing display bugs  
**Impact:** Vehicles show $0 value, 0 miles; Fitness shows "No Workouts"

**What it does:**
- Scans all `domain_entries` for double-nested metadata
- Flattens `metadata.metadata` to just `metadata`
- Shows before/after for each fixed record

**How to run:**
1. Open `fix-double-nested-metadata.sql`
2. Copy all contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Review output to see how many records were fixed

#### Migration 3: Create Missing Tables
**File:** `create-missing-tables.sql`  
**Issue:** 404 errors for `insights` and `user_settings` tables  
**Impact:** Infrastructure endpoints failing

**What it does:**
- Creates `insights` table for AI-powered analytics
- Creates/verifies `user_settings` table with proper RLS
- Adds `domain_id` and `category` columns to `documents` table (fixes 400 error)
- Creates auto-trigger to initialize user_settings on signup
- Sets up proper indexes and RLS policies

**How to run:**
1. Open `create-missing-tables.sql`
2. Copy all contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Verify tables are created successfully

---

## Verification

### Test DELETE Operations
After running Migration 1, test that deletes work:

```bash
npm run test:delete
# or
node scripts/test-delete.js
```

### Expected Output:
```
✅ DELETE TEST PASSED
Deleted: Test Vehicle for DELETE
DELETE operations are now working correctly!
```

### Verify in Your App:
1. Navigate to http://localhost:3000/domains/vehicles
2. Click "Delete" on any vehicle
3. Accept the confirmation
4. **Refresh the page** (Cmd+R or F5)
5. ✅ Vehicle should stay deleted!

---

## Migration Details

### Schema Changes

#### New Tables Created:
- **`insights`**: Stores AI-generated insights and analytics
  - Columns: `id`, `user_id`, `domain`, `insight_type`, `title`, `description`, `metadata`, `severity`, `is_read`, `is_dismissed`, `created_at`, `expires_at`
  - RLS: Enabled with full CRUD policies

- **`user_settings`**: Stores user preferences and settings
  - Columns: `id`, `user_id`, `settings` (JSONB), `theme`, `language`, `timezone`, `notifications_enabled`, `email_notifications`, `push_notifications`, `created_at`, `updated_at`
  - RLS: Enabled with SELECT/INSERT/UPDATE policies
  - Trigger: Auto-creates settings on user signup

#### Modified Tables:
- **`domain_entries`**: Added DELETE RLS policy
- **`documents`**: Added `domain_id` and `category` columns (if missing)

### RLS Policies Added

#### domain_entries:
- ✅ `SELECT`: Users can view own entries
- ✅ `INSERT`: Users can create own entries
- ✅ `UPDATE`: Users can modify own entries
- ✅ **`DELETE`**: Users can delete own entries (NEW)

#### insights:
- ✅ `SELECT`: Users can view own insights
- ✅ `INSERT`: Users can create own insights
- ✅ `UPDATE`: Users can update own insights
- ✅ `DELETE`: Users can delete own insights

#### user_settings:
- ✅ `SELECT`: Users can view own settings
- ✅ `INSERT`: Users can create own settings
- ✅ `UPDATE`: Users can update own settings

---

## Rollback (if needed)

### To Rollback Migration 1 (DELETE Policy):
```sql
DROP POLICY IF EXISTS "Users can delete own domain entries" ON domain_entries;
```

### To Rollback Migration 2 (Double-Nesting Fix):
⚠️ **Cannot rollback** - metadata has been permanently flattened. This is a data transformation, not a schema change.

### To Rollback Migration 3 (New Tables):
```sql
DROP TABLE IF EXISTS insights CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_settings() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
```

---

## Troubleshooting

### DELETE still not working after Migration 1
**Check:**
1. RLS is enabled: `SELECT * FROM pg_tables WHERE tablename = 'domain_entries';`
2. Policy exists: `SELECT * FROM pg_policies WHERE tablename = 'domain_entries' AND cmd = 'DELETE';`
3. User ID matches: Ensure `auth.uid()` returns the correct user ID

**Solution:**
Run this query to verify your user ID:
```sql
SELECT auth.uid() as current_user_id;
SELECT user_id, COUNT(*) 
FROM domain_entries 
GROUP BY user_id;
```

### Migration fails with "permission denied"
**Cause:** Service role key not being used or insufficient permissions

**Solution:**
- Ensure you're running migrations in Supabase SQL Editor (uses service role automatically)
- If using scripts, verify `SUPABASE_SERVICE_ROLE_KEY` is correct

### "relation already exists" errors
**Cause:** Tables or policies already exist from previous migration attempts

**Solution:**
- Migrations include `IF NOT EXISTS` and `DROP POLICY IF EXISTS` to handle this
- Safe to re-run migrations multiple times

---

## Post-Migration Checklist

- [ ] Migration 1 completed without errors
- [ ] Migration 2 shows number of fixed records
- [ ] Migration 3 confirms tables created
- [ ] `node scripts/test-delete.js` passes
- [ ] DELETE works in app (test with vehicles)
- [ ] Refresh page - deleted items stay deleted
- [ ] No more 404 errors for insights/user_settings
- [ ] No more 400 errors for insurance documents

---

## Additional Scripts

### Check Current Database State
```bash
node scripts/check-vehicles.js        # Shows all vehicles in database
node scripts/cleanup-duplicates.js    # Removes duplicate entries
```

### Manual Testing
```bash
# Start your development server
npm run dev

# In browser:
# 1. Login as teat@aol.com
# 2. Go to Vehicles domain
# 3. Try to delete a vehicle
# 4. Refresh page
# 5. Verify vehicle is gone
```

---

## Support

If migrations fail or issues persist:

1. Check Supabase logs: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/logs
2. Review `bug-reports/delete-bug-investigation-2025-10-28.md` for detailed analysis
3. Check console errors in browser DevTools
4. Verify RLS policies in Supabase Dashboard → Authentication → Policies

---

## Migration History

| Date | Migration | Status | Notes |
|------|-----------|--------|-------|
| 2025-10-28 | Fix DELETE RLS Policy | ⏳ Pending | Critical fix for delete bug |
| 2025-10-28 | Fix Double-Nested Metadata | ⏳ Pending | Fixes display issues |
| 2025-10-28 | Create Missing Tables | ⏳ Pending | Adds infrastructure |

---

**Last Updated:** October 28, 2025  
**Project:** LifeHub Personal Life Operating System  
**Database:** Supabase (jphpxqqilrjyypztkswc)






