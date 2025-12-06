# 🤖 LifeHub Automated QA System

## Overview

This automated QA system generates realistic test data, runs comprehensive integration tests, and verifies all app features work correctly.

---

## 🚀 Quick Start

### Run All Tests (Automated)
```bash
chmod +x scripts/run-qa-tests.sh
./scripts/run-qa-tests.sh
```

This will:
1. ✅ Generate test data in Supabase
2. ✅ Start development server
3. ✅ Run all Playwright tests
4. ✅ Generate HTML report
5. ✅ Open report in browser

---

## 📋 Test Coverage

### 1. Command Center Tests (`e2e/01-command-center.spec.ts`)
- ✅ Dashboard loads without errors
- ✅ Financial metrics display (not zeros)
- ✅ Health metrics display (not zeros)
- ✅ Domain counts are accurate
- ✅ Tasks and habits sections work
- ✅ Navigation is functional
- ✅ Page loads within reasonable time
- ✅ Real data indicators present

### 2. Domain Pages Tests (`e2e/02-domains.spec.ts`)
- ✅ All domain pages load correctly
- ✅ Domain entries display properly
- ✅ Back buttons work
- ✅ Tabs are functional
- ✅ Navigation between domains works
- ✅ Domain overview grid displays
- ✅ Entry counts show on cards

**Tested Domains:**
- Financial
- Health
- Vehicles
- Pets
- Insurance
- Home

### 3. Upload Tests (`e2e/03-upload.spec.ts`)
- ✅ Upload dialog opens from navigation
- ✅ File input is present
- ✅ File selection works
- ✅ AI extraction shows results
- ✅ Save/approve button appears
- ✅ Camera capture option available
- ✅ Dialog can be closed
- ✅ Upload API endpoint works
- ✅ Smart-scan API endpoint works

### 4. AI Assistant Tests (`e2e/04-ai-assistant.spec.ts`)
- ✅ AI assistant opens from navigation
- ✅ AI assistant page loads
- ✅ Chat input field works
- ✅ Text input is accepted
- ✅ Send button is present
- ✅ Response appears after sending
- ✅ Chat history displays
- ✅ Concierge page loads
- ✅ Floating button opens concierge
- ✅ Voice input option available
- ✅ Call history page works
- ✅ Concierge requests are handled
- ✅ AI API endpoints respond

---

## 🔧 Manual Test Execution

### Generate Test Data Only
```bash
npx ts-node scripts/generate-test-data.ts
```

**Environment Variables Required:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TEST_USER_ID=your_test_user_id  # Optional, auto-generated if not set
```

### Run Specific Test Suite
```bash
# Command Center only
npx playwright test e2e/01-command-center.spec.ts

# Domains only
npx playwright test e2e/02-domains.spec.ts

# Upload only
npx playwright test e2e/03-upload.spec.ts

# AI Assistant only
npx playwright test e2e/04-ai-assistant.spec.ts
```

### Run Tests with UI
```bash
npx playwright test --ui
```

### Run Tests in Headed Mode
```bash
npx playwright test --headed
```

### Debug Specific Test
```bash
npx playwright test --debug e2e/01-command-center.spec.ts
```

---

## 📊 Test Data Generated

### Financial Domain (8 entries)
- Salary income
- Grocery expenses
- Gas expenses
- Freelance income
- Netflix subscription
- Electric bill
- Investment dividend
- Restaurant expense

### Health Domain (7 entries)
- Weight measurement
- Blood pressure reading
- Daily steps
- Vitamin D supplement
- Annual physical appointment
- Morning run workout
- Blood test results

### Vehicles Domain (3 entries)
- 2020 Toyota Camry
- Oil change maintenance
- Tire rotation

### Pets Domain (3 entries)
- Max (Golden Retriever)
- Rabies vaccination
- Monthly pet food expense

### Tasks (4 entries)
- Review Q4 financial reports
- Schedule annual checkup
- Renew vehicle registration
- Buy groceries (completed)

### Habits (4 entries)
- Morning meditation (12-day streak)
- Drink 8 glasses of water (7-day streak)
- Exercise (5-day streak)
- Read for 30 minutes (3-day streak)

**Total: 29 test entries across all domains**

---

## 🎯 Expected Test Results

### ✅ All Tests Should Pass If:
1. Supabase connection is working
2. `domain_entries` table exists
3. Test data was generated successfully
4. Development server is running
5. No critical console errors
6. All API endpoints respond

### ⚠️ Tests May Fail If:
1. Database connection issues
2. Missing environment variables
3. Server not running
4. Authentication required but not configured
5. API endpoints returning errors
6. Missing test fixtures

---

## 🐛 Troubleshooting

### Test Data Generation Fails

**Error: "Auth session missing"**
```bash
# Solution: Use service role key
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Error: "Table domain_entries does not exist"**
```bash
# Solution: Run migrations
npm run migrate
# Or manually create table using migration script
```

**Error: "TEST_USER_ID not found"**
```bash
# Solution: Create test user or use existing user ID
export TEST_USER_ID=$(uuidgen)
```

### Playwright Tests Fail

**Error: "Timeout waiting for element"**
- Increase timeout in test
- Check if element selector is correct
- Verify page is loading correctly

**Error: "Server not responding"**
```bash
# Solution: Ensure dev server is running
npm run dev
```

**Error: "Navigation failed"**
- Check for JavaScript errors in console
- Verify routes exist
- Check authentication requirements

### Upload Tests Fail

**Error: "Test fixture not found"**
```bash
# Solution: Create test fixtures directory
mkdir -p test-fixtures
# Test image will be auto-generated
```

**Error: "Upload API returns 401"**
- Authentication may be required
- Configure test user credentials
- Check API route authentication

---

## 📈 Test Reports

### HTML Report
After running tests, open:
```
playwright-report/index.html
```

**Contains:**
- ✅ Pass/fail status for each test
- ⏱️ Execution time
- 📸 Screenshots of failures
- 📹 Video recordings (if enabled)
- 📊 Test statistics

### Console Output
Real-time test execution with:
- ✅ Passed tests (green)
- ❌ Failed tests (red)
- ⏭️ Skipped tests (yellow)
- 📊 Summary statistics

### Screenshots
Failed tests automatically capture:
- Page screenshot at failure point
- Full page screenshot
- Element screenshot (if applicable)

Located in: `test-results/`

---

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: QA Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Generate test data
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: npx ts-node scripts/generate-test-data.ts
      
      - name: Run tests
        run: npx playwright test
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📝 Adding New Tests

### 1. Create Test File
```typescript
// e2e/05-my-feature.spec.ts
import { test, expect } from '@playwright/test'

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/my-feature')
    // ... test logic
  })
})
```

### 2. Add Test Data Generator
```typescript
// In scripts/generate-test-data.ts
async function generateMyFeatureData() {
  console.log('\n🎯 Generating My Feature Data...')
  // ... generation logic
}

// Add to main()
await generateMyFeatureData()
```

### 3. Update Documentation
- Add test description to this file
- Document expected data
- Note any special requirements

---

## 🎨 Best Practices

### Test Writing
1. ✅ Use descriptive test names
2. ✅ Test one thing per test
3. ✅ Use page object pattern for complex pages
4. ✅ Add appropriate waits and timeouts
5. ✅ Clean up test data after tests
6. ✅ Use data-testid attributes for stable selectors

### Test Data
1. ✅ Generate realistic data
2. ✅ Use consistent naming
3. ✅ Include edge cases
4. ✅ Clean up after tests
5. ✅ Use isolated test user

### Debugging
1. ✅ Use `--headed` to see browser
2. ✅ Use `--debug` to step through
3. ✅ Add `await page.pause()` for breakpoints
4. ✅ Check screenshots in test-results/
5. ✅ Review HTML report for details

---

## 📊 Success Metrics

### Target Pass Rate
- ✅ **100%** for critical paths
- ✅ **95%+** for all tests
- ✅ **< 30s** average test execution
- ✅ **< 5min** full suite execution

### Coverage Goals
- ✅ All major user flows
- ✅ All domain pages
- ✅ All API endpoints
- ✅ Upload functionality
- ✅ AI features
- ✅ Navigation
- ✅ Data display

---

## 🚀 Next Steps

### Immediate
1. Run full test suite
2. Review HTML report
3. Fix any failures
4. Verify test data in Supabase

### Short Term
1. Add more domain-specific tests
2. Test edge cases
3. Add performance tests
4. Set up CI/CD

### Long Term
1. Add visual regression tests
2. Add load testing
3. Add security tests
4. Add accessibility tests

---

## 📞 Support

### Common Issues
- Check `playwright-report/index.html` for details
- Review screenshots in `test-results/`
- Check console output for errors
- Verify environment variables

### Documentation
- Playwright: https://playwright.dev
- Testing Guide: `TESTING_GUIDE.md`
- Architecture: `CLAUDE.md`

---

**Last Updated**: October 26, 2025  
**Status**: ✅ **Fully Automated QA System Ready**





