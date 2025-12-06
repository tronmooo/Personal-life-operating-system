# Supabase Sync Gaps & Remediation Plan

## ✅ 1. Concierge Call History Still Stored Locally - COMPLETED
- ~~`lib/call-history.ts:30-101`~~ **DELETED**
- ~~`components/ai-concierge/concierge-widget.tsx:14-45`~~ **MIGRATED**
- ~~`components/ai-concierge-popup.tsx:14-49`~~ **MIGRATED**
- ~~`lib/call-history-storage.ts:30-102`~~ **DELETED**

**Issue**: Call history is written to IndexedDB (`idbGet/idbSet`) instead of Supabase. The UI imports the local storage helpers, so data is device-bound and diverges from the Supabase-backed class that already exists.

**Fix Plan** ✅ COMPLETED
1. ✅ Replace imports of `@/lib/call-history` with `@/lib/call-history-storage-supabase`.
2. ✅ Update the concierge UI to subscribe to the Supabase-backed storage (which already handles syncing).
3. ✅ Delete the legacy `lib/call-history.ts` and `lib/call-history-storage.ts` once no longer referenced.
4. ⚠️ Migration from IndexedDB to Supabase happens automatically on first use via the storage class.

---

## ✅ 2. Vapi User Context Not Connected to Supabase - COMPLETED
- ~~`app/api/vapi/user-context/route.ts:22-56`~~ **MIGRATED**

**Issue**: The endpoint returns hard-coded demo data, ignoring Supabase. Voice calls with Vapi never receive real user context.

**Fix Plan** ✅ COMPLETED
1. ✅ Use `createRouteHandlerClient({ cookies })` to authenticate the caller.
2. ✅ Query domain data (`domain_entries`, `tasks`, `bills`, etc.) based on the provided `userId`.
3. ✅ Normalize results into the expected payload for Vapi.
4. ✅ Add error handling for missing users (unit tests can be added later if needed).

---

## ✅ 3. Document OCR Fallback Persists in IndexedDB - COMPLETED
- ~~`components/mobile-camera-ocr.tsx:253-272`~~ **MIGRATED**
- **NEW**: `lib/sync-pending-documents.ts` **CREATED**

**Issue**: When the user is unauthenticated, scanned documents save only to IndexedDB (`lifehub-documents`), never syncing once the user signs in.

**Fix Plan** ✅ COMPLETED
1. ✅ Queue unsynced scans in IndexedDB with a `pendingSync` flag.
2. ✅ On sign-in, push each record to Supabase (`documents` table) and clear the local entry.
3. ✅ Guard the offline path with a warning so it isn't treated as production-ready storage.
4. ✅ Integrated automatic sync in DataProvider on SIGNED_IN event.

---

## ✅ 4. Asset Lifespan Tracker Uses IndexedDB - COMPLETED
- ~~`components/asset-lifespan-tracker.tsx:418-463`~~ **MIGRATED**

**Issue**: Assets are stored in IndexedDB (`trackedAssets`). Users lose data across devices and after cache clears.

**Fix Plan** ✅ COMPLETED
1. ✅ Reused `domain_entries` table in Supabase with domain='tracked_assets'.
2. ✅ Swapped CRUD helpers (`saveTrackedAsset`, `deleteTrackedAsset`, `useTrackedAssets`) to use Supabase calls.
3. ✅ Fallback to IndexedDB for unauthenticated users with automatic migration on sign-in.

---

## ✅ 5. Expiration Tracker Alerts Stored Locally - COMPLETED
- ~~`components/expiration-tracker.tsx:119-142`~~ **MIGRATED**

**Issue**: Reminder metadata (`expirationAlerts`) is saved in IndexedDB only, so reminders never appear on other devices.

**Fix Plan** ✅ COMPLETED
1. ✅ Persist alerts to Supabase using `domain_entries` with domain='expiration_alerts'.
2. ✅ Replace the local writes with Supabase inserts.
3. ✅ Updated `useExpirationAlerts` hook to load from Supabase with IndexedDB fallback.

---

## ✅ 6. Pet Profiles Persisted in IndexedDB - COMPLETED
- ~~`components/pet-profile-manager.tsx:44-118`~~ **MIGRATED**

**Issue**: Pet profiles rely on IndexedDB (`lifehub-pet-profiles`). No Supabase sync means loss on device reset.

**Fix Plan** ✅ COMPLETED
1. ✅ Updated CRUD operations to use Supabase `pets` table (which already exists).
2. ✅ All functions (`handleAddPet`, `handleEditPet`, `handleDeletePet`) now use Supabase.
3. ✅ Fallback to IndexedDB for unauthenticated users with automatic migration on sign-in.

---

## ✅ 7. Enhanced Domain Data Local-Only - COMPLETED
- ~~`lib/providers/enhanced-data-provider.tsx:25-141`~~ **MIGRATED**

**Issue**: Enhanced domain items and attached documents are stored in IndexedDB (`enhanced-data`).

**Fix Plan** ✅ COMPLETED
1. ✅ Reused `domain_entries` table with domain='enhanced_domain_items'.
2. ✅ Replaced all provider CRUD operations with Supabase calls.
3. ✅ Updated load, add, update, delete functions to use Supabase with IndexedDB fallback.

---

## ✅ 8. Achievements Stored in IndexedDB - COMPLETED
- ~~`lib/achievements.ts:177-360`~~ **MIGRATED**

**Issue**: Achievement progress is tracked via IndexedDB keys (`lifehub_*`). Users cannot resume progress on other devices.

**Fix Plan** ✅ COMPLETED
1. ✅ Persist achievements in Supabase using `domain_entries` with domain='achievements'.
2. ✅ Updated `AchievementManager.getAchievements` and `saveAchievements` to use Supabase.
3. ✅ Fallback to IndexedDB for unauthenticated users with automatic migration on sign-in.

---

## ✅ Summary - ALL MIGRATIONS COMPLETED

**All 8 identified Supabase sync gaps have been successfully migrated!**

### Completed Migrations:
1. ✅ **Concierge Call History** - Migrated from IndexedDB to Supabase `call_history` table
2. ✅ **Vapi User Context** - Now fetches real data from Supabase instead of hard-coded demo data
3. ✅ **Document OCR Fallback** - Pending documents sync to Supabase on user sign-in
4. ✅ **Asset Lifespan Tracker** - Migrated to `domain_entries` table with domain='tracked_assets'
5. ✅ **Expiration Tracker Alerts** - Migrated to `domain_entries` table with domain='expiration_alerts'
6. ✅ **Pet Profiles** - Migrated to dedicated `pets` table in Supabase
7. ✅ **Enhanced Domain Data** - Migrated to `domain_entries` table with domain='enhanced_domain_items'
8. ✅ **Achievements** - Migrated to `domain_entries` table with domain='achievements'

### Key Benefits:
- ✅ Cross-device data synchronization
- ✅ Persistent storage (no data loss on cache clear)
- ✅ Real-time updates via Supabase subscriptions
- ✅ Offline fallback to IndexedDB for unauthenticated users
- ✅ Automatic migration on user sign-in

### Files Modified:
- ~~`lib/call-history.ts`~~ **DELETED**
- ~~`lib/call-history-storage.ts`~~ **DELETED**
- `components/ai-concierge/concierge-widget.tsx` **MIGRATED**
- `components/ai-concierge-popup.tsx` **MIGRATED**
- `app/api/vapi/user-context/route.ts` **MIGRATED**
- `components/mobile-camera-ocr.tsx` **MIGRATED**
- `lib/sync-pending-documents.ts` **CREATED**
- `lib/providers/data-provider.tsx` **UPDATED** (added auto-sync)
- `components/asset-lifespan-tracker.tsx` **MIGRATED**
- `components/expiration-tracker.tsx` **MIGRATED**
- `components/pet-profile-manager.tsx` **MIGRATED**
- `lib/providers/enhanced-data-provider.tsx` **MIGRATED**
- `lib/achievements.ts` **MIGRATED**
- `app/api/vapi/user-context/route.ts`

Each section above outlines the remediation plan to complete the Supabase transition.
