# Legacy localStorage → Supabase Mapping (2025-11-09)

This document inventories the remaining client-side `localStorage` keys and defines their permanent homes in Supabase. It should be kept up to date while the migration plan is in flight.

---

## Summary
- **Active runtime usage:** Only two legacy buckets remain in the application code (`routines` and `lifehub-logs-*`). Both are read solely to perform one-time migrations.
- **Supabase destination:** All legacy payloads are now normalized into the `domain_entries` table (via the `use-domain-entries` hook) with domain-specific metadata.
- **Server migration helper:** `lib/utils/server-migration-client.ts` provides programmatic migrations for these keys and detects any additional `lifehub-*` artifacts that may still be present in a user's browser.

---

## Key-by-Key Mapping

| Legacy key pattern | Legacy payload | Supabase destination | Migration path | Status |
| --- | --- | --- | --- | --- |
| `routines` | Array of `Routine` objects (name, description, days, steps, etc.) written by the retired Routine Manager | `domain_entries` table with `domain = 'mindfulness'` and metadata `{ itemType: 'routine', ... }` | `lib/hooks/use-routines.ts` migrates on mount (client) <br> `migrateRoutinesViaServer()` provides server-backed migration | **In progress** — auto-migrates then removes key |
| `lifehub-logs-${domainId}` | Domain quick-log entries (Financial, Health, Nutrition, Fitness, Pets, Vehicles, Home, etc.) | `domain_entries` table with `domain = ${domainId}` and metadata `{ source: 'domain-quick-log(-legacy)', logType, data, ... }` | `components/domain-quick-log.tsx` migrates client-side <br> `migrateDomainLogsViaServer(domainId)` handles server batch migration | **In progress** — per-domain migration removes key |

> **Note:** `server-migration-client.ts` also reports any other `lifehub-*` keys under the `other` bucket. As of this audit no production code reads those keys; they are either already migrated or require manual cleanup if discovered.

---

## Supabase Destinations (detail)

### 1. `domain_entries` table
Primary schema (see `supabase/migrations/20250215_domain_entries.sql`):

| Column | Usage |
| --- | --- |
| `id` | Auto-generated UUID for each entry |
| `user_id` | Owner of the data (from Supabase auth) |
| `domain` | Logical domain (`financial`, `health`, `mindfulness`, etc.) |
| `title` / `description` | Human-readable labels generated during migration |
| `metadata` | JSONB payload containing legacy data and migration provenance |
| `created_at` / `updated_at` | Timestamps managed by Supabase trigger |

For both `routines` and `lifehub-logs-*` migrations we populate:
- `metadata.migratedFrom = 'localStorage'`
- `metadata.migratedAt = <ISO timestamp>`
- Domain-specific attributes (log data, routine fields, etc.)

### 2. `domain_entries_view`
Once data lands in `domain_entries`, application components consume it via the `use-domain-entries` hook, which queries the `domain_entries_view`. No direct action required; included here for completeness.

---

## Migration Checklist

| Task | Owner | Notes |
| --- | --- | --- |
| Track and migrate `routines` key | `use-routines` hook | Already in place; clears key after success |
| Track and migrate `lifehub-logs-*` keys | `DomainQuickLog` + server migration helper | Migrates per domain and clears key |
| Detect residual `lifehub-*` keys | `scanLegacyData()` (server migration client) | Logs to console for investigation; expand mapping if new keys appear |

---

## Next Steps
1. Instrument analytics to observe how often `scanLegacyData()` reports `other` keys; create follow-up mapping entries as needed.
2. Remove legacy migration toggles (`isLegacyMigrationEnabled`) once all keys report zero occurrences in production.
3. Update CI (`scripts/verify-localstorage-migration.ts`) to fail builds when new `localStorage` access patterns are introduced.

---

_Prepared by: Migration audit (2025-11-09)_  
_Contact: migration@lifehub.dev_














