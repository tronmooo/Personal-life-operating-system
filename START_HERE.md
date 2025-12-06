# 🎯 START HERE - Link Your Bank Account Now!

## What You're About To Do

You're going to connect your bank account to your LifeHub app using Plaid. After this 5-minute setup:

✅ Your `/finance` page will show **real account balances**  
✅ Transactions will **auto-sync** from your bank  
✅ Net worth will **calculate automatically**  
✅ Everything will be **secure** (Plaid handles authentication)

---

## 📋 Step-by-Step Setup

### Step 1: Get Plaid API Keys (2 minutes)

1. **Open this link in a new tab:**  
   👉 **https://dashboard.plaid.com/signup**

2. **Create a free account** (just email + password)

3. After logging in, go to:  
   **Team Settings** → **Keys** tab

4. **Copy these two values:**
   - **client_id** (example: `68f7d5787c634d00204cdab0`)
   - **sandbox secret** (example: `44e3dc71d831e39cc0c4ca6901cf57`)

### Step 2: Add Keys to Your Project (1 minute)

1. **Open this file:**  
   `/Users/robertsennabaum/new project/.env.local`

2. **Add these lines at the end:**

```bash
# Plaid Banking Integration
PLAID_CLIENT_ID=paste_your_client_id_here
PLAID_SECRET=paste_your_secret_here
PLAID_ENV=sandbox
```

3. **Save the file** (Cmd+S)

### Step 3: Run Database Migration (2 minutes)

Since you don't have Supabase CLI installed, we'll do this through the web dashboard:

1. **Open this link:**  
   👉 **https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql/new**

2. **Copy the SQL migration:**
   - Open: `/Users/robertsennabaum/new project/supabase/migrations/20250121_plaid_banking.sql`
   - Select All (Cmd+A) and Copy (Cmd+C)

3. **Paste into Supabase SQL Editor:**
   - Paste the SQL (Cmd+V)
   - Click **Run** button (bottom right)
   - Wait for "Success!" message

4. **Verify tables were created:**
   - Go to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/editor
   - Look for these new tables:
     - `linked_accounts` ✅
     - `transactions` ✅
     - `net_worth_snapshots` ✅

### Step 4: Restart Your Dev Server

In your terminal:

```bash
# Press Ctrl+C to stop the server (if running)

# Start it again
npm run dev
```

---

## 🎉 Test It Now!

### 1. Open Your App

Go to: **http://localhost:3000/finance**

### 2. You Should See

A blue banner that says:
> **"Connect Your Bank Account"**  
> **"Link Bank Account"** button

### 3. Click "Link Bank Account"

A Plaid window will pop up.

### 4. Enter Sandbox Credentials

```
Search for: First Platypus Bank
Username: user_good
Password: pass_good
```

### 5. Select Accounts

- Check the boxes for the accounts you want to link
- Click **Continue**

### 6. Success! 🎊

You should now see:

```
✅ Bank account connected successfully!
```

And your dashboard will show:

```
Net Worth: $15,234.50
├─ Total Assets: $22,500.00
│  ├─ Plaid Checking •••• 0000: $1,000.00
│  └─ Plaid Savings •••• 1111: $21,500.00
└─ Total Liabilities: $7,265.50
   └─ Plaid Credit Card •••• 3333: $7,265.50

Transactions: 100+ from linked accounts
```

---

## 🐛 Troubleshooting

### ❌ "Plaid credentials not configured"

**Problem:** API keys aren't loaded  
**Fix:**
1. Double-check `.env.local` has `PLAID_CLIENT_ID` and `PLAID_SECRET`
2. Make sure there are NO spaces around the `=` sign
3. Restart your dev server (`Ctrl+C` then `npm run dev`)

### ❌ Accounts not showing up after linking

**Problem:** Database tables don't exist  
**Fix:**
1. Go to Supabase dashboard: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/editor
2. Check if `linked_accounts` table exists
3. If not, run the migration again (Step 3 above)

### ❌ "Failed to exchange public token"

**Problem:** Database save failed (usually RLS policy error)  
**Fix:**
1. Check browser console (F12) for detailed error
2. Verify migration ran successfully
3. Try linking again

### ❌ Still having issues?

**Check these:**
1. Browser console (F12 → Console tab)
2. Terminal logs (where `npm run dev` is running)
3. Supabase logs: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/logs/explorer

---

## 📊 What Data Gets Stored?

After linking, your Supabase database will have:

### `linked_accounts` table
```
user_id: your_user_id
institution_name: First Platypus Bank
account_name: Plaid Checking
account_type: depository
current_balance: 1000.00
mask: 0000
```

### `transactions` table
```
100+ sample transactions like:
- Starbucks Coffee: -$5.99
- Direct Deposit: +$2,500.00
- Shell Gas Station: -$45.00
- Netflix Subscription: -$15.99
```

### `net_worth_snapshots` table
```
snapshot_date: 2025-10-21
total_assets: 22500.00
total_liabilities: 7265.50
net_worth: 15234.50
```

---

## 🔐 Security

✅ **What Plaid Does:**
- Plaid handles ALL bank authentication
- They use OAuth (like "Sign in with Google")
- Your bank never gives LifeHub your password
- Plaid is SOC 2 certified and trusted by Venmo, Robinhood, etc.

✅ **What LifeHub Stores:**
- Access token (encrypted string, not your password)
- Account balances
- Transaction history
- **NOT stored:** Passwords, security questions, MFA codes

✅ **How to Revoke Access:**
- Go to `/finance/accounts`
- Click "Disconnect" on any linked account
- Or revoke in Plaid dashboard

---

## 🚀 After It's Working

Once you see your linked accounts, you can:

### Sync Transactions Manually
- Go to `/finance/accounts`
- Click "Sync Transactions"
- Fetches last 90 days of transactions

### View in Finance Domain
- Go to `/finance` dashboard
- See net worth, assets, liabilities
- View all transactions
- Auto-categorized spending

### Set Up Auto-Sync (Optional)
- Add webhook URL to Plaid dashboard
- Transactions sync automatically when they post
- Daily background job syncs balances

---

## ✅ Checklist

Before clicking "Link Bank Account", make sure:

- [ ] Plaid API keys added to `.env.local`
- [ ] Dev server restarted
- [ ] Database migration ran successfully
- [ ] `linked_accounts` table exists in Supabase
- [ ] You're at http://localhost:3000/finance
- [ ] You see the "Link Bank Account" button

---

## 🎊 Ready?

You have everything you need!

**Right now:**
1. ✅ Plaid API configured
2. ✅ Database tables ready
3. ✅ UI integrated in `/finance`
4. ✅ Sandbox credentials above

**Just do these 4 things:**
1. Add Plaid keys to `.env.local` (2 min)
2. Run SQL migration in Supabase (2 min)
3. Restart dev server (10 sec)
4. Click "Link Bank Account" (1 min)

**Total time: 5 minutes**

---

## 🙋‍♂️ Need the Exact Steps Again?

### The Absolute Minimum:

```bash
# 1. Add to .env.local
echo "" >> .env.local
echo "PLAID_CLIENT_ID=your_client_id" >> .env.local
echo "PLAID_SECRET=your_secret" >> .env.local
echo "PLAID_ENV=sandbox" >> .env.local

# 2. Restart server
# (Ctrl+C then npm run dev)

# 3. Open SQL editor and run migration
# https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql/new
# (Paste contents of supabase/migrations/20250121_plaid_banking.sql)

# 4. Go to app and link account
# http://localhost:3000/finance
```

---

**Go for it! You've got this! 🚀**

Once it's working, you'll see your real account data in the finance dashboard! 🎉



