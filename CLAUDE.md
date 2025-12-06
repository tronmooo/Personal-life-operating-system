# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LifeHub is a comprehensive personal life management application built with Next.js 14 (App Router), TypeScript, and Supabase. It provides a centralized hub for tracking 21+ life domains (Financial, Health, Insurance, Vehicles, Pets, Education, etc.) with AI-powered insights, voice commands, and real-time analytics.

## Development Commands

### Core Commands
```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:ci          # Lint + check for localStorage usage
npm run type-check       # TypeScript type checking
```

### Testing
```bash
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:ci          # Run tests for CI (with coverage)
npm run e2e              # Run Playwright e2e tests
npm run e2e:ui           # Run Playwright with UI
```

### Running a Single Test
```bash
npm test -- path/to/test.spec.ts           # Jest single file
npm run e2e -- path/to/test.spec.ts        # Playwright single file
```

## Architecture

### ⚡ STANDARD DATA ACCESS PATTERN (Updated 2025-11-13)

**🚨 IMPORTANT: Always use `useDomainCRUD` for ALL domain data operations**

#### ❌ DEPRECATED - DO NOT USE
```typescript
// OLD PATTERN - NO LONGER USE
import { useData } from '@/lib/providers/data-provider'

function MyComponent() {
  const { addData, updateData, deleteData } = useData()
  
  // ❌ Don't use these methods anymore
  addData('vehicles', data)
  updateData('vehicles', id, data)
  deleteData('vehicles', id)
}
```

#### ✅ STANDARD PATTERN - ALWAYS USE THIS
```typescript
// NEW STANDARD PATTERN
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'

function MyComponent() {
  const { items, create, update, remove, loading } = useDomainCRUD('vehicles')
  
  const handleAdd = async () => {
    await create({ 
      title: 'My Vehicle',
      metadata: { make: 'Toyota', model: 'Camry' }
    })
    // ✅ Automatic toast notification on success/error
    // ✅ Automatic error handling
  }
  
  const handleUpdate = async (id: string) => {
    await update(id, { title: 'Updated Vehicle' })
    // ✅ Automatic toast notification
  }
  
  const handleDelete = async (id: string) => {
    await remove(id)
    // ✅ Automatic confirmation dialog
    // ✅ Automatic toast notification
  }
  
  if (loading) return <LoadingSpinner />
  return <DataTable items={items} onDelete={remove} />
}
```

**Why This Pattern?**
- ✅ **Consistent UX**: All CRUD operations have same error handling and user feedback
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Delete Confirmation**: Built-in confirmation dialogs
- ✅ **Loading States**: Automatic loading state management
- ✅ **Error Handling**: Centralized error handling with user-friendly messages
- ✅ **Toast Notifications**: Automatic success/error toasts
- ✅ **Single Source of Truth**: One hook for all domain operations

### Data Layer

**Primary Data Model: `domain_entries`**
- Central table storing all domain data (financial, health, vehicles, pets, education, etc.)
- Schema: `{ id, user_id, domain, title, description, metadata, created_at, updated_at }`
- `metadata` is JSONB containing domain-specific fields
- Accessed via `domain_entries_view` for better performance

**Data Access Patterns:**
1. **✅ Standard**: `lib/hooks/use-domain-crud.ts` - Standardized CRUD with UX (USE THIS)
2. **Low-level**: `lib/hooks/use-domain-entries.ts` - Direct Supabase CRUD operations
3. **❌ Legacy**: `lib/providers/data-provider.tsx` - Context API wrapper (DEPRECATED)
4. **Cache**: `lib/utils/idb-cache.ts` - Client-side cache for offline support

**Data Flow:**
```
Component → useDomainCRUD() → use-domain-entries → Supabase
                ↓
          (automatic toasts, confirmations, error handling)
```

**Important Tables:**
- `domain_entries` - All domain data (universal table)
- `notifications` - User notifications with settings
- `dashboard_layouts` - Customizable dashboard configurations
- `user_settings` - User preferences
- Specialized tables: `travel_*`, `relationships_*`, `plaid_*`

### Provider Architecture

**Provider Hierarchy (in `app/layout.tsx`):**
```tsx
<Providers>
  └─ ThemeProvider
     └─ SupabaseSyncProvider    // Realtime sync
        └─ DataProvider         // Primary data access
           └─ NotificationProvider
              └─ EnhancedDataProvider
                 └─ FinanceProvider
```

**Key Providers:**
- `DataProvider` (`lib/providers/data-provider.tsx`) - Main data context for domains, tasks, habits, bills
- `SupabaseSyncProvider` - Manages realtime subscriptions to Supabase
- `NotificationProvider` - Notification scheduling and management
- `FinanceProvider` - Financial domain-specific state
- `EnhancedDataProvider` - Legacy provider being migrated away from localStorage

### Domain System

**21 Domains:** financial, health, insurance, home, vehicles, appliances, pets, education, relationships, digital, mindfulness, fitness, nutrition, and more.

**Domain Configuration:**
- `types/domains.ts` - Domain types and configurations
- `types/domain-metadata.ts` - Domain-specific metadata schemas
- Each domain has: name, description, icon, color, category, fields

**Domain Pages:**
- `/domains` - All domains grid view
- `/domains/[domainId]` - Single domain detail with 3 tabs: Items, Documents, Analytics
- Dynamic forms based on `DOMAIN_CONFIGS[domain].fields`

### API Routes Structure

**API Organization:**
- `/api/domain-entries` - CRUD for domain data
- `/api/documents` - Document upload, OCR, smart scanning
- `/api/ai-tools/*` - AI-powered tools (OCR, receipts, invoices, budgets)
- `/api/calendar/*` - Google Calendar integration
- `/api/gmail/*` - Gmail integration
- `/api/drive/*` - Google Drive operations
- `/api/plaid/*` - Banking integration (Plaid)
- `/api/notifications/*` - Notification generation and scheduling
- `/api/mcp/*` - Model Context Protocol execution
- `/api/cron/*` - Background jobs

### Component Organization

**UI Components** (`components/ui/`)
- ShadCN UI-based primitives
- Custom: `back-button.tsx`, `back-button-guard.tsx`, `error-boundary.tsx`, `loading-state.tsx`

**Dashboard Components** (`components/dashboard/`)
- `customizable-dashboard.tsx` - Drag-and-drop dashboard with react-grid-layout
- `command-center-*.tsx` - Main dashboard views
- `domain-cards/*` - Domain-specific dashboard cards
- `notification-hub.tsx` - Notification center

**Domain Components**
- `components/health/*` - Health domain tabs and forms
- `components/finance/*` - Financial domain components
- `components/insurance/*` - Insurance policies and claims
- `components/travel/*` - Travel bookings and itineraries
- `components/pets/*` - Pet management

### Integration Points

**Supabase Backend:**
- MCP-enabled Supabase project: `jphpxqqilrjyypztkswc`
- Service role key available in `.cursor/rules/h.mdc` line 14
- Use Supabase MCP for all database/edge function development

**Google Integrations:**
- Calendar: OAuth-based event sync (`/api/calendar/*`)
- Drive: Document storage (`/api/drive/*`)
- Gmail: Email parsing and suggestions (`/api/gmail/*`)
- Vision API: OCR for document scanning

**AI Services:**
- Gemini API (Google) - Primary AI
- OpenAI - Alternative AI provider
- Tesseract.js - Client-side OCR
- @google-cloud/vision - Server-side OCR

### Key Utilities

**Cache Management:**
- `lib/utils/idb-cache.ts` - IndexedDB wrapper (replaces localStorage)
- Functions: `idbGet()`, `idbSet()`, `idbDelete()`, `idbClear()`

**Dashboard:**
- `lib/dashboard/layout-io.ts` - Save/load layouts
- `lib/dashboard/responsive-manager.ts` - Responsive grid calculations
- `lib/types/dashboard-layout-types.ts` - Layout type definitions

**Notifications:**
- `lib/notifications.ts` - Legacy notification utils
- `lib/notifications/notification-generator.ts` - Smart notification generation
- `components/notifications/notification-scheduler.tsx` - Scheduling UI

## Important Patterns

### Data Mutations

**Preferred Pattern** (use-domain-entries):
```typescript
import { useDomainEntries } from '@/lib/hooks/use-domain-entries'

const { entries, createEntry, updateEntry, deleteEntry } = useDomainEntries('vehicles')

await createEntry({
  title: 'My Car',
  domain: 'vehicles',
  metadata: { make: 'Toyota', model: 'Camry' }
})
```

**Legacy Pattern** (DataProvider - avoid for new code):
```typescript
const { addData, updateData, deleteData } = useData()
addData('vehicles', { title: 'My Car', ... })
```

### Realtime Subscriptions

Supabase realtime is configured in `SupabaseSyncProvider`:
- Auto-subscribes to `domain_entries` changes for current user
- Debounced reloads (250-500ms) to prevent excessive updates
- Use IDB for instant hydration, Supabase for source of truth

### Offline Support

1. **On Load**: Read from IDB first for instant UI
2. **Fetch**: Load from Supabase to get latest data
3. **Save**: Write to both IDB and Supabase
4. **Sync**: Supabase realtime updates IDB automatically

### Error Handling

- Use `ErrorBoundary` component for section isolation
- Toast notifications via `lib/utils/toast.tsx` (sonner)
- Graceful degradation when offline or API fails

## Development Notes

### localStorage Migration
**Active Migration**: Moving away from localStorage to IndexedDB + Supabase
- Current status tracked in `plan.md`
- Use `npm run check:no-storage` to find localStorage usage
- Migrate to `idbCache.*` methods or Supabase

### Testing Requirements
- Run `npm run lint:ci` before commits (includes storage check)
- Playwright tests for critical user flows
- Jest tests for utilities and hooks
- Coverage threshold enforced in CI

### MCP (Model Context Protocol)
- Config: `.mcp/config.json`
- Enabled servers: Google Calendar, Supabase Database, Web Search
- Execute via `/api/mcp/execute`

### Cursor Rules
Important development rules in `.cursor/rules/`:
- `h.mdc` - Contains Supabase service role key, architecture guidance, plan.md execution pattern
- `j.mdc` - plan.md execution instructions

**Development Workflow from Cursor Rules:**
> "Read the assigned section of plan.md, complete the first unchecked task, mark it as [x] when done, and immediately move to the next unchecked task. Continue until all tasks in your section are complete."

### Database Development
**Always use Supabase MCP** for backend work:
- Project: `jphpxqqilrjyypztkswc.supabase.co`
- Service role key in `.cursor/rules/h.mdc:14`
- Migrations in `supabase/migrations/`

## Common Gotchas

1. **No localStorage**: Use IndexedDB (`idb-cache.ts`) or Supabase instead
2. **Realtime Debouncing**: Don't reload data too frequently; use debounced updates
3. **IDB-First Hydration**: Always load from IDB first for instant UI, then Supabase
4. **Domain Entry Metadata**: Domain-specific fields go in `metadata` JSONB column
5. **RLS Policies**: Ensure Row Level Security is configured on new tables
6. **Type Safety**: All domain metadata must match `DomainMetadataMap` in `types/domain-metadata.ts`

## Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Configure Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Add API keys for integrations (optional): Gemini, OpenAI, VAPI, Plaid, etc.
4. For Google integrations, follow respective setup guides in docs

## Performance Considerations

- **Database Queries**: Use selective columns, avoid `SELECT *`
- **Realtime**: Debounce subscription callbacks (250-500ms)
- **Indexing**: Critical indexes in `20251025_domain_entries_common_indexes.sql`
- **Loading States**: Use Suspense/skeletons for async data
- **IDB Caching**: Instant first load, then background sync from Supabase
