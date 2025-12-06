# LifeHub Comprehensive Testing Guide

Complete testing documentation for the LifeHub application covering all automated tests.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Categories](#test-categories)
5. [Writing New Tests](#writing-new-tests)
6. [Test Coverage](#test-coverage)
7. [Troubleshooting](#troubleshooting)

## Overview

LifeHub has a comprehensive test suite covering:
- **Unit Tests**: Testing individual functions, hooks, and components
- **Integration Tests**: Testing data flow and API integrations
- **E2E Tests**: Testing complete user workflows with Playwright
- **Component Tests**: Testing React components in isolation

### Test Framework Stack

- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Playwright**: End-to-end browser testing
- **TypeScript**: Type-safe tests

## Test Structure

```
new project/
├── __tests__/                    # Unit & integration tests
│   ├── api/                      # API route tests
│   │   ├── domain-entries.test.ts
│   │   └── ai-tools.test.ts
│   ├── components/               # Component tests
│   │   ├── domain-cards.test.tsx
│   │   └── domain-forms.test.tsx
│   ├── domains/                  # Domain-specific tests
│   │   └── all-domains-crud.test.ts
│   ├── hooks/                    # Hook tests
│   │   └── use-domain-entries.test.ts
│   ├── integration/              # Integration tests
│   │   └── data-flow.test.ts
│   └── integrations/             # External integration tests
│       └── voice-ai.test.ts
├── e2e/                          # E2E tests
│   ├── 01-command-center.spec.ts
│   ├── 02-domains.spec.ts
│   ├── 03-upload.spec.ts
│   ├── 04-ai-assistant.spec.ts
│   ├── 05-data-flow.spec.ts
│   ├── 06-analytics.spec.ts
│   ├── 07-tools.spec.ts
│   ├── 08-all-domains-crud.spec.ts
│   └── 09-dashboard-customization.spec.ts
└── scripts/
    ├── run-all-tests.sh          # Master test runner
    └── test-specific-domain.sh   # Domain-specific tests
```

## Running Tests

### Quick Commands

```bash
# Run all tests (recommended)
bash scripts/run-all-tests.sh

# Run unit tests only
npm test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui

# Run single E2E test file
npm run e2e -- e2e/05-data-flow.spec.ts

# Run single unit test file
npm test -- __tests__/hooks/use-domain-entries.test.ts

# Test specific domain
bash scripts/test-specific-domain.sh health

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Master Test Runner

The comprehensive test script runs all tests in order:

```bash
chmod +x scripts/run-all-tests.sh
bash scripts/run-all-tests.sh
```

This will:
1. ✅ Run linting
2. ✅ Run type checking
3. ✅ Run unit tests with coverage
4. ✅ Start dev server (if needed)
5. ✅ Run E2E tests
6. ✅ Generate summary report

## Test Categories

### 1. Domain CRUD Tests

**Location**: `__tests__/domains/all-domains-crud.test.ts`

Tests CRUD operations for all 21+ domains:
- ✅ Financial - Accounts, transactions, budgets
- ✅ Health - Medical records, medications, appointments
- ✅ Insurance - Policies, claims, documents
- ✅ Home - Property details, maintenance, bills
- ✅ Vehicles - Cars, maintenance, mileage
- ✅ Appliances - Appliances, warranties, service history
- ✅ Pets - Pet profiles, vaccinations, vet visits
- ✅ Relationships - Contacts, events, notes
- ✅ Digital - Subscriptions, accounts, domains
- ✅ Mindfulness - Meditation, journaling
- ✅ Fitness - Workouts, activities, tracking
- ✅ Nutrition - Meals, calories, macros
- ✅ Legal - Contracts, documents, dates
- ✅ Miscellaneous - Everything else

**What it tests**:
- Creating entries with domain-specific metadata
- Updating entries
- Validating metadata structure
- Complex nested metadata handling

**Run specific domain tests**:
```bash
bash scripts/test-specific-domain.sh financial
bash scripts/test-specific-domain.sh health
bash scripts/test-specific-domain.sh vehicles
```

### 2. Hook Tests

**Location**: `__tests__/hooks/use-domain-entries.test.ts`

Tests the `useDomainEntries` hook:
- ✅ List domain entries (all or filtered)
- ✅ Create new entries with metadata
- ✅ Update existing entries
- ✅ Delete entries
- ✅ Entry normalization
- ✅ Error handling (auth, database)
- ✅ Authentication checks
- ✅ User isolation (RLS)

**Example test**:
```typescript
it('should create entry and add to state', async () => {
  const { createEntry } = useDomainEntries('health')
  const result = await createEntry({
    title: 'Test Entry',
    domain: 'health',
    metadata: { recordType: 'Medical' }
  })
  expect(result.id).toBeTruthy()
})
```

### 3. API Route Tests

**Location**: `__tests__/api/`

Tests API endpoints:

#### `/api/domain-entries`
- ✅ GET - List entries (all or by domain)
- ✅ POST - Create new entry
- ✅ PUT - Update existing entry
- ✅ DELETE - Delete entry
- ✅ Authentication checks
- ✅ Validation errors

#### `/api/ai-tools/*`
- ✅ `/ocr` - OCR text extraction
- ✅ `/receipts` - Receipt parsing
- ✅ `/invoices` - Invoice generation
- ✅ `/budgets` - AI budget suggestions
- ✅ `/tax-documents` - Tax document processing
- ✅ `/analyze` - Financial analysis

### 4. Component Tests

**Location**: `__tests__/components/`

Tests React components:

#### Domain Cards (`domain-cards.test.tsx`)
- ✅ Health card displays data count
- ✅ Financial card shows balance
- ✅ Vehicle card lists vehicles
- ✅ Insurance card shows policies
- ✅ Pet card displays pets
- ✅ Home card shows property info
- ✅ Card interactions (click, navigate)

#### Domain Forms (`domain-forms.test.tsx`)
- ✅ Form field rendering
- ✅ Field validation (required, format)
- ✅ Form submission
- ✅ Dynamic field visibility
- ✅ Error handling
- ✅ Currency/number formatting
- ✅ Date validation

### 5. Integration Tests

**Location**: `__tests__/integration/data-flow.test.ts`

Tests complete data flow:

#### Frontend → Supabase Flow
- ✅ Create entry syncs to Supabase
- ✅ Update entry syncs to Supabase
- ✅ Delete entry from Supabase
- ✅ Authentication required for all operations

#### IndexedDB Caching
- ✅ Cache data on fetch
- ✅ Read from cache first (offline-first)
- ✅ Clear cache on logout
- ✅ Cache invalidation

#### Realtime Sync
- ✅ Handle INSERT events
- ✅ Handle UPDATE events
- ✅ Handle DELETE events
- ✅ Update local state automatically
- ✅ Debounced updates (prevent excessive reloads)

#### Offline/Online Sync
- ✅ Queue operations when offline
- ✅ Sync queued operations when online
- ✅ Conflict resolution
- ✅ Optimistic updates with rollback

### 6. Voice AI Tests

**Location**: `__tests__/integrations/voice-ai.test.ts`

Tests VAPI integration:

#### Webhook Handling
- ✅ call-started event
- ✅ call-ended event
- ✅ function-call event
- ✅ Event parsing

#### Voice Command Execution
- ✅ Add entry commands
- ✅ Query commands
- ✅ Update commands
- ✅ Delete commands
- ✅ Command validation

#### User Context
- ✅ Provide user context to VAPI
- ✅ Include recent activity
- ✅ Include user preferences
- ✅ Include active domains

#### Call History
- ✅ Save call history to Supabase
- ✅ Retrieve call history
- ✅ Store transcripts
- ✅ Store summaries

#### Voice Command Parser
- ✅ Parse add commands
- ✅ Parse queries
- ✅ Parse updates
- ✅ Handle ambiguous commands

### 7. E2E Tests

**Location**: `e2e/`

End-to-end user workflow tests:

#### Existing E2E Tests
- ✅ `01-command-center.spec.ts` - Dashboard loading and navigation
- ✅ `02-domains.spec.ts` - Domain page functionality
- ✅ `03-upload.spec.ts` - Document upload and OCR
- ✅ `04-ai-assistant.spec.ts` - AI chat functionality
- ✅ `05-data-flow.spec.ts` - Data flow from domains to dashboard
- ✅ `06-analytics.spec.ts` - Analytics and visualizations
- ✅ `07-tools.spec.ts` - AI tools functionality

#### New E2E Tests

##### `08-all-domains-crud.spec.ts`
Complete CRUD cycle for each domain:
- ✅ Navigate to domain page
- ✅ Add new entry with form
- ✅ Verify entry appears in list
- ✅ Edit entry
- ✅ Verify changes saved
- ✅ Delete entry
- ✅ Verify entry removed
- ✅ Data appears in command center
- ✅ Bulk operations (add multiple entries)

**Test example**:
```typescript
test('should complete CRUD cycle for health domain', async ({ page }) => {
  await page.goto('/domains/health')
  await page.click('button:has-text("Add")')
  await page.fill('input[name="title"]', 'Test Entry')
  await page.click('button:has-text("Save")')
  // Verify entry appears...
})
```

##### `09-dashboard-customization.spec.ts`
Dashboard customization features:
- ✅ Load command center with cards
- ✅ Navigate to settings
- ✅ Customize card visibility (show/hide)
- ✅ Save and load custom layouts
- ✅ Customize card colors
- ✅ Select layout templates
- ✅ Export/import layouts
- ✅ Drag and drop card reordering
- ✅ Quick add widget
- ✅ Switch between dashboard views
- ✅ Filter dashboard cards

## Writing New Tests

### Unit Test Template

```typescript
/**
 * Feature Tests
 * Description of what's being tested
 */

import { functionToTest } from '@/lib/some-file'

describe('Feature Name', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Setup before each test
  })

  it('should do something specific', () => {
    // Arrange
    const input = 'test input'

    // Act
    const result = functionToTest(input)

    // Assert
    expect(result).toBe('expected output')
  })

  it('should handle errors', () => {
    expect(() => functionToTest(null)).toThrow()
  })
})
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  })

  test('should perform user action', async ({ page }) => {
    // Navigate
    await page.goto('/some-page')
    await page.waitForLoadState('networkidle')

    // Interact
    const button = page.locator('button:has-text("Click Me")')
    await button.click()
    await page.waitForTimeout(1000)

    // Assert
    await expect(page.locator('text=Success')).toBeVisible()
  })
})
```

### Integration Test Template

```typescript
describe('Integration: Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Supabase, etc.
  })

  it('should complete full workflow', async () => {
    // Test multiple components working together
    const result = await fullWorkflow()
    expect(result.success).toBeTruthy()
  })
})
```

## Test Coverage

### Current Coverage

Run `npm run test:coverage` to see detailed coverage report.

**Coverage Goals**:
- Hooks: > 90%
- Utilities: > 85%
- Components: > 70%
- API Routes: > 80%

### Viewing Coverage Report

After running tests with coverage:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Troubleshooting

### Common Issues

#### 1. E2E Tests Timeout

**Problem**: Tests timeout waiting for elements
```
Error: Timeout 30000ms exceeded
```

**Solutions**:
- Increase timeout: `await element.isVisible({ timeout: 60000 })`
- Check dev server: `curl http://localhost:3000`
- Wait for network: `await page.waitForLoadState('networkidle')`
- Add explicit waits: `await page.waitForTimeout(2000)`

#### 2. Supabase Mocking Issues

**Problem**: Tests fail due to Supabase connection
```
Error: Invalid Supabase URL
```

**Solutions**:
- Ensure mocks are set up in test files
- Check `jest.setup.ts` for global mocks
- Mock `createClientComponentClient` properly:
```typescript
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => mockClient)
}))
```

#### 3. Authentication Errors

**Problem**: Tests fail with auth errors
```
Error: Not authenticated
```

**Solutions**:
- Mock auth responses in tests
- Set up authenticated state in E2E global setup
- Check `.auth/storage-state.json` exists
- Mock `getUser()` to return test user

#### 4. IndexedDB Errors

**Problem**: IndexedDB not available in tests
```
Error: IDB is not defined
```

**Solutions**:
- Mock IDB in Jest setup
- Use `fake-indexeddb` package
- Ensure jsdom environment is set in jest.config.js

### Debug Mode

Run tests in debug mode:

```bash
# Jest debug
node --inspect-brk node_modules/.bin/jest --runInBand

# Playwright debug
npx playwright test --debug

# Playwright headed mode
npm run e2e -- --headed

# Playwright UI mode
npm run e2e:ui
```

## Best Practices

### 1. Test Naming
- Use descriptive test names: `should create health entry with valid metadata`
- Group related tests in `describe` blocks
- Use `it` for individual test cases
- Follow pattern: "should [expected behavior] when [condition]"

### 2. Test Independence
- Each test should be independent
- Use `beforeEach` to reset state
- Don't rely on test execution order
- Clean up test data in `afterEach`

### 3. Assertions
- Test one thing per test
- Use specific assertions
- Include error messages in assertions
- Prefer `toBe` over `toEqual` for primitives

### 4. Mocking
- Mock external dependencies
- Don't mock what you're testing
- Use realistic mock data
- Clear mocks in `beforeEach`

### 5. E2E Tests
- Test real user workflows
- Use data-testid for reliable selectors
- Handle loading states
- Clean up test data
- Use `waitForLoadState` and `waitForTimeout`

## Performance

### Speed Up Tests

1. **Run tests in parallel**:
   ```bash
   npm test -- --maxWorkers=4
   ```

2. **Run only changed tests**:
   ```bash
   npm test -- --onlyChanged
   ```

3. **Skip E2E tests during development**:
   ```bash
   npm test  # Only unit tests
   ```

4. **Run specific test file**:
   ```bash
   npm test -- __tests__/hooks/use-domain-entries.test.ts
   ```

## CI/CD Integration

Tests are designed to run in CI environments:

```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint:ci
      - run: npm test -- --coverage --ci
      - run: npm run build
      - run: npx playwright install --with-deps
      - run: npm run e2e
```

## Test Data Management

### Generate Test Data

```bash
# Seed database with test data
npm run seed-data
```

### Clean Test Data

```bash
# Clear all test data
# (Implementation depends on your setup)
```

### Use Test User

E2E tests use authenticated user from `.auth/storage-state.json`

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Quick Reference

### Run All Tests
```bash
bash scripts/run-all-tests.sh
```

### Test Specific Domain
```bash
bash scripts/test-specific-domain.sh health
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### E2E UI Mode
```bash
npm run e2e:ui
```

---

**Last Updated**: January 2025
**Test Coverage**: Comprehensive
**Status**: ✅ All test suites created
