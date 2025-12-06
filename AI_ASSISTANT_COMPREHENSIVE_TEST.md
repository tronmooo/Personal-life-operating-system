# 🧪 AI Assistant Comprehensive Domain Test Plan

## Test Objective
Verify that the AI assistant creates actual CRUD entries in the `domain_entries` table for all 21 supported domains when users issue voice/text commands.

## 21 Supported Domains

### ✅ Test Status Legend
- ⏳ **Not Tested Yet**
- ✅ **Passing** - Creates proper domain_entries
- ❌ **Failing** - Not creating entries or errors
- ⚠️ **Partial** - Some commands work, others don't

---

## 1. HEALTH Domain ⏳

**Purpose:** Track vital signs, measurements, symptoms, medications

**Test Commands:**
```
"I weigh 175 pounds"
"my weight is 180"
"blood pressure 120 over 80"
"heart rate is 72 bpm"
"weigh 175 and heart rate 72"
"temperature 98.6"
"slept 8 hours"
"walked 10000 steps"
```

**Expected Result:**
- Creates separate entries in `domain_entries` for each vital
- Domain: `health`
- Metadata contains: `logType`, `weight`, `heartRate`, `systolic`, `diastolic`, `temperature`, `sleepHours`, `steps`
- Visible in `/domains/health` → Vitals & Labs tab

**Verification Query:**
```sql
SELECT * FROM domain_entries 
WHERE domain = 'health' 
AND user_id = '<user_id>'
ORDER BY created_at DESC;
```

---

## 2. FITNESS Domain ⏳

**Purpose:** Track workouts, exercises, activities

**Test Commands:**
```
"walked 30 minutes"
"ran 45 minutes"
"30 minute cardio workout"
"did yoga for 20 minutes"
"lifted weights for 1 hour"
"cycled 15 miles"
"swam for 40 minutes"
```

**Expected Result:**
- Creates entries in `domain_entries`
- Domain: `fitness`
- Metadata: `{ type: "workout", exercise: "walking", duration: 30 }`
- Title: `"30 min walking"`
- Visible in `/domains/fitness` → Activity History tab

---

## 3. NUTRITION Domain ⏳

**Purpose:** Track meals, water, calories, macros

**Test Commands:**
```
"drank 16 ounces of water"
"drank 32 oz water"
"ate chicken salad for lunch 450 calories"
"had breakfast 600 calories"
"protein shake 200 calories 30g protein"
```

**Expected Result:**
- Domain: `nutrition`
- Water entries: `{ type: "water", value: 16, unit: "oz" }`
- Meal entries: `{ type: "meal", description: "chicken salad", calories: 450 }`

---

## 4. FINANCIAL Domain ⏳

**Purpose:** Track expenses, income, transactions

**Test Commands:**
```
"spent $35 on groceries"
"spent $50 at Target"
"paid $120 for utilities"
"earned $2000 from freelance work"
"income $5000"
"expense $25 coffee"
```

**Expected Result:**
- Domain: `financial`
- Expense: `{ type: "expense", amount: 35, description: "groceries" }`
- Income: `{ type: "income", amount: 2000, description: "freelance work" }`
- Title: `"$35 - groceries"` or `"Income: $2000"`

---

## 5. VEHICLES Domain ⏳

**Purpose:** Track mileage, fuel, maintenance, repairs

**Test Commands:**
```
"oil change $120 today"
"car maintenance $85"
"filled up gas $45"
"current mileage is 52000"
"tire rotation $60"
"car wash $25"
"registration fee $150"
"car insurance payment $200"
```

**Expected Result:**
- Domain: `vehicles`
- Maintenance: `{ type: "maintenance", serviceName: "oil change", amount: 120 }`
- Fuel: `{ type: "cost", costType: "fuel", amount: 45 }`
- Mileage: `{ type: "mileage_update", currentMileage: 52000 }`

---

## 6. PROPERTY Domain ⏳

**Purpose:** Track home value, mortgage, property tax

**Test Commands:**
```
"home value is $450000"
"mortgage payment $2500"
"property tax $8000 annual"
"HOA fee $300 monthly"
```

**Expected Result:**
- Domain: `property`
- Home value: `{ type: "home_value", value: 450000 }`
- Mortgage: `{ type: "mortgage_payment", amount: 2500 }`

---

## 7. HOME Domain ⏳

**Purpose:** Track home maintenance, utilities, repairs

**Test Commands:**
```
"electric bill $150"
"water bill $60"
"replaced HVAC filter $30"
"plumber visit $200"
```

**Expected Result:**
- Domain: `home`
- Utility: `{ type: "utility", utilityType: "electric", amount: 150 }`
- Repair: `{ type: "repair", description: "plumber visit", cost: 200 }`

---

## 8. APPLIANCES Domain ⏳

**Purpose:** Track appliance purchases, warranties, repairs

**Test Commands:**
```
"bought new refrigerator $1500"
"washing machine repair $120"
"dishwasher warranty expires 2026"
```

**Expected Result:**
- Domain: `appliances`
- Purchase: `{ type: "purchase", appliance: "refrigerator", cost: 1500 }`
- Repair: `{ type: "repair", appliance: "washing machine", cost: 120 }`

---

## 9. PETS Domain ⏳

**Purpose:** Track pet care, vet visits, food, grooming

**Test Commands:**
```
"fed Buddy at 8am"
"vet appointment tomorrow at 2pm $150"
"bought dog food $45"
"grooming appointment $80"
"gave Max his vaccine"
```

**Expected Result:**
- Domain: `pets`
- Feeding: `{ type: "feeding", petName: "Buddy", time: "8am" }`
- Vet: `{ type: "vet_appointment", time: "2pm", cost: 150 }`

---

## 10. MINDFULNESS Domain ⏳

**Purpose:** Track meditation, mood, stress, journaling

**Test Commands:**
```
"meditated for 15 minutes"
"mood is happy"
"stress level 7 out of 10"
"did breathing exercises 10 minutes"
"gratitude journal entry"
```

**Expected Result:**
- Domain: `mindfulness`
- Meditation: `{ type: "meditation", duration: 15 }`
- Mood: `{ type: "mood_checkin", mood: "happy" }`
- Stress: `{ type: "stress_level", level: 7 }`

---

## 11. RELATIONSHIPS Domain ⏳

**Purpose:** Track contacts, birthdays, gifts, interactions

**Test Commands:**
```
"called mom"
"texted John"
"met with Sarah"
"John's birthday is March 15"
"anniversary April 10"
"bought gift for Amy $50"
```

**Expected Result:**
- Domain: `relationships`
- Contact: `{ type: "interaction", person: "mom", method: "call" }`
- Birthday: `{ type: "birthday", personName: "John", month: "March", day: 15 }`

---

## 12. CAREER Domain ⏳

**Purpose:** Track salary, interviews, work hours, certifications

**Test Commands:**
```
"interview at Amazon tomorrow"
"interview with Google next week"
"salary is $120000 per year"
"worked 8 hours today"
"got promoted to Senior Engineer"
"earned AWS certification"
"bonus $5000"
```

**Expected Result:**
- Domain: `career`
- Interview: `{ type: "interview", company: "Amazon", date: "tomorrow" }`
- Salary: `{ type: "salary", amount: 120000, frequency: "year" }`
- Certification: `{ type: "certification", name: "AWS" }`

---

## 13. EDUCATION Domain ⏳

**Purpose:** Track courses, grades, study time, tuition

**Test Commands:**
```
"enrolled in Python course"
"studied for 3 hours"
"got an A in calculus"
"paid tuition $5000"
"completed 15 credits"
```

**Expected Result:**
- Domain: `education`
- Course: `{ type: "course", name: "Python course", status: "enrolled" }`
- Study: `{ type: "study_time", hours: 3 }`
- Grade: `{ type: "grade", grade: "A", subject: "calculus" }`

---

## 14. LEGAL Domain ⏳

**Purpose:** Track legal documents, licenses, fees

**Test Commands:**
```
"signed lease agreement"
"legal consultation $300"
"driver's license expires 2028"
"passport expires 2030"
```

**Expected Result:**
- Domain: `legal`
- Document: `{ type: "document", documentType: "lease agreement" }`
- Fee: `{ type: "legal_fee", serviceType: "consultation", amount: 300 }`
- License: `{ type: "license", licenseType: "driver's", expiryYear: 2028 }`

---

## 15. INSURANCE Domain ⏳

**Purpose:** Track insurance premiums, claims, coverage

**Test Commands:**
```
"health insurance premium $400 monthly"
"filed insurance claim $2000"
"car insurance $150 monthly"
"life insurance coverage $500000"
```

**Expected Result:**
- Domain: `insurance`
- Premium: `{ type: "premium", insuranceType: "health", amount: 400, frequency: "monthly" }`
- Claim: `{ type: "claim", amount: 2000, status: "filed" }`

---

## 16. TRAVEL Domain ⏳

**Purpose:** Track flights, hotels, passport, airline miles

**Test Commands:**
```
"flight to Paris $850"
"hotel in London 5 nights $600"
"passport expires 2030"
"earned 5000 airline miles"
"trip to Tokyo next month"
```

**Expected Result:**
- Domain: `travel`
- Flight: `{ type: "flight", destination: "Paris", cost: 850 }`
- Accommodation: `{ type: "accommodation", location: "London", nights: 5, cost: 600 }`
- Miles: `{ type: "airline_miles", miles: 5000, action: "earned" }`

---

## 17. HOBBIES Domain ⏳

**Purpose:** Track music, art, reading, equipment

**Test Commands:**
```
"played guitar for 30 minutes"
"painted for 2 hours"
"read 50 pages"
"bought new camera $1200"
```

**Expected Result:**
- Domain: `hobbies`
- Music: `{ type: "music", instrument: "guitar", duration: 30 }`
- Art: `{ type: "art", activityType: "painting", duration: 120 }`
- Reading: `{ type: "reading", amount: 50, unit: "pages" }`

---

## 18. COLLECTIBLES Domain ⏳

**Purpose:** Track collectible purchases, valuations

**Test Commands:**
```
"bought rare coin $500"
"comic book collection valued at $3000"
"trading card purchase $75"
```

**Expected Result:**
- Domain: `collectibles`
- Purchase: `{ type: "purchase", itemType: "rare coin", cost: 500 }`
- Valuation: `{ type: "valuation", value: 3000 }`

---

## 19. DIGITAL-LIFE Domain ⏳

**Purpose:** Track subscriptions, domains, cloud storage

**Test Commands:**
```
"Netflix subscription $15 monthly"
"domain mywebsite.com expires 2025"
"upgraded cloud storage to 2TB"
"Spotify premium $10 per month"
```

**Expected Result:**
- Domain: `digital-life`
- Subscription: `{ type: "subscription", service: "Netflix", amount: 15, frequency: "monthly" }`
- Domain: `{ type: "domain", domainName: "mywebsite.com", expiryYear: 2025 }`

---

## 20. TASKS Domain ⏳

**Purpose:** Track to-do items, task completion

**Test Commands:**
```
"add task buy milk"
"add task call dentist"
"add task finish report"
"task buy groceries"
```

**Expected Result:**
- Domain: `tasks`
- Task: `{ type: "task", title: "buy milk", completed: false }`

**Note:** Tasks may use a separate `tasks` table instead of `domain_entries`

---

## 21. GOALS Domain ⏳

**Purpose:** Track goals, progress, milestones

**Test Commands:**
```
"goal to lose 10 pounds"
"goal to launch product"
"goal progress 50%"
"milestone reached project complete"
```

**Expected Result:**
- Domain: `goals`
- Goal: `{ type: "goal", description: "lose 10 pounds" }`
- Progress: `{ type: "goal_progress", progress: 50 }`
- Milestone: `{ type: "milestone", description: "project complete" }`

---

## Testing Procedure

### Prerequisites
1. Start dev server: `npm run dev`
2. Open browser console (F12 / Cmd+Option+I)
3. Login to the app
4. Open Network tab to monitor API calls

### Test Steps for Each Domain

1. **Click Purple AI Button** (bottom right of page)
2. **Send test command** from the list above
3. **Check Console Logs** for:
   ```
   🤖 GPT-4 response: { isCommand: true, domain: "...", ... }
   💾 [SAVE START] Domain: ...
   📝 Inserting ... entry: { ... }
   ✅ [SAVE SUCCESS] Saved new entry to domain_entries! ID: xxx
   ```

4. **Verify in Database** (Supabase):
   - Go to Supabase Dashboard
   - Table Editor → `domain_entries`
   - Filter: `domain = '<domain_name>'`
   - Check if row was created with correct metadata

5. **Verify in UI** (Domain Pages):
   - Navigate to `/domains/<domain_id>`
   - Check if entry appears in the appropriate tab
   - Verify it can be edited/deleted (CRUD operations)

6. **Update Status** in this document (⏳ → ✅ or ❌)

---

## Common Issues & Solutions

### Issue 1: No console logs appearing
**Solution:** Check if OPENAI_API_KEY is configured in `.env.local`

### Issue 2: `isCommand: false` for valid commands
**Solution:** GPT-4 may be misclassifying. Check the prompt in `intelligentCommandParser`

### Issue 3: Data saved but not visible in UI
**Solution:** 
- Check if DataProvider is reloading after save
- Verify `ai-assistant-saved` event is being dispatched
- Check domain page filtering logic

### Issue 4: Database insert errors
**Solution:**
- Check RLS policies on `domain_entries` table
- Verify user is authenticated
- Check Supabase logs for detailed error messages

---

## Automated Test Script

See `test-ai-assistant-domains.ts` for automated testing script that:
1. Sends commands for each domain
2. Verifies database entries
3. Generates a test report
4. Flags any failures

---

## Success Criteria

✅ **All 21 domains tested**
✅ **90%+ commands create proper domain_entries**
✅ **Entries visible in respective domain pages**
✅ **CRUD operations work (Create, Read, Update, Delete)**
✅ **No console errors**
✅ **Proper metadata structure for each domain**

---

## Next Steps After Testing

1. **Fix any failing domains** - Update AI prompt or save logic
2. **Document edge cases** - Commands that don't work as expected
3. **Improve UI filtering** - Ensure all entry types display correctly
4. **Add more test commands** - Cover additional use cases
5. **Create E2E tests** - Playwright tests for critical flows


