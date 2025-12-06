# 🚀 ADVANCED EXPIRATION TRACKING - Complete Guide

## ✨ What's New & Advanced

Your expiration tracking system has been upgraded with **enterprise-grade features**!

---

## 🎯 Key Improvements

### 1. **1 Month Default Reminder** ⏰
- **Default changed from 14 days to 30 days (1 month)**
- Gives you plenty of time to prepare for renewal
- Auto-adjusts based on document urgency

### 2. **Quick Preset Options** 🎨
Choose from 5 preset reminder timeframes:
- **1 Week Before** (7 days) - For urgent documents
- **2 Weeks Before** (14 days) - Standard reminders
- **1 Month Before** (30 days) - ⭐ RECOMMENDED (default)
- **2 Months Before** (60 days) - For complex renewals
- **3 Months Before** (90 days) - For long-lead-time documents

### 3. **Multiple Reminder System** 🔔
Enable "Multiple Reminders" to get **4 automatic alerts**:
1. **First Alert** - Your chosen timeframe (e.g., 1 month before)
2. **Second Alert** - Halfway to expiration
3. **Final Alert** - 1 week before expiration
4. **Expiration Day** - On the actual expiration date

**Example with 1 month (30 days) default:**
```
Document expires: December 31, 2025

You'll get reminders on:
• December 1, 2025 (30 days before) - MEDIUM priority
• December 16, 2025 (15 days before) - MEDIUM priority  
• December 24, 2025 (7 days before) - HIGH priority
• December 31, 2025 (expiration day) - HIGH priority
```

### 4. **Smart Priority System** 🎯
**Auto-detection based on urgency:**
- **HIGH** - Expires in ≤ 30 days (red alerts)
- **MEDIUM** - Expires in 31-90 days (yellow alerts)
- **LOW** - Expires in > 90 days (blue alerts)

**Manual override:** Choose your own priority level

### 5. **Custom Notes Field** 📝
Add detailed notes like:
- Renewal requirements
- Documents needed
- Website URLs
- Phone numbers
- Important instructions

### 6. **Document Type Detection** 🔍
Automatically detects and categorizes:
- Driver's License
- Passport
- Insurance Policy
- Professional License
- Membership
- Warranty
- Certification
- And more...

### 7. **Notification Methods** 📱
Choose how you want to be notified:
- ✅ **Push Notifications** - In-app alerts (active)
- 📧 **Email Reminders** - Coming soon (UI ready)

### 8. **Visual Timeline** 📊
See exactly when you'll be reminded with:
- Color-coded priority badges
- Date breakdown
- Days remaining counter
- Urgency indicators

---

## 🎮 How to Use

### Step 1: Upload Document
Visit any domain (e.g., http://localhost:3000/domains/insurance)
1. Click **"Documents"** tab
2. Click **"Smart Document Upload"**
3. Upload your PDF or image with expiration date

### Step 2: OCR Processing
Wait 10-30 seconds while the system:
- ✅ Extracts all text
- ✅ Detects expiration date
- ✅ Identifies document type

### Step 3: Advanced Tracking Dialog
When expiration is detected, you'll see:

```
┌─────────────────────────────────────────────┐
│ 📅 Advanced Expiration Tracking              │
├─────────────────────────────────────────────┤
│                                             │
│ ⚠️ drivers_license.pdf          [ACTIVE]    │
│    Type: Driver's License                   │
│    Expires: December 31, 2025               │
│    426 days remaining                       │
│                                             │
│ WHEN TO REMIND YOU:                         │
│ [1 Week] [2 Weeks] [1 Month★] [2 Mo] [3 Mo]│
│                                             │
│ PRIORITY LEVEL:                             │
│ ○ High   ● Medium   ○ Low                   │
│                                             │
│ ☑ Enable Multiple Reminders [Advanced]     │
│                                             │
│ You'll receive alerts on:                   │
│ • First Alert: Dec 1, 2025    [MEDIUM]     │
│ • Second Alert: Dec 16, 2025  [MEDIUM]     │
│ • Final Alert: Dec 24, 2025   [HIGH]       │
│ • Expiration Day: Dec 31, 2025 [HIGH]      │
│                                             │
│ CUSTOM NOTES:                               │
│ [Add renewal requirements...]               │
│                                             │
│ NOTIFICATION METHODS:                       │
│ ☑ Push Notifications (In-app)              │
│ ☐ Email Reminders (Coming Soon)            │
│                                             │
│ ✨ What will happen:                        │
│ • 4 tasks created                           │
│ • First alert on Dec 1, 2025               │
│ • Follow-up reminders leading to exp date   │
│ • Alerts in Command Center (MEDIUM)        │
│                                             │
│ [Skip Tracking]    [Track with 4 Reminders]│
└─────────────────────────────────────────────┘
```

### Step 4: Customize Your Tracking
1. **Adjust expiration date** if OCR was wrong
2. **Choose reminder timeframe** (1 month recommended)
3. **Set priority level** (or let it auto-detect)
4. **Enable multiple reminders** for peace of mind
5. **Add custom notes** for renewal instructions
6. **Choose notification methods**
7. Click **"Track with Smart Alerts"**

### Step 5: View Alerts in Command Center
Visit http://localhost:3000
- Check **"Alerts"** card (top-left)
- See your document expiration alerts
- Click to view full details

---

## 📊 Features Comparison

| Feature | Basic (Old) | Advanced (New) |
|---------|-------------|----------------|
| Default Reminder | 14 days | **30 days (1 month)** |
| Preset Options | None | **5 presets** |
| Multiple Reminders | No | **Yes (4 alerts)** |
| Priority System | Auto only | **Auto + Manual** |
| Custom Notes | No | **Yes (unlimited text)** |
| Document Detection | Basic | **Advanced categorization** |
| Notification Options | Push only | **Push + Email (soon)** |
| Visual Timeline | No | **Yes (color-coded)** |
| Custom Days | Yes | **Yes (1-365 days)** |

---

## 🎯 Real-World Examples

### Example 1: Driver's License (Urgent)
**Scenario:** Expires in 45 days

**Configuration:**
- Reminder: 1 month before (30 days)
- Multiple reminders: ON
- Priority: AUTO (→ HIGH)
- Notes: "Bring birth certificate and proof of address"

**Result:**
- ✅ 4 tasks created
- ✅ First alert in 15 days
- ✅ Follow-ups at 22 days, 38 days, and expiration
- ✅ All show in Command Center with HIGH priority

### Example 2: Passport (Long Lead Time)
**Scenario:** Expires in 18 months (540 days)

**Configuration:**
- Reminder: 3 months before (90 days)
- Multiple reminders: ON
- Priority: LOW
- Notes: "Renewal takes 6-8 weeks. Check photo requirements online."

**Result:**
- ✅ 4 tasks created
- ✅ First alert in 450 days (15 months from now)
- ✅ Plenty of time to prepare
- ✅ LOW priority until closer to expiration

### Example 3: Professional License (Complex)
**Scenario:** Expires in 4 months (120 days)

**Configuration:**
- Reminder: 2 months before (60 days)
- Multiple reminders: ON
- Priority: MEDIUM
- Notes: "Need 20 CE credits. Check board website for approved courses. Submit 30 days before exp."

**Result:**
- ✅ 4 detailed reminders
- ✅ Custom notes visible in each task
- ✅ Enough time to complete CE requirements
- ✅ Final reminder 7 days before to submit

---

## 🔔 Alert Display

### In Command Center:
```
┌────────────────────────────────────────┐
│ ⚠️ Alerts                           3  │
├────────────────────────────────────────┤
│                                        │
│ 🔔 drivers_license.pdf expires soon    │
│    Expires: December 31, 2025          │
│    15 days left                  [HIGH]│
│    Notes: Bring birth certificate      │
│                                        │
│ 🔔 passport.pdf expires soon           │
│    Expires: June 15, 2027              │
│    450 days left                  [LOW]│
│                                        │
│ 💰 Electric Bill due                   │
│    Due: November 15                    │
│    3 days left                   [HIGH]│
│                                        │
└────────────────────────────────────────┘
```

### In Tasks List:
```
┌────────────────────────────────────────┐
│ TASKS                                  │
├────────────────────────────────────────┤
│                                        │
│ ☐ [First Alert] Renew: drivers_license│
│    Due: Dec 1, 2025          [MEDIUM] │
│    Notes: Bring birth certificate...  │
│                                        │
│ ☐ [Second Alert] Renew: drivers_lic...│
│    Due: Dec 16, 2025         [MEDIUM] │
│                                        │
│ ☐ [Final Alert] Renew: drivers_licen.│
│    Due: Dec 24, 2025           [HIGH] │
│                                        │
│ ☐ [Expiration Day] Renew: drivers_l...│
│    Due: Dec 31, 2025           [HIGH] │
│                                        │
└────────────────────────────────────────┘
```

---

## ⚙️ Technical Details

### Storage Format:
```javascript
{
  id: "1699123456789",
  documentName: "drivers_license.pdf",
  expirationDate: "2025-12-31T00:00:00.000Z",
  reminderDate: "2025-12-01T00:00:00.000Z",
  documentType: "Driver's License",
  domain: "insurance",
  priority: "high",
  multipleReminders: true,
  reminderDays: 30,
  customNotes: "Bring birth certificate and proof of address",
  enableEmail: false,
  enablePush: true,
  isActive: true,
  createdAt: "2024-11-05T12:00:00.000Z"
}
```

### Multiple Reminder Logic:
```javascript
if (multipleReminders) {
  reminderDates = [
    primaryReminder: expirationDate - reminderDays,
    secondAlert: expirationDate - (reminderDays / 2),
    finalAlert: expirationDate - 7 days,
    expirationDay: expirationDate
  ]
}
```

---

## 🎨 Advanced Features

### 1. **Auto-Priority Detection**
```javascript
if (daysUntil <= 30) priority = 'HIGH'
else if (daysUntil <= 90) priority = 'MEDIUM'
else priority = 'LOW'
```

### 2. **Smart Notes Generation**
Auto-populates notes based on document type:
- Driver's License → "Bring required documents..."
- Passport → "Check photo requirements..."
- Insurance → "Review coverage options..."

### 3. **Priority Escalation**
As expiration approaches:
- LOW → MEDIUM at 90 days
- MEDIUM → HIGH at 30 days
- HIGH → URGENT at 7 days

### 4. **Batch Operations** (Coming Soon)
- Track multiple documents at once
- Bulk edit reminders
- Export reminder calendar

---

## 🚀 Start Using Now!

1. Visit: **http://localhost:3000/domains/insurance**
2. Click **"Documents"** tab
3. Upload a document with an expiration date
4. Experience the **Advanced Expiration Tracking**!

---

## 📝 Summary

**✅ 1 Month Default** - Changed from 14 days to 30 days
**✅ 5 Preset Options** - Quick selection for different timeframes
**✅ Multiple Reminders** - 4 automatic alerts leading to expiration
**✅ Smart Priority** - Auto-detection with manual override
**✅ Custom Notes** - Add detailed renewal instructions
**✅ Document Detection** - Intelligent categorization
**✅ Visual Timeline** - Color-coded alert schedule
**✅ Notification Choice** - Push + Email (coming soon)

**Your document expiration tracking is now ENTERPRISE-GRADE!** 🎉

