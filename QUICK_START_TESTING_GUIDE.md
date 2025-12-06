# 🚀 Quick Start Testing Guide
## Implement Critical Tests This Week

**Goal**: Get the highest-priority tests running within 7 days  
**Focus**: Critical security & data integrity paths  
**Approach**: Start small, iterate fast, build confidence

---

## 📅 7-Day Implementation Plan

### Day 1: Setup & Infrastructure (Monday)

#### Morning: Test Infrastructure
```bash
# Install testing dependencies
npm install --save-dev \
  @testing-library/react-hooks \
  @testing-library/user-event \
  nock \
  msw \
  @faker-js/faker \
  @supabase/supabase-js-mock

# Create test utilities directory
mkdir -p __tests__/utils __tests__/mocks __tests__/fixtures
```

#### Afternoon: Mock Setup

**Create**: `__tests__/mocks/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
  })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
  })),
  removeChannel: jest.fn(),
}

// Mock createClientComponentClient
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => mockSupabaseClient,
}))
```

**Create**: `__tests__/utils/test-helpers.ts`
```typescript
import { Domain } from '@/types/domains'

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  ...overrides
})

export const createMockEntry = (domain: Domain, overrides = {}) => ({
  id: 'test-entry-id',
  user_id: 'test-user-id',
  domain,
  title: 'Test Entry',
  description: 'Test description',
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const wait = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))
```

---

### Day 2: Authentication Tests (Tuesday)

#### Priority 1: RLS Security Tests

**Create**: `__tests__/security/row-level-security.test.ts`
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { listDomainEntries, createDomainEntry } from '@/lib/hooks/use-domain-entries'

describe('Row-Level Security', () => {
  let supabaseUserA: any
  let supabaseUserB: any
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
  })
  
  test('CRITICAL: User A cannot access User B data', async () => {
    // User A creates entry
    supabaseUserA = createClientComponentClient()
    supabaseUserA.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-a', email: 'a@test.com' } },
      error: null
    })
    
    const entryA = await createDomainEntry(supabaseUserA, {
      domain: 'health',
      title: 'User A Private Data'
    })
    
    // User B tries to access
    supabaseUserB = createClientComponentClient()
    supabaseUserB.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-b', email: 'b@test.com' } },
      error: null
    })
    
    // Mock RLS enforcement
    supabaseUserB.from().select().eq().mockResolvedValue({
      data: [], // RLS filters out User A's data
      error: null
    })
    
    const entriesForUserB = await listDomainEntries(supabaseUserB, 'health')
    
    // User B should NOT see User A's data
    expect(entriesForUserB).toEqual([])
    expect(entriesForUserB).not.toContainEqual(
      expect.objectContaining({ id: entryA.id })
    )
  })
  
  test('CRITICAL: Unauthenticated requests rejected', async () => {
    const supabase = createClientComponentClient()
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated')
    })
    
    const entries = await listDomainEntries(supabase, 'health')
    
    // Should return empty array (no data leak)
    expect(entries).toEqual([])
  })
  
  test('CRITICAL: Cannot update another user data', async () => {
    const supabase = createClientComponentClient()
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-b', email: 'b@test.com' } },
      error: null
    })
    
    // Mock RLS preventing update
    supabase.from().update().eq().single.mockResolvedValue({
      data: null,
      error: { message: 'No rows updated', code: 'PGRST116' }
    })
    
    await expect(
      updateDomainEntry(supabase, {
        id: 'user-a-entry-id',
        title: 'Malicious Update'
      })
    ).rejects.toThrow()
  })
})
```

#### Priority 2: Session Management Tests

**Create**: `__tests__/auth/session-management.test.ts`
```typescript
import { signIn, signOut } from '@/lib/auth'
import { idbClear } from '@/lib/utils/idb-cache'

describe('Session Management', () => {
  test('Sign-out clears all data', async () => {
    // Sign in
    await signIn('test@example.com', 'password')
    
    // Add some data
    await idbSet('test-key', 'test-value')
    
    // Sign out
    await signOut()
    
    // IDB should be cleared
    const cachedData = await idbGet('test-key')
    expect(cachedData).toBeNull()
    
    // Subscriptions should be cleaned up
    const activeChannels = getActiveSupabaseChannels()
    expect(activeChannels).toHaveLength(0)
  })
  
  test('Expired session redirects to login', async () => {
    const supabase = createClientComponentClient()
    
    // Mock expired session
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Session expired' }
    })
    
    // Try to load data
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/auth/signin')
    })
  })
})
```

**⏰ Time Check**: End of Day 2 - Should have 10+ security tests passing

---

### Day 3: Realtime Sync Tests (Wednesday)

#### Priority 1: Subscription Lifecycle

**Create**: `__tests__/realtime/subscription-lifecycle.test.ts`
```typescript
import { SupabaseSyncProvider } from '@/lib/providers/supabase-sync-provider'
import { render, cleanup } from '@testing-library/react'

describe('Realtime Subscription Lifecycle', () => {
  afterEach(() => {
    cleanup() // Cleanup React components
  })
  
  test('Creates subscriptions on mount', async () => {
    const supabase = createClientComponentClient()
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } },
      error: null
    })
    
    const channelSpy = jest.spyOn(supabase, 'channel')
    
    render(
      <SupabaseSyncProvider>
        <div>Test Content</div>
      </SupabaseSyncProvider>
    )
    
    await waitFor(() => {
      expect(channelSpy).toHaveBeenCalledWith('realtime-domain-entries')
    })
  })
  
  test('Cleans up subscriptions on unmount', async () => {
    const supabase = createClientComponentClient()
    const removeChannelSpy = jest.spyOn(supabase, 'removeChannel')
    
    const { unmount } = render(
      <SupabaseSyncProvider>
        <div>Test Content</div>
      </SupabaseSyncProvider>
    )
    
    unmount()
    
    await waitFor(() => {
      expect(removeChannelSpy).toHaveBeenCalled()
    })
  })
  
  test('No duplicate subscriptions in multi-tab', async () => {
    const supabase = createClientComponentClient()
    const channelSpy = jest.spyOn(supabase, 'channel')
    
    // Render twice (simulating 2 tabs)
    render(
      <SupabaseSyncProvider>
        <div>Tab 1</div>
      </SupabaseSyncProvider>
    )
    
    render(
      <SupabaseSyncProvider>
        <div>Tab 2</div>
      </SupabaseSyncProvider>
    )
    
    // Should check for existing subscription
    // (Implementation detail: use BroadcastChannel or localStorage flag)
    expect(channelSpy).toHaveBeenCalledTimes(1)
  })
})
```

#### Priority 2: Realtime Updates

**Create**: `__tests__/realtime/realtime-updates.test.ts`
```typescript
describe('Realtime Updates', () => {
  test('INSERT event updates UI', async () => {
    const { rerender } = render(<DomainListPage domain="health" />)
    
    // Simulate realtime INSERT
    const newEntry = {
      id: 'new-id',
      user_id: 'test-user',
      domain: 'health',
      title: 'New Entry',
      created_at: new Date().toISOString()
    }
    
    act(() => {
      triggerRealtimeEvent('INSERT', newEntry)
    })
    
    rerender(<DomainListPage domain="health" />)
    
    // Should show new entry
    await waitFor(() => {
      expect(screen.getByText('New Entry')).toBeInTheDocument()
    })
  })
  
  test('Debounces rapid updates', async () => {
    const reloadSpy = jest.fn()
    
    // Trigger 10 updates rapidly
    for (let i = 0; i < 10; i++) {
      triggerRealtimeEvent('UPDATE', { id: 'entry-1', title: `Update ${i}` })
    }
    
    // Wait for debounce (500ms)
    await wait(600)
    
    // Should only reload once
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })
})
```

**⏰ Time Check**: End of Day 3 - Should have 15+ realtime tests passing

---

### Day 4: Data Provider & Cache Tests (Thursday)

#### Priority 1: IDB Cache Tests

**Create**: `__tests__/cache/idb-cache.test.ts`
```typescript
import { idbGet, idbSet, idbDel, idbClear } from '@/lib/utils/idb-cache'

describe('IndexedDB Cache', () => {
  beforeEach(async () => {
    await idbClear()
  })
  
  test('Set and get data', async () => {
    const testData = { id: 1, name: 'Test' }
    
    await idbSet('test-key', testData)
    const retrieved = await idbGet('test-key')
    
    expect(retrieved).toEqual(testData)
  })
  
  test('Returns null for non-existent key', async () => {
    const result = await idbGet('non-existent')
    expect(result).toBeNull()
  })
  
  test('Deletes data', async () => {
    await idbSet('test-key', 'test-value')
    await idbDel('test-key')
    
    const result = await idbGet('test-key')
    expect(result).toBeNull()
  })
  
  test('Handles large data (50MB)', async () => {
    const largeData = {
      entries: Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        title: `Entry ${i}`,
        description: 'A'.repeat(1000)
      }))
    }
    
    await idbSet('large-data', largeData)
    const retrieved = await idbGet('large-data')
    
    expect(retrieved.entries).toHaveLength(10000)
  })
})
```

#### Priority 2: Optimistic Updates

**Create**: `__tests__/providers/optimistic-updates.test.ts`
```typescript
describe('Optimistic Updates', () => {
  test('Updates UI immediately before Supabase confirms', async () => {
    render(<DataProvider><DomainListPage /></DataProvider>)
    
    const addButton = screen.getByText('Add Entry')
    await userEvent.click(addButton)
    
    await fillForm({ title: 'New Entry' })
    await submitForm()
    
    // Should show immediately (optimistic)
    expect(screen.getByText('New Entry')).toBeInTheDocument()
    
    // Wait for Supabase confirmation
    await waitFor(() => {
      expect(mockSupabase.from().insert).toHaveBeenCalled()
    })
  })
  
  test('Rolls back on Supabase failure', async () => {
    // Mock Supabase failure
    mockSupabase.from().insert().mockResolvedValue({
      data: null,
      error: new Error('Insert failed')
    })
    
    render(<DataProvider><DomainListPage /></DataProvider>)
    
    await addEntry({ title: 'Failed Entry' })
    
    // Should show optimistically
    expect(screen.getByText('Failed Entry')).toBeInTheDocument()
    
    // Wait for rollback
    await waitFor(() => {
      expect(screen.queryByText('Failed Entry')).not.toBeInTheDocument()
    })
    
    // Should show error toast
    expect(screen.getByText(/failed to save/i)).toBeInTheDocument()
  })
})
```

**⏰ Time Check**: End of Day 4 - Should have 25+ tests passing

---

### Day 5: External API Tests (Friday)

#### Priority 1: Plaid Integration

**Create**: `__tests__/integrations/plaid.test.ts`
```typescript
import { PlaidBankingService } from '@/lib/integrations/plaid-banking'
import nock from 'nock'

describe('Plaid Integration', () => {
  let plaidService: PlaidBankingService
  
  beforeEach(() => {
    plaidService = new PlaidBankingService()
    nock.cleanAll()
  })
  
  test('Creates link token successfully', async () => {
    nock('https://sandbox.plaid.com')
      .post('/link/token/create')
      .reply(200, {
        link_token: 'link-test-token',
        expiration: '2025-01-01T00:00:00Z'
      })
    
    const result = await plaidService.createLinkToken('user-123')
    
    expect(result.link_token).toBe('link-test-token')
  })
  
  test('Handles Plaid API rate limiting', async () => {
    nock('https://sandbox.plaid.com')
      .post('/link/token/create')
      .reply(429, {
        error_code: 'RATE_LIMIT_EXCEEDED',
        error_message: 'Rate limit exceeded'
      })
    
    await expect(
      plaidService.createLinkToken('user-123')
    ).rejects.toThrow(/rate limit/i)
  })
  
  test('Exchanges public token for access token', async () => {
    nock('https://sandbox.plaid.com')
      .post('/item/public_token/exchange')
      .reply(200, {
        access_token: 'access-test-token',
        item_id: 'item-123'
      })
    
    const result = await plaidService.exchangePublicToken('public-token')
    
    expect(result.access_token).toBe('access-test-token')
    expect(result.item_id).toBe('item-123')
  })
})
```

#### Priority 2: OCR Fallback

**Create**: `__tests__/ocr/ocr-fallback.test.ts`
```typescript
import { smartScan } from '@/app/api/documents/smart-scan/route'
import nock from 'nock'

describe('OCR Fallback Chain', () => {
  test('Tries OpenAI first', async () => {
    const openaiSpy = nock('https://api.openai.com')
      .post('/v1/chat/completions')
      .reply(200, {
        choices: [{ message: { content: 'Extracted text' } }]
      })
    
    const result = await smartScan(testImage)
    
    expect(openaiSpy.isDone()).toBe(true)
    expect(result.ocrMethod).toBe('OpenAI GPT-4 Vision')
  })
  
  test('Falls back to Google Vision on OpenAI failure', async () => {
    // OpenAI fails
    nock('https://api.openai.com')
      .post('/v1/chat/completions')
      .reply(429, { error: 'Rate limit exceeded' })
    
    // Google Vision succeeds
    const googleSpy = nock('https://vision.googleapis.com')
      .post('/v1/images:annotate')
      .reply(200, {
        responses: [{ fullTextAnnotation: { text: 'Extracted text' } }]
      })
    
    const result = await smartScan(testImage)
    
    expect(googleSpy.isDone()).toBe(true)
    expect(result.ocrMethod).toBe('Google Cloud Vision')
  })
  
  test('Falls back to Tesseract when all APIs fail', async () => {
    // Both APIs fail
    nock('https://api.openai.com').post('/v1/chat/completions').reply(500)
    nock('https://vision.googleapis.com').post('/v1/images:annotate').reply(500)
    
    const result = await smartScan(testImage)
    
    expect(result.ocrMethod).toBe('Tesseract.js')
    expect(result.extractedText).toBeTruthy()
  })
})
```

**⏰ Time Check**: End of Day 5 - Should have 35+ tests passing

---

### Day 6-7: Weekend - E2E Critical Paths

#### Priority 1: Auth E2E

**Create**: `e2e/critical-auth-flow.spec.ts`
```typescript
import { test, expect } from '@playwright/test'

test.describe('Critical Auth Flows', () => {
  test('Complete signup to dashboard flow', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Click sign up
    await page.click('text=Sign Up')
    
    // Fill form
    await page.fill('[name="email"]', 'new@test.com')
    await page.fill('[name="password"]', 'TestPassword123!')
    
    // Submit
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/')
    
    // Should show user email
    await expect(page.locator('text=new@test.com')).toBeVisible()
  })
  
  test('Session persists across tabs', async ({ context }) => {
    const page1 = await context.newPage()
    await page1.goto('/auth/signin')
    await page1.fill('[name="email"]', 'test@example.com')
    await page1.fill('[name="password"]', 'password')
    await page1.click('button[type="submit"]')
    
    await expect(page1).toHaveURL('/')
    
    // Open new tab
    const page2 = await context.newPage()
    await page2.goto('/')
    
    // Should be authenticated (no redirect)
    await expect(page2).toHaveURL('/')
    await expect(page2.locator('text=test@example.com')).toBeVisible()
  })
})
```

#### Priority 2: Data Flow E2E

**Create**: `e2e/critical-data-flow.spec.ts`
```typescript
test.describe('Critical Data Flows', () => {
  test('Add entry -> See in list -> Realtime update', async ({ context }) => {
    const page1 = await context.newPage()
    await page1.goto('/')
    await signIn(page1)
    
    // Navigate to health domain
    await page1.goto('/domains/health')
    
    // Add entry
    await page1.click('text=Add New')
    await page1.fill('[name="title"]', 'Test Medical Record')
    await page1.click('text=Save')
    
    // Should appear in list
    await expect(page1.locator('text=Test Medical Record')).toBeVisible()
    
    // Open second tab
    const page2 = await context.newPage()
    await page2.goto('/domains/health')
    
    // Wait for realtime sync
    await page2.waitForTimeout(2000)
    
    // Should see entry in second tab (realtime)
    await expect(page2.locator('text=Test Medical Record')).toBeVisible()
  })
})
```

**⏰ Time Check**: End of Day 7 - Should have 45+ tests passing

---

## ✅ Success Criteria

### By End of Week 1:
- [ ] 45+ tests passing
- [ ] 0 critical security gaps
- [ ] RLS tests confirming data isolation
- [ ] Realtime sync tests confirming consistency
- [ ] Mock infrastructure in place
- [ ] CI/CD pipeline running tests

### Test Coverage:
- [ ] Auth: >80% coverage
- [ ] Realtime: >70% coverage  
- [ ] Data Provider: >60% coverage
- [ ] API Routes: >50% coverage

---

## 🚨 Red Flags - Stop and Fix

If you encounter these during testing:

1. **User A can see User B's data** → CRITICAL RLS bug, stop all work
2. **Realtime subscription memory leak** → Fix immediately
3. **IDB cache corrupts data** → Investigate before continuing
4. **Auth session not persisting** → Block all other tests

---

## 📊 Daily Progress Tracking

### Template:
```
## Day X Progress

### Tests Added: X
### Tests Passing: Y
### Tests Failing: Z

### Bugs Found:
1. [BUG-001] Description
2. [BUG-002] Description

### Next Steps:
- [ ] Fix failing test Z
- [ ] Add missing coverage for Y
- [ ] Review bug BUG-001
```

---

## 🛠️ Common Issues & Solutions

### Issue 1: Mock Not Working
**Solution**: Ensure mock is imported before component
```typescript
jest.mock('@supabase/auth-helpers-nextjs')
import { MyComponent } from '@/components/MyComponent'
```

### Issue 2: Async Test Timing Out
**Solution**: Increase timeout or fix await
```typescript
test('async test', async () => {
  // ...
}, 10000) // 10 second timeout
```

### Issue 3: Flaky Realtime Test
**Solution**: Use `waitFor` instead of fixed timeout
```typescript
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument()
}, { timeout: 5000 })
```

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/docs/intro)
- [MSW (Mock Service Worker)](https://mswjs.io/docs/)

---

## 🎯 Next Week Goals

After completing Week 1, focus on:

1. **Domain Logic Tests**: Financial calculations, health metrics
2. **Notification System**: Generation, scheduling, delivery
3. **Document Processing**: OCR, classification, extraction
4. **Voice AI**: VAPI webhooks, function calling
5. **Google Integrations**: Calendar sync, Drive uploads

---

*Start small. Build confidence. Test critical paths first. Ship with confidence!*



