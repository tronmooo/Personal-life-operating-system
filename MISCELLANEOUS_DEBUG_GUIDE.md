# Miscellaneous Domain Debug Guide

## Issue
Miscellaneous items can be added but disappear after page refresh, with a 400 error in the console.

## Changes Made

### 1. Enhanced Error Logging
Updated `lib/hooks/use-domain-entries.ts` to log detailed error information:
- Added pre-insert logging to show exact payload being sent
- Added detailed error logging showing Supabase error codes, messages, and hints
- Added validation to ensure data is returned from insert

### 2. Database Verification
Verified that:
- ✅ `domain_entries` table exists and is properly configured
- ✅ RLS policies are correct (users can insert/select their own entries)
- ✅ Direct database inserts work perfectly
- ✅ All required fields are present (id, user_id, domain, title)
- ✅ Miscellaneous domain is properly defined in types

## Testing Instructions

### Step 1: Clear Browser Cache
1. Open Chrome DevTools (F12)
2. Go to Application > Storage
3. Click "Clear site data"
4. Refresh the page

### Step 2: Test Adding Miscellaneous Item
1. Navigate to `/domains/miscellaneous`
2. Click "+ Add Your First Item" or "+ Add Item"
3. Fill in the form:
   - **Item Name**: Test Boat
   - **Category**: Boat/Watercraft
   - **Estimated Value**: 50000
   - **Description**: Test item for debugging
4. Click "Add Item"

### Step 3: Check Console Logs
Open browser console (F12) and look for these log messages:

#### Expected Success Logs:
```
🔵 About to insert into domain_entries: { payload: {...}, userId: '...', userEmail: '...' }
✅ Successfully saved to database: <entry-id>
```

#### If Error Occurs:
```
❌ Supabase insert error: {
  code: '...',
  message: '...',
  details: '...',
  hint: '...',
  payload: {...}
}
```

### Step 4: Verify Data Persistence
1. After adding the item, refresh the page
2. The item should still be visible
3. Check the console for any errors during data loading

## Common Issues & Solutions

### Issue: 400 Error
**Possible Causes:**
1. **Auth Token Expired**: Sign out and sign back in
2. **Invalid Metadata**: Check that all values are proper types (numbers, strings, etc.)
3. **RLS Policy Issue**: Verify you're logged in as the correct user
4. **CORS Issue**: Check that Supabase URL is correctly configured

**Debug Steps:**
1. Check the `🔵 About to insert` log to see exact payload
2. Look at the `❌ Supabase insert error` for specific error details
3. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`

### Issue: No Error But Item Still Disappears
**Possible Cause:** IndexedDB cache issue

**Solution:**
1. Open DevTools > Application > IndexedDB
2. Delete all IndexedDB databases for your site
3. Refresh and try again

### Issue: "Not Authenticated" Error
**Solution:**
1. Sign out from Settings
2. Sign back in
3. Try adding the item again

## Manual Database Test

If you want to verify the database is working directly:

```sql
-- In Supabase SQL Editor, run:
SELECT * FROM domain_entries 
WHERE domain = 'miscellaneous' 
  AND user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com')
ORDER BY created_at DESC
LIMIT 10;
```

This will show you all miscellaneous items in the database for your user.

## Next Steps

1. **Try the test above** and share the console logs
2. **If you see the `🔵 About to insert` log**, copy the full payload and share it
3. **If you see the `❌ Supabase insert error` log**, copy the complete error object
4. **Take a screenshot** of the browser console showing all log messages during the add operation

With these detailed logs, we can identify the exact cause of the 400 error and fix it.

## Additional Debugging

### Enable Verbose Supabase Logging
If the above doesn't reveal the issue, we can add even more detailed Supabase client logging by temporarily modifying the Supabase client configuration.

### Check Network Tab
1. Open DevTools > Network
2. Filter by "domain_entries"
3. Try adding an item
4. Click on the failed request
5. Check the "Payload" and "Response" tabs for detailed error information

---

**Last Updated:** October 30, 2025  
**Status:** Ready for Testing



