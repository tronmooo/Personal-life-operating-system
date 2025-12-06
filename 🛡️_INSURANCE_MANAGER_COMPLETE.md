# 🛡️ Insurance Manager - Complete with OCR!

## ✅ All Features Implemented

### 📸 Smart Document Scanner with OCR
**Take a photo of any insurance document and automatically extract:**
- ✅ Policy Number
- ✅ Insurance Provider
- ✅ Premium Amount
- ✅ Coverage Amount
- ✅ Expiration/Valid Until Date
- ✅ Next Payment Date
- ✅ Phone Number
- ✅ Email Address
- ✅ **Photo is always saved!**

### 🔔 30-Day Expiration Reminders
**Automatic alerts for expiring policies:**
- System checks expiration dates when adding policies
- Creates critical alerts for policies expiring within 30 days
- Shows alert banner on dashboard
- Reminders go to Command Center Critical Alerts

### 📊 Dashboard Stats (Top of Policies Tab)
Four beautiful stat cards with colored left borders:
1. **Total Policies** (Blue border) - Count of all policies
2. **Active Policies** (Green border) - Only active policies
3. **Annual Premium** (Purple border) - Total yearly cost across all active policies
4. **Total Claims** (Orange border) - Number of claims filed

### 🛡️ Insurance Types Supported
- Health Insurance 🏥
- Auto Insurance 🚗
- Home/Renters Insurance 🏠
- Life Insurance ❤️
- Dental Insurance 🦷
- Vision Insurance 👁️
- Pet Insurance 🐾
- Disability Insurance
- Umbrella Insurance

### 📋 Three Main Tabs

#### 1. **Insurance Policies Tab**
- View all policies with beautiful color-coded cards
- Each policy shows:
  - Policy type with emoji icon
  - Provider name
  - Policy number
  - Premium and frequency (Monthly/Quarterly/Annually)
  - Coverage amount
  - Expiration date
  - Contact info (phone & email)
  - Active/Expired status badge
  - Scanned document (expandable)
- Edit and delete buttons
- Expiring soon alert banner

#### 2. **Claims Management Tab**
- File new claims
- View all claims with status badges
- Claim information:
  - Claim number (auto-generated: CLM-2024-001)
  - Linked to policy
  - Claim date
  - Claim amount
  - Approved amount (if applicable)
  - Status: Pending, In Review, Approved, Denied
  - Description
- Edit and delete claims

#### 3. **Premium Payment Tracker Tab**
- **Large purple gradient card** showing Total Annual Premium
- Individual payment cards for each active policy showing:
  - Payment frequency
  - Premium amount
  - Annual cost (auto-calculated)
  - Next payment date
  - Coverage period with progress bar

## 🎯 Key Features

### 📸 OCR Document Scanning
```
1. Click "Add Policy" button
2. Click "Take Photo & Auto-Fill"
3. Take photo of insurance card/document
4. System extracts all data automatically
5. Review and correct any errors
6. Photo is saved with policy
7. Click "Add Policy"
```

### 🔍 What OCR Extracts
- **Policy Number**: Patterns like HC-2024-001, POL123456
- **Provider**: Blue Cross, Aetna, Cigna, Geico, State Farm, etc.
- **Premium**: Dollar amounts ($450)
- **Coverage**: Large dollar amounts ($500,000)
- **Phone**: 1-800-555-0100
- **Email**: support@provider.com
- **Expiration**: Any date with "expires", "valid", "until"

### ⏰ Expiration Tracking
- Checks expiration when adding policy
- If expiring within 30 days:
  - Creates critical alert
  - Shows orange banner on policies tab
  - Alert visible in Command Center
- Helps you never miss a renewal!

## 📁 Files Created

```
/app/insurance/page.tsx
- Main insurance domain page
- 3-tab navigation (Policies, Claims, Payments)
- Header with gradient shield icon

/components/insurance/policies-tab.tsx
- Stats cards at top
- Expiring soon alert
- All policies list
- Color-coded by type
- Shows scanned documents

/components/insurance/add-policy-dialog.tsx
- Photo capture button
- OCR with Tesseract.js
- Auto-fills all fields
- Saves photo with policy
- Creates expiration alerts

/components/insurance/claims-tab.tsx
- File claims button
- Claims list with status
- Linked to policies
- Edit/delete functionality

/components/insurance/payments-tab.tsx
- Total annual premium card
- Individual payment trackers
- Progress bars for coverage period
- Auto-calculates annual costs

/components/insurance/add-claim-dialog.tsx
- File claim form
- Select from active policies
- Status dropdown
- Amount tracking
```

## 💾 Data Storage

### Insurance Policies
```javascript
localStorage.getItem('insurance-policies')

[
  {
    id: "1234567890",
    type: "Health",
    provider: "Blue Cross",
    policyNumber: "HC-2024-001",
    premium: 450,
    frequency: "Monthly",
    coverage: 500000,
    validUntil: "2024-12-30",
    phone: "1-800-555-0100",
    email: "support@bluecross.com",
    status: "Active",
    documentPhoto: "data:image/jpeg;base64,...",
    nextPayment: "2023-12-31"
  }
]
```

### Claims
```javascript
localStorage.getItem('insurance-claims')

[
  {
    id: "1234567890",
    claimNumber: "CLM-2024-001",
    policyId: "1234567890",
    policyNumber: "HC-2024-001",
    policyType: "Health",
    provider: "Blue Cross",
    claimDate: "2024-03-14",
    claimAmount: 2500,
    approvedAmount: 2200,
    status: "Approved",
    description: "Hospital visit"
  }
]
```

### Expiration Alerts
```javascript
localStorage.getItem('critical-alerts')

[
  {
    id: "insurance-expiry-1234567890",
    type: "insurance",
    title: "Health Insurance Expiring Soon",
    message: "Your Health insurance policy (HC-2024-001) expires on 12/30/2024",
    date: "2024-11-30T...",
    priority: "high"
  }
]
```

## 🚀 How to Use

### Add Your First Policy (with OCR)
1. Go to **Insurance** domain
2. Click **"Add Policy"** (top right)
3. Click **"Take Photo & Auto-Fill"** (blue button)
4. Allow camera access
5. Take photo of insurance card
6. Wait for "Photo saved! Data extracted..."
7. Review auto-filled information
8. Correct any errors
9. Click **"Add Policy"**

### File a Claim
1. Go to **Claims Management** tab
2. Click **"File Claim"**
3. Select policy from dropdown
4. Enter claim date and amount
5. Add description
6. Set status (Pending, In Review, Approved, Denied)
7. Click **"File Claim"**

### View Premium Payments
1. Go to **Premium Tracker** tab
2. See total annual premium at top
3. View breakdown by policy
4. See payment frequency and next due date
5. Track coverage period with progress bar

### Check Expiring Policies
1. Go to **Insurance Policies** tab
2. Look for orange "Expiring Soon" banner
3. Review policies needing renewal
4. Also visible in Command Center alerts!

## 🎨 Design Features

### Beautiful UI
- Gradient headers (blue to indigo)
- Color-coded policy cards
- Type-specific emojis (🏥 🚗 🏠)
- Status badges (Active/Expired)
- Clean, modern design
- Responsive grid layouts

### Stats Cards
- Bordered cards with left accent
- Large numbers
- Color coordination:
  - Blue: Total Policies
  - Green: Active Policies
  - Purple: Annual Premium
  - Orange: Total Claims

### Progress Bars
- Purple gradient for coverage period
- Visual representation of time elapsed
- Smooth animations

## ✨ Smart Features

### Auto-Calculations
- Annual premium from monthly/quarterly
- Total across all policies
- Approved vs claimed amounts
- Coverage period progress

### Auto-Generated IDs
- Claim numbers: CLM-2024-001
- Unique timestamps for IDs
- Sequential numbering

### Data Validation
- Required fields marked with *
- Form validation before submit
- Error messages for missing data
- Date format handling

## 🔗 Integration

### Command Center
- Expiration alerts appear in Critical Alerts
- 30-day warning system
- High priority notifications

### Storage Events
- Real-time updates across tabs
- Automatic refresh on changes
- Synchronized data

## 📸 OCR Technology

### Powered by Tesseract.js
- Client-side OCR
- No server required
- Works offline
- Supports multiple languages
- Automatic text extraction

### Smart Pattern Matching
- Recognizes policy number formats
- Identifies common insurance providers
- Extracts dollar amounts correctly
- Finds phone numbers and emails
- Parses dates intelligently

---

## 🌟 Ready to Protect Your Coverage!

Visit **http://localhost:3002** → **Insurance** domain

Scan all your insurance documents, track claims, and never miss a renewal! 🛡️📸

**Everything is saved automatically with photos!**

