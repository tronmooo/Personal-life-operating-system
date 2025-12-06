# Code Audit Action Plan - Prioritized Checklist
**Based on:** CODE_AUDIT_REPORT_2025-11-13.md  
**Start Date:** 2025-11-13  
**Target Completion:** 2025-12-11 (4 weeks)

---

## 🔴 WEEK 1: CRITICAL FIXES (40 hours)

### Day 1-2: Error Handling Foundation (16h)

#### 1.1 Centralized Error Handler (4h)
- [ ] Update `lib/utils/error-handler.ts` with standardized error logging
- [ ] Add error reporting service integration (Sentry or LogRocket)
- [ ] Create error severity levels (debug, info, warn, error, critical)
- [ ] Add context tracking (user_id, route, action)
- [ ] Test error handler with sample errors

**Files to create/update:**
- `lib/utils/error-handler.ts`
- `lib/utils/logger.ts`
- `.env.local` (add SENTRY_DSN or equivalent)

#### 1.2 API Routes Error Wrapping (6h)
- [ ] `app/api/domain-entries/route.ts` - Add try-catch to GET, POST, PUT, DELETE
- [ ] `app/api/documents/route.ts` - Wrap all operations
- [ ] `app/api/documents/upload/route.ts` - Add upload error handling
- [ ] `app/api/ai-assistant/chat/route.ts` - Handle AI API failures
- [ ] `app/api/vapi/webhook/route.ts` - Validate webhook payloads
- [ ] Run tests after each file update
- [ ] Document error codes in API responses

**Priority API routes (25 of 125):**
1. ✅ domain-entries/* (CRUD operations)
2. ✅ documents/* (File operations)
3. ✅ ai-assistant/* (AI features)
4. calendar/* (Google integration)
5. gmail/* (Email parsing)
6. plaid/* (Banking data)
7. vapi/* (Voice AI)
8. orders/* (Ordering system)
9. concierge/* (Smart calling)
10. analytics/* (Reports)

#### 1.3 React Error Boundaries (3h)
- [ ] Create `components/ui/error-boundary.tsx` (already exists - verify working)
- [ ] Wrap dashboard in error boundary (`app/layout.tsx`)
- [ ] Wrap domain detail pages (`app/domains/[domainId]/layout.tsx`)
- [ ] Wrap AI assistant (`app/ai-assistant/page.tsx`)
- [ ] Wrap document viewer (`app/documents/page.tsx`)
- [ ] Add fallback UI for each boundary
- [ ] Test by forcing errors in wrapped components

#### 1.4 Error Message Quality (3h)
- [ ] Replace generic errors in `lib/hooks/use-domain-entries.ts`
- [ ] Update errors in `lib/providers/data-provider.tsx`
- [ ] Add user-friendly messages to all toast notifications
- [ ] Create error message dictionary (`lib/constants/error-messages.ts`)
- [ ] Document error recovery steps for common failures

---

### Day 3-4: Performance Critical Path (16h)

#### 2.1 Fix Dashboard N+1 Queries (6h) ⚡ CRITICAL
- [ ] **Before:** Measure current dashboard load time with DevTools
- [ ] Update `components/dashboard/command-center-redesigned.tsx`
  - [ ] Replace 21 individual domain queries with single bulk query
  - [ ] Group entries by domain client-side
  - [ ] Update state management to handle bulk data
- [ ] Update all domain cards to accept pre-fetched data as props
  - [ ] `components/dashboard/domain-cards/financial-card.tsx`
  - [ ] `components/dashboard/domain-cards/health-card.tsx`
  - [ ] `components/dashboard/domain-cards/vehicle-card.tsx`
  - [ ] (+ 7 more domain cards)
- [ ] **After:** Measure new load time (target: < 800ms)
- [ ] Document performance improvement in PR

**Expected Impact:** 80% reduction in load time (2-3s → 400-600ms)

#### 2.2 Memory Leak Cleanup - Timers (4h)
- [ ] `components/dashboard/command-center-redesigned.tsx:726` - Add interval cleanup
- [ ] `components/domain-quick-log.tsx:168` - Add timeout cleanup
- [ ] `components/ai-assistant-popup-clean.tsx` - Add cleanup to 5 timeouts
- [ ] `components/documents/smart-upload-dialog.tsx` - Add cleanup to 8 timeouts
- [ ] `components/insurance/smart-document-upload-dialog.tsx` - Add cleanup to 4 timeouts

**Pattern to apply:**
```typescript
useEffect(() => {
  const timerId = setTimeout(() => { /* ... */ }, delay)
  return () => clearTimeout(timerId)
}, [dependencies])
```

**Verification:**
- [ ] Run memory profiler in Chrome DevTools
- [ ] Navigate to/from affected pages 10 times
- [ ] Verify memory returns to baseline

#### 2.3 AbortController for Fetch Operations (4h)
- [ ] Add AbortController to `lib/hooks/use-domain-entries.ts`
- [ ] Update `lib/hooks/use-document-retrieval.ts`
- [ ] Update `lib/hooks/use-pets-stats.ts`
- [ ] Update `lib/hooks/use-health-metrics.ts`
- [ ] Update `lib/hooks/use-transactions.ts`
- [ ] Document pattern in `docs/FETCH_PATTERN.md`

**Standard pattern:**
```typescript
useEffect(() => {
  const controller = new AbortController()
  fetchData({ signal: controller.signal }).then(setData).catch(err => {
    if (err.name !== 'AbortError') {
      handleError(err)
    }
  })
  return () => controller.abort()
}, [])
```

#### 2.4 Memoization - Top 10 Components (2h)
- [ ] `components/dashboard/command-center-redesigned.tsx` - Memoize filtered data (54 operations)
- [ ] `app/domains/page.tsx` - Memoize domain list (68 operations)
- [ ] `components/domain-profiles/vehicle-tracker-autotrack.tsx` - Memoize calculations (46 ops)
- [ ] `lib/providers/data-provider.tsx` - Memoize selectors (29 operations)
- [ ] `components/domain-profiles/appliance-tracker-autotrack.tsx` - Memoize (15 operations)
- [ ] Document when to use `useMemo` vs `useCallback`

---

### Day 5: Type Safety Quick Wins (8h)

#### 3.1 Fix Error Handling Types (4h)
- [ ] Create codemod script: `codemods/fix-error-types.ts`
- [ ] Run on `lib/` directory
- [ ] Run on `app/api/` directory
- [ ] Run on `components/` directory
- [ ] Manual review of auto-fixed code
- [ ] Test all affected files

**Pattern replacement:**
```typescript
// Before: catch (err: any)
// After:
catch (err) {
  const error = err instanceof Error ? err : new Error(String(err))
  // Use error safely
}
```

**Target:** ~200 instances across 100 files

#### 3.2 External API Type Definitions (4h)
- [ ] Create `types/external-apis.ts`
- [ ] Define `GoogleCalendarEvent`, `GoogleCalendarEventList`
- [ ] Define `ZillowProperty`, `ZillowSearchResult`
- [ ] Define `OpenAIResponse`, `GeminiResponse`
- [ ] Define `PlaidAccount`, `PlaidTransaction`
- [ ] Define `VAPICall`, `VAPIWebhookPayload`
- [ ] Update 20 files using these APIs
- [ ] Verify TypeScript compilation still passes

---

## 🟡 WEEKS 2-3: IMPORTANT IMPROVEMENTS (60 hours)

### Week 2: Data Layer Standardization (20h)

#### 4.1 Component Migration (16h)
**Migrate from DataProvider to use-domain-entries hook**

Priority components (55 total, tackle 20 first):
- [ ] `components/domain-quick-log.tsx`
- [ ] `components/health/vitals-tab.tsx`
- [ ] `components/meal-logger.tsx`
- [ ] `components/relationships/relationships-manager.tsx`
- [ ] `components/mindfulness/mindfulness-app-full.tsx`
- [ ] `components/pets/costs-tab.tsx`
- [ ] `components/pets/vaccinations-tab.tsx`
- [ ] `components/digital/domains-tab.tsx`
- [ ] `components/digital/accounts-tab.tsx`
- [ ] `components/digital/assets-tab.tsx`
- [ ] `components/digital/subscriptions-tab.tsx`
- [ ] `components/nutrition/meals-view.tsx`
- [ ] `components/fitness/activities-tab.tsx`
- [ ] `components/home/projects-tab.tsx`
- [ ] `components/home/maintenance-schedule-tab.tsx`
- [ ] `components/home/bills-tab.tsx`
- [ ] `components/insurance/policies-tab.tsx`
- [ ] `components/health/records-tab.tsx`
- [ ] `components/health/sleep-tab.tsx`
- [ ] `components/finance-simple/debts-view.tsx`

**Migration checklist per component:**
1. Replace `const { addData, updateData, deleteData } = useData()` 
2. With `const { entries, createEntry, updateEntry, deleteEntry } = useDomainEntries(domain)`
3. Update function calls to match new API
4. Update state management if needed
5. Test CRUD operations
6. Verify realtime sync works
7. Check offline behavior

#### 4.2 Documentation (4h)
- [ ] Update `CLAUDE.md` with standard data access pattern
- [ ] Create `docs/DATA_ACCESS_PATTERNS.md`
- [ ] Document when to use useData vs useDomainEntries
- [ ] Add migration guide for remaining components
- [ ] Update component templates

---

### Week 2: Type Safety Improvements (16h)

#### 5.1 Metadata Type Refactoring (10h)
**Use discriminated unions for type-safe metadata**

Files to update (89 total, prioritize 30):
- [ ] Update `lib/hooks/use-domain-entries.ts` to use `DomainMetadataMap`
- [ ] Update `lib/providers/data-provider.tsx`
- [ ] Update all API routes accepting metadata (25 routes)
- [ ] Update all components creating/editing entries (30 components)

**Pattern:**
```typescript
// Before: metadata?: Record<string, any>
// After:
import type { DomainMetadataMap } from '@/types/domain-metadata'

interface DomainEntry<T extends Domain> {
  domain: T
  metadata?: DomainMetadataMap[T]
}
```

#### 5.2 AI Service Type Safety (6h)
- [ ] Type OpenAI API responses (`lib/services/ai-service.ts`)
- [ ] Type Gemini API responses
- [ ] Type Google Vision OCR responses (`lib/ocr/google-vision-ocr.ts`)
- [ ] Type Google Calendar responses (`lib/integrations/google-calendar-sync.ts`)
- [ ] Type Zillow API responses (`lib/integrations/zillow-api.ts`)
- [ ] Type Plaid responses (`app/api/plaid/*`)

---

### Week 3: Performance Optimization (16h)

#### 6.1 Virtual Scrolling (6h)
- [ ] Install `react-window` or `@tanstack/react-virtual`
- [ ] Implement in `app/domains/page.tsx` (domain list)
- [ ] Implement in large document lists
- [ ] Implement in transaction lists (financial)
- [ ] Measure before/after render performance
- [ ] Document virtual scrolling pattern

#### 6.2 Code Splitting (6h)
- [ ] Add dynamic imports for domain-specific pages
- [ ] Lazy load AI tools (`app/tools/page.tsx`)
- [ ] Lazy load analytics pages
- [ ] Lazy load rarely-used components (therapy chat, mindfulness)
- [ ] Configure Webpack/Next.js bundle optimization
- [ ] Run bundle analyzer: `npm run build -- --analyze`
- [ ] Document code splitting strategy

#### 6.3 Bundle Optimization (4h)
- [ ] Review bundle analyzer output
- [ ] Tree-shake unused dependencies
- [ ] Replace moment.js with date-fns (if present)
- [ ] Optimize image loading (next/image)
- [ ] Add `.env` check for unused API keys
- [ ] Target: 40% bundle size reduction

---

### Week 3: Technical Debt Cleanup (8h)

#### 7.1 Console.log Replacement (4h)
- [ ] Create `lib/utils/logger.ts` utility
- [ ] Configure for dev vs production
- [ ] Create codemod: `codemods/replace-console.ts`
- [ ] Run codemod on all files
- [ ] Manual review of 50 critical logs
- [ ] Keep important error logs
- [ ] Remove debug logs
- [ ] Target: 4,727 → < 100 statements

#### 7.2 TODO Item Resolution (2h)
- [ ] `lib/tools/auto-fill.ts:404-406` - Implement tax auto-fill OR document as future work
- [ ] `app/analytics-comprehensive/page.tsx:476` - Get age from user settings
- [ ] `app/api/notifications/cron/route.ts:169` - Implement email summary OR remove TODO
- [ ] `app/api/documents/route.ts:196` - Delete from storage bucket on document delete
- [ ] Review all 30 TODOs and either fix or create issues

#### 7.3 Dead Code Removal (2h)
- [ ] Run ESLint: `npm run lint`
- [ ] Fix unused imports (20+ files)
- [ ] Remove commented-out code
- [ ] Remove unused utility functions
- [ ] Remove legacy migration scripts (if migration complete)

---

## 🟢 MONTH 2: POLISH & TESTING (80 hours)

### Weeks 4-5: Type Safety Completion (40h)

#### 8.1 Enable Strict Mode (20h)
- [ ] Update `tsconfig.json`: `"strict": true`
- [ ] Fix null/undefined errors (500-1000 expected)
- [ ] Add type guards where needed
- [ ] Update function signatures
- [ ] Fix return type inference issues
- [ ] Ensure all tests pass

#### 8.2 Eliminate Remaining `any` Types (20h)
- [ ] Target: 492 files → < 50 remaining
- [ ] Systematic review of all files with `any`
- [ ] Replace with proper types or `unknown`
- [ ] Add type assertions where unavoidable
- [ ] Document why `any` is necessary (if kept)

---

### Weeks 6-7: Testing Coverage (40h)

#### 9.1 Hook Tests (15h)
- [ ] Test all 25 hooks in `lib/hooks/`
- [ ] Focus on: use-domain-entries, use-health-metrics, use-insurance
- [ ] Test success paths
- [ ] Test error handling
- [ ] Test cleanup (timers, listeners)
- [ ] Target: 80% coverage for hooks

#### 9.2 Provider Tests (10h)
- [ ] `lib/providers/data-provider.tsx`
- [ ] `lib/providers/notification-provider.tsx`
- [ ] `lib/providers/finance-provider.tsx`
- [ ] `lib/providers/supabase-sync-provider.tsx`
- [ ] Mock Supabase calls
- [ ] Test state updates
- [ ] Test error scenarios

#### 9.3 API Route Tests (15h)
- [ ] Test top 20 API routes
- [ ] Mock external services (OpenAI, Google, Plaid)
- [ ] Test authentication/authorization
- [ ] Test validation errors
- [ ] Test rate limiting
- [ ] Test error responses
- [ ] Target: 70% coverage for critical routes

---

## 📊 PROGRESS TRACKING

### Metrics Dashboard

| Metric | Baseline | Week 1 | Week 2 | Week 3 | Week 6 | Target |
|--------|----------|--------|--------|--------|--------|--------|
| `any` types | 1,200+ | | | | | < 50 |
| Console logs | 4,727 | | | | | < 100 |
| Dashboard load | 2-3s | | | | | < 600ms |
| Memory leaks | 18 | | | | | 0 |
| Error coverage | 46% | | | | | > 95% |
| Test coverage | ~30% | | | | | > 70% |
| TypeScript errors | 0 | | | | | 0 |
| ESLint warnings | 329 | | | | | < 10 |

### Weekly Checkpoints

#### End of Week 1 Checklist
- [ ] Dashboard loads in < 800ms
- [ ] Zero memory leaks from timers
- [ ] All critical API routes have try-catch
- [ ] Error boundaries deployed
- [ ] AbortController on all fetch calls
- [ ] 200 error types fixed

#### End of Week 2 Checklist  
- [ ] 20 components migrated to use-domain-entries
- [ ] Data access patterns documented
- [ ] 30 files using typed metadata
- [ ] 5 external APIs typed

#### End of Week 3 Checklist
- [ ] Virtual scrolling implemented
- [ ] Code splitting active
- [ ] Bundle size reduced 30%
- [ ] Console logs < 200 remaining
- [ ] All TODOs resolved/documented

#### End of Month 2 Checklist
- [ ] Strict TypeScript mode enabled
- [ ] < 50 `any` types remaining
- [ ] Test coverage > 70%
- [ ] All metrics hit targets
- [ ] Production monitoring configured

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Production Release
- [ ] Run full test suite: `npm test && npm run e2e`
- [ ] TypeScript check: `npm run type-check`
- [ ] Lint check: `npm run lint:ci`
- [ ] Build check: `npm run build`
- [ ] Performance audit: Lighthouse score > 90
- [ ] Security audit: `npm audit`
- [ ] Error monitoring configured (Sentry/LogRocket)
- [ ] Performance monitoring configured
- [ ] Backup database
- [ ] Document rollback procedure

---

## 📝 NOTES

### Key Decision Points
1. **Error Monitoring Service:** Choose Sentry, LogRocket, or alternative
2. **Bundle Analyzer:** Decide if using webpack-bundle-analyzer or Next.js built-in
3. **Virtual Scrolling Library:** Choose between react-window, react-virtual, or Tanstack Virtual
4. **Type Coverage Tool:** Decide if installing type-coverage package

### Risk Mitigation
- Create feature branch for each major change
- Test locally before committing
- Use Playwright tests to catch regressions
- Monitor production errors closely after deploy
- Keep rollback plan ready

### Communication
- Update team on progress weekly
- Document breaking changes in CHANGELOG.md
- Create migration guides for major refactors
- Share performance improvements in team meeting

---

**Last Updated:** 2025-11-13  
**Owner:** Development Team  
**Review Frequency:** Weekly  
**Completion Target:** 2025-12-11



