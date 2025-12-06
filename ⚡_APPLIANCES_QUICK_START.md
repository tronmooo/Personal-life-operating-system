# ⚡ Appliances Domain - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Set Up the Database (2 minutes)

1. **Open Supabase SQL Editor**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run the Schema**
   ```sql
   -- Copy and paste the entire contents of:
   -- /supabase/appliances-schema.sql
   -- Then click "Run"
   ```

3. **Verify Tables Created**
   - Check that these 8 tables exist:
     - `appliances`
     - `appliance_maintenance`
     - `appliance_repairs`
     - `appliance_documents`
     - `appliance_service_providers`
     - `appliance_warranties`
     - `appliance_energy_tracking`
     - `appliance_replacement_planning`

### Step 2: Access the Appliances Domain (30 seconds)

1. **Navigate to Appliances**
   - Go to `/domains/appliances`

2. **Click the "Profiles" Tab**
   - This is where the new enhanced view lives

### Step 3: Add Your First Appliance (2 minutes)

1. **Click "Add Appliance"**

2. **Fill in Basic Info:**
   - Name: "Refrigerator" (or your appliance)
   - Category: "Kitchen - Major"
   - Brand: "Samsung" (or yours)
   - Model: Your model number
   - Location: "Kitchen"

3. **Add Purchase Details:**
   - Purchase Date: When you bought it
   - Purchase Price: What you paid
   - Expected Lifespan: 10-15 years (for refrigerator)

4. **Set Status:**
   - Current Status: "Working"
   - Condition: "Good" (or current condition)

5. **Click "Add Appliance"**

### Step 4: View AI Recommendation (Instant!)

Once you add an appliance, the system automatically:
- ✅ Calculates age and lifespan percentage
- ✅ Generates AI recommendation (Keep, Monitor, or Replace)
- ✅ Estimates replacement cost
- ✅ Calculates resale value
- ✅ Shows cost of ownership

**Click on your appliance to see the full AI analysis!**

---

## 🎯 What to Add First

### Priority 1: Major Appliances (Most Important)
1. **Refrigerator** - Usually most expensive
2. **HVAC System** - Highest impact on energy bills
3. **Water Heater** - Critical when it fails
4. **Washer & Dryer** - Daily use items
5. **Dishwasher** - Convenience appliance

### Priority 2: Costly Items
6. **Oven/Range** - If separate from cooktop
7. **Microwave** - If built-in
8. **TV** - If expensive/under warranty

### Priority 3: Everything Else
9. Small appliances worth tracking
10. Items still under warranty

---

## 📊 Quick Feature Tour

### Dashboard Tab
- **See at a glance:**
  - How many appliances you have
  - Which ones need attention
  - What's under warranty
  - Upcoming maintenance

### All Appliances Tab
- **Filter by category:**
  - Kitchen, Laundry, HVAC, etc.
- **Search** by name or brand
- **View lifespan progress** for each item

### Individual Appliance View
Click any appliance to see:
- **AI Recommendation** with reasoning
- **Full cost analysis**
- **Maintenance history**
- **Repair tracking**
- **Energy usage**
- **Documents & warranties**

---

## 💡 Pro Tips

### 1. **Start Simple**
Just add name, category, and purchase date for now. You can always add more details later!

### 2. **Take Photos**
When adding appliances, snap a quick photo of:
- The appliance itself
- The serial number plate
- The purchase receipt (if you have it)

### 3. **Set Realistic Lifespans**
If you don't know, use these defaults:
- Refrigerators: 12 years
- Washers/Dryers: 11 years
- Dishwashers: 10 years
- HVAC: 17 years
- Water Heaters: 10 years
- Ovens/Ranges: 15 years
- Microwaves: 9 years

### 4. **Log First Maintenance**
Even if it's just "cleaned coils" or "changed filter" - this establishes a baseline.

### 5. **Track Energy Costs**
For major appliances, estimate monthly energy cost:
- Check your utility bill
- Or use this formula: (Watts × Hours Used Daily × 30 × $0.12) / 1000

---

## 🎨 Understanding AI Recommendations

### 🟢 Keep & Maintain
**What it means:** Appliance is in good shape
**What to do:** Continue regular maintenance

### 🔵 Monitor Closely  
**What it means:** Getting older but still working
**What to do:** Start researching replacement options

### 🟡 Plan Replacement
**What it means:** Should budget for replacement
**What to do:** Set aside money, watch for sales

### 🟠 Replace Soon
**What it means:** High repair costs or past lifespan
**What to do:** Plan replacement within 6 months

### 🔴 Replace Immediately
**What it means:** Broken or critical issues
**What to do:** Replace ASAP

### 💰 Sell Now
**What it means:** Like-new, good resale value
**What to do:** Consider selling if upgrading

---

## 🔧 Common First Steps

### If Your Appliance is New (< 3 years old)
1. Add purchase details
2. Save warranty info
3. Set up maintenance reminders
4. **Expected Recommendation:** "Keep & Maintain"

### If Your Appliance is Mid-Life (3-7 years old)
1. Add purchase details
2. Log any repairs you remember
3. Note current condition
4. **Expected Recommendation:** "Keep & Maintain" or "Monitor Closely"

### If Your Appliance is Old (7+ years)
1. Add all details you can remember
2. Log repair history
3. Note any current issues
4. **Expected Recommendation:** May suggest "Plan Replacement" or "Replace Soon"

### If Your Appliance is Broken
1. Add basic details
2. Set status to "Broken"
3. Log the issue in repairs
4. **Expected Recommendation:** "Replace Immediately"

---

## 📅 Maintenance Tracking

### Add a Maintenance Record
1. Go to individual appliance
2. Click "Maintenance" tab
3. Click "Log Maintenance"
4. Fill in:
   - Service Type (Filter Change, Cleaning, etc.)
   - Date performed
   - Cost (if any)
   - Next due date

### Common Maintenance Tasks

**HVAC System:**
- Filter change: Monthly or quarterly
- Professional service: Annually
- Duct cleaning: Every 3-5 years

**Refrigerator:**
- Clean coils: Quarterly
- Replace water filter: Every 6 months
- Clean door seals: Monthly

**Washer/Dryer:**
- Clean lint trap: After each use (dryer)
- Clean washer drum: Monthly
- Check hoses: Annually

**Dishwasher:**
- Clean filter: Monthly
- Run cleaning cycle: Monthly
- Check spray arms: Quarterly

---

## 🚨 Reporting Issues

### When Something Breaks
1. Click "Report Issue"
2. Fill in:
   - Issue description
   - When noticed
   - Severity (Minor/Moderate/Major/Critical)
   - Current status

3. System will:
   - Create an alert
   - Update recommendation
   - Track for future decisions

---

## 💰 Cost Tracking Benefits

The system tracks:
1. **Purchase price** - What you paid
2. **Repair costs** - All fixes over time
3. **Maintenance costs** - Preventive care
4. **Energy costs** - Monthly usage
5. **Total cost of ownership** - Everything combined

**Use this to decide:**
- Repair or replace?
- Buy warranty or not?
- When to upgrade?

---

## 🎯 Your First Week

### Day 1: Setup & Major Appliances
- Set up database
- Add 3-5 major appliances

### Day 2: Details & Warranties
- Add warranty info
- Upload documents/receipts

### Day 3: Maintenance
- Log any recent maintenance
- Set up recurring schedules

### Day 4: Energy Tracking
- Add energy usage estimates
- Note Energy Star ratings

### Day 5: Review Recommendations
- Check AI suggestions
- Plan any needed actions

### Week 2+: Ongoing
- Log maintenance as performed
- Report issues immediately
- Review monthly energy usage
- Plan replacements based on AI

---

## 📈 Expected Results

### After 1 Week:
- ✅ All major appliances tracked
- ✅ Warranty dates in system
- ✅ AI recommendations for each item
- ✅ Maintenance schedule started

### After 1 Month:
- ✅ First round of maintenance logged
- ✅ Energy usage tracked
- ✅ Cost trends visible
- ✅ Replacement plans forming

### After 3 Months:
- ✅ Accurate cost of ownership data
- ✅ Reliable AI predictions
- ✅ Proactive maintenance routine
- ✅ Budget for replacements

### After 6 Months:
- ✅ Full lifecycle visibility
- ✅ Energy efficiency insights
- ✅ Smart replacement timing
- ✅ Thousands saved vs reactive approach

---

## ❓ Quick FAQ

**Q: What if I don't know the purchase date?**
A: Estimate it! Even "approximately 2018" is better than nothing.

**Q: Should I add really old appliances?**
A: Yes! Especially if they're still working. The AI will tell you when to replace them.

**Q: What about small appliances like toasters?**
A: If it cost over $50 or has a warranty, add it!

**Q: Can I add appliances I'm researching to buy?**
A: Not yet, but you can add them with status "Replaced" once purchased.

**Q: How often should I update this?**
A: 
- Add new appliances: When purchased
- Log maintenance: When performed
- Report issues: Immediately
- Review dashboard: Weekly

---

## 🎉 You're Ready!

**Your appliance tracking system is now set up!**

### Next Steps:
1. ✅ Database is ready
2. ✅ Add your first appliance (5 min)
3. ✅ View AI recommendation
4. ✅ Set up maintenance schedule
5. ✅ Start tracking costs

### The System Will:
- 🤖 Analyze all your appliances
- 📊 Predict replacement timing
- 💰 Calculate cost savings
- ⚡ Identify energy inefficiencies
- 📅 Remind you of maintenance
- ✅ Help you make smart decisions

**Start now at `/domains/appliances` → Profiles tab!**

---

*Need help? Check the main guide: 🎉_APPLIANCES_DOMAIN_COMPLETE_AI_POWERED.md*

















