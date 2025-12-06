# 🐛 Debug: Why Command Center Isn't Showing Data

## The Problem

Your data is being saved, but the Command Center can't see it because of a **storage key mismatch**.

## How to Check Your Data

Open your browser console (F12) and run this:

```javascript
// Check what's actually in localStorage
const domains = ['vehicles', 'pets', 'health', 'home', 'collectibles', 'nutrition', 'fitness', 'mindfulness', 'digital', 'appliances', 'legal', 'utilities', 'career', 'relationships', 'miscellaneous', 'financial', 'insurance', 'education', 'travel', 'planning'];

console.log('=== CHECKING LOCALSTORAGE ===\n');

// Check individual domain keys (OLD system)
domains.forEach(domain => {
  const key = `lifehub-${domain}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      console.log(`✅ ${domain}: ${parsed.length} items in '${key}'`);
    } catch (e) {
      console.log(`❌ ${domain}: Invalid JSON in '${key}'`);
    }
  }
});

// Check unified key (NEW system)
const unifiedData = localStorage.getItem('lifehub_data');
if (unifiedData) {
  try {
    const parsed = JSON.parse(unifiedData);
    console.log('\n=== UNIFIED DATA (lifehub_data) ===');
    Object.keys(parsed).forEach(domain => {
      console.log(`✅ ${domain}: ${parsed[domain]?.length || 0} items`);
    });
  } catch (e) {
    console.log('❌ lifehub_data: Invalid JSON');
  }
} else {
  console.log('\n❌ NO UNIFIED DATA FOUND (lifehub_data is empty)');
}
```

## Expected Output

### If Data is in OLD Keys:
```
✅ vehicles: 3 items in 'lifehub-vehicles'
✅ pets: 2 items in 'lifehub-pets'
❌ NO UNIFIED DATA FOUND (lifehub_data is empty)
```
**Problem:** Data is in old keys, Command Center reads from unified key

### If Data is in NEW Key:
```
=== UNIFIED DATA (lifehub_data) ===
✅ vehicles: 3 items
✅ pets: 2 items
```
**Good:** Data is in unified key, Command Center should see it

## The Fix

The DataProvider has a migration system that should move data from old keys to the new unified key, but it might not have run yet or might have failed.

### Force Migration

Run this in console to force migration:

```javascript
// Clear migration flag to force re-run
localStorage.removeItem('lifehub_migration_completed');

// Reload page
location.reload();
```

The page will reload and automatically migrate all data from individual keys to the unified key.

## Why This Happened

1. **Old System:** Each domain saved to its own key (`lifehub-vehicles`, `lifehub-pets`, etc.)
2. **New System:** DataProvider uses ONE unified key (`lifehub_data`)
3. **Migration:** Should automatically move old data to new key on first load
4. **Your Issue:** Migration either didn't run or data is still in old keys

## Next Steps

1. Run the debug script above in console
2. Check if data is in old keys or new key
3. If in old keys, run the force migration script
4. Refresh and check Command Center

---

**After migration, your Command Center will show all your data!** 🎉



