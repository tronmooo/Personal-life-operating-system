# ✅ Test Checklist - Verify Everything Works

Follow this checklist to verify all the migrations and Vapi setup are working correctly.

---

## 🎯 Part 1: Supabase Migration Testing

### ✅ 1. Career Tracking
- [ ] Navigate to `/career`
- [ ] Add a new job application
- [ ] **Verify:** Check Supabase → `domain_data` table → Should see entry with `domain = 'career'`
- [ ] Refresh page
- [ ] **Verify:** Data persists (not lost)

### ✅ 2. Finance Management
- [ ] Open Finance page
- [ ] Go to "Income & Investments" tab
- [ ] Add an income entry
- [ ] **Verify:** Check Supabase → `user_preferences` table → Look for `finance-income-investments` key
- [ ] Go to "Budget" tab
- [ ] Set a monthly budget
- [ ] **Verify:** Check `user_preferences` table → Look for `monthlyBudget` key

### ✅ 3. Budget Planner
- [ ] Navigate to Budget Planner tool
- [ ] Add a new budget category
- [ ] **Verify:** Check `user_preferences` → `budgetCategories` key
- [ ] Refresh page
- [ ] **Verify:** Your categories are still there

### ✅ 4. Loans Manager
- [ ] Open Loans Manager
- [ ] Add a new loan (mortgage, auto, etc.)
- [ ] **Verify:** Check Supabase `domain_data` → Should see loan in financial domain
- [ ] Check Bills section
- [ ] **Verify:** A monthly payment bill was auto-created

### ✅ 5. Dashboard Customization
- [ ] Go to Dashboard
- [ ] Customize widget layout (drag/drop)
- [ ] **Verify:** Check `user_preferences` → `lifehub-dashboard-config` key
- [ ] Refresh page
- [ ] **Verify:** Layout persists

### ✅ 6. Documents Management
- [ ] Pick any domain (e.g., `/domains/health/documents`)
- [ ] Note: Upload may not work without storage setup
- [ ] **Verify:** Page loads without errors
- [ ] **Verify:** Console shows query to `documents` table (not localStorage)

### ✅ 7. Location Tracking (AI Concierge)
- [ ] Open AI Concierge section
- [ ] Allow location permissions
- [ ] **Verify:** Check Supabase → `user_locations` table → Should see your location
- [ ] **Verify:** Console shows "📍 Location saved to Supabase"

### ✅ 8. Connections/Integrations
- [ ] Navigate to `/connections`
- [ ] Connect any service (even test data)
- [ ] **Verify:** Check `user_preferences` → `lifehub-connections` key
- [ ] **Verify:** No localStorage references in console

---

## 🔐 Part 2: Vapi Function Authentication

### ✅ 1. Environment Setup
```bash
# Run verification script
npx ts-node scripts/verify-vapi-setup.ts
```

**Expected Output:**
```
✅ .env.local: File exists
✅ VAPI_API_KEY: Configured
✅ VAPI_ASSISTANT_ID: Configured
✅ VAPI_PHONE_NUMBER_ID: Configured
✅ VAPI_AUTH_TOKEN: Configured
✅ Vapi Connection: Connected
✅ Function Auth: Token configured (strong)
```

- [ ] All checks pass
- [ ] If any fail, see `VAPI_SETUP_AND_TESTING.md`

### ✅ 2. Function Authentication Test

```bash
# Test without auth (should fail)
curl http://localhost:3000/api/vapi/functions/location

# Expected: {"error":"Unauthorized"}
```

```bash
# Test with auth (should succeed)
curl -H "Authorization: Bearer YOUR_VAPI_AUTH_TOKEN" \
  http://localhost:3000/api/vapi/functions/location

# Expected: {"latitude":34.5008,"longitude":-117.3245,...}
```

- [ ] Unauthorized request returns 401
- [ ] Authorized request returns data
- [ ] Repeat for `/vehicle-info` and `/financial-context`

---

## 📞 Part 3: AI Concierge Call Testing

### ✅ Prerequisites
- [ ] `.env.local` has all 4 VAPI_* variables
- [ ] Dev server restarted after adding variables
- [ ] Vapi account has credits
- [ ] Phone number verified in Vapi dashboard

### ✅ Test Call Flow

1. **Initiate Call**
   - [ ] Navigate to AI Concierge
   - [ ] Search for a business (e.g., "auto repair")
   - [ ] Click on a business result
   - [ ] Click "Start AI Concierge Call"

2. **Monitor Console**
   ```
   Expected console output:
   📞 Formatted phone: +18001234567
   🏢 Business name: Joe's Auto Shop
   📞 Initiating Vapi call to: Joe's Auto Shop
   ✅ Call initiated successfully. Call ID: call_xxxxx
   ```
   - [ ] See formatted phone number
   - [ ] See "Call initiated successfully"
   - [ ] Get a call ID back

3. **Check Call History**
   - [ ] Navigate to `/call-history`
   - [ ] **Verify:** Your call appears in the list
   - [ ] Click on call to see details
   - [ ] **Verify:** Metadata shows business name, request, etc.

4. **Check Supabase**
   - [ ] Open Supabase dashboard
   - [ ] Go to `call_history` table
   - [ ] **Verify:** See entry with:
     - `call_id` = Vapi call ID
     - `business_name` = Business you called
     - `metadata` = Your request details
     - `status` = Call status

5. **Monitor Webhook**
   - [ ] Watch dev server console
   - [ ] **Verify:** See "📞 Webhook received: [event-type]"
   - [ ] As call progresses, multiple webhook events arrive
   - [ ] Call entry in Supabase updates automatically

---

## 🚨 Troubleshooting

### ❌ If Supabase Tests Fail

**Check browser console for errors:**
- Auth issues → Verify you're logged in
- RLS errors → Check Supabase policies
- Network errors → Verify Supabase URL/keys

**Check Supabase Dashboard:**
- Go to Table Editor
- Look for your data in respective tables
- Check "API" tab for real-time queries

### ❌ If Vapi Tests Fail

**"Vapi credentials not configured"**
- [ ] Check `.env.local` exists
- [ ] Verify all VAPI_* variables are set
- [ ] Restart dev server: `npm run dev`

**"Unauthorized" on function calls**
- [ ] Regenerate token: `openssl rand -base64 32`
- [ ] Update `.env.local`
- [ ] Update Vapi dashboard functions
- [ ] Restart dev server

**"Call initiated but no response"**
- [ ] Check Vapi account credits
- [ ] Verify phone number format (+1XXXXXXXXXX)
- [ ] Check Vapi dashboard for error logs
- [ ] Test with a different phone number

---

## 📊 Success Metrics

### ✅ Supabase Migration Success
- [ ] No localStorage errors in console
- [ ] Data persists after page refresh
- [ ] Data syncs across browser tabs
- [ ] All CRUD operations work
- [ ] Loading states show during async ops

### ✅ Vapi Integration Success  
- [ ] Environment variables all configured
- [ ] Function auth returns 401 without token
- [ ] Function auth succeeds with valid token
- [ ] Calls initiate without simulation warning
- [ ] Call history saves to Supabase
- [ ] Webhooks received in real-time
- [ ] Call details visible in dashboard

---

## 🎉 All Tests Passed?

Congratulations! Your app is now:
- ✅ **Cloud-backed** with Supabase
- ✅ **Secure** with proper authentication
- ✅ **Real-time** with webhooks & subscriptions
- ✅ **Production-ready** for AI phone calls

---

## 📚 Next Steps

1. **Deploy to production:**
   - Get public HTTPS URL (Vercel, Netlify, etc.)
   - Update `NEXT_PUBLIC_APP_URL` 
   - Update Vapi function URLs in dashboard

2. **Configure Vapi Assistant:**
   - Add the 3 server functions
   - Include Authorization headers
   - Test from Vapi dashboard

3. **Monitor & Optimize:**
   - Set up error tracking (Sentry)
   - Monitor Vapi usage/costs
   - Review Supabase query performance
   - Check RLS policies are working

---

**Questions?** Check these docs:
- `VAPI_SETUP_AND_TESTING.md` - Detailed Vapi guide
- `VAPI_QUICK_REFERENCE.md` - Quick fixes
- `WORK_COMPLETE_SUMMARY.md` - What was done
- `MIGRATION_GUIDE.md` - Supabase migration details

**Run automated checks:**
```bash
npx ts-node scripts/verify-vapi-setup.ts
```









