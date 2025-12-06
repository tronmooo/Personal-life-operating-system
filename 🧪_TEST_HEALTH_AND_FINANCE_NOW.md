# 🧪 Test Health & Finance - Quick Guide

## ⚡ 3-Minute Test

### Test 1: Health Metrics → Command Center

**Step 1:** Go to http://localhost:3000/health

**Step 2:** Click "Metrics" tab → Click "+ Add Metric"

**Step 3:** Add these metrics quickly:
```
Weight: 180 lbs
Steps: 10500
Heart Rate: 72 bpm
Blood Pressure: Systolic 120, Diastolic 80
Blood Glucose: 95 mg/dL
```

**Step 4:** Go to http://localhost:3000/ (Command Center)

**Step 5:** Scroll down to "Health & Wellness" card

**✅ EXPECTED RESULT:**
```
Health & Wellness
─────────────────────────
Steps Today    │ Weight
   10.5K       │  180 lbs

Heart Rate     │ Blood Pressure  
   72 bpm      │    120/80

Glucose        │ Active Meds
95 mg/dL       │      0
```

❌ **If you see `--` instead:** Health data not syncing (but it should work now!)

---

### Test 2: Add Investment Account

**Step 1:** Go to http://localhost:3000/finance

**Step 2:** Click "Accounts" tab

**Step 3:** Click "+ Add Account"

**Step 4:** Fill in:
```
Account Name: Fidelity 401k
Account Type: Investment
Current Balance: 50000
Institution: Fidelity Investments
```

**Step 5:** Click "Add Account"

**✅ EXPECTED RESULT:**
- Dialog closes
- Account appears in "Investments" section
- Net Worth increases by $50,000

---

### Test 3: Add Credit Card

**Step 1:** Still on Finance → Accounts tab

**Step 2:** Click "+ Add Account"

**Step 3:** Fill in:
```
Account Name: Chase Sapphire
Account Type: Credit Card
Current Balance: -2500
Institution: Chase
```

**Step 4:** Click "Add Account"

**✅ EXPECTED RESULT:**
- Dialog closes
- Account appears in "Credit Cards" section
- Net Worth decreases by $2,500 (liability)

---

### Test 4: Add Medications (for Active Meds KPI)

**Step 1:** Go to http://localhost:3000/health

**Step 2:** Click "Medications" tab

**Step 3:** Click "+ Add Medication"

**Step 4:** Add a few meds:
```
Medication 1: Multivitamin
Medication 2: Fish Oil
Medication 3: Vitamin D
```

**Step 5:** Go back to Command Center

**✅ EXPECTED RESULT:**
Health card now shows "Active Meds: 3"

---

### Test 5: Log a Workout (for Workouts This Week)

**Step 1:** Go to http://localhost:3000/health

**Step 2:** Click "Workouts" tab

**Step 3:** Click "+ Log Workout"

**Step 4:** Add today's workout:
```
Workout Type: Running
Duration: 30 minutes
Date: Today
```

**Step 5:** Go back to Command Center

**✅ EXPECTED RESULT:**
Health card footer shows "1 workouts this week"

---

## 🎯 All Tests Passed Checklist

After completing all tests, verify:

- ✅ Weight shows in Command Center (not `--`)
- ✅ Steps shows in Command Center (not `--`)
- ✅ Heart Rate shows in Command Center
- ✅ Blood Pressure shows in Command Center
- ✅ Glucose shows in Command Center
- ✅ Active Meds count shows correctly
- ✅ Workouts this week shows correctly
- ✅ Investment account saved successfully
- ✅ Credit card account saved successfully
- ✅ Net worth updated correctly

---

## 🐛 Troubleshooting

### If Health KPIs show `--`:

1. **Check browser console** (F12) for errors
2. **Hard refresh** (Cmd+Shift+R or Ctrl+Shift+R)
3. **Verify data exists:**
   - Open DevTools → Application → Local Storage
   - Find key: `lifehub-health-data`
   - Should see JSON with metrics array

### If Accounts Won't Save:

1. **Check browser console** for errors
2. **Try simpler account first** (Checking with $1000)
3. **Verify Finance context** is loaded
4. **Check localStorage** for `finance-accounts` key

### If Workouts/Meds Don't Show:

1. **Refresh Command Center** after adding data
2. **Check dates** - workouts must be this week
3. **Verify status** - medications must be active

---

## 📊 Visual Comparison

### Before Fix:
```
Health:        Steps: --    Weight: --
Finance:       ❌ Can't add investment/credit cards
```

### After Fix:
```
Health:        Steps: 10.5K  Weight: 180 lbs  ❤️ 72 bpm
               🩸 120/80      🍬 95 mg/dL      💊 3 meds
Finance:       ✅ All account types work!
```

---

## 🎉 Success!

If all tests pass, you now have:

1. **8 Health KPIs** tracking in Command Center
2. **All finance account types** working (investment, credit, etc.)
3. **Real-time sync** between domains and Command Center
4. **Complete health dashboard** with medications, workouts, metrics
5. **Complete finance system** with accounts, transactions, goals

**Ready to use!** 🚀



















