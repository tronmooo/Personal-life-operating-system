# Appliances Data Sync Test Plan

## 🔍 **Root Cause Found**

The dashboard reads from `domain_entries` table:
```typescript
const appliances = (data.appliances || []) as any[]
const totalValue = appliances.reduce((sum, a) => 
  sum + (Number(a.metadata?.value || a.metadata?.purchasePrice) || 0), 0)
const underWarranty = appliances.filter(a => {
  const exp = a.metadata?.warrantyExpiry
  if (!exp) return false
  return new Date(exp) > new Date()
}).length
const needsMaint = appliances.filter(a => 
  a.metadata?.maintenanceDue || a.metadata?.needsMaintenance
).length
```

But AutoTrack saves to the separate `appliances` table!

**My fix (just applied):** AutoTrack now syncs to `domain_entries` after each add/edit.

---

## 🧪 **Manual Test Steps**

### **Test 1: Add New Appliance**
1. Go to: http://localhost:3001/domains/appliances
2. Click on an appliance OR click **"Add Appliance"**
3. Fill in these fields:
   - **Name:** "LG Refrigerator"
   - **Brand:** "LG"
   - **Model:** "LRFXS2503S"
   - **Purchase Date:** 2024-01-15
   - **Purchase Price:** 2500
   - **Est. Lifespan:** 12 years
   - **Location:** "Kitchen"
4. Click **Save**
5. **Expected:** Alert "Appliance added successfully!"

### **Test 2: Verify Dashboard Update**
1. Go back to dashboard: http://localhost:3001
2. Find **Appliances** card
3. **Expected:**
   - **Items:** 4 (was 3, now +1)
   - **Total Value:** $2,500 (or higher if other appliances have prices)
   - **Under Warranty:** 0 (we didn't set warranty)
   - **Maintenance Due:** 0 (we didn't set maintenance)

### **Test 3: Edit Existing Appliance**
1. Go to: http://localhost:3001/domains/appliances
2. Click on "sam" appliance (the one showing $889)
3. Click **Edit** (pencil icon)
4. Change **Purchase Price** from 889 to **900**
5. Click **Save**
6. **Expected:** Alert "Appliance updated successfully!"
7. Verify the detail card now shows: **Purchase Price: $900**

### **Test 4: Verify Dashboard Reflects Edit**
1. Go back to dashboard: http://localhost:3001
2. Find **Appliances** card
3. **Expected:**
   - **Total Value** should increase by $11 (900 - 889 = +11)

### **Test 5: Add Warranty & Maintenance**
1. Go to: http://localhost:3001/domains/appliances
2. Click on the LG Refrigerator
3. Click **Edit**
4. Add these fields:
   - **Warranty Expiry:** 2026-12-31 (future date)
   - **Next Maintenance:** 2025-11-30 (future date)
5. Click **Save**

### **Test 6: Verify Alerts Show Up**
1. Go back to dashboard: http://localhost:3001
2. Find **Appliances** card
3. **Expected:**
   - **Under Warranty:** 1 ✅
   - **Maintenance Due:** 1 ✅

### **Test 7: Delete an Appliance**
1. Go to: http://localhost:3001/domains/appliances
2. Click on an appliance
3. Click **Delete** button
4. Confirm deletion
5. **Expected:** Appliance removed from list

### **Test 8: Verify Dashboard Reflects Deletion**
1. Go back to dashboard: http://localhost:3001
2. Find **Appliances** card
3. **Expected:**
   - **Items** count decreased by 1
   - **Total Value** decreased by that appliance's price
   - **Warranty/Maintenance** counts adjusted if deleted item had them

---

## 🎯 **Key Things to Check**

### In Console (Press Cmd+Option+J):
Look for these log messages after each save:
```
✅ Adding appliance for user: test@aol.com
✅ Appliance added/updated successfully!
```

### In Network Tab:
1. Open DevTools → Network tab
2. After saving, look for:
   - POST to `appliances` table (status 200)
   - POST to `domain_entries` table (status 200 or 201)

### In Database:
Check that both tables have the data:
- `appliances` table: Has the appliance with `purchase_price = 900`
- `domain_entries` table: Has matching entry with `metadata.purchasePrice = 900`

---

## ✅ **Expected Final State**

After all tests, the dashboard should show:
- **3+ appliances** (depending on how many you add/delete)
- **Total Value:** Sum of all `purchasePrice` fields
- **Under Warranty:** Count of appliances with `warrantyExpiry > today`
- **Maintenance Due:** Count of appliances with `maintenanceDue` set

---

## 🚨 **If Data Still Shows $0**

### Debug Checklist:
1. **Check domain_entries table:**
   ```sql
   SELECT * FROM domain_entries WHERE domain = 'appliances' AND user_id = 'YOUR_USER_ID';
   ```
   - Should see entries with `metadata->'purchasePrice'` populated

2. **Check DataProvider:**
   - Open React DevTools
   - Find `DataProvider` component
   - Inspect `data.appliances` array
   - Each appliance should have `metadata.purchasePrice` or `metadata.value`

3. **Force Refresh:**
   - Hard refresh (Cmd+Shift+R)
   - Clear cache
   - Sign out and sign back in

4. **Console Errors:**
   - Check for any red errors in console
   - Look for failed network requests

---

**Ready to test! Open http://localhost:3001/domains/appliances and follow the steps above.** 🚀

