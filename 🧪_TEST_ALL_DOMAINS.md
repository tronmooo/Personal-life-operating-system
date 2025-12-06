# 🧪 Test ALL 21 Domains - Quick Test Script

## 🎯 Goal
Test every domain to make sure AI Assistant can log to ALL 21 domains.

---

## ✅ Quick Test Sequence
Copy and paste these ONE AT A TIME into the AI Assistant:

### 1. Health ✅ (Already Tested)
```
weigh 175 pounds
```
**Expected**: ✅ Logged weight: 175 lbs in Health domain  
**Check**: Health page → Dashboard tab → Weight card shows 175

---

### 2. Water (Smart - Health) 💧
```
drank 64 ounces of water
```
**Expected**: ✅ Logged 64 oz of water in Health domain  
**Check**: Should aggregate with weight in Health vitals

---

### 3. Water (Smart - Nutrition) 💧
```
drank 32 oz water with my nutrition plan
```
**Expected**: ✅ Logged 32 oz of water in Nutrition domain  
**Check**: Should appear in Nutrition domain (separate from Health)

---

### 4. Fitness 💪
```
did 30 minute cardio workout
```
**Expected**: ✅ Logged 30 min cardio workout in Fitness domain  
**Check**: Fitness domain page

---

### 5. Nutrition 🍎
```
ate chicken salad 450 calories
```
**Expected**: ✅ Logged meal: "chicken salad" (450 cal) in Nutrition domain  
**Check**: Nutrition domain page

---

### 6. Financial 💰
```
spent $50 on groceries
```
**Expected**: ✅ Logged expense: $50 for groceries in Financial domain  
**Check**: Financial domain / Command Center

---

### 7. Vehicles 🚗
```
filled up for $45
```
**Expected**: ✅ Logged gas fillup: $45 in Vehicles domain  
**Check**: Vehicles domain page

---

### 8. Property 🏠
```
paid $2000 for mortgage
```
**Expected**: ✅ Logged mortgage payment: $2000 in Property domain  
**Check**: Property domain page

---

### 9. Pets 🐾
```
fed the dog
```
**Expected**: ✅ Logged pet feeding in Pets domain  
**Check**: Pets domain page

---

### 10. Mindfulness 🧘
```
meditated 15 minutes
```
**Expected**: ✅ Logged 15 min meditation in Mindfulness domain  
**Check**: Mindfulness domain page

---

### 11. Habits ✅
```
completed my morning routine habit
```
**Expected**: ✅ Logged habit completion: "morning routine" in Habits domain  
**Check**: Habits domain page

---

### 12. Goals 🎯
```
goal fitness is 75%
```
**Expected**: ✅ Logged goal progress: "fitness" at 75% in Goals domain  
**Check**: Goals domain page

---

### 13. Tasks 📋
```
add task buy groceries
```
**Expected**: ✅ Task added: "buy groceries" in Tasks domain  
**Check**: Tasks page / Command Center

---

### 14. Education 📚
```
studied for 2 hours math
```
**Expected**: ✅ Logged study session: 2 hours on math in Education domain  
**Check**: Education domain page

---

### 15. Career 💼
```
had interview at Google
```
**Expected**: ✅ Logged interview with Google in Career domain  
**Check**: Career domain page

---

### 16. Relationships 👥
```
called Mom
```
**Expected**: ✅ Logged call with Mom in Relationships domain  
**Check**: Relationships domain page

---

### 17. Travel ✈️
```
booked trip to Paris
```
**Expected**: ✅ Added trip to Paris in Travel domain  
**Check**: Travel domain page

---

### 18. Hobbies 🎨
```
played guitar for 30 minutes
```
**Expected**: ✅ Logged guitar: 30 minutes in Hobbies domain  
**Check**: Hobbies domain page

---

### 19. Insurance 🛡️
```
paid $200 for health insurance
```
**Expected**: ✅ Logged health insurance payment: $200 in Insurance domain  
**Check**: Insurance domain page

---

### 20. Legal ⚖️
```
signed lease document
```
**Expected**: ✅ Logged signing of lease document in Legal domain  
**Check**: Legal domain page

---

### 21. Appliances 🔧
```
repaired dryer for $150
```
**Expected**: ✅ Logged dryer maintenance ($150) in Appliances domain  
**Check**: Appliances domain page

---

### 22. Digital-Life 💻
```
subscribed to Netflix for $15 per month
```
**Expected**: ✅ Added subscription: Netflix ($15/mo) in Digital-Life domain  
**Check**: Digital-Life domain page

---

### 23. Home (Utilities) 🏡
```
paid $120 for electric bill
```
**Expected**: ✅ Logged electricity bill: $120 in Home domain  
**Check**: Home domain page

---

## 📊 Verification Checklist

After testing all commands, verify:

- [ ] All 21 domains received data
- [ ] Water correctly went to different domains based on context
- [ ] Health vitals aggregated correctly (weight + water)
- [ ] No 500 errors in console
- [ ] Data appears in respective domain pages
- [ ] Command Center shows recent entries

---

## 🎯 Result Sheet

| # | Domain | Command | Status | Notes |
|---|--------|---------|--------|-------|
| 1 | Health | weigh 175 pounds | ⬜ |  |
| 2 | Water (Health) | drank 64 oz water | ⬜ |  |
| 3 | Water (Nutrition) | drank 32 oz with nutrition | ⬜ |  |
| 4 | Fitness | 30 min cardio | ⬜ |  |
| 5 | Nutrition | chicken salad 450 cal | ⬜ |  |
| 6 | Financial | spent $50 groceries | ⬜ |  |
| 7 | Vehicles | filled up $45 | ⬜ |  |
| 8 | Property | mortgage $2000 | ⬜ |  |
| 9 | Pets | fed the dog | ⬜ |  |
| 10 | Mindfulness | meditated 15 min | ⬜ |  |
| 11 | Habits | morning routine | ⬜ |  |
| 12 | Goals | fitness 75% | ⬜ |  |
| 13 | Tasks | buy groceries | ⬜ |  |
| 14 | Education | studied 2 hours math | ⬜ |  |
| 15 | Career | interview Google | ⬜ |  |
| 16 | Relationships | called Mom | ⬜ |  |
| 17 | Travel | trip to Paris | ⬜ |  |
| 18 | Hobbies | guitar 30 min | ⬜ |  |
| 19 | Insurance | health insurance $200 | ⬜ |  |
| 20 | Legal | signed lease | ⬜ |  |
| 21 | Appliances | repaired dryer $150 | ⬜ |  |
| 22 | Digital-Life | Netflix $15/mo | ⬜ |  |
| 23 | Home | electric bill $120 | ⬜ |  |

---

## 💡 Troubleshooting

### If a command doesn't work:
1. **Check console** (F12) for errors
2. **Try alternative phrasing** (see Complete Command List)
3. **Check domain page** to see if data appeared
4. **Hard refresh** (Ctrl+Shift+R) if data doesn't show

### If data goes to wrong domain:
1. **Check the command** - does it have the right keywords?
2. **Be more specific** - add domain keywords
3. **Report the command** so we can improve pattern matching

---

## 🚀 After Testing

Once you've tested everything, let me know:
1. **How many domains worked?** X/21
2. **Which commands failed?** (if any)
3. **Any wrong domain routing?**
4. **Any error messages?**

---

**Goal**: ✅ All 21 domains should work!  
**Time**: ~5-10 minutes to test all  
**Status**: Ready to test 🚀


