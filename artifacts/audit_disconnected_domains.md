# Disconnected Domain Data Audit

| Domain | Component / Provider | Line Range | Current Data Source | Required Fix |
| --- | --- | --- | --- | --- |
| Enhanced Domains | `components/domains/enhanced-domain-detail.tsx` | L25-L138 | `useEnhancedData()` context backed by IndexedDB | Replace EnhancedData flow with Supabase-backed `domain_entries` access (e.g. `useDomainEntries`) so enhanced subcategories hydrate from Supabase. |
| Enhanced Domains | `lib/providers/enhanced-data-provider.tsx` | L22-L127 | Direct `idbGet` / `idbSet` reads of `enhanced-data` | Migrate provider to Supabase/remote cache; remove IDB as source of truth to keep Enhanced domain items in sync. |
| Pets | `components/pet-profile-switcher.tsx` | L68-L141 | IndexedDB `lifehub-pet-profiles` | Store pet profiles in Supabase (e.g. `domain_entries` with `domain='pets'`); ensure switcher listens to realtime updates. |
| Pets | `components/pet-profile-manager.tsx` | L44-L117 | IndexedDB `lifehub-pet-profiles` | Convert manager CRUD to Supabase so pet selection syncs across clients; remove IDB persistence. |

## Notes

- All other audited domain tabs for Health, Vehicles, Nutrition, and Fitness already pull from Supabase via `useData()` / specialized providers.
- Components listed above must migrate off IndexedDB/local mocks before Command Center metrics can rely exclusively on live Supabase data.

