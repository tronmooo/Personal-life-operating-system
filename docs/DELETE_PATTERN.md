# Proper Delete Pattern for Domain Data

## Problem Statement

When users click the trash can icon to delete data, it should:
1. ✅ Delete from the Supabase database immediately
2. ✅ Remove from the UI immediately (optimistic update)
3. ✅ Clear any loading/deleting states
4. ✅ Reload the data to stay in sync with the database
5. ✅ Show confirmation dialog before deleting
6. ✅ Show success/error toast messages

## The Correct Pattern

### ✅ GOOD: Complete Delete Handler

```typescript
const handleDelete = async (id: string) => {
  // 1. Show confirmation
  if (!confirm('Delete this item?')) return
  
  // 2. Set loading state
  setDeletingIds(prev => new Set(prev).add(id))
  
  try {
    // 3. Delete from database (deleteData handles optimistic UI update)
    await deleteData('domainName', id)
    
    // 4. Clear loading state after success
    setDeletingIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    
    // 5. Reload data to stay in sync with database
    await reloadDomain('domainName' as any)
    // OR
    await loadData() // if using local load function
    
  } catch (error) {
    console.error('Failed to delete:', error)
    
    // 6. Clear loading state on error
    setDeletingIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    
    // 7. Try to reload anyway to stay in sync
    reloadDomain('domainName' as any)
  }
}
```

### ❌ BAD: Missing Reload

```typescript
// DON'T DO THIS - UI won't refresh!
const handleDelete = async (id: string) => {
  setDeletingIds(prev => new Set(prev).add(id))
  try {
    await deleteData('health', id)
    // ❌ Missing: Clear deleting state
    // ❌ Missing: Reload data
  } catch (error) {
    console.error('Failed to delete:', error)
  }
}
```

## How `deleteData` Works

The `deleteData` function in DataProvider:

1. **Optimistically removes from UI** - Updates React state immediately
2. **Updates IndexedDB cache** - For offline support
3. **Deletes from Supabase** - Calls `deleteDomainEntryRecord(supabase, id)`
4. **Shows toast notifications** - Success or error messages
5. **Rolls back on error** - Restores data if database delete fails

## Files That Need This Pattern

### Already Fixed ✅
- `components/health/vitals-tab.tsx` - Delete vitals entries
- `components/health/records-tab.tsx` - Delete allergies, conditions, documents

### Need Audit/Fixes ⚠️
- `components/domains/domain-detail-page.tsx` - Generic domain deletes
- `components/finance/*` - Financial domain deletes
- `components/vehicles/*` - Vehicle deletes
- `components/home/*` - Home property deletes
- `components/insurance/*` - Insurance policy/claim deletes
- `components/pets/*` - Pet profile deletes
- All other domain-specific components

## Testing Delete Functionality

### Manual Test
1. Add a test entry to any domain
2. Note the entry ID in browser console
3. Click the trash can
4. Confirm deletion
5. **Check browser console**: Should see `✅ Successfully deleted from database: [id]`
6. **Refresh the page**: Entry should still be gone (proves it was deleted from DB)

### Verify Database Deletion

Run this query in Supabase SQL Editor:

```sql
-- Check if entry still exists (should return 0 rows)
SELECT * FROM domain_entries WHERE id = 'YOUR_ENTRY_ID';

-- Check recent deletions (audit log if you have one)
SELECT * FROM domain_entries 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL')
ORDER BY updated_at DESC
LIMIT 10;
```

## Common Issues

### Issue 1: "Data reappears after refresh"
**Cause**: Data not actually deleted from database  
**Fix**: Ensure `deleteData` is being awaited and check for errors

### Issue 2: "Trash can stays spinning forever"
**Cause**: `deletingIds` state not cleared after delete  
**Fix**: Clear the state in both success and error cases

### Issue 3: "Delete works but UI doesn't update"
**Cause**: No reload after deletion  
**Fix**: Call `reloadDomain()` or `loadData()` after successful delete

### Issue 4: "Console shows 'deleted 0 entries'"
**Cause**: Row Level Security (RLS) blocking delete, or entry doesn't belong to user  
**Fix**: Check RLS policies, verify entry ownership

## Row Level Security (RLS)

Ensure your Supabase RLS policy allows deletes:

```sql
-- Check RLS policy
SELECT * FROM pg_policies WHERE tablename = 'domain_entries';

-- Delete policy should look like:
CREATE POLICY "Users can delete own entries" ON domain_entries
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Debugging Checklist

When delete isn't working:

- [ ] Check browser console for error messages
- [ ] Verify `deleteData` is being called with correct ID
- [ ] Confirm entry belongs to authenticated user
- [ ] Check RLS policies allow DELETE
- [ ] Verify database connection is working
- [ ] Check if `deletingIds` state is being managed
- [ ] Ensure reload function is called after delete
- [ ] Test with hard refresh (F5) to verify database deletion

## Summary

**Always follow this pattern:**
1. Confirm with user
2. Set loading state
3. Call `await deleteData(domain, id)`
4. Clear loading state
5. Reload data
6. Handle errors gracefully

This ensures data is deleted from both the database AND the UI, with proper user feedback.

