# 🧪 Manual Testing Guide - Appliances Domain

## 🎯 Goal
Verify that appliance data correctly syncs between the `appliances` table (AutoTrack) and `domain_entries` table (Dashboard), and that the dashboard displays accurate counts and values.

---

## 📋 Pre-Test Setup

### 1. Open Browser with DevTools
```
http://localhost:3001
```
- Press **Cmd+Option+J** (Mac) or **F12** (Windows) to open Chrome DevTools
- Go to **Console** tab

### 2. Load Debug Script
Copy and paste this into the console:

```javascript
async function debugAppliancesData() {
  const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createClientComponentClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return console.error('❌ Not authenticated')
  
  console.log(`✅ User: ${user.email}`)
  
  const { data: appTable } = await supabase.from('appliances').select('*').eq('user_id', user.id)
  const { data: domainTable } = await supabase.from('domain_entries').select('*').eq('user_id', user.id).eq('domain', 'appliances')
  
  console.log('\n📊 APPLIANCES TABLE:', appTable?.length || 0, 'items')
  console.table(appTable?.map(a => ({ Name: a.name, Price: a.purchase_price, Date: a.purchase_date })))
  
  console.log('\n📊 DOMAIN_ENTRIES TABLE:', domainTable?.length || 0, 'items')
  console.table(domainTable?.map(e => ({ 
    Title: e.title, 
    Price: e.metadata?.purchasePrice || e.metadata?.value || 0,
    Warranty: e.metadata?.warrantyExpiry || 'None'
  })))
  
  const domainValue = domainTable?.reduce((sum, e) => sum + (Number(e.metadata?.purchasePrice || e.metadata?.value) || 0), 0) || 0
  console.log(`\n💰 Total Value (Dashboard will show): $${domainValue}`)
}

window.debugAppliancesData = debugAppliancesData
console.log('✅ Run: debugAppliancesData()')
```

---

## 🧪 Test Scenario 1: Check Current State

### Steps:
1. Open dashboard: `http://localhost:3001`
2. Find the **Appliances** card
3. Take screenshot of current values:
   - Items: ?
   - Total Value: $?
   - Under Warranty: ?
   - Maintenance Due: ?

4. In console, run:
   ```javascript
   debugAppliancesData()
   ```

5. **Compare:**
   - Does `domain_entries` count match dashboard "Items"?
   - Does `domain_entries` total value match dashboard "Total Value"?
   - Are the counts different between `appliances` and `domain_entries` tables?

### Expected Result:
- If counts match → Tables are synced ✅
- If counts differ → Tables need sync ⚠️
- If dashboard shows $0 but domain_entries has values → DataProvider issue ⚠️

---

## 🧪 Test Scenario 2: Edit Existing Appliance (Fix the $889 → $900)

### Steps:
1. Go to: `http://localhost:3001/domains/appliances`
2. You should see your 3 appliances listed
3. Click on the **"sam"** appliance (the one with $889)
4. Click the **Edit button** (pencil icon)
5. Find the **Purchase Price** field showing 889
6. Change it to: **900**
7. Click **Save**

### Watch For:
**In Console, you should see:**
```
✅ Appliance updated successfully!
```

**In Network Tab (DevTools → Network):**
- Filter by "Fetch/XHR"
- Look for POST requests:
  - One to `appliances` table ✅
  - One to `domain_entries` table (upsert) ✅

8. After save, run in console:
   ```javascript
   debugAppliancesData()
   ```

9. **Verify:**
   - `appliances` table shows `purchase_price = 900` ✅
   - `domain_entries` table shows `metadata.purchasePrice = 900` ✅

10. **Refresh Dashboard:**
    - Go to: `http://localhost:3001`
    - Check **Appliances** card
    - **Total Value** should have increased by $11 (900 - 889)

### Expected Result:
- ✅ Edit saves to BOTH tables
- ✅ Dashboard reflects new value after refresh
- ✅ The exact number you typed (900) is preserved

---

## 🧪 Test Scenario 3: Add New Appliance with Full Data

### Steps:
1. Go to: `http://localhost:3001/domains/appliances`
2. Click **"Add Appliance"** button
3. Fill out the form:
   ```
   Name: Samsung Microwave
   Category: Microwave
   Brand: Samsung
   Model: MS19M8000AG
   Purchase Date: 2024-10-01
   Purchase Price: 450
   Location: Kitchen
   Est. Lifespan: 10
   Notes: Built-in, 1.9 cu ft
   ```
4. Click **Save**

### Watch For:
**In Console:**
```
✅ Adding appliance for user: test@aol.com
Appliance added successfully!
```

5. Run debug:
   ```javascript
   debugAppliancesData()
   ```

6. **Verify:**
   - `appliances` table has new Samsung Microwave ✅
   - `domain_entries` table has matching entry with ID `appliance:{id}` ✅
   - `metadata.purchasePrice = 450` ✅

7. **Refresh Dashboard:**
   - Items count increased by 1 ✅
   - Total Value increased by $450 ✅

---

## 🧪 Test Scenario 4: Add Warranty & Maintenance (Fix Alerts)

### Steps:
1. Go to: `http://localhost:3001/domains/appliances`
2. Click on the **Samsung Microwave** (or any appliance)
3. Click **Edit**
4. Add these fields:
   ```
   Warranty Expiry: 2026-12-31 (future date)
   Next Maintenance: 2025-11-30 (upcoming)
   ```
5. Click **Save**

6. Run debug:
   ```javascript
   debugAppliancesData()
   ```

7. **Verify domain_entries has:**
   - `metadata.warrantyExpiry = "2026-12-31"` ✅
   - `metadata.maintenanceDue = "2025-11-30"` ✅

8. **Refresh Dashboard:**
   - **Under Warranty** count increased by 1 ✅
   - **Maintenance Due** count increased by 1 ✅

---

## 🧪 Test Scenario 5: Delete Appliance (Verify Dashboard Updates)

### Steps:
1. Go to: `http://localhost:3001/domains/appliances`
2. Note the current count (e.g., 4 appliances)
3. Click on an appliance (e.g., the Samsung Microwave)
4. Click **Delete** button
5. Confirm deletion

6. **In Console, check for:**
   ```
   🗑️ Deleting entry {id} for user {user_id}
   ✅ Deleted 1 entries
   ```

7. Run debug:
   ```javascript
   debugAppliancesData()
   ```

8. **Verify:**
   - `appliances` table no longer has that appliance ✅
   - `domain_entries` table no longer has matching entry ✅
   - Counts decreased by 1 in both tables ✅

9. **Refresh Dashboard:**
   - **Items** decreased by 1 ✅
   - **Total Value** decreased by deleted appliance's price ✅
   - **Warranty/Maintenance** counts adjusted ✅

---

## 🧪 Test Scenario 6: Full Dashboard Accuracy Check

### Steps:
1. Open dashboard: `http://localhost:3001`
2. Take note of **Appliances** card values
3. Open console and run:
   ```javascript
   debugAppliancesData()
   ```
4. **Manually calculate:**
   - Count all entries in `domain_entries` table
   - Sum all `metadata.purchasePrice` values
   - Count entries with `warrantyExpiry > today`
   - Count entries with `maintenanceDue` set

5. **Compare to Dashboard:**
   - Items count matches? ✅
   - Total Value matches? ✅
   - Warranty count matches? ✅
   - Maintenance count matches? ✅

---

## 🚨 Troubleshooting

### Issue: Dashboard shows $0 even though domain_entries has prices

**Fix:**
1. Hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+F5** (Windows)
2. Clear cache and reload
3. Check DataProvider in React DevTools:
   - Install React DevTools extension
   - Find `DataProvider` component
   - Inspect `data.appliances` array
   - Each item should have `metadata.purchasePrice`

### Issue: Tables out of sync (different counts)

**Fix:**
1. Go to each appliance in AutoTrack
2. Click Edit → Click Save (even without changes)
3. This triggers the sync to `domain_entries`
4. Refresh dashboard

### Issue: Numbers still not updating

**Check:**
1. Console errors (red text in DevTools console)
2. Network tab → Look for failed requests (red status codes)
3. Authentication → Run in console:
   ```javascript
   const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
   const supabase = createClientComponentClient()
   const { data } = await supabase.auth.getUser()
   console.log('User:', data.user?.email)
   ```

---

## ✅ Success Criteria

After completing all tests, you should have:

1. ✅ **Sync Working:** `appliances` and `domain_entries` tables have same count
2. ✅ **Values Accurate:** Dashboard "Total Value" = sum of all `purchasePrice` fields
3. ✅ **Edits Persist:** Changing 889 → 900 shows exactly 900, not 889
4. ✅ **Alerts Working:** Warranty and Maintenance counts are accurate
5. ✅ **Deletes Work:** Removing an appliance updates both tables and dashboard
6. ✅ **Real-time Updates:** Dashboard reflects changes after page refresh

---

## 📸 Screenshots to Capture

Please take screenshots of:
1. Dashboard **before** any changes (showing current $0 issue)
2. Console output from `debugAppliancesData()` showing table mismatch
3. Editing an appliance (showing 900 in the form field)
4. Console output **after** save (showing success messages)
5. Dashboard **after** refresh (showing updated values)
6. Final `debugAppliancesData()` output (showing tables in sync)

---

**Ready to test! Start with Test Scenario 1 to check current state.** 🚀

