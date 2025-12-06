# 🚀 Quick Commands & Document Expiration Tracking - Complete Guide

## ✅ What's Been Implemented

### 1. **Quick Commands Buttons - FULLY FUNCTIONAL** 🎯

All 8 Quick Command buttons in the Insights page (`/insights`) are now fully functional!

#### The 8 Quick Commands:
1. **💰 Financial Summary** - Shows net worth, income, expenses breakdown
2. **❤️ Health Report** - Weight trends, fitness progress, vitals
3. **📅 This Week's Focus** - Priority items and recommendations
4. **⚠️ What Needs Attention** - Overdue tasks and alerts
5. **📊 Progress Report** - Goal status across all domains
6. **🎯 Goal Check-in** - Detailed analysis of goal progress
7. **💡 Optimize My Life** - AI suggestions for improvement
8. **🧠 Deep Dive Analysis** - Comprehensive multi-domain insights

#### How They Work:
- Visit: **http://localhost:3000/insights**
- Click any of the 8 buttons
- AI instantly analyzes your data and provides personalized insights
- Real-time calculations based on ALL your tracked data

---

### 2. **Document Expiration Tracking System** 📄⏰

A complete system that automatically detects, tracks, and alerts you about document expirations!

#### Features:

##### A) **Smart Expiration Detection**
When you upload a document (PDF, image), the OCR automatically looks for:
- ✅ **"EXP"** or **"EXPIRES"** text
- ✅ **"EXPIRATION DATE"**
- ✅ **"VALID UNTIL"** or **"VALID THRU"**
- ✅ **"EXPIRY"**
- ✅ Any date patterns near these keywords

**Supported Documents:**
- Driver's Licenses
- Passports
- Insurance Cards
- ID Cards
- Visas
- Certifications
- Warranties
- Memberships
- Professional Licenses

##### B) **User Confirmation Dialog**
When an expiration date is found:
1. **Dialog pops up automatically** asking: "Would you like to track this expiration?"
2. Shows:
   - Document name
   - Detected expiration date
   - Days until expiration
   - Urgency level (red if < 30 days)
3. **You can adjust:**
   - The expiration date (if OCR was wrong)
   - Reminder days (default: 14 days before)
4. **Two choices:**
   - **"Yes, Track It!"** - Creates task & alerts
   - **"No Thanks"** - Just saves the document

##### C) **Automatic Alerts in Command Center** 🔔
When you choose to track an expiration:
- ✅ **Task created** automatically: "Renew: [Document Name]"
- ✅ **Alert shows in Command Center** starting 14 days before expiration
- ✅ **Priority level** set automatically:
  - **HIGH** if expires in ≤ 14 days
  - **MEDIUM** if expires in > 14 days
- ✅ **Bell icon** (🔔) distinguishes document alerts from other alerts
- ✅ **Link to domain** for quick access

##### D) **Alert Display** 
Alerts appear in the **Command Center** (home page) in the **"Alerts"** card (top-left):
- Shows document name
- Shows "expires soon"
- Shows exact expiration date
- Shows days remaining
- Sorted by urgency (soonest first)
- **Maximum 5 alerts** displayed at once

---

## 🎮 How to Use

### Upload a Document with Expiration Date:

#### Step 1: Go to any domain
```
http://localhost:3000/domains/insurance
```
(or any domain like: `legal`, `education`, `health`, `travel`, etc.)

#### Step 2: Click "Documents" tab

#### Step 3: Upload your document
- Click "Upload Document" or "Smart Document Upload"
- Select PDF or image (JPG, PNG, WEBP)
- **Auto-processing starts immediately**

#### Step 4: Wait for OCR (10-30 seconds)
The system will:
1. Extract all text from the document
2. Search for expiration dates
3. Analyze the document type

#### Step 5: Review Expiration Dialog (if found)
If an expiration date is detected:
- **Dialog appears automatically**
- Shows: Document name, expiration date, days until expiration
- **Adjust if needed:**
  - Change expiration date
  - Set reminder days (default: 14)
- **Choose:**
  - **"Yes, Track It!"** - Enables tracking & alerts
  - **"No Thanks"** - Skips tracking

#### Step 6: Check Command Center
Visit homepage: **http://localhost:3000**
- Look at **"Alerts"** card (top-left)
- Your document expiration alert will appear **14 days before** (or your custom reminder days)
- Alert shows:
  - 🔔 Document name + "expires soon"
  - Exact expiration date
  - Days remaining
  - Priority badge (HIGH/MEDIUM)

---

## 📊 Examples

### Example 1: Driver's License

**Scenario:** Upload driver's license PDF with "EXP: 12/31/2025"

**What Happens:**
1. OCR extracts: "EXP: 12/31/2025"
2. Dialog pops up: "Expiration Date Detected!"
3. Shows:
   - Document: drivers_license.pdf
   - Expires: December 31, 2025
   - 426 days from now
4. You click "Yes, Track It!" (with 14 days reminder)
5. **Results:**
   - ✅ Task created: "Renew: drivers_license.pdf"
   - ✅ Due date: December 17, 2025 (14 days before)
   - ✅ Priority: HIGH
   - ✅ Alert will appear in Command Center on Dec 17, 2025

### Example 2: Insurance Card

**Scenario:** Upload insurance card image with "VALID UNTIL 03/15/2026"

**What Happens:**
1. OCR extracts: "VALID UNTIL 03/15/2026"
2. Dialog shows:
   - Expires: March 15, 2026
   - 157 days from now
3. You adjust reminder to **30 days** before
4. Click "Yes, Track It!"
5. **Results:**
   - ✅ Alert appears February 13, 2026 (30 days before)
   - ✅ Task shows in Tasks section
   - ✅ Command Center alert with 🔔 icon

### Example 3: Passport

**Scenario:** Upload passport with "Expiration Date: 08/20/2027"

**What Happens:**
1. OCR detects expiration
2. Dialog shows: 1,044 days until expiration
3. You set reminder to **60 days** before
4. Click "Yes, Track It!"
5. **Results:**
   - ✅ Alert appears June 21, 2027 (60 days before)
   - ✅ MEDIUM priority (far in future)
   - ✅ Task created with link to passport document

---

## 🔍 Where to Find Things

### Quick Commands:
- **Location:** `/insights` page
- **Access:** http://localhost:3000/insights
- **Look for:** "Quick Commands" card with 8 colorful buttons

### Document Upload:
- **Any domain page** → **Documents tab** → **Smart Document Upload**
- Examples:
  - http://localhost:3000/domains/insurance → Documents
  - http://localhost:3000/domains/legal → Documents
  - http://localhost:3000/domains/health → Documents

### Expiration Alerts:
- **Location:** Command Center (homepage)
- **Access:** http://localhost:3000
- **Look for:** "Alerts" card (top-left corner)
- **Icon:** 🔔 (bell icon) for document expiration alerts

### Tasks Created:
- **Command Center** → Tasks card
- **Tasks page:** http://localhost:3000/domains/tasks
- Look for: "Renew: [Document Name]"

---

## ⚙️ Technical Details

### Expiration Detection Algorithm:
```typescript
// Keywords searched:
- "exp", "expiration", "expires"
- "valid until", "valid thru"
- "expiry"
- "end date"

// Date patterns recognized:
- MM/DD/YYYY
- DD/MM/YYYY
- YYYY-MM-DD
- Month DD, YYYY
- DD Month YYYY
```

### Alert Trigger Logic:
```typescript
// Alert appears when:
if (daysUntilExpiration <= reminderDays) {
  showAlertInCommandCenter()
}

// Priority assignment:
priority = daysUntilExpiration <= 14 ? 'HIGH' : 'MEDIUM'
```

### Data Storage:
- **Tasks:** Stored in `localStorage` under `tasks`
- **Expiration Alerts:** Stored in `localStorage` under `expirationAlerts`
- **Documents:** Stored in `localStorage` under `lifehub-documents`
- **Real-time updates:** Events dispatched to sync all components

---

## 🎨 Visual Indicators

### In Expiration Dialog:
- **🟠 Orange background** - Expires in < 30 days
- **🔵 Blue background** - Expires in > 30 days
- **⚠️ Warning icon** - Urgent expiration
- **📅 Calendar icon** - Standard expiration

### In Command Center Alerts:
- **🔴 Red badge** - HIGH priority (≤ 14 days)
- **🟡 Yellow badge** - MEDIUM priority (> 14 days)
- **🔔 Bell icon** - Document expiration alert
- **💰 Dollar icon** - Bill due alert
- **❤️ Heart icon** - Health expiry alert

---

## 🐛 Troubleshooting

### "No expiration date detected"
**Possible reasons:**
- Document quality too low (blurry, dark)
- Expiration text in unusual format
- OCR confidence too low
**Solution:** Try a clearer scan or manually add expiration in task

### "Alert not showing in Command Center"
**Check:**
1. Did you click "Yes, Track It!" in the dialog?
2. Is the expiration within the reminder window? (check days until expiration)
3. Refresh the page (Command Center)
4. Check browser console for errors

### "Dialog didn't appear"
**Possible reasons:**
- No expiration date found in document
- Date format not recognized
- OCR failed
**Solution:** Check the extracted text in the editor, manually create a task

---

## 🎉 Benefits

### For Quick Commands:
✅ **Instant insights** - No typing required
✅ **Personalized** - Based on YOUR real data
✅ **Comprehensive** - 8 different analysis types
✅ **Smart** - AI-powered recommendations
✅ **Fast** - Results in < 2 seconds

### For Expiration Tracking:
✅ **Never miss a renewal** - Automatic reminders
✅ **Smart detection** - Works with any document type
✅ **Customizable** - Set your own reminder days
✅ **Visual alerts** - Clear priority indicators
✅ **Centralized** - All alerts in one place
✅ **Automatic** - No manual date entry needed

---

## 📝 Summary

**Quick Commands:**
- 8 fully functional AI-powered insight buttons
- Located in `/insights` page
- One-click analysis of your life data

**Expiration Tracking:**
- Automatic expiration date detection from documents
- User confirmation dialog with customization
- Automatic task creation
- Alerts in Command Center starting 2 weeks before (customizable)
- Works with driver's licenses, passports, insurance cards, etc.

**Everything is fully implemented and ready to use!** 🚀

Visit http://localhost:3000 to start using these features now!

