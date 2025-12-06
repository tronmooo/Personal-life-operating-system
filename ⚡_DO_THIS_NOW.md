# ⚡ DO THIS NOW - 3 Quick Steps!

## 🎯 Goal
Get your bank account showing real data in `/finance` in 5 minutes.

---

## Step 1: Add Plaid Keys (2 min)

### Get Your API Keys
1. Go to: **https://dashboard.plaid.com/signup**
2. Sign up (free, just email + password)
3. Click **Team Settings** → **Keys**
4. Copy your:
   - `client_id`
   - `sandbox` secret

### Add to .env.local
Open `/Users/robertsennabaum/new project/.env.local` and add:

```bash
PLAID_CLIENT_ID=paste_your_client_id_here
PLAID_SECRET=paste_your_secret_here
PLAID_ENV=sandbox
```

Save the file.

---

## Step 2: Run Database Migration (2 min)

1. **Open:** https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql/new

2. **Copy SQL:**
   - Open: `supabase/migrations/20250121_plaid_banking.sql`
   - Copy all (Cmd+A, Cmd+C)

3. **Paste & Run:**
   - Paste in Supabase SQL Editor
   - Click **Run**
   - Wait for "Success!"

---

## Step 3: Test It! (1 min)

```bash
# Restart your server
npm run dev
```

1. Go to: **http://localhost:3000/finance**
2. Click **"Link Bank Account"**
3. Search: **First Platypus Bank**
4. Username: `user_good`
5. Password: `pass_good`
6. Select accounts → Continue

**DONE!** 🎉

Your finance page will now show:
- ✅ Real account balances (sandbox data)
- ✅ 100+ transactions
- ✅ Auto-calculated net worth
- ✅ Transaction history

---

## 🐛 If Something Breaks

### "Plaid credentials not configured"
→ Restart your dev server after adding keys to `.env.local`

### "No accounts showing"
→ Check Supabase dashboard that `linked_accounts` table was created

### "Failed to exchange token"
→ Run the migration again (Step 2)

---

## ✅ What You'll See After Linking

**Finance Dashboard (`/finance`):**
```
🏦 Net Worth: $15,234.50
   Real-time from 2 linked accounts

📊 Total Assets: $22,500.00
📊 Total Liabilities: $7,265.50
📊 Transactions: 104

Connected Accounts:
🏦 First Platypus Bank Checking •••• 0000
   $1,000.00
   [Linked badge]

🏦 First Platypus Bank Savings •••• 1111
   $21,500.00
   [Linked badge]
```

**Accounts Page (`/finance/accounts`):**
```
Plaid ✓ Connected

Connected 10/21/2025

Features:
• Real-time balances
• Transactions
• Investments

[Disconnect]
```

---

That's it! Just 3 steps. Let's go! 🚀



