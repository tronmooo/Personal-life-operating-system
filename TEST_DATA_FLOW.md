# 🧪 Test Data Flow - Verification Guide

## Quick Test: Verify Data is Displaying

### Step 1: Open Browser Console
Press `F12` or `Cmd+Option+I` (Mac) to open DevTools

### Step 2: Check DataProvider Data

Paste this in console:

```javascript
// Check what data exists
const data = JSON.parse(localStorage.getItem('lifehub_data') || '{}')
console.log('📊 Data in DataProvider:')
Object.keys(data).forEach(domain => {
  console.log(`  ${domain}: ${data[domain]?.length || 0} items`)
})

// Check tasks and habits
const tasks = JSON.parse(localStorage.getItem('lifehub_tasks') || '[]')
const habits = JSON.parse(localStorage.getItem('lifehub_habits') || '[]')
const bills = JSON.parse(localStorage.getItem('lifehub_bills') || '[]')
console.log(`📋 Tasks: ${tasks.length}`)
console.log(`✅ Habits: ${habits.length}`)
console.log(`💳 Bills: ${bills.length}`)
```

### Step 3: Add Test Data

If you see 0 items, add some test data:

```javascript
// Add a test home
const testHome = {
  id: crypto.randomUUID(),
  domain: 'home',
  title: 'Test House',
  description: 'My test home',
  metadata: {
    address: '123 Test St',
    estimatedValue: '500000',
    purchaseDate: '2020-01-01'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// Get existing data
const currentData = JSON.parse(localStorage.getItem('lifehub_data') || '{}')
currentData.home = currentData.home || []
currentData.home.push(testHome)

// Save it
localStorage.setItem('lifehub_data', JSON.stringify(currentData))

// Trigger update event
window.dispatchEvent(new CustomEvent('data-updated', {
  detail: { domain: 'home', data: currentData.home, action: 'add', timestamp: Date.now() }
}))

console.log('✅ Test home added! Refresh the page.')
```

### Step 4: Verify Command Center Shows Data

1. Go to `/command` or main dashboard
2. Look for:
   - **Net Worth card** should show value > $0
   - **Home domain card** should show count > 0
   - **Financial metrics** should update

### Step 5: Verify Analytics Shows Data

1. Go to `/analytics`
2. Look for:
   - **Net Worth chart** should have data points
   - **Asset Distribution** should show categories
   - **Health vitals** if you added health data

## Test Event System

Verify events are firing:

```javascript
// Listen for data updates
window.addEventListener('data-updated', (e) => {
  console.log('🔔 Data updated event:', {
    domain: e.detail.domain,
    action: e.detail.action,
    itemCount: e.detail.data?.length || 0
  })
})

// Listen for domain-specific updates
window.addEventListener('home-data-updated', (e) => {
  console.log('🏠 Home data updated:', e.detail)
})

window.addEventListener('financial-data-updated', (e) => {
  console.log('💰 Financial data updated:', e.detail)
})

console.log('✅ Event listeners added. Now add data and watch for events.')
```

## Add Data Through UI

### Add a Home:
1. Go to `/domains/home`
2. Click "Add Home"
3. Fill in:
   - Address: "123 Main St"
   - Estimated Value: "450000"
   - Purchase Date: "01/01/2020"
4. Save
5. Check console for events
6. Go to Command Center - should see home count

### Add a Vehicle:
1. Go to `/domains/vehicles`
2. Click "Add Vehicle"
3. Fill in:
   - Make: "Toyota"
   - Model: "Camry"
   - Year: "2020"
   - Estimated Value: "25000"
4. Save
5. Check Command Center - should see vehicle count

### Add Health Data:
1. Go to `/domains/health`
2. Add vitals:
   - Weight: "180"
   - Blood Pressure: "120/80"
   - Heart Rate: "72"
3. Save
4. Check Analytics - should see health charts

## Expected Results

After adding data, you should see:

### Command Center:
- ✅ Net Worth > $0
- ✅ Domain cards show counts (e.g., "Home: 1")
- ✅ Financial metrics update
- ✅ Health stats show values (not dashes)

### Analytics:
- ✅ Net Worth chart has data
- ✅ Asset distribution shows categories
- ✅ Health vitals chart (if health data added)
- ✅ Domain activity shows counts

### Main Dashboard:
- ✅ Financial cards show values
- ✅ Net Worth displays correctly
- ✅ Domain counts update

## Troubleshooting

### Data not showing?

1. **Check if signed in:**
   ```javascript
   const session = localStorage.getItem('sb-jphpxqqilrjyypztkswc-auth-token')
   console.log('Signed in:', !!session)
   ```

2. **Check DataProvider loaded:**
   ```javascript
   console.log('DataProvider data:', localStorage.getItem('lifehub_data'))
   ```

3. **Check for errors:**
   - Look for red errors in console
   - Check Network tab for failed requests

4. **Force refresh:**
   ```javascript
   window.dispatchEvent(new CustomEvent('data-updated', {
     detail: { domain: 'all', timestamp: Date.now() }
   }))
   ```

### Still not working?

1. **Clear cache and reload:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

2. **Check Supabase connection:**
   ```javascript
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```

3. **Verify data structure:**
   ```javascript
   const data = JSON.parse(localStorage.getItem('lifehub_data') || '{}')
   console.log('Data structure:', JSON.stringify(data, null, 2))
   ```

## Success Criteria

✅ Command Center shows real data counts
✅ Analytics displays charts with data
✅ Adding data updates all views
✅ No console errors
✅ Events fire when data changes

---

**If all tests pass, your data flow is working correctly!** 🎉



