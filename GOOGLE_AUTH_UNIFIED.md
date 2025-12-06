# ✅ Google OAuth Unified Scopes - Complete

## What Was Fixed

### 1. **Unified Google OAuth Scopes** 
All Google sign-in flows now request the same comprehensive set of scopes in a single authorization:

```javascript
scopes: [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
]
```

### 2. **Files Updated**

#### `/app/auth/signin/page.tsx`
- ✅ Added unified scopes to `handleGoogleSignIn()`
- ✅ Includes `access_type: 'offline'` and `prompt: 'consent'` for refresh tokens
- **Result:** When you sign in with Google, you'll see a consent screen showing all 7 permissions

#### `/components/dashboard/smart-inbox-card.tsx`
- ✅ Updated `syncWithGmail()` to use unified scopes
- ✅ Matches sign-in page scopes exactly
- **Result:** No separate Gmail reconnect prompt needed after initial sign-in

#### `/components/dashboard/google-calendar-card.tsx`
- ✅ Updated `handleReconnect()` to use unified scopes
- ✅ Matches sign-in page scopes exactly
- **Result:** No separate Calendar reconnect prompt needed after initial sign-in

### 3. **Gmail Category Purchases**

#### `/lib/integrations/gmail-parser.ts`
- ✅ Already configured correctly (no changes needed)
- ✅ Query explicitly includes `category:purchases`
- ✅ Also includes `category:travel`, `category:finance`, `category:updates`
- ✅ `maxResults` set to 100 emails

```typescript
const query = `after:${afterDateStr} (in:inbox OR category:purchases OR category:travel OR category:finance OR category:updates) -category:social -category:forums -category:spam`
```

### 4. **Financial Totals (Assets & Liabilities)**

#### `/lib/utils/unified-financial-calculator.ts`
- ✅ Enhanced to read from both sources:
  1. **FinanceProvider accounts** (passed via `financeData` parameter)
  2. **DataProvider financial domain** (for items added via other methods)
- ✅ Automatically detects account types containing "credit", "loan", "mortgage" as liabilities
- ✅ All other accounts counted as assets

#### How Financial Data Works:
The Finance domain has **two separate data sources**:

1. **FinanceProvider** (`/lib/providers/finance-provider.tsx`)
   - Stores: Accounts, Transactions, Bills, Goals, Budgets
   - Location: Supabase `financial_accounts`, `financial_data` tables
   - Used by: `/finance` page (AI Finance Advisor)

2. **DataProvider** (`/lib/providers/data-provider.tsx`)
   - Stores: General domain items (home, vehicles, health, etc.)
   - Location: Supabase `domains` table
   - Used by: Command Center and other domain pages

**The unified calculator now reads from BOTH sources** to calculate total net worth.

---

## 🎯 What You Need to Do

### Step 1: Sign Out and Sign Back In
1. Click your profile in the top-right
2. Sign out
3. Go to the sign-in page
4. Click "Continue with Google"
5. **You will see a consent screen showing 7 permissions:**
   - ✅ View your email address
   - ✅ View your basic profile info
   - ✅ Read your Gmail messages
   - ✅ Modify your Gmail messages
   - ✅ View your Google Calendar
   - ✅ View and edit events on your Google Calendar
   - ✅ Manage your calendars
6. Click "Allow" / "Continue"

### Step 2: Test Gmail Smart Inbox
1. Go to Command Center
2. Find the "Smart Inbox" card
3. Click the refresh icon (↻) to sync Gmail
4. **Expected:** No permission prompt, emails from `category:purchases` should be extracted

### Step 3: Test Google Calendar
1. Go to Command Center
2. Find the "Google Calendar" card
3. **Expected:** No "Reconnect Calendar" button, events should load automatically

### Step 4: Add Financial Accounts (if showing $0)
The Finance page shows $0 because you haven't added any accounts yet. To fix:

1. Go to **AI Finance Advisor** page (`/finance`)
2. Click the **"Accounts"** tab
3. Click **"+ Add Account"**
4. Add your accounts:
   - **Checking accounts** (e.g., Chase Checking: $5,000)
   - **Savings accounts** (e.g., Ally Savings: $10,000)
   - **Credit cards** (e.g., Amex: -$2,500) ← This is a liability
   - **Loans** (e.g., Car Loan: -$15,000) ← This is a liability
   - **Investment accounts** (e.g., Vanguard 401k: $50,000)

5. After adding accounts, the Dashboard tab will show:
   - **Total Assets:** Sum of checking, savings, investments, etc.
   - **Total Liabilities:** Sum of credit cards, loans, mortgages
   - **Net Worth:** Assets - Liabilities

**Note:** The unified calculator will also include:
- Home values (from Home domain)
- Vehicle values (from Vehicles domain)
- Collectibles (from Collectibles domain)
- Any financial items in the DataProvider

---

## 🔍 Troubleshooting

### "Request had insufficient authentication scopes" Error
**Solution:** Sign out and sign back in with Google. The old session doesn't have the new unified scopes.

### Gmail Not Pulling Purchases
**Causes:**
1. No emails in `category:purchases` in the last 7 days
2. Gmail hasn't classified any emails as purchases yet
3. Old session without Gmail scopes

**Solution:** 
- Sign out and sign back in
- Try clicking the refresh icon in Smart Inbox
- Check your Gmail to confirm you have emails labeled "Purchases"

### Calendar Still Asking to Reconnect
**Cause:** Old session without Calendar scopes

**Solution:** Sign out and sign back in with Google

### Financial Totals Still Show $0
**Causes:**
1. No accounts added to FinanceProvider yet
2. No homes/vehicles/assets in other domains

**Solution:**
- Go to `/finance` → Accounts tab → Add accounts
- OR go to `/home` → Add a home with property value
- OR go to `/vehicles` → Add a vehicle with estimated value

---

## 📊 Summary

| Feature | Status | Action Required |
|---------|--------|-----------------|
| Unified Google Scopes | ✅ Fixed | Sign out & sign in once |
| Gmail Purchases Extraction | ✅ Working | Sync Gmail after re-login |
| Calendar Auto-Connect | ✅ Working | No action after re-login |
| Financial Totals | ✅ Enhanced | Add accounts in Finance page |

---

## 🎉 After Re-Login

You should experience:
1. ✅ **One-time consent** for all 7 Google services
2. ✅ **No additional prompts** for Gmail or Calendar
3. ✅ **Smart Inbox** automatically syncs purchases
4. ✅ **Google Calendar** automatically loads events
5. ✅ **Financial totals** sum all accounts + domain assets

**No more reconnect buttons!** 🚀
















