# LifeHub Comprehensive QA & Testing Guide

**Status:** ✅ Complete
**Last Updated:** $(date)

## 🎯 Overview

This guide provides everything you need to test LifeHub comprehensively, ensuring all features work correctly with real data displayed on the frontend.

## 📦 What's Been Created

### 1. **Comprehensive Seed Data Generator** (`scripts/comprehensive-seed-data.ts`)
- Generates realistic sample data for **ALL 21+ domains**
- Creates:
  - Financial transactions, accounts, and budgets
  - Health vitals, medications, appointments, and workouts
  - Insurance policies across all types (health, auto, home, life, dental)
  - Vehicle profiles and maintenance records
  - Pet profiles, vaccinations, and expenses
  - Home property data and maintenance tasks
  - Education courses and certifications
  - Career employment and skills
  - Travel trips and bookings
  - Tasks, habits, and notifications
  - And 12 more domains!

**Total Records Generated:** 80+ entries across all domains

### 2. **Automated E2E Test Suite** (Playwright)
Comprehensive browser-based tests covering:

#### **Command Center Tests** (`e2e/01-command-center.spec.ts`)
- ✅ Dashboard loads without errors
- ✅ Financial metrics display (no zeros)
- ✅ Health metrics display
- ✅ Domain counts visible
- ✅ Tasks and habits sections
- ✅ Navigation functionality
- ✅ Page load performance (< 15s)
- ✅ Real data indicators

#### **Domain Pages Tests** (`e2e/02-domains.spec.ts`)
Tests **all major domains** (Financial, Health, Vehicles, Pets, Insurance, Home):
- ✅ Page loads correctly
- ✅ Entries display with data
- ✅ Back button works
- ✅ Tabs function properly
- ✅ Domain overview grid
- ✅ Entry counts on cards

#### **Upload Functionality Tests** (`e2e/03-upload.spec.ts`)
- ✅ Upload dialog opens
- ✅ File input available
- ✅ Accepts file selection
- ✅ AI extraction shows results
- ✅ Save/approve buttons work
- ✅ Camera capture option
- ✅ Dialog closes properly

#### **AI Assistant Tests** (`e2e/04-ai-assistant.spec.ts`)
- ✅ Opens from navigation
- ✅ Chat input field works
- ✅ Accepts and sends messages
- ✅ Shows responses
- ✅ Displays chat history
- ✅ Concierge functionality
- ✅ Voice input options
- ✅ Call history page

#### **API Endpoint Tests**
- ✅ AI chat endpoint
- ✅ Concierge endpoint
- ✅ VAPI webhook
- ✅ Document upload
- ✅ Smart-scan API

### 3. **QA Automation Script** (`scripts/run-comprehensive-qa.sh`)
One-command test runner that:
- Checks dev server status
- Runs TypeScript type checking
- Runs ESLint
- Runs Jest unit tests
- Runs Playwright E2E tests
- Generates detailed reports

### 4. **Repository Mapping** (Completed)
Full documentation of:
- **400+ Frontend Components** organized by domain
- **90+ Backend API Routes** with HTTP methods and purposes
- **50+ Database Tables** with schemas, indexes, and RLS policies

---

## 🚀 Quick Start (5 Steps)

### Step 1: Environment Setup

Ensure your `.env.local` file has all required credentials:

```bash
# Required for all features
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# For E2E tests
TEST_USER_EMAIL=your_test_email@example.com
TEST_USER_PASSWORD=your_test_password

# Optional: For full functionality
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
VAPI_API_KEY=your_vapi_key
# ... other API keys
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Development Server

```bash
npm run dev
```

**Keep this running in a separate terminal!**

### Step 4: Populate Test Data

Get your user ID after logging in to LifeHub:
1. Log in to your LifeHub account at http://localhost:3000
2. Open browser console (F12)
3. Run this command:
   ```javascript
   supabase.auth.getUser().then(({data}) => console.log(data.user.id))
   ```
4. Copy the UUID (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

Then generate comprehensive seed data:

```bash
./scripts/run-seed-data.sh <YOUR_USER_ID>
```

**Example:**
```bash
./scripts/run-seed-data.sh a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Expected Output:**
```
🚀 COMPREHENSIVE LIFEHUB TEST DATA GENERATOR
============================================================
📝 Target User ID: a1b2c3d4-...
✅ User verified: user@example.com

💰 Generating Financial Data...
  ✅ Created 14 financial entries

🏥 Generating Health Data...
  ✅ Created 10 health entries

🛡️  Generating Insurance Data...
  ✅ Created 5 insurance entries

...

📊 GENERATION SUMMARY
============================================================
  TOTAL RECORDS CREATED:     ✅ 85
  TOTAL ERRORS:              ✅ 0
============================================================

🎉 SUCCESS! All test data generated successfully!
```

### Step 5: Run Comprehensive QA Tests

```bash
./scripts/run-comprehensive-qa.sh
```

This will run all tests and generate a detailed report in `test-results/qa-report-*.md`.

---

## 📊 Test Results & Verification

### What to Check After Running Tests

#### 1. **Command Center (Homepage)**
Visit http://localhost:3000 and verify:
- [ ] Financial card shows **real dollar amounts** (not $0.00)
- [ ] Health card shows **vitals, workouts, or appointments**
- [ ] Insurance card shows **active policies**
- [ ] Vehicle card shows **vehicle data**
- [ ] Tasks section shows **your tasks** (3-5 items)
- [ ] Habits section shows **active habits** (4-5 items)
- [ ] All domain cards have **non-zero entry counts**

#### 2. **Domain Pages**
Click through each domain and verify data appears:

**Financial Domain** (`/domains/financial`):
- [ ] Accounts tab shows checking, savings, credit cards
- [ ] Transactions tab shows income and expenses
- [ ] Budget tab shows budgets (if enabled)

**Health Domain** (`/domains/health`):
- [ ] Metrics tab shows weight, BP, steps
- [ ] Appointments tab shows upcoming appointments
- [ ] Medications tab shows current medications

**Insurance Domain** (`/domains/insurance`):
- [ ] Policies tab shows 4-5 insurance policies
- [ ] Each policy shows provider, premium, expiry date

**Vehicles Domain** (`/domains/vehicles`):
- [ ] Shows vehicle profile (2020 Toyota Camry)
- [ ] Maintenance records visible
- [ ] Vehicle details complete

**Pets Domain** (`/domains/pets`):
- [ ] Pet profile shows (Max - Golden Retriever)
- [ ] Vaccination records visible
- [ ] Expenses tracked

#### 3. **AI Features**
Visit `/ai-assistant`:
- [ ] Chat interface loads
- [ ] Can type messages
- [ ] Send button works
- [ ] Shows responses (may be simulated if no API key)

Visit `/concierge`:
- [ ] Concierge interface loads
- [ ] Voice options available
- [ ] Call history page exists

#### 4. **Document Upload**
Test document upload functionality:
- [ ] Upload button accessible
- [ ] File picker opens
- [ ] Can select files
- [ ] Processing/scanning indicators appear
- [ ] Results show after upload

---

## 🧪 Running Tests Individually

### Run All E2E Tests
```bash
npm run e2e
```

### Run Specific Test File
```bash
# Command Center tests only
npm run e2e -- e2e/01-command-center.spec.ts

# Domains tests only
npm run e2e -- e2e/02-domains.spec.ts

# Upload tests only
npm run e2e -- e2e/03-upload.spec.ts

# AI Assistant tests only
npm run e2e -- e2e/04-ai-assistant.spec.ts
```

### Run Tests with UI (Interactive)
```bash
npm run e2e:ui
```

### Run Type Checking Only
```bash
npm run type-check
```

### Run Linting Only
```bash
npm run lint
```

### Run Jest Unit Tests
```bash
npm test
```

---

## 📁 Project Structure Overview

### Frontend Components (400+)
```
components/
├── dashboard/                  # Command Center, customizable layouts
│   ├── command-center.tsx
│   ├── customizable-dashboard.tsx
│   ├── domain-cards/          # Financial, Health, Insurance cards
│   └── notification-hub.tsx
├── health/                     # Health domain components
├── finance/                    # Finance domain components
├── insurance/                  # Insurance domain components
├── pets/                       # Pets domain components
├── ai-concierge/              # AI concierge widgets
├── tools/ai-tools/            # 15 AI-powered tools
└── ui/                        # ShadCN primitives (30 components)
```

### Backend API Routes (90+)
```
app/api/
├── domain-entries/            # CRUD for all domains
├── documents/                 # Upload, OCR, smart-scan
├── ai-tools/                  # OCR, receipts, invoices, budgets
├── calendar/                  # Google Calendar sync
├── gmail/                     # Email parsing
├── drive/                     # Google Drive operations
├── plaid/                     # Banking integration
├── vapi/                      # Voice AI webhooks
└── notifications/             # Notification generation
```

### Database Schema (50+ tables)
```
Supabase Tables:
├── domain_entries             # Central unified data model
├── user_settings              # User preferences
├── notifications              # User alerts
├── dashboard_layouts          # Custom dashboards
├── travel_trips               # Travel planning
├── relationships              # People tracking
├── linked_accounts            # Plaid banking
├── transactions               # Financial transactions
├── health_metrics             # Health tracking
└── ... 40+ more specialized tables
```

---

## 🔧 Troubleshooting

### Issue: Tests Fail with "No Data" Errors

**Solution:** Run the seed data script first:
```bash
./scripts/run-seed-data.sh <YOUR_USER_ID>
```

### Issue: "Dev Server Not Running" Error

**Solution:** Start the development server in a separate terminal:
```bash
npm run dev
```

### Issue: Authentication Errors in Tests

**Solution:** Update `.env.local` with valid test credentials:
```bash
TEST_USER_EMAIL=your_email@example.com
TEST_USER_PASSWORD=your_password
```

### Issue: Type Errors

**Solution:** Run type checking to see all errors:
```bash
npm run type-check
```

Fix errors one by one or suppress with `@ts-ignore` if necessary for quick testing.

### Issue: Database Connection Errors

**Solution:** Verify Supabase credentials:
1. Check `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
3. Check `SUPABASE_SERVICE_ROLE_KEY` is correct (for seed data)

### Issue: Playwright Tests Timeout

**Solution:** Increase timeout in specific tests or globally:
```typescript
// In test file
test.setTimeout(60000) // 60 seconds

// Or in playwright.config.ts
timeout: 30000
```

---

## 📈 Performance Benchmarks

### Expected Load Times
- **Command Center:** < 15 seconds (with network loading)
- **Domain Pages:** < 10 seconds
- **API Endpoints:** < 3 seconds response time
- **Database Queries:** < 1 second with proper indexing

### Optimization Checklist
- ✅ Database indexes on `user_id`, `domain`, `created_at`
- ✅ Supabase realtime debounced (250-500ms)
- ✅ IDB cache for instant first load
- ✅ Lazy loading for heavy components
- ✅ Selective column queries (no `SELECT *`)

---

## 🎯 Test Coverage Summary

| Category | Tests | Status |
|----------|-------|--------|
| Command Center Metrics | 8 tests | ✅ Complete |
| Domain Pages (6 domains) | 24 tests | ✅ Complete |
| AI Assistant & Concierge | 10 tests | ✅ Complete |
| Upload Functionality | 8 tests | ✅ Complete |
| API Endpoints | 5 tests | ✅ Complete |
| **TOTAL** | **55+ E2E tests** | ✅ **Ready** |

---

## 🚦 Next Steps After QA

### If All Tests Pass ✅
1. **Review generated data:** Verify it looks realistic in the UI
2. **Test user flows:** Manually test critical user journeys
3. **Performance testing:** Check load times meet benchmarks
4. **Mobile testing:** Test responsive design on mobile
5. **Accessibility testing:** Check keyboard navigation and screen readers

### If Tests Fail ❌
1. **Review test output:** Check which specific tests failed
2. **Check logs:** Look at browser console and network errors
3. **Fix issues:** Address failed tests one by one
4. **Re-run tests:** Verify fixes with `npm run e2e`
5. **Update report:** Document any workarounds or known issues

---

## 📚 Additional Resources

### Documentation Files
- `CLAUDE.md` - Development instructions for Claude Code
- `QUICK_START.md` - Getting started guide
- `REPO_MAP.md` - Full repository structure
- `plan.md` - Development roadmap

### Test Files
- `e2e/*.spec.ts` - Playwright E2E tests
- `__tests__/**/*.test.tsx` - Jest unit tests
- `playwright.config.ts` - Playwright configuration
- `jest.config.js` - Jest configuration

### Scripts
- `scripts/comprehensive-seed-data.ts` - Seed data generator
- `scripts/run-seed-data.sh` - Seed data runner
- `scripts/run-comprehensive-qa.sh` - QA test runner

---

## 🎉 Success Criteria

Your LifeHub installation is **fully functional** when:

- ✅ All E2E tests pass
- ✅ Command Center shows real data (no zeros)
- ✅ All domain pages display entries
- ✅ Upload functionality works
- ✅ AI features are accessible
- ✅ No critical console errors
- ✅ Page load times < 15 seconds
- ✅ Database queries are fast
- ✅ All integrations connect (if API keys provided)

---

## 💬 Support

### Questions?
- Check `CLAUDE.md` for architecture details
- Review `QUICK_START.md` for setup steps
- See individual test files for test logic

### Reporting Issues
When reporting issues, include:
1. Test output (from QA script)
2. Browser console errors
3. Network tab errors
4. Steps to reproduce
5. Expected vs actual behavior

---

**Generated by LifeHub Comprehensive QA System**
**Test Suite Version:** 1.0
**Last Updated:** $(date)
