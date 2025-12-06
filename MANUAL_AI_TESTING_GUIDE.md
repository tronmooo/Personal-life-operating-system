# 🧪 Manual AI Assistant Testing Guide
## Step-by-Step Instructions for Testing All Domains

**Last Updated:** November 18, 2025

---

## 🎯 What We're Testing

We need to verify that when you use the AI assistant to log data:
1. ✅ The command is detected and processed
2. ✅ Data is saved to the `domain_entries` table in Supabase
3. ✅ Data appears in the correct domain page
4. ✅ You can **view, edit, and delete** the entry (full CRUD)

---

## 🚀 Quick Start (5 Minutes)

### Before You Begin:
1. Make sure dev server is running: `npm run dev`
2. Open http://localhost:3000 in your browser
3. Press **F12** (or **Cmd+Option+I** on Mac) to open Developer Console
4. Keep console open during all tests

---

## 📝 Testing Workflow

### For EACH Domain Test:

#### Step 1: Open AI Assistant
- Click the **purple AI brain button** (bottom-right corner)
- Or press **Cmd+K** and type "AI Assistant"

#### Step 2: Send Test Command
- Type one of the commands from the list below
- Press Enter or click Send

#### Step 3: Watch Console Output
Look for these logs:

```bash
✅ GOOD LOGS (Command Worked):
🧠 Using AI to analyze message...
✅ AI detected command and executed: save_[something]
💾 [SAVE START] Domain: [domain_name]
📝 Entry to save: {...}
✅ [SAVE SUCCESS] Saved new entry to domain_entries! ID: xxx
✅ Dispatched ai-assistant-saved event

❌ BAD LOGS (Command Failed):
💬 AI said not a command, trying regex fallback...
💬 Definitely not a command, proceeding to conversational AI...
(No save logs appear)
```

#### Step 4: Check Domain Page
1. Navigate to the domain page:
   - Press **Cmd+K** and search for domain name
   - Or go to `/domains` and click the domain
2. Look for your entry in the list
3. Verify the title and data look correct

#### Step 5: Test CRUD
- **View**: Click on the entry to see details
- **Edit**: Click edit button, modify a field, save
- **Delete**: Click delete button, confirm deletion

#### Step 6: Record Results
Use this template:

```
✅ [Domain Name] - [Command]
   - Command detected: YES/NO
   - Data saved: YES/NO
   - Visible in UI: YES/NO
   - CRUD works: YES/NO
   - Issues: [none or describe]
```

---

## 🧪 Test Commands by Domain

Copy and paste these commands directly into the AI assistant:

### 1. HEALTH Domain
```
I weigh 175 pounds
blood pressure 120 over 80
heart rate is 72
temperature is 98.6
slept 8 hours
took 10000 steps
feeling great
```

**Check:** Go to **Health domain** → **Vitals & Labs** tab

**Expected:** Each metric should appear as a separate entry with correct values

---

### 2. FITNESS Domain
```
walked 30 minutes
ran 45 minutes
did 30 minute cardio workout
cycled 20 miles
burned 350 calories
```

**Check:** Go to **Fitness Tracker** → **Activity History** tab

**Expected:** Each workout should show with duration and activity type

---

### 3. NUTRITION Domain
```
drank 20 oz water
drank 16 ounces of water
ate chicken salad 450 calories
ate 30g protein
```

**Check:** Go to **Nutrition domain**

**Expected:** Water and meals logged separately

---

### 4. FINANCIAL Domain
```
spent $35 on groceries
paid $50 for dinner
earned $1500 for freelance work
bought coffee $5
```

**Check:** Go to **Financial domain** → **Transactions** tab

**Expected:** Expenses and income listed with amounts and descriptions

---

### 5. VEHICLES Domain
```
oil change $120 today
filled up gas for $45
tire rotation $80
car has 50000 miles
brake service $350
```

**Check:** Go to **Vehicles domain** → **Maintenance** tab

**Expected:** Each service/expense logged (NOT in financial domain)

---

### 6. PROPERTY Domain
```
house worth $450000
mortgage payment $2500
property tax $5000 annually
hoa fee $200 per month
```

**Check:** Go to **Property domain**

**Expected:** Property data logged with correct amounts

---

### 7. PETS Domain
```
fed the dog
fed Max
walked the dog 30 minutes
vet appointment at 2pm
```

**Check:** Go to **Pets domain**

**Expected:** Pet activities logged with details

---

### 8. CAREER Domain
```
interview at Amazon tomorrow
interview with Google at 2pm
salary $120000 per year
promoted to Senior Engineer
worked 8 hours today
```

**Check:** Go to **Career domain**

**Expected:** Career events logged with company/role info

---

### 9. EDUCATION Domain
```
studied 2 hours for math
enrolled in Python course
studying 45 minutes biology
```

**Check:** Go to **Education domain**

**Expected:** Study sessions and courses logged

---

### 10. RELATIONSHIPS Domain
```
called Mom
texted Sarah
met with John
```

**Check:** Go to **Relationships domain**

**Expected:** Interactions logged with person and method

---

### 11. TRAVEL Domain
```
planning trip to Paris
booked vacation to Hawaii
booked flight to New York
```

**Check:** Go to **Travel domain**

**Expected:** Trips and flights logged with destinations

---

### 12. MINDFULNESS Domain
```
meditated 20 minutes
did breathing exercise 10 min
feeling stressed
journaled 15 minutes
```

**Check:** Go to **Mindfulness domain**

**Expected:** Meditation and mood logs

---

### 13. HOBBIES Domain
```
played guitar 30 minutes
practiced piano 45 min
reading 1 hour
```

**Check:** Go to **Hobbies domain**

**Expected:** Hobby activities with duration

---

### 14. INSURANCE Domain
```
paid $200 for health insurance
paid auto insurance $150
paid home insurance $100
```

**Check:** Go to **Insurance domain**

**Expected:** Premium payments logged by type

---

### 15. LEGAL Domain
```
signed lease agreement
signed employment contract
```

**Check:** Go to **Legal domain**

**Expected:** Document signings logged

---

### 16. APPLIANCES Domain
```
serviced the washer for $80
repaired dishwasher $150
fixed fridge $200
```

**Check:** Go to **Appliances domain**

**Expected:** Maintenance logged with appliance and cost

---

### 17. DIGITAL-LIFE Domain
```
subscribed to Netflix $15 per month
signed up for Spotify $10/month
```

**Check:** Go to **Digital-Life domain**

**Expected:** Subscriptions logged with recurring costs

---

### 18. HOME Domain
```
paid $120 for electricity bill
paid water bill $45
paid internet $80
```

**Check:** Go to **Home domain** → **Utilities** tab

**Expected:** Utility payments logged by type

---

### 19. GOALS Domain
```
goal to launch product
goal progress 50%
```

**Check:** Go to **Goals domain**

**Expected:** Goals and progress logged

---

### 20. TASKS Domain
```
add task buy milk
create task finish report
```

**Check:** Go to **Tasks** page (not domain_entries)

**Expected:** Tasks appear in task list

---

### 21. HABITS Domain
```
completed my morning run habit
did meditation habit
```

**Check:** Go to **Habits domain**

**Expected:** Habit completions logged

---

## 🐛 Troubleshooting

### Problem: "AI said not a command"
**Solution:** Command pattern not recognized
1. Check console for exact error
2. Try rewording the command
3. Report pattern to be added to `handleVoiceCommand()`

### Problem: "Saved successfully" but not visible in UI
**Solution:** Domain page filter mismatch
1. Go to Supabase Table Editor → `domain_entries`
2. Find your entry (filter by domain)
3. Check the `metadata` structure
4. Compare to what domain page expects
5. May need to adjust domain page filter logic

### Problem: Entry shows but can't edit/delete
**Solution:** CRUD buttons not wired up or RLS policy issue
1. Check if `useDomainCRUD` hook is used on that page
2. Check Supabase RLS policies for UPDATE and DELETE
3. Verify entry has proper `id` field

### Problem: Data goes to wrong domain
**Solution:** Routing logic needs adjustment
1. Check `intelligentCommandParser()` AI prompt
2. Check `handleVoiceCommand()` regex patterns
3. May need to add specific routing logic

---

## 📊 Results Template

Fill this out as you test:

```markdown
## TEST RESULTS - [Your Name] - [Date]

### Summary
- Total Commands Tested: X
- Successful: X
- Failed: X
- Success Rate: X%

### Fully Working Domains
- ✅ Health
- ✅ Fitness
- ✅ [etc]

### Partially Working Domains
- 🟡 Vehicles (saves but title generation broken)
- 🟡 [etc]

### Not Working Domains
- ❌ Hobbies (commands not detected)
- ❌ [etc]

### Detailed Results

#### HEALTH
✅ "I weigh 175 pounds"
   - Saved: YES
   - Visible: YES
   - CRUD: YES

❌ "blood pressure 120 over 80"
   - Saved: NO
   - Issue: Regex pattern not matching

[Continue for all commands...]
```

---

## 🎯 Success Criteria

A domain is **FULLY WORKING** if:
- ✅ All commands are detected
- ✅ Data saves to correct domain
- ✅ Data appears in domain page
- ✅ Titles are auto-generated correctly
- ✅ Metadata structure is correct
- ✅ Full CRUD operations work
- ✅ No console errors

A domain is **PARTIALLY WORKING** if:
- 🟡 Commands are detected
- 🟡 Data saves
- 🟡 But has minor issues (e.g., title, formatting)

A domain is **NOT WORKING** if:
- ❌ Commands are not detected
- ❌ Data doesn't save
- ❌ Data doesn't appear in UI
- ❌ CRUD operations fail

---

## 📈 Progress Tracker

Use this to track your progress:

```
[  ] Health        [  ] Career        [  ] Insurance
[  ] Fitness       [  ] Education     [  ] Legal
[  ] Nutrition     [  ] Relationships [  ] Appliances
[  ] Financial     [  ] Travel        [  ] Digital-Life
[  ] Vehicles      [  ] Mindfulness   [  ] Home
[  ] Property      [  ] Hobbies       [  ] Goals
[  ] Pets          [  ] Tasks         [  ] Habits
```

---

## 🎉 When You're Done

After testing all domains:

1. **Compile Results**: Fill out the Results Template above
2. **Report Issues**: List any broken domains/commands
3. **Celebrate Wins**: Note what's working perfectly
4. **Next Steps**: Prioritize fixes for broken features

---

## 💡 Pro Tips

1. **Test in batches**: Do 5-6 domains at a time, take breaks
2. **Use console filter**: Filter console by "SAVE" to see only save logs
3. **Clear data between tests**: Delete test entries to avoid clutter
4. **Take screenshots**: Capture successful tests for documentation
5. **Note edge cases**: Try variations of commands to find issues

---

## 📞 Need Help?

If you get stuck:
1. Check console logs for detailed error messages
2. Check Supabase Table Editor to see if data was saved
3. Review `app/api/ai-assistant/chat/route.ts` for command patterns
4. Check domain page code to see expected metadata structure

---

**Happy Testing! 🚀**

Remember: The goal is to find what's working AND what needs fixing. Both are valuable results!

