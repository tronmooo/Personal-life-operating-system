# Files That Need Supabase Migration

This document lists all files in the app that still don't properly use Supabase and need migration.

**Last Updated:** 2025-11-03
**Total Files:** 130+

---

## Category 1: Direct localStorage Usage (HIGH PRIORITY)

These files are still directly accessing `localStorage` and need to be migrated to IndexedDB or Supabase.

### Critical Files
1. `lib/hooks/use-routines.ts` - Has migration logic but still reads from localStorage
2. `lib/utils/server-migration-client.ts` - Migration helper that reads localStorage
3. `components/domain-quick-log.tsx` - Uses localStorage and legacy useData()
4. `scripts/verify-localstorage-migration.ts` - Script file (can ignore)

---

## Category 2: Legacy DataProvider Usage (MEDIUM PRIORITY)

These files use `useData()` from `data-provider.tsx` instead of the new `useDomainEntries()` hook. They should be migrated to use direct Supabase access.

### Page Components (25 files)
1. `app/health/page.tsx`
2. `app/domains/[domainId]/page.tsx`
3. `app/domains/page.tsx`
4. `app/domains/miscellaneous/page.tsx`
5. `app/home/[id]/page.tsx`
6. `app/activity/page.tsx`
7. `app/admin/sync-data/page.tsx`
8. `app/analytics-enhanced/page.tsx`
9. `app/ai-assistant/page.tsx`
10. `app/debug/page.tsx`
11. `app/pets/page.tsx`
12. `app/command/page.tsx`
13. `app/appointments/page.tsx`
14. `app/insights/page.tsx`
15. `app/test-domains/page.tsx`
16. `app/test-crud/page.tsx`

### Dashboard Components (20 files)
1. `components/dashboard/command-center-redesigned.tsx`
2. `components/dashboard/command-center-functional.tsx`
3. `components/dashboard/command-center-enhanced.tsx`
4. `components/dashboard/customizable-dashboard.tsx`
5. `components/dashboard/customizable-command-center.tsx`
6. `components/dashboard/command-center-new.tsx`
7. `components/dashboard/command-center.tsx`
8. `components/dashboard/index.tsx`
9. `components/dashboard/live-asset-tracker.tsx`
10. `components/dashboard/insights-card.tsx`
11. `components/dashboard/habits-manager.tsx`
12. `components/dashboard/tasks-manager.tsx`
13. `components/dashboard/tasks-enhanced.tsx`
14. `components/dashboard/expiring-documents.tsx`
15. `components/dashboard/bills-due.tsx`
16. `components/dashboard/bills-manager.tsx`
17. `components/dashboard/events-manager.tsx`
18. `components/dashboard/documents-manager.tsx`
19. `components/dashboard/ocr-scanner.tsx`
20. `components/dashboard/smart-inbox-card.tsx`

### Health Domain Components (8 files)
1. `components/health/vitals-tab.tsx`
2. `components/health/records-tab.tsx`
3. `components/health/dashboard-tab.tsx`
4. `components/health/sleep-tab.tsx`
5. `components/health/medications-tab.tsx`
6. `components/health/appointments-tab.tsx`
7. `lib/context/health-context.tsx`

### Nutrition/Fitness Components (8 files)
1. `components/nutrition/goals-view.tsx`
2. `components/nutrition/meals-view.tsx`
3. `components/nutrition/water-view.tsx`
4. `components/nutrition/nutrition-tracker.tsx`
5. `components/nutrition/dashboard-view.tsx`
6. `components/fitness/dashboard-tab.tsx`
7. `components/fitness/activities-tab.tsx`
8. `components/fitness/add-activity-dialog.tsx`

### Pets Domain Components (5 files)
1. `components/pets/costs-tab.tsx`
2. `components/pets/documents-tab.tsx`
3. `components/pets/vaccinations-tab.tsx`
4. `components/pets/ai-vet-tab.tsx`
5. `components/pets/profile-tab.tsx`

### Home Domain Components (7 files)
1. `components/home/projects-tab.tsx`
2. `components/home/maintenance-schedule-tab.tsx`
3. `components/home/bills-tab.tsx`
4. `components/home/documents-tab.tsx`
5. `components/home/maintenance-tab.tsx`
6. `components/home/service-history-tab.tsx`
7. `components/home-management-dashboard.tsx`

### Insurance Domain Components (4 files)
1. `components/insurance/add-claim-form.tsx`
2. `components/insurance/payments-tab.tsx`
3. `components/insurance/insurance-dashboard.tsx`
4. `components/insurance/add-policy-form.tsx`

### Domain Profiles (5 files)
1. `components/domain-profiles/vehicle-tracker-autotrack.tsx`
2. `components/domain-profiles/property-manager.tsx`
3. `components/domain-profiles/bills-manager.tsx`
4. `components/domain-profiles/loans-manager.tsx`
5. `components/domain-profiles/vehicle-manager.tsx`

### Legal Domain Components (2 files)
1. `components/legal/add-document-form.tsx`
2. `components/legal/legal-dashboard.tsx`

### Relationships (1 file)
1. `components/relationships/relationships-manager.tsx`

### AI & Concierge Components (6 files)
1. `components/ai-assistant-popup-clean.tsx`
2. `components/ai-concierge-popup-final.tsx`
3. `components/ai-concierge-popup.tsx`
4. `components/ai-concierge-popup-v2.tsx`
5. `components/ai-concierge/concierge-widget.tsx`
6. `components/tools/travel-planner-ai.tsx`

### Other Domain Components (8 files)
1. `components/meal-logger.tsx`
2. `components/expiration-tracker.tsx`
3. `components/mobile-camera-ocr.tsx`
4. `components/dialogs/categorized-alerts-dialog.tsx`
5. `components/dialogs/alerts-dialog.tsx`
6. `components/mindfulness/mindfulness-app-full.tsx`
7. `components/mindfulness/mindfulness-journal.tsx`
8. `components/mindfulness/guided-meditations.tsx`

### Utility Components (10 files)
1. `components/quick-add-widget.tsx`
2. `components/voice-data-entry.tsx`
3. `components/smart-insights-enhanced.tsx`
4. `components/app-enhancements.tsx`
5. `components/analytics/advanced-dashboard.tsx`
6. `components/notifications/notification-center.tsx`
7. `components/search/global-search.tsx`
8. `components/family-member-switcher.tsx`
9. `components/data-export-import.tsx`
10. `components/data/bulk-actions.tsx`
11. `components/data-export.tsx`
12. `components/domain-quick-log-with-pets.tsx`
13. `components/add-data-dialog.tsx`

### Tools (3 files)
1. `components/tools/budget-optimizer-ai.tsx`
2. `components/tools/net-worth-calculator.tsx`
3. `lib/tools/auto-fill.ts`

---

## Category 3: Finance Domain Components (LOW PRIORITY)

These might be using legacy patterns or need verification:

1. `components/finance/dashboard-tab.tsx`
2. `components/analytics/domain-data-charts.tsx`

---

## Category 4: Legacy Components (TO REVIEW)

These components exist but might be duplicates or old versions:

1. `components/ai-assistant-popup-final.tsx`
2. `components/ai-assistant-popup.tsx`
3. `components/property-form-with-zillow.tsx`
4. `components/global-search.tsx`
5. `components/dialogs/journal-entry-dialog.tsx`
6. `components/nutrition/meal-photo-analyzer.tsx`
7. `components/forms/add-car-value.tsx`
8. `components/forms/add-home-value.tsx`
9. `components/enhanced-ai-insights.tsx`
10. `components/google-calendar/calendar-view.tsx`
11. `components/forms/quick-income-form.tsx`
12. `components/ai-chat-interface.tsx`
13. `components/domains/enhanced-domain-detail.tsx`
14. `components/life-balance-score.tsx`
15. `components/smart-insights.tsx`

---

## Migration Priority Guide

### Priority 1: Critical (Complete first)
- **Files with localStorage usage** - These are the highest priority
- Core dashboard components that show domain data

### Priority 2: High (Complete second)
- Page components (`app/*/page.tsx`)
- Domain tab components (health, pets, nutrition, etc.)
- Any component directly displaying or mutating domain data

### Priority 3: Medium (Complete third)
- Utility components (search, export, etc.)
- AI/Concierge features
- Analytics components

### Priority 4: Low (Complete last)
- Test/debug pages
- Legacy/duplicate components
- Components that might be deprecated

---

## Migration Pattern

### Before (Legacy):
```typescript
import { useData } from '@/lib/providers/data-provider'

function MyComponent() {
  const { getData, addData, updateData, deleteData } = useData()
  const entries = getData('health')

  const handleAdd = () => addData('health', newEntry)
}
```

### After (Supabase):
```typescript
import { useDomainEntries } from '@/lib/hooks/use-domain-entries'

function MyComponent() {
  const { entries, createEntry, updateEntry, deleteEntry, isLoading } = useDomainEntries('health')

  const handleAdd = () => createEntry({
    title: 'Title',
    domain: 'health',
    metadata: { /* domain specific fields */ }
  })
}
```

---

## Related Files

### Core Infrastructure (Already Migrated)
- ✅ `lib/hooks/use-domain-entries.ts` - New Supabase hook
- ✅ `lib/supabase/direct-sync.ts` - Direct Supabase operations
- ✅ `lib/utils/idb-cache.ts` - IndexedDB cache replacement for localStorage

### Legacy Files (Being Phased Out)
- ⚠️ `lib/providers/data-provider.tsx` - Legacy context provider
- ⚠️ `lib/providers/enhanced-data-provider.tsx` - Legacy enhanced provider

---

## Testing After Migration

1. Test CRUD operations for the domain
2. Verify data persists after page refresh
3. Check that realtime updates work
4. Ensure offline mode works with IDB cache
5. Verify no localStorage usage: `npm run lint:ci`

---

## Progress Tracking

- [ ] Priority 1: localStorage files (4 files)
- [ ] Priority 2: Page components (16 files)
- [ ] Priority 2: Dashboard components (20 files)
- [ ] Priority 2: Domain components (35+ files)
- [ ] Priority 3: Utility components (13 files)
- [ ] Priority 3: AI/Concierge (6 files)
- [ ] Priority 4: Legacy/review components (15 files)

**Total Estimated Files to Migrate:** ~125 files
