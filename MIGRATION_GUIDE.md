# localStorage → Supabase Migration Guide

This guide documents the migration of all localStorage-based data storage to Supabase cloud storage.

## Overview

All data previously stored in the browser's localStorage is being migrated to Supabase for:
- ✅ **Cloud sync** - Access your data from any device
- ✅ **Data persistence** - Never lose your data
- ✅ **Better performance** - Optimized queries and indexing
- ✅ **Collaboration** - Share data with family/team members (future feature)
- ✅ **Backup & Recovery** - Automatic backups

## Migration Status

### ✅ Phase 1: Core Infrastructure (COMPLETE)
- All domain data (health, finance, home, etc.) migrated to Supabase
- Command Center fully Supabase-backed
- DataProvider refactored for cloud-only operation

### 🔄 Phase 2: Remaining localStorage Dependencies (IN PROGRESS)

## What's Been Created

### 1. **New Supabase Tables**

File: `supabase/migrations/20250124_create_call_history_table.sql`

**Tables Created:**
- `call_history` - AI Concierge call history and quotes
- `user_locations` - Location tracking for location-based services
- `user_preferences` - User preferences, dashboard configs, app settings

All tables include:
- Row Level Security (RLS) policies
- Proper indexes for performance
- User authentication integration
- Automatic timestamps

### 2. **Supabase-backed Call History Storage**

File: `lib/call-history-storage-supabase.ts`

**Features:**
- Cloud-synced call history
- Quote management
- Call statistics calculation
- Real-time updates
- Import/export functionality

**Usage:**
```typescript
import { callHistoryStorage } from '@/lib/call-history-storage-supabase'

// Add a call
const entry = await callHistoryStorage.addEntry({
  businessName: 'Example Business',
  phoneNumber: '555-1234',
  category: 'restaurant',
  userRequest: 'Get a quote for catering',
  status: 'completed',
  startTime: new Date(),
  duration: 120
})

// Get recent calls
const recentCalls = callHistoryStorage.getRecentEntries(10)

// Get stats
const stats = callHistoryStorage.getStats()
```

### 3. **User Preferences Hook**

File: `lib/hooks/use-user-preferences.ts`

**Features:**
- Type-safe preference management
- Automatic Supabase sync
- Loading states
- Error handling
- Support for any JSON-serializable data

**Usage:**
```typescript
import { useUserPreferences } from '@/lib/hooks/use-user-preferences'

function MyComponent() {
  const {
    value: dashboardConfig,
    loading,
    error,
    setValue,
    reload
  } = useUserPreferences('dashboard-config', defaultConfig)

  const handleSave = async () => {
    await setValue(newConfig)
  }

  if (loading) return <div>Loading...</div>
  return <div>Config: {JSON.stringify(dashboardConfig)}</div>
}
```

### 4. **Migration Utility**

File: `lib/migrate-localStorage-to-supabase-final.ts`

**Purpose:** One-time migration of existing localStorage data to Supabase

**Usage:**
```typescript
import { localStorageMigration } from '@/lib/migrate-localStorage-to-supabase-final'

// Check if migration is needed
const needsMigration = await localStorageMigration.needsMigration()

if (needsMigration) {
  // Run migration
  const result = await localStorageMigration.migrateAllData()
  
  console.log('Migrated keys:', result.migratedKeys)
  console.log('Errors:', result.errors)
}
```

## Action Items

### Required: Run SQL Migration

```bash
# Apply the migration to create new tables
supabase db push
# or if using hosted Supabase, run the SQL in the dashboard
```

### Components to Update

#### 1. AI Concierge Components
**Files to update:**
- `lib/call-history.ts` - Change import to use Supabase version
- `components/ai-concierge/concierge-widget.tsx` - Update to use new storage
- `components/ai-concierge/location-tracker.tsx` - Migrate to `user_locations` table

**Changes:**
```typescript
// OLD
import { callHistoryStorage } from '@/lib/call-history-storage'

// NEW
import { callHistoryStorage } from '@/lib/call-history-storage-supabase'
```

#### 2. Customizable Dashboard
**File:** `components/dashboard/customizable-dashboard.tsx`

**Changes:**
```typescript
// OLD
const [config, setConfig] = useState(() => {
  const stored = localStorage.getItem('dashboard-config')
  return stored ? JSON.parse(stored) : defaultConfig
})

// NEW
const { value: config, setValue: setConfig } = useUserPreferences(
  'dashboard-config',
  defaultConfig
)
```

#### 3. Connections Page
**File:** `app/connections/page.tsx`

Replace localStorage usage with `useUserPreferences` hook.

#### 4. Career Page
**File:** `app/career/page.tsx`

Migrate to use DataProvider's `career` domain or create dedicated Supabase table.

#### 5. Finance Components
**Files:**
- `components/finance/income-investments-tab.tsx`
- `components/finance/budget-tab.tsx`
- `components/tools/budget-planner.tsx`
- `components/domain-profiles/loans-manager.tsx`

All should use DataProvider's `financial` domain.

#### 6. Documents Page
**File:** `app/domains/[domainId]/documents/page.tsx`

Use Supabase `documents` table instead of `lifehub-documents-*` localStorage keys.

#### 7. Health Context
**File:** `lib/context/health-context.tsx`

Migrate to use DataProvider's `health` domain.

#### 8. Live Asset Tracker
**File:** `components/dashboard/live-asset-tracker.tsx`

Use DataProvider's various asset domains (vehicles, home, collectibles, etc.).

## localStorage Keys to Remove

Once migration is complete, these keys can be safely removed:

### AI Concierge
- `vapi-call-history`
- `vapi-call-stats`

### Dashboard & Preferences
- `lifehub-dashboard-config`
- `lifehub-dashboard-layout`
- `lifehub-widget-visibility`
- `customizable-dashboard-*` (all keys)
- `lifehub-widget-*` (all keys)

### Connections
- `lifehub-connections`

### Documents
- `lifehub-documents-*` (all domain-specific keys)

### Finance
- `lifehub-finance-*`
- `budget-planner-*`
- `loans-*`

### Other
- Any other `lifehub-*` prefixed keys

## Testing the Migration

### 1. Run SQL Migration
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('call_history', 'user_locations', 'user_preferences');

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename IN ('call_history', 'user_locations', 'user_preferences');
```

### 2. Test User Preferences Hook
```typescript
// In a test component
const { value, setValue } = useUserPreferences('test-key', { test: true })

// Should save to Supabase
await setValue({ test: false })

// Reload and verify
await reload()
console.log(value) // Should be { test: false }
```

### 3. Test Call History
```typescript
// Add a test call
const entry = await callHistoryStorage.addEntry({
  businessName: 'Test',
  phoneNumber: '555-0000',
  category: 'test',
  userRequest: 'test call',
  status: 'completed',
  startTime: new Date(),
  duration: 60
})

// Verify it's in Supabase
const entries = callHistoryStorage.getAllEntries()
console.log(entries) // Should include the test entry
```

### 4. Run One-Time Migration
```typescript
// For existing users with localStorage data
const result = await localStorageMigration.migrateAllData()

// Check for errors
if (result.errors.length > 0) {
  console.error('Migration errors:', result.errors)
}

console.log('Migrated keys:', result.migratedKeys)
```

## Rollback Plan

If issues arise:

1. **Keep old localStorage code temporarily** - Don't delete old files until migration is verified
2. **Dual-write temporarily** - Write to both localStorage and Supabase during testing
3. **Backup localStorage** - Export data before clearing:
   ```typescript
   const backup = {}
   for (let i = 0; i < localStorage.length; i++) {
     const key = localStorage.key(i)
     if (key) backup[key] = localStorage.getItem(key)
   }
   console.log(JSON.stringify(backup))
   ```

## Performance Considerations

- User preferences are cached after first load
- Call history is cached in memory
- All queries use indexes for optimal performance
- RLS policies are efficient (single user_id check)

## Security

- All data is protected by Row Level Security (RLS)
- Users can only access their own data
- Authentication required for all operations
- No cross-user data leakage possible

## Next Steps

1. ✅ Apply SQL migration (`supabase db push`)
2. 📝 Update imports in components to use Supabase versions
3. 🧪 Test each component after migration
4. 🗑️ Remove old localStorage code after verification
5. 📚 Update component documentation

## Questions?

- Check Supabase dashboard for data visibility
- Use Supabase logs for debugging RLS issues
- Test with multiple users to verify isolation









