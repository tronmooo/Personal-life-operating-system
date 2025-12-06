# LifeHub Development Runbook

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Development Workflow](#development-workflow)
3. [Testing & QA](#testing--qa)
4. [Deployment](#deployment)
5. [Legacy Data Migration](#legacy-data-migration)
6. [Troubleshooting](#troubleshooting)

---

## Environment Setup

### Required Environment Variables

Create `.env.local` from `.env.local.example`:

```bash
cp .env.local.example .env.local
```

**Core Services:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

**AI Services:**
- `GEMINI_API_KEY` - Google Gemini API key (primary AI)
- `OPENAI_API_KEY` - OpenAI API key (alternative)

**Integrations:**
- `VAPI_API_KEY` - VAPI.ai voice assistant
- `PLAID_CLIENT_ID` / `PLAID_SECRET` - Banking integration
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth

### Installation

```bash
npm install
npm run dev
```

### Database Setup

All database operations should use the Supabase MCP:
- Project ID: `jphpxqqilrjyypztkswc`
- Service role key in `.cursor/rules/h.mdc` line 14

```bash
# Run migrations
npm run verify:all

# Seed test data
npm run seed:health
npm run seed:insurance
```

---

## Development Workflow

### Commands

```bash
# Development
npm run dev                    # Start dev server (http://localhost:3000)
npm run build                  # Production build
npm run start                  # Start production server

# Code Quality
npm run lint                   # Run ESLint
npm run lint:ci                # Lint + localStorage check (CI)
npm run type-check             # TypeScript validation
npm run validate               # type-check + lint + test

# Testing
npm test                       # Run Jest tests
npm run test:watch             # Jest watch mode
npm run test:coverage          # Jest with coverage
npm run e2e                    # Playwright E2E tests
npm run e2e:ui                 # Playwright with UI

# Migration & Verification
npm run migration:check        # Verify localStorage migration (runs in prebuild)
npm run check:no-storage       # Scan for localStorage/sessionStorage usage
```

### Adding New Features

1. **Data Layer**: Use `useDomainEntries(domain)` hook for CRUD operations
2. **Components**: Follow ShadCN UI patterns in `components/ui/`
3. **API Routes**: Server-side logic in `app/api/`
4. **Types**: Update `types/domains.ts` and `types/domain-metadata.ts`

### Code Standards

- **No localStorage**: Use IndexedDB (`idb-cache.ts`) or Supabase
- **Type Safety**: All domain metadata must match `DomainMetadataMap`
- **Error Handling**: Use `ErrorBoundary` for section isolation
- **Offline Support**: IDB-first hydration, then Supabase sync

---

## Testing & QA

### Pre-Commit Checklist

```bash
npm run type-check             # Must pass
npm run lint:ci                # Must pass (includes localStorage check)
npm test                       # Must pass
```

### E2E Testing

```bash
npm run e2e                    # Run all E2E tests
npm run e2e:ui                 # Run with Playwright UI
npm run e2e -- path/to/test    # Run single test
```

### Domain Testing

```bash
npm run test:domains           # Test all domains
npm run test:health-crud       # Health domain CRUD
npm run test:insurance-crud    # Insurance domain CRUD
```

---

## Deployment

### Pre-Deployment

```bash
# Full validation
npm run validate

# Migration check (automatically runs in prebuild)
npm run migration:check

# Build for production
npm run build
```

### CI/CD Pipeline

The build will **automatically fail** if:
1. TypeScript compilation fails
2. ESLint errors exist
3. **New localStorage usage detected** (STRICT MODE)
4. Tests fail

### Rollback Procedure

If deployment fails:
1. Revert to previous commit
2. Check Supabase migration logs: `migration_logs` table
3. Review error logs in Vercel/deployment platform
4. Fix issues and re-deploy

---

## Legacy Data Migration

### Overview

LifeHub migrated from localStorage to Supabase + IndexedDB. Legacy migration helpers are **disabled by default** to reduce bundle size.

### Feature Flag: `NEXT_PUBLIC_ENABLE_LEGACY_MIGRATION`

**Default:** `false` (legacy migrations disabled)

**When to Enable:**
- User reports missing data after major version update
- Supporting old users who haven't logged in for months
- Testing migration code in development

**How to Enable:**

**Option 1: Environment Variable** (recommended for dev/staging)
```bash
# .env.local
NEXT_PUBLIC_ENABLE_LEGACY_MIGRATION=true
```

**Option 2: Runtime Override** (browser console for one-off migrations)
```javascript
window.__ENABLE_LEGACY_MIGRATION__ = true
// Then reload the page
```

### Migration Endpoints

**Client-Side (Flag-Gated):**
- `lib/hooks/use-routines.ts` - Routines migration (one-time)
- `components/domain-quick-log.tsx` - Domain logs migration (one-time)

⚠️ These run once per browser session when flag is enabled. They will be removed in a future release.

**Server-Side (Preferred):**
- `POST /api/migrate-legacy-data` - Server endpoint for all migrations
- Client helper: `lib/utils/server-migration-client.ts`

```typescript
import { migrateAllLegacyData } from '@/lib/utils/server-migration-client'

// Migrate all detected legacy data via server
const results = await migrateAllLegacyData()
console.log(`Migrated: ${results.totalMigrated}, Failed: ${results.totalFailed}`)
```

### Migration Types

1. **Routines** (`type: 'routines'`)
   - Source: `localStorage.getItem('routines')`
   - Target: `domain_entries` table, `domain: 'mindfulness'`, `itemType: 'routine'`

2. **Domain Logs** (`type: 'domain-logs'`)
   - Source: `localStorage.getItem('lifehub-logs-{domain}')`
   - Target: `domain_entries` table, respective domain

3. **Generic Data** (`type: 'other'`)
   - Custom migration for any other legacy data

### Monitoring Migrations

**Telemetry Table:** `migration_logs`

Query recent migrations:
```sql
SELECT * FROM migration_logs 
WHERE user_id = '{user_id}' 
ORDER BY migrated_at DESC 
LIMIT 10;
```

Fields:
- `migration_type` - 'routines', 'domain-logs', 'other'
- `migrated_count` - Successfully migrated items
- `skipped_count` - Already existed (duplicates)
- `failed_count` - Failed to migrate
- `errors` - JSONB array of error messages
- `success` - Overall migration success boolean

### Scanning for Legacy Data

```typescript
import { scanLegacyData } from '@/lib/utils/server-migration-client'

const scan = scanLegacyData()
// Returns: { routines: boolean, domainLogs: string[], other: string[] }
```

### Manual Migration (Advanced)

If automated migration fails, use the API directly:

```bash
curl -X POST http://localhost:3000/api/migrate-legacy-data \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "type": "routines",
    "data": [...]
  }'
```

---

## Troubleshooting

### localStorage Migration Issues

**Problem:** User data missing after upgrade

**Solution:**
1. Enable legacy migration flag: `NEXT_PUBLIC_ENABLE_LEGACY_MIGRATION=true`
2. Ask user to reload the page
3. Check browser console for migration logs
4. Query `migration_logs` table for details

**Problem:** Build fails with "localStorage usage found"

**Solution:**
1. Check error output from `npm run migration:check`
2. Move localStorage code to server endpoint or IndexedDB
3. If it's a migration helper, add to allowlist in `scripts/verify-localstorage-migration.ts`

### Data Sync Issues

**Problem:** Data not syncing between devices

**Solution:**
1. Check Supabase connection: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Verify Row Level Security policies in Supabase
3. Check `SupabaseSyncProvider` is active in `app/layout.tsx`
4. Clear IndexedDB cache: `localStorage.clear()` then reload

### Performance Issues

**Problem:** Dashboard slow to load

**Solution:**
1. Check IndexedDB cache is working: `lib/utils/idb-cache.ts`
2. Verify debounced realtime subscriptions (250-500ms)
3. Use selective columns in queries (avoid `SELECT *`)
4. Check for excessive component re-renders

### API Errors

**Problem:** AI/integration API calls failing

**Solution:**
1. Verify API keys in `.env.local`
2. Check API rate limits (Gemini, OpenAI, etc.)
3. Review error logs in `app/api/*/route.ts`
4. Test with fallback providers

---

## Support & Resources

**Documentation:**
- `CLAUDE.md` - Development guidance for AI assistance
- `plan.md` - Current migration/refactoring tasks
- `LOCALSTORAGE_MIGRATION_PLAN.md` - Detailed migration docs

**Key Files:**
- `.cursor/rules/h.mdc` - Supabase keys and architecture
- `.cursor/rules/j.mdc` - Plan execution instructions
- `types/domains.ts` - Domain configurations
- `lib/hooks/use-domain-entries.ts` - Primary data access

**Debugging:**
- Migration logs: `window.migrationLogger.getLogs()`
- Data provider state: React DevTools → DataProvider context
- Supabase logs: Supabase Dashboard → Logs & Monitoring




















