# 🧪 Test Commands for AI Assistant

## Quick Test Sequence

Copy and paste these commands one at a time into the AI Assistant to test data logging:

### 1. Health Tests
```
weigh 175 pounds
```
**Expected**: ✅ Logged weight: 175 lbs in Health domain

```
slept 8 hours
```
**Expected**: ✅ Logged 8.0 hours of sleep in Health domain

```
walked 10000 steps
```
**Expected**: ✅ Awesome! I've logged 10,000 steps in your Health domain.

```
drank 64 ounces of water
```
**Expected**: ✅ Perfect! I've logged 64 oz of water in your Health domain.

```
blood pressure 120 over 80
```
**Expected**: ✅ Logged blood pressure: 120/80 in Health domain

```
heart rate 72 bpm
```
**Expected**: ✅ Logged heart rate: 72 bpm in Health domain

```
feeling great
```
**Expected**: ✅ Logged mood: great in Health domain

### 2. Fitness Tests
```
did 30 minute cardio workout
```
**Expected**: ✅ Logged 30 min cardio workout in Fitness domain

```
burned 500 calories
```
**Expected**: ✅ Logged 500 calories burned in Fitness domain

```
did 3 bench press 10 reps
```
**Expected**: ✅ Logged bench press: 3 sets x 10 reps in Fitness domain

### 3. Nutrition Tests
```
ate chicken salad 450 calories
```
**Expected**: ✅ Logged meal: "chicken salad" (450 cal) in Nutrition domain

```
ate 50 grams of protein
```
**Expected**: ✅ Logged 50g protein in Nutrition domain

### 4. Financial Tests
```
spent $50 on groceries
```
**Expected**: ✅ Logged expense: $50 for groceries in Financial domain

```
earned $1000 for freelance work
```
**Expected**: ✅ Logged income: $1000 for freelance work in Financial domain

### 5. Tasks Test
```
add task buy groceries
```
**Expected**: ✅ Task added! I've created a new task: "buy groceries"

### 6. Mindfulness Test
```
meditated 15 minutes
```
**Expected**: ✅ Logged 15 min meditation in Mindfulness domain

## Voice Test Script

If testing with voice commands, speak these clearly:

1. **"Weigh one seventy-five pounds"**
2. **"Slept eight hours"**
3. **"Walked ten thousand steps"**
4. **"Drank sixty-four ounces of water"**
5. **"Spent fifty dollars on groceries"**

## Verification Checklist

After each command:
- [ ] AI responds with ✅ success message (not just chatting about it)
- [ ] No 500 error in browser console
- [ ] No "Maximum update depth exceeded" warning
- [ ] Data appears in Command Center
- [ ] Data appears in the specific domain page (Health, Financial, etc.)
- [ ] Data is saved in Supabase `domains` table

## If Something Doesn't Work

### Step 1: Check Browser Console
Press F12, look for:
- ✅ Green checkmarks: `✅ [SAVE SUCCESS]`
- ❌ Red X's: `❌ [SAVE FAILED]`
- Any error messages

### Step 2: Check Network Tab
Press F12, go to Network tab:
- Find `/api/ai-assistant/chat` request
- Status should be `200` (not `500`)
- Response should have `"saved": true`

### Step 3: Hard Refresh
- Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- This clears the cache and reloads everything

### Step 4: Check Supabase
- Go to Supabase dashboard
- Table Editor → `domains` table
- Find row where `domain_name = 'health'`
- Check the `data` column (should show your entries)

## Report Results

Please let me know:
1. Which commands worked ✅
2. Which commands failed ❌
3. Any error messages from console
4. Screenshot of AI Assistant responses (if helpful)

---

**Status**: Ready to test! 🚀


