# 🧪 Fitness Tracker Testing Guide

## Manual Testing Instructions

### Test 1: Time Period Selector
**Goal:** Verify that the 7/30/90 day period selector works correctly

**Steps:**
1. Navigate to `/fitness` or `/domains/fitness`
2. Go to the Dashboard tab
3. Click the "7 Days" button
   - ✅ Verify metrics show data for last 7 days
   - ✅ Verify charts show last 7 days
4. Click the "30 Days" button
   - ✅ Verify metrics update to last 30 days
   - ✅ Verify charts adjust accordingly
5. Click the "90 Days" button
   - ✅ Verify metrics update to last 90 days
   - ✅ Verify charts show longer time span

**Expected Results:**
- Period selector highlights the active button
- All 4 stat cards update their totals
- All 4 charts refresh with period-specific data
- Smooth transitions between periods

---

### Test 2: Period Comparison Indicators
**Goal:** Verify comparison indicators show correct trends

**Pre-requisites:** Have fitness activities logged across multiple weeks

**Steps:**
1. Select "7 Days" period
2. Observe the comparison indicators under each stat card
   - Look for green ↑ arrows (increases)
   - Look for red ↓ arrows (decreases)
   - Note the percentage changes

3. Verify indicators make sense:
   - If you worked out more this week than last, steps/calories should show green ↑
   - If you worked out less, they should show red ↓

**Expected Results:**
- Each stat card shows comparison to previous period
- Green arrow = improvement
- Red arrow = decline
- Percentage matches actual change

---

### Test 3: AI Assistant - Miles to Steps Conversion
**Goal:** Test automatic miles → steps conversion

**Steps:**
1. Open AI Assistant (chat interface)
2. Say or type: **"I ran 2 miles"**
3. Wait for AI response
4. Navigate to Fitness → Activity History
5. Find the new entry

**Expected Results:**
- ✅ Activity created with title like "Running - 2 miles"
- ✅ Steps automatically calculated (~4,000-4,500 steps)
- ✅ Calories automatically calculated (~240-260 calories)
- ✅ Distance shows 2 miles
- ✅ Activity appears in dashboard charts immediately

**Console Log Check:**
Look for logs like:
```
🏃 AI Fitness: Converted 2 miles → 4224 steps
🔥 AI Fitness: Estimated 246 calories burned for 20min of Running
```

---

### Test 4: AI Assistant - Duration-Based Calorie Calculation
**Goal:** Test automatic calorie estimation from duration

**Steps:**
1. Open AI Assistant
2. Say or type: **"I did 30 minutes of cycling"**
3. Check the activity entry

**Expected Results:**
- ✅ Activity type: Cycling
- ✅ Duration: 30 minutes
- ✅ Calories: ~240 (automatically calculated)
- ✅ Steps: 0 (cycling is non-stepping)

**Try different activities:**
- "30 minutes of yoga" → ~90 calories
- "30 minutes of swimming" → ~270 calories
- "30 minutes of strength training" → ~180 calories

---

### Test 5: AI Assistant - Activity Type to Steps Estimation
**Goal:** Test automatic step estimation for stepping activities

**Steps:**
1. Open AI Assistant
2. Say or type: **"Walked for 45 minutes"**
3. Check the activity entry

**Expected Results:**
- ✅ Activity type: Walking
- ✅ Duration: 45 minutes
- ✅ Steps: ~4,950 (110 steps/min × 45)
- ✅ Distance: ~2.25 miles
- ✅ Calories: ~158

---

### Test 6: Combined Natural Language Input
**Goal:** Test complex fitness commands

**Test Cases:**

1. **"Ran 5 miles in 40 minutes"**
   - ✅ Distance: 5 miles
   - ✅ Duration: 40 minutes
   - ✅ Steps: ~10,560
   - ✅ Calories: ~615
   - ✅ Pace: 8:00 min/mile

2. **"Did 2 hour bike ride, went 25 miles"**
   - ✅ Activity: Cycling
   - ✅ Duration: 120 minutes
   - ✅ Distance: 25 miles
   - ✅ Calories: ~960

3. **"45 minute strength training session"**
   - ✅ Activity: Strength Training
   - ✅ Duration: 45 minutes
   - ✅ Calories: ~270
   - ✅ Steps: 0

---

### Test 7: Dashboard Charts with Real Data
**Goal:** Verify charts display correctly with multiple entries

**Pre-requisites:** Log 10+ activities over 2 weeks

**Steps:**
1. Log various activities:
   - Mix of running, walking, cycling, strength training
   - Different durations (20-60 minutes)
   - Spread across multiple days

2. Go to Fitness Dashboard

3. Verify charts:
   - **Calories Burned Over Time**: Should show bar chart with daily totals
   - **Steps Progress**: Line chart should show step trends
   - **Activity Distribution**: Pie chart should show % breakdown
   - **Workout Duration**: Bar chart showing minutes per day

**Expected Results:**
- All charts populate with data
- Charts are visually clear and readable
- Tooltips show detailed info on hover
- Charts update when changing time period

---

### Test 8: Empty State
**Goal:** Verify empty state shows correctly for new users

**Steps:**
1. Start with 0 fitness activities
2. Go to Fitness Dashboard

**Expected Results:**
- Empty state message: "No Workouts Yet"
- Friendly icon and message
- "Log Your First Workout" button
- No chart errors or crashes

---

### Test 9: Activity Editing
**Goal:** Verify edited activities recalculate metrics

**Steps:**
1. Go to Fitness → Activity History
2. Click Edit on an activity
3. Change the duration (e.g., 30 → 45 minutes)
4. Save
5. Go back to Dashboard

**Expected Results:**
- Dashboard metrics update to reflect new duration
- Calories recalculated if not manually entered
- Charts update immediately
- No data inconsistencies

---

### Test 10: Cross-Domain Verification
**Goal:** Ensure fitness data shows in global analytics

**Steps:**
1. Log several fitness activities
2. Go to `/analytics` or main dashboard
3. Look for fitness-related metrics in global views

**Expected Results:**
- Fitness domain shows activity count
- Recent fitness entries appear in activity feed
- Global charts may include fitness data (if implemented)

---

## Automated Test Script

```bash
# Run the dev server
npm run dev

# In a new terminal, run tests
npm test -- fitness

# Run type checking
npm run type-check

# Run linter
npm run lint
```

---

## Performance Checks

### Large Dataset Test
**Goal:** Verify performance with lots of data

**Steps:**
1. Create 100+ fitness activities (can use API directly or script)
2. Go to Fitness Dashboard
3. Switch between time periods
4. Check for lag or slowness

**Expected Results:**
- Page loads in < 2 seconds
- Period switching is instant
- Charts render smoothly
- No browser console errors

---

## Browser Compatibility

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)

---

## Known Limitations

1. **User Weight**: Currently defaults to 165 lbs for calorie calculations
   - Future: Allow user to set their weight in profile
   
2. **Stride Length**: Uses average stride length
   - Future: Calculate from user height or allow manual setting
   
3. **MET Values**: Uses average MET values
   - Future: Adjust based on intensity (light/moderate/vigorous)

---

## Debugging Tips

### If activities don't show:
1. Check browser console for errors
2. Verify `domain_entries` table has `domain='fitness'` records
3. Check that `metadata.type` or `metadata.itemType` is 'activity' or 'workout'
4. Verify `metadata.activityType` field exists

### If conversions don't work:
1. Check AI Assistant logs in browser console
2. Look for domain router logs: "🏃 AI Fitness: Converted..."
3. Verify `lib/utils/fitness-calculations.ts` is imported correctly
4. Check `lib/ai/domain-router.ts` fitness case

### If charts are empty:
1. Verify activities have valid dates
2. Check activities fall within selected time period
3. Look for JavaScript errors in console
4. Verify recharts library is loaded

---

## Success Criteria

✅ All 3 time period views (7/30/90 days) work correctly
✅ AI Assistant converts miles → steps automatically
✅ AI Assistant estimates calories for all activity types
✅ Comparison indicators show correct trends
✅ Charts display data accurately
✅ Natural language commands create proper entries
✅ No TypeScript errors in new files
✅ No linter warnings in new files
✅ Dashboard loads in < 2 seconds
✅ Mobile responsive design works

---

## Reporting Issues

If you find bugs, please note:
1. Exact steps to reproduce
2. Expected vs actual behavior
3. Browser and version
4. Console error messages (if any)
5. Screenshots (if applicable)

---

## Feature Completion Status

✅ **Time Period Selector** - 7/30/90 day views implemented
✅ **Period Calculations** - Totals, averages, comparisons working
✅ **Miles → Steps Conversion** - Automatic conversion active
✅ **Calorie Estimation** - 30+ activities supported with MET values
✅ **Activity Enrichment** - Missing metrics auto-calculated
✅ **Comparison Indicators** - Trend arrows showing progress
✅ **AI Integration** - Natural language parsing functional
✅ **Type Safety** - Full TypeScript support
✅ **Documentation** - Complete usage guide available

**Status: ✅ COMPLETE AND READY FOR USE**



















