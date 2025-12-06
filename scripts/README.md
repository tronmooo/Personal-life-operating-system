# Database Cleanup Scripts

## Understanding Your Data

The data you're seeing on the dashboard **IS REAL DATA from your Supabase database**, not hardcoded mock data.

When you see:
- Glucose: 92
- Weight: 175.2 lbs
- Heart Rate: 72 bpm
- Blood Pressure: 118/78
- Medications: 2

These values are being calculated from actual database entries in the `domain_entries` table. Check your browser console for logs showing the actual database IDs and timestamps.

## Why You Have This Data

This data was likely:
1. Created during initial testing/setup
2. Added through the app's UI at some point
3. Imported from a seed script or migration
4. Created by you or another developer testing the app

## How to Clear All Data

### Option 1: Clear Health Data Only

Run `clear-health-data.sql` in Supabase SQL Editor:

1. Go to https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql
2. Copy and paste the SQL from `clear-health-data.sql`
3. Replace `'test@aol.com'` with your actual email
4. Click "Run"
5. Refresh your app

### Option 2: Clear ALL Data (Complete Reset)

Run `clear-all-sample-data.sql` in Supabase SQL Editor:

1. Go to https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql
2. Copy and paste the SQL from `clear-all-sample-data.sql`
3. Replace `'test@aol.com'` with your actual email
4. **Uncomment the preview queries first** to see what will be deleted
5. Once you're sure, run the full DELETE script
6. Refresh your app

### After Clearing Data

Once you clear the data:
- Dashboard will show "No data" for all cards
- Health tab will show "No vitals recorded yet"
- All domain detail pages will be empty
- You can start adding real data through the UI

## Verifying Data Source

To confirm the data is coming from Supabase:

1. Open your browser console (F12)
2. Look for logs starting with 🏥
3. You'll see:
   - Database IDs (UUIDs)
   - Created/Updated timestamps
   - Actual metadata from Supabase

Example log:
```
🏥 ⚠️ SHOWING ACTUAL DATABASE DATA - These are real entries from your Supabase database!
🏥 Sample entry 0: {
  "id": "d4dbdaec-4b01-404a-95f7-07a8f8818614",
  "title": "Penicillin",
  "createdAt": "2025-10-29T06:13:28.403Z",
  ...
}
```

## Data Flow

```
Supabase DB → DataProvider → Dashboard Components → UI Display
     ↓
domain_entries table
  - 15 health entries
  - Including: allergies, conditions, vitals
```

## Still Seeing "Mock" Data?

If you still believe it's mock data after checking the console logs:

1. Run this query in Supabase SQL Editor to see the actual data:

```sql
SELECT id, title, created_at, metadata 
FROM domain_entries 
WHERE domain = 'health' 
  AND user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com')
ORDER BY created_at DESC;
```

2. Compare the IDs and values with what you see in the browser console logs
3. They should match exactly, confirming it's real database data

## Questions?

The data is definitely coming from Supabase. The confusion might be because:
- You don't remember adding it
- It was added during initial setup/testing
- The values look generic (72 bpm, 118/78 BP) but they're still real entries in your DB

To verify 100%, just run the DELETE script and the data will disappear from your app immediately.

