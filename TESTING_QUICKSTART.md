What the fuck is going on# LifeHub Testing Quick Start

**🎯 Goal:** Verify LifeHub works correctly with real data displayed on the frontend.

---

## ⚡ Quick Commands (Copy & Paste)

### 1. Start Dev Server (Terminal 1)
```bash
npm run dev
```
**Keep this running!**

### 2. Generate Sample Data (Terminal 2)
```bash
# First, get your user ID:
# 1. Open http://localhost:3000 and log in
# 2. Open browser console (F12) and run:
#    supabase.auth.getUser().then(({data}) => console.log(data.user.id))
# 3. Copy the UUID

# Then run:
./scripts/run-seed-data.sh <YOUR_USER_ID>
```

### 3. Run All Tests
```bash
./scripts/run-comprehensive-qa.sh
```

**Done!** Check the generated report in `test-results/qa-report-*.md`

---

## 🔍 What Gets Tested

### ✅ Command Center
- Dashboard loads without errors
- Financial metrics show **real values** (not $0)
- Health metrics display
- All domain cards visible
- Tasks and habits sections work

### ✅ All Domain Pages
Tests run for:
- Financial (accounts, transactions, budgets)
- Health (vitals, appointments, medications)
- Insurance (policies, claims)
- Vehicles (cars, maintenance)
- Pets (profiles, vaccinations)
- Home (property, maintenance)
- And 15 more domains!

### ✅ AI Features
- AI Assistant chat interface
- AI Concierge requests
- Voice options
- Call history

### ✅ Document Upload
- File selection works
- AI extraction processes files
- Save functionality
- Camera capture option

### ✅ API Endpoints
- All major API routes respond correctly
- No 404 or 500 errors
- Proper authentication

---

## 📊 Expected Results

After running tests, you should see:

```
🧪 LifeHub Comprehensive QA Test Suite
=======================================

✅ Dev server is running
✅ Type checking passed
✅ Linting passed
✅ Jest tests passed
✅ Playwright tests passed

=======================================
📋 Test Summary
=======================================
Type Check:    ✅ Passed
Linting:       ✅ Passed
Jest Tests:    ✅ Passed
E2E Tests:     ✅ Passed
=======================================

🎉 All tests passed!

📄 Full report available at: test-results/qa-report-20250125_143022.md
```

---

## 🎨 Visual Verification

After generating sample data, **manually verify** these pages look good:

### Homepage (Command Center)
http://localhost:3000
- [ ] Financial card shows real amounts (not $0.00)
- [ ] Health card shows vitals or workouts
- [ ] Insurance card shows policies
- [ ] All cards have data

### Financial Domain
http://localhost:3000/domains/financial
- [ ] Accounts tab shows 3-4 accounts
- [ ] Transactions tab shows 8+ transactions
- [ ] Non-zero balances everywhere

### Health Domain
http://localhost:3000/domains/health
- [ ] Metrics tab shows weight, BP, steps
- [ ] Appointments tab shows future appointments
- [ ] Medications tab shows daily meds

### Insurance Domain
http://localhost:3000/domains/insurance
- [ ] Policies tab shows 4-5 policies
- [ ] Each policy has provider, premium, expiry

---

## 🚨 Troubleshooting

### "Dev server not running"
**Fix:**
```bash
npm run dev
```

### "No data" or "0 entries" everywhere
**Fix:**
```bash
./scripts/run-seed-data.sh <YOUR_USER_ID>
```

### Tests timeout or hang
**Fix:**
```bash
# Kill any hung processes
pkill -f playwright
pkill -f node

# Restart and try again
npm run dev
./scripts/run-comprehensive-qa.sh
```

### Type errors
**Fix:**
```bash
npm run type-check
# Review errors and fix, or suppress with @ts-ignore for testing
```

---

## 🏃 Run Individual Tests

```bash
# Just Command Center tests
npm run e2e -- e2e/01-command-center.spec.ts

# Just Domain tests
npm run e2e -- e2e/02-domains.spec.ts

# Just Upload tests
npm run e2e -- e2e/03-upload.spec.ts

# Just AI Assistant tests
npm run e2e -- e2e/04-ai-assistant.spec.ts

# All tests with UI (interactive)
npm run e2e:ui

# Type checking only
npm run type-check

# Linting only
npm run lint

# Jest unit tests only
npm test
```

---

## 📈 Success Metrics

**All tests passing** means:
- ✅ 55+ E2E tests passed
- ✅ Zero TypeScript errors
- ✅ No critical ESLint errors
- ✅ All domains show data
- ✅ Command Center loads fast (< 15s)
- ✅ APIs respond correctly

---

## 📚 More Details

For comprehensive documentation, see:
- **`QA_COMPLETE_GUIDE.md`** - Full testing guide with troubleshooting
- **`CLAUDE.md`** - Development and architecture docs
- **`REPO_MAP.md`** - Full codebase structure

---

## 🎯 One-Line Summary

**Run this to test everything:**
```bash
npm run dev & sleep 5 && ./scripts/run-comprehensive-qa.sh
```

*(Starts dev server, waits 5 seconds, runs all tests)*

---

**Questions?** Check `QA_COMPLETE_GUIDE.md` for detailed explanations.

**Report Issues:** Include test output, console errors, and steps to reproduce.
