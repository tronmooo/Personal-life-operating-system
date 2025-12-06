# 🔌 DataProvider Migration Plan

## Problem

**92 components** still use `localStorage` instead of `DataProvider`:
- ❌ AI Assistant saves to Supabase → Data appears in database
- ❌ UI components read from localStorage → Don't see AI-saved data
- ❌ Data is disconnected and out of sync

## Solution

Migrate all components to use **DataProvider** (`useData` hook):
```typescript
// BEFORE (localStorage)
const data = JSON.parse(localStorage.getItem('key') || '[]')

// AFTER (DataProvider)
import { useData } from '@/lib/providers/data-provider'
const { getData } = useData()
const data = getData('domain-name')
```

---

## Priority Migration List

### 🔴 CRITICAL (Breaks AI Commands)

These domains have AI commands but components don't use DataProvider:

1. **Career** (4 files)
   - [ ] `career/applications-tab.tsx` → Uses localStorage
   - [ ] `career/interviews-tab.tsx` → Uses localStorage
   - [ ] `career/skills-tab.tsx` → Uses localStorage
   - [ ] `career/certifications-tab.tsx` → Uses localStorage

2. **Travel** (6 files)
   - [ ] `travel/my-trips-tab.tsx` → Uses localStorage
   - [ ] `travel/bookings-tab.tsx` → Uses localStorage
   - [ ] `travel/documents-tab.tsx` → Uses localStorage
   - [ ] `travel/create-trip-tab.tsx` → Uses localStorage
   - [ ] `travel/discover-tab.tsx` → Uses localStorage

3. **Goals** (2 files)
   - [ ] `goals/goals-dashboard.tsx` → Uses localStorage
   - [ ] `goals/add-goal-form.tsx` → Uses localStorage

4. **Legal** (2 files)
   - [ ] `legal/legal-dashboard.tsx` → Uses localStorage
   - [ ] `legal/add-document-form.tsx` → Uses localStorage

5. **Digital-Life** (3 files)
   - [ ] `digital/accounts-tab.tsx` → Uses localStorage
   - [ ] `digital/assets-tab.tsx` → Uses localStorage
   - [ ] `digital/domains-tab.tsx` → Uses localStorage

6. **Education** (4 files - some already migrated)
   - [x] `education/courses-tab.tsx` → ✅ Uses DataProvider
   - [ ] `education/transcripts-tab.tsx` → Uses localStorage
   - [ ] `education/goals-tab.tsx` → Uses localStorage
   - [ ] `education/certifications-tab.tsx` → Uses localStorage

7. **Pets** (4 files - some already migrated)
   - [x] `pets/vaccinations-tab.tsx` → ✅ Uses DataProvider
   - [ ] `pets/profile-tab.tsx` → Uses localStorage
   - [ ] `pets/costs-tab.tsx` → Uses localStorage
   - [ ] `pets/documents-tab.tsx` → Uses localStorage
   - [ ] `pets/ai-vet-tab.tsx` → Uses localStorage

8. **Insurance** (6 files - some already migrated)
   - [x] `insurance/insurance-dashboard.tsx` → ✅ Uses DataProvider
   - [x] `insurance/add-policy-form.tsx` → ✅ Uses DataProvider
   - [ ] `insurance/policies-tab.tsx` → Uses localStorage
   - [ ] `insurance/claims-tab.tsx` → Uses localStorage
   - [ ] `insurance/payments-tab.tsx` → Uses localStorage
   - [ ] `insurance/add-claim-form.tsx` → Uses localStorage
   - [ ] `insurance/add-claim-dialog.tsx` → Uses localStorage
   - [ ] `insurance/add-policy-dialog.tsx` → Uses localStorage

### 🟡 HIGH PRIORITY (Already partially working)

9. **Fitness** (1 file - others done)
   - [x] `fitness/activities-tab.tsx` → ✅ Fixed
   - [ ] `fitness/dashboard-tab.tsx` → Uses localStorage

10. **Nutrition** (2 files - others done)
   - [x] `nutrition/water-view.tsx` → ✅ Fixed
   - [x] `nutrition/meals-view.tsx` → ✅ Uses DataProvider
   - [ ] `nutrition/dashboard-view.tsx` → Uses localStorage

11. **Health** (3 files - others done)
   - [x] `health/dashboard-tab.tsx` → ✅ Uses DataProvider
   - [x] `health/vitals-tab.tsx` → ✅ Uses DataProvider
   - [ ] `health/records-tab.tsx` → Uses localStorage
   - [ ] `health/appointments-tab.tsx` → Uses localStorage
   - [ ] `health/medications-tab.tsx` → Uses localStorage
   - [ ] `health/tabs/metrics-tab.tsx` → Uses localStorage
   - [ ] `health/ai-diagnostics-dialog.tsx` → Uses localStorage

12. **Home** (3 files - one done)
   - [x] `home/maintenance-tab.tsx` → ✅ Fixed
   - [ ] `home/documents-tab.tsx` → Uses localStorage
   - [ ] `home/assets-tab.tsx` → Uses localStorage
   - [ ] `home/projects-tab.tsx` → Uses localStorage

### 🟢 LOWER PRIORITY (UI/Settings components)

13. **Mindfulness** (1 file)
   - [x] `mindfulness/mindfulness-app-full.tsx` → ✅ Uses DataProvider
   - [ ] `mindfulness/mindfulness-journal.tsx` → Uses localStorage

14. **Finance** (many files - some done)
   - [x] `finance/dashboard-tab.tsx` → ✅ Uses DataProvider
   - [x] `finance-simple/income-view.tsx` → ✅ Uses DataProvider
   - [ ] `finance/budget-tab.tsx` → Uses localStorage
   - [ ] `finance/income-investments-tab.tsx` → Uses localStorage

---

## Migration Pattern

### Step 1: Import useData Hook
```typescript
import { useData } from '@/lib/providers/data-provider'
```

### Step 2: Replace State and localStorage
```typescript
// BEFORE
const [items, setItems] = useState<Item[]>([])

useEffect(() => {
  const stored = localStorage.getItem('key')
  if (stored) {
    setItems(JSON.parse(stored))
  }
}, [])

// AFTER
const [items, setItems] = useState<Item[]>([])
const { getData, addData, deleteData, updateData } = useData()

useEffect(() => {
  loadItems()
}, [])

useEffect(() => {
  // Listen for data updates
  const handleUpdate = () => loadItems()
  window.addEventListener('data-updated', handleUpdate)
  window.addEventListener('domain-data-updated', handleUpdate)
  return () => {
    window.removeEventListener('data-updated', handleUpdate)
    window.removeEventListener('domain-data-updated', handleUpdate)
  }
}, [])

const loadItems = () => {
  const domainData = getData('domain-name') || []
  const parsedItems = domainData
    .filter(item => item.metadata?.type === 'specific-type')
    .map(item => ({
      id: item.id,
      // map other fields from metadata
    }))
  setItems(parsedItems)
}
```

### Step 3: Replace Add Function
```typescript
// BEFORE
const handleAdd = (newItem: Item) => {
  const updated = [...items, newItem]
  setItems(updated)
  localStorage.setItem('key', JSON.stringify(updated))
}

// AFTER
const handleAdd = async (newItem: Item) => {
  await addData('domain-name', {
    title: newItem.title,
    description: newItem.description,
    metadata: {
      type: 'specific-type',
      ...newItem // all item fields
    }
  })
  loadItems() // Reload from DataProvider
}
```

### Step 4: Replace Delete Function
```typescript
// BEFORE
const handleDelete = (id: string) => {
  const updated = items.filter(i => i.id !== id)
  setItems(updated)
  localStorage.setItem('key', JSON.stringify(updated))
}

// AFTER (with optimistic update)
const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

const handleDelete = async (id: string) => {
  // Optimistic UI update
  setDeletingIds(prev => new Set(prev).add(id))
  setItems(prev => prev.filter(i => i.id !== id))
  
  try {
    await deleteData('domain-name', id)
  } catch (e) {
    console.error('Failed to delete:', e)
    loadItems() // Rollback
  } finally {
    setDeletingIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }
}
```

---

## Domain Mapping

Each component needs to know its domain name for `getData()`:

| Component | Domain Name | Item Type |
|-----------|-------------|-----------|
| Career Applications | 'career' | 'application' |
| Career Interviews | 'career' | 'interview' |
| Career Skills | 'career' | 'skill' |
| Career Certifications | 'career' | 'certification' |
| Travel Trips | 'travel' | 'trip' |
| Travel Bookings | 'travel' | 'booking' |
| Travel Documents | 'travel' | 'document' |
| Goals | 'goals' | 'goal' |
| Legal Documents | 'legal' | 'document' |
| Legal Contracts | 'legal' | 'contract' |
| Digital Accounts | 'digital-life' | 'account' |
| Digital Assets | 'digital-life' | 'asset' |
| Digital Domains | 'digital-life' | 'domain' |
| Education Courses | 'education' | 'course' |
| Education Transcripts | 'education' | 'transcript' |
| Education Goals | 'education' | 'goal' |
| Pets Profile | 'pets' | 'profile' |
| Pets Costs | 'pets' | 'cost' |
| Pets Documents | 'pets' | 'document' |
| Insurance Policies | 'insurance' | 'policy' |
| Insurance Claims | 'insurance' | 'claim' |
| Insurance Payments | 'insurance' | 'payment' |

---

## Testing Checklist

For each migrated component:

1. [ ] Component imports `useData` hook
2. [ ] Component uses `getData('domain')` to load
3. [ ] Component uses `addData('domain', {...})` to save
4. [ ] Component uses `deleteData('domain', id)` to delete
5. [ ] Component uses `updateData('domain', id, {...})` to update
6. [ ] Component listens to 'data-updated' events
7. [ ] Component works with AI Assistant commands
8. [ ] Data persists to Supabase
9. [ ] Data appears immediately after save
10. [ ] Delete buttons work with optimistic UI

---

## Benefits After Migration

### Before
- ❌ Data in localStorage (browser-only)
- ❌ No sync across devices
- ❌ AI saves to Supabase, UI reads from localStorage
- ❌ Data disconnected
- ❌ No real-time updates

### After
- ✅ All data in Supabase (cloud-backed)
- ✅ Syncs across devices
- ✅ AI and UI use same data source
- ✅ Data connected end-to-end
- ✅ Real-time updates via events

---

## Implementation Order

1. **Phase 1: Critical Domains** (AI Commands break without these)
   - Career (4 files)
   - Travel (6 files)
   - Goals (2 files)
   - Legal (2 files)
   - Digital-Life (3 files)

2. **Phase 2: Partially Working** (Some already done)
   - Education (3 files)
   - Pets (4 files)
   - Insurance (6 files)
   - Fitness (1 file)
   - Nutrition (1 file)
   - Health (5 files)
   - Home (3 files)

3. **Phase 3: Polish** (Lower priority)
   - Settings components
   - Dashboard components
   - Utility components

---

## Estimated Effort

- **Per component**: 15-30 minutes
- **Total components to migrate**: ~50 critical ones
- **Total time**: 12-25 hours
- **Priority files (Phase 1)**: 17 files = ~4-8 hours

---

## Next Steps

1. Start with **Career domain** (4 files)
2. Then **Travel domain** (6 files)  
3. Then **Goals domain** (2 files)
4. Test AI commands work end-to-end
5. Continue with remaining domains

Once migrated, **ALL 21 domains will be fully connected** to the DataProvider and work seamlessly with the AI Assistant! 🎉


