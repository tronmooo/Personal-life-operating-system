# Assets Display Issue - Investigation & Fix Summary

## Issue Report
User reported that the Assets tab was not showing all assets despite data being added to the database.

## Investigation Results

### Database State
- **Total appliances entries in database**: 15
- **Breakdown by user**:
  - User 1 (`713c0e33-31aa-4bb8-bf27-476b5eba942e`): 8 items
  - User 2/Current (`3d67799c-7367-41a8-b4da-a7598c02f346`): 7 items

### Root Cause
The `ApplianceTrackerAutoTrack` component was loading data from the **legacy `appliances` table** instead of the **universal `domain_entries` table**.

```typescript
// BEFORE (Line 305-309):
const { data: appliancesData, error: appliancesError } = await supabase
  .from('appliances')  // ❌ Legacy table with only 3 items
  .select('*')
  .eq('user_id', session.user.id)
  .order('created_at', { ascending: false })
```

### Table Data Comparison
| Table | Item Count | Source |
|-------|-----------|---------|
| `appliances` (legacy) | 3 items | Old table structure |
| `domain_entries` | 15 items | Universal table (correct source) |

## Fix Applied

Updated `components/domain-profiles/appliance-tracker-autotrack.tsx` line 305-355 to:

```typescript
// AFTER (Line 306-311):
const { data: domainEntriesData, error: domainEntriesError } = await supabase
  .from('domain_entries')  // ✅ Universal table
  .select('*')
  .eq('user_id', session.user.id)
  .eq('domain', 'appliances')
  .order('created_at', { ascending: false })
```

### Data Transformation
Added proper mapping from `domain_entries` schema to `Appliance` interface:

```typescript
const appliancesWithPhotos = domainEntriesData.map(entry => {
  const meta = entry.metadata || {}
  return {
    id: entry.id,
    user_id: entry.user_id,
    name: entry.title || meta.name || 'Unnamed Appliance',
    category: meta.category || 'Other',
    brand: meta.brand || '',
    model_number: meta.model || meta.modelNumber || '',
    serial_number: meta.serialNumber || '',
    purchase_date: meta.purchaseDate || entry.created_at,
    purchase_price: parseFloat(meta.purchasePrice || meta.value || '0'),
    location: meta.location || '',
    expected_lifespan: parseInt(meta.estimatedLifespan || '10'),
    notes: entry.description || meta.notes || '',
    created_at: entry.created_at,
    updated_at: entry.updated_at,
    photoUrl: meta.photoUrl || null
  } as Appliance
})
```

## Verification Results

**After Fix:**
- ✅ Assets page now shows **7 assets** for current user (correct)
- ✅ Dashboard card shows "7 Total Assets" (correct)
- ✅ All 7 asset tabs visible:
  1. Samsung Refrigerator
  2. Bosch Dishwasher
  3. Samsung Washing Machine
  4. refi
  5. Kitchen Refrigerator
  6. Dishwasher Repair
  7. Washer/Dryer Set

## Other Domains Status

### ✅ Vehicles - Already Correct
- Uses `DataProvider.getData('vehicles')` which loads from `domain_entries`
- No fix needed

### ✅ Pets - Already Correct  
- Uses dedicated `pets` table via API routes (`/api/pets`)
- No fix needed

### ✅ Digital Assets - Already Correct
- Uses `useDomainEntries('digital')` hook which loads from `domain_entries`
- No fix needed

## Architecture Note

The codebase has three data storage patterns:

1. **Universal `domain_entries` table** (preferred):
   - Most domains: health, digital, home, mindfulness, etc.
   - Accessed via `useDomainEntries()` hook or `DataProvider`

2. **Legacy domain-specific tables**:
   - `appliances` table (legacy - only 3 items)
   - `vehicles` table (legacy)
   - Should be migrated to `domain_entries` or removed

3. **Dedicated specialized tables**:
   - `pets` table (used actively with API)
   - Has related tables: `pet_vaccinations`, `pet_costs`

## Recommendation

Consider migrating remaining legacy table references to use the universal `domain_entries` table for consistency, or maintain clear documentation on which domains use which storage pattern.

---

**Date**: 2025-11-12  
**Fixed By**: Claude Code  
**Status**: ✅ RESOLVED



