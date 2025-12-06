# 🧪 AI Assistant Comprehensive Test Plan
## Testing All 21+ Domain Commands

**Last Updated:** November 18, 2025  
**Test Status:** In Progress 🟡

---

## 🎯 Objective

Test EVERY AI assistant command type across ALL domains to verify:
1. ✅ Data is saved to `domain_entries` table
2. ✅ Data appears in domain pages
3. ✅ Data can be **viewed, edited, and deleted** (CRUD)
4. ✅ Metadata structure is correct for each domain
5. ✅ Titles are auto-generated properly

---

## 📋 Test Matrix

### ✅ Fully Working Domains
These domains have been confirmed to work end-to-end:

| Domain | Test Commands | Save ✓ | View ✓ | Edit ✓ | Delete ✓ |
|--------|---------------|--------|--------|--------|----------|
| *None confirmed yet* | - | - | - | - | - |

### 🟡 Partially Working Domains
These save to database but may have display/CRUD issues:

| Domain | Test Commands | Issues |
|--------|---------------|--------|
| *TBD* | - | - |

### ❌ Not Working Domains  
These don't save or have critical errors:

| Domain | Test Commands | Issues |
|--------|---------------|--------|
| *TBD* | - | - |

---

## 🧪 Test Commands by Domain

### 1. **HEALTH** Domain
Test commands to try:

```
✅ Weight:
- "I weigh 175 pounds"
- "my weight is 180 lbs"

✅ Blood Pressure:
- "blood pressure 120 over 80"
- "bp is 130/85"

✅ Heart Rate:
- "heart rate is 72"
- "pulse is 68 bpm"

✅ Temperature:
- "temperature is 98.6"
- "temp 99.2 degrees"

✅ Sleep:
- "slept 8 hours"
- "got 7.5 hours of sleep"

✅ Steps:
- "walked 10000 steps"
- "took 8500 steps today"

✅ Mood:
- "feeling great"
- "mood is stressed"
```

**Expected Behavior:**
- Should create separate entries for each metric type
- Each entry should have proper `metadata.logType` (weight, blood_pressure, heart_rate, etc.)
- Should appear in Health domain → Vitals & Labs tab
- Should be editable/deletable

---

### 2. **FITNESS** Domain
Test commands:

```
✅ Workouts:
- "walked 30 minutes"
- "ran 45 minutes"
- "did 30 minute cardio workout"
- "cycled 20 miles"

✅ Strength Training:
- "did 3 pushups 15 reps"
- "bench press 5 sets 10 reps"

✅ Calories Burned:
- "burned 350 calories"
```

**Expected Behavior:**
- Should save with `type: "workout"` or `type: "strength"`
- Title should be "{duration} min {exercise}"
- Should appear in Fitness domain → Activity History tab
- Should be editable/deletable

---

### 3. **NUTRITION** Domain
Test commands:

```
✅ Water:
- "drank 20 oz water"
- "16 ounces of water"

✅ Meals:
- "ate chicken salad 450 calories"
- "had burger 800 cal"

✅ Macros:
- "ate 30g protein"
```

**Expected Behavior:**
- Water should have `type: "water"`, `calories: 0`
- Meals should have `type: "meal"`
- Should appear in Nutrition domain
- Should be editable/deletable

---

### 4. **FINANCIAL** Domain
Test commands:

```
✅ Expenses:
- "spent $35 on groceries"
- "paid $50 for dinner"
- "bought coffee $5"

✅ Income:
- "earned $1500 for freelance work"
- "received $200"
```

**Expected Behavior:**
- Should save with `type: "expense"` or `type: "income"`
- Title should be "$amount - description"
- Should appear in Financial domain → Transactions
- Should be editable/deletable

---

### 5. **VEHICLES** Domain
Test commands:

```
✅ Fuel:
- "filled up gas for $45"
- "got gas $50"

✅ Maintenance:
- "oil change $120 today"
- "tire rotation $80"
- "brake service $350"

✅ Mileage:
- "car has 50000 miles"
- "odometer at 75k miles"

✅ Registration:
- "registration expires June 2025"
- "dmv registration $150"

✅ Vehicle Purchase:
- "bought 2020 Honda Civic for $25000"
```

**Expected Behavior:**
- Different `type` for each (fuel_purchase, maintenance, mileage_update, registration)
- Should NOT go to financial domain (vehicle-related expenses stay in vehicles)
- Should appear in Vehicles domain
- Should be editable/deletable

---

### 6. **PROPERTY** Domain
Test commands:

```
✅ Home Value:
- "house worth $450000"
- "home value 450k"

✅ Mortgage:
- "mortgage payment $2500"

✅ Property Tax:
- "property tax $5000 annually"

✅ HOA:
- "hoa fee $200 per month"

✅ Square Footage:
- "house is 2500 square feet"

✅ Home Purchase:
- "bought house in 2018 for 400k"
```

**Expected Behavior:**
- Different `type` for each entry
- Should appear in Property domain
- Should be editable/deletable

---

### 7. **PETS** Domain
Test commands:

```
✅ Feeding:
- "fed the dog"
- "fed Max"

✅ Walks:
- "walked the dog 30 minutes"

✅ Vet Appointments:
- "vet appointment at 2pm"
- "vet appointment $150"

✅ Vaccinations:
- "rabies vaccine expires 2026"
```

**Expected Behavior:**
- Different `type` for each (feeding, walk, vet_appointment, vaccination)
- Should appear in Pets domain
- Should be editable/deletable

---

### 8. **CAREER** Domain
Test commands:

```
✅ Interviews:
- "interview at Amazon tomorrow"
- "interview with Google at 2pm"

✅ Salary:
- "salary $120000 per year"
- "hourly rate $50 per hour"

✅ Promotions:
- "promoted to Senior Engineer"
- "promotion to Manager $150000"

✅ Work Hours:
- "worked 8 hours today"

✅ Bonuses:
- "bonus $5000"

✅ Certifications:
- "got AWS certification"
```

**Expected Behavior:**
- Different `type` for each
- Interview should include company, date, time
- Should appear in Career domain
- Should be editable/deletable

---

### 9. **EDUCATION** Domain
Test commands:

```
✅ Study Sessions:
- "studied 2 hours for math"
- "studying 45 minutes biology"

✅ Courses:
- "enrolled in Python course"
- "taking Data Science class"
```

**Expected Behavior:**
- Should save with proper duration and subject
- Should appear in Education domain
- Should be editable/deletable

---

### 10. **RELATIONSHIPS** Domain
Test commands:

```
✅ Interactions:
- "called Mom"
- "texted Sarah"
- "met with John"
```

**Expected Behavior:**
- Should save interaction with person and method
- Should appear in Relationships domain
- Should be editable/deletable

---

### 11. **TRAVEL** Domain
Test commands:

```
✅ Trips:
- "planning trip to Paris"
- "booked vacation to Hawaii"

✅ Flights:
- "booked flight to New York"
```

**Expected Behavior:**
- Should save destination and status
- Should appear in Travel domain
- Should be editable/deletable

---

### 12. **MINDFULNESS** Domain
Test commands:

```
✅ Meditation:
- "meditated 20 minutes"
- "did breathing exercise 10 min"

✅ Mood Check-in:
- "feeling stressed"
- "mood is calm"

✅ Journaling:
- "journaled 15 minutes"
```

**Expected Behavior:**
- Should save with duration and type
- Should appear in Mindfulness domain
- Should be editable/deletable

---

### 13. **HOBBIES** Domain
Test commands:

```
✅ Activities:
- "played guitar 30 minutes"
- "practiced piano 45 min"
- "reading 1 hour"
```

**Expected Behavior:**
- Should save hobby with duration
- Should appear in Hobbies domain
- Should be editable/deletable

---

### 14. **INSURANCE** Domain
Test commands:

```
✅ Premium Payments:
- "paid $200 for health insurance"
- "paid auto insurance $150"
```

**Expected Behavior:**
- Should save with insurance type and amount
- Should appear in Insurance domain
- Should be editable/deletable

---

### 15. **LEGAL** Domain
Test commands:

```
✅ Document Signing:
- "signed lease agreement"
- "signing employment contract"
```

**Expected Behavior:**
- Should save document type
- Should appear in Legal domain
- Should be editable/deletable

---

### 16. **APPLIANCES** Domain
Test commands:

```
✅ Maintenance:
- "serviced the washer for $80"
- "repaired dishwasher $150"
```

**Expected Behavior:**
- Should save appliance and cost
- Should appear in Appliances domain
- Should be editable/deletable

---

### 17. **DIGITAL-LIFE** Domain
Test commands:

```
✅ Subscriptions:
- "subscribed to Netflix $15 per month"
- "signed up for Spotify $10/month"
```

**Expected Behavior:**
- Should save service and recurring cost
- Should appear in Digital-Life domain
- Should be editable/deletable

---

### 18. **HOME** Domain
Test commands:

```
✅ Utility Bills:
- "paid $120 for electricity bill"
- "paid water bill $45"
```

**Expected Behavior:**
- Should save utility type and amount
- Should appear in Home domain
- Should be editable/deletable

---

### 19. **GOALS** Domain
Test commands:

```
✅ Goal Setting:
- "goal to launch product"
- "goal progress 50%"
```

**Expected Behavior:**
- Should save goal description and progress
- Should appear in Goals domain
- Should be editable/deletable

---

### 20. **TASKS** Domain
Test commands:

```
✅ Add Tasks:
- "add task buy milk"
- "create task finish report"
```

**Expected Behavior:**
- Should save to `tasks` table (NOT domain_entries)
- Should appear in Tasks list
- Should be markable as complete/deletable

---

### 21. **HABITS** Domain
Test commands:

```
✅ Habit Completion:
- "completed my morning run habit"
- "did meditation habit"
```

**Expected Behavior:**
- Should log habit completion
- Should appear in Habits domain
- Should be editable/deletable

---

## 🔍 How to Test Each Domain

### Step 1: Open Console
Press **F12** (Windows/Linux) or **Cmd+Option+I** (Mac) to open browser console

### Step 2: Open AI Assistant
Click the **purple AI brain button** at bottom-right of any page

### Step 3: Send Test Command
Type one of the commands above (e.g., "I weigh 175 pounds")

### Step 4: Watch Console Logs
Look for these key logs:

```bash
✅ GOOD - Command was detected:
🧠 Using AI to analyze message...
✅ AI detected command and executed: save_weight
💾 [SAVE START] Domain: health, User: xxx
📝 Entry to save: {...}
✅ [SAVE SUCCESS] Saved new entry to domain_entries for health! ID: xxx
✅ Data was saved! Triggering reload...
```

```bash
❌ BAD - Command was NOT detected:
💬 AI said not a command, trying regex fallback...
💬 Definitely not a command, proceeding to conversational AI...
```

### Step 5: Navigate to Domain Page
1. Go to `/domains` or use Command Palette (Cmd+K)
2. Click on the domain you just tested (e.g., Health, Fitness, Vehicles)
3. Look for the entry you just created

### Step 6: Verify CRUD Operations
- ✅ **View**: Can you see the entry in the list?
- ✅ **Edit**: Click edit button - does it open a form with data?
- ✅ **Delete**: Click delete button - does it remove the entry?

---

## 📊 Test Results Template

For each domain, record:

```markdown
### [DOMAIN NAME]
**Test Date:** YYYY-MM-DD
**Test Command:** "exact command used"

**Console Logs:**
✅ Command detected as: save_[type]
✅ Saved to domain_entries with ID: xxx

**Domain Page:**
✅ Entry visible in domain page
✅ Title displayed correctly: "Auto-generated title"
✅ Metadata fields populated

**CRUD Operations:**
✅ View: Working
✅ Edit: Working
✅ Delete: Working

**Issues Found:** None / [describe any issues]

---
```

---

## 🚨 Common Issues to Watch For

### Issue 1: Command Not Detected
**Symptom:** Console shows "not a command"  
**Cause:** Regex pattern doesn't match or AI classifier failed  
**Fix:** Add pattern to `handleVoiceCommand()` or improve AI prompt

### Issue 2: Saves but Doesn't Appear in UI
**Symptom:** Success log in console, but not visible in domain page  
**Cause:** 
- Wrong metadata structure
- Domain page filtering too strict
- Missing realtime reload event
**Fix:** Check domain page filter logic

### Issue 3: Wrong Domain
**Symptom:** Data saved to wrong domain (e.g., vehicle expense → financial)  
**Cause:** AI routing logic or regex routing  
**Fix:** Adjust domain detection in `intelligentCommandParser()`

### Issue 4: Can't Edit/Delete
**Symptom:** Entry shows but buttons don't work  
**Cause:** Missing `id` field or wrong metadata structure  
**Fix:** Ensure `id` is included in insert payload

### Issue 5: Title Generation Broken
**Symptom:** Title shows as "Entry" or "undefined"  
**Cause:** Title generation logic missing for that entry type  
**Fix:** Add title case to `saveToSupabase()` function

---

## 🎯 Success Criteria

A domain is considered **FULLY WORKING** if:

1. ✅ AI assistant detects commands for that domain
2. ✅ Data saves to `domain_entries` with correct `domain` field
3. ✅ Data appears in the domain page UI
4. ✅ Title is auto-generated correctly
5. ✅ Metadata structure is correct
6. ✅ Entry can be viewed in detail
7. ✅ Entry can be edited
8. ✅ Entry can be deleted
9. ✅ No console errors during save/load/CRUD

---

## 📈 Progress Tracker

**Total Domains to Test:** 21  
**Domains Tested:** 0  
**Fully Working:** 0  
**Partially Working:** 0  
**Not Working:** 0  
**Not Yet Tested:** 21

---

## 🔧 Quick Fixes

### If a domain isn't saving:
1. Check `handleVoiceCommand()` has regex pattern
2. Check `intelligentCommandParser()` AI prompt includes domain
3. Check `saveToSupabase()` handles that entry type
4. Check database has proper RLS policies

### If a domain saves but doesn't show:
1. Check domain page filter logic
2. Check `useDomainCRUD` or `useData` hooks
3. Check `domain_entries_view` includes the entry
4. Check metadata structure matches domain page expectations

### If CRUD doesn't work:
1. Check `useDomainCRUD` hook is used (not legacy methods)
2. Check entry has proper `id` field
3. Check RLS policies allow UPDATE and DELETE
4. Check domain page has edit/delete buttons wired up

---

## 📝 Next Steps

1. **Run systematic tests** for all 21 domains
2. **Document results** in Test Results Template above
3. **Fix any broken domains** using Quick Fixes section
4. **Create summary report** of all working vs broken domains
5. **Update AI_CHAT_DATA_ENTRY_FIX.md** with comprehensive status

---

## 🎉 When Complete

You'll have:
- ✅ Confirmation that ALL domains work end-to-end
- ✅ CRUD functionality verified for each domain
- ✅ Documentation of any remaining issues
- ✅ Complete command reference for all domains
- ✅ Confidence that the AI assistant is production-ready

---

**Ready to start testing!** 🚀

