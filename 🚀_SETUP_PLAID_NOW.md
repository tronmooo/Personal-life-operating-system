# 🚀 Set Up Plaid Banking in 3 Minutes!

## Quick Setup (3 steps)

### 1️⃣ Get Your Plaid API Keys (2 minutes)

1. Go to **https://dashboard.plaid.com/signup**
2. Create a free account (email + password)
3. Go to **Team Settings** → **Keys** tab
4. Copy your:
   - **Client ID** (looks like: `68f7d5787c634d00204cdab0`)
   - **Sandbox Secret** (looks like: `44e3dc71d831e39cc0c4ca6901cf57`)

### 2️⃣ Add Keys to Your `.env.local` File

Open `/Users/robertsennabaum/new project/.env.local` and add:

```bash
# Plaid Banking Integration
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_secret_here
PLAID_ENV=sandbox
```

**OR** run the automated setup script:
```bash
npm run setup:plaid
```

### 3️⃣ Run the Database Migration

**Option A - Supabase CLI (fastest):**
```bash
cd /Users/robertsennabaum/new\ project
supabase db push
```

**Option B - Manual (if no CLI):**
1. Go to: https://supabase.com/dashboard
2. Click your project → SQL Editor → New Query
3. Copy the entire contents of: `supabase/migrations/20250121_plaid_banking.sql`
4. Paste and click **Run**

---

## ✅ Test It Now!

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Open your app:**
   ```
   http://localhost:3000/finance
   ```

3. **Click "Link Bank Account"**

4. **Use these sandbox credentials:**
   ```
   Institution: First Platypus Bank
   Username: user_good
   Password: pass_good
   ```

5. **Select accounts** and click Continue

6. **You're done!** Your finance page will now show:
   - ✅ Real account balances
   - ✅ 100+ sample transactions
   - ✅ Net worth calculation
   - ✅ Auto-categorized transactions

---

## 🎉 What You'll See

### Finance Dashboard
- **Net Worth Card**: Real-time calculation from all linked accounts
- **Total Assets**: Sum of checking, savings, investments
- **Total Liabilities**: Credit cards, loans
- **Transaction Count**: All synced transactions

### Connected Accounts
- **Plaid-linked accounts** with 🏦 icon and "Linked" badge
- **Real balances** from your bank (in sandbox: mock data)
- **Account details**: name, type, mask (last 4 digits)

### Example After Linking
```
Net Worth: $15,234.50 ✨
├─ Total Assets: $22,500.00
│  ├─ Chase Checking •••• 4532: $2,500
│  ├─ Chase Savings •••• 8901: $15,000
│  └─ Robinhood Investment: $5,000
└─ Total Liabilities: $7,265.50
   ├─ Chase Credit •••• 2109: $2,300
   └─ Auto Loan: $4,965.50

Transactions: 127 (104 from linked accounts)
```

---

## 🐛 Troubleshooting

### "Plaid credentials not configured"
- Make sure you added `PLAID_CLIENT_ID` and `PLAID_SECRET` to `.env.local`
- Restart your dev server after adding them
- Check for typos in your API keys

### "No accounts showing up"
- Check the browser console for errors
- Open Supabase dashboard → Table Editor → `linked_accounts` to verify data was saved
- Make sure the migration ran successfully (check `linked_accounts` table exists)

### "Access token exchange failed"
- This means the database save failed
- Run the migration again: `supabase db push`
- Check Supabase logs for RLS policy errors

### Database migration errors
- Make sure you're logged in: `supabase login`
- Make sure you're linked to a project: `supabase link`
- Or use the manual SQL editor method (Option B above)

---

## 🔐 Security Notes

✅ **What's Stored:**
- Access tokens (encrypted in production)
- Account balances
- Transaction history
- No passwords or bank credentials!

✅ **How It Works:**
1. Plaid handles all bank authentication (OAuth)
2. You never see or store bank passwords
3. Users can revoke access anytime
4. All data is protected with Row Level Security (RLS)

---

## 🎯 Next Steps (Optional)

Once basic integration is working:

### 1. Enable Real-time Sync
Set up webhook to auto-sync transactions:
- Configure webhook URL in Plaid dashboard: `https://your-app.com/api/plaid/webhook`

### 2. Daily Background Sync
Set up cron job (Vercel Cron Jobs):
```json
{
  "crons": [{
    "path": "/api/plaid/sync-all",
    "schedule": "0 6 * * *"
  }]
}
```

### 3. Add OpenAI Categorization
Add to `.env.local`:
```bash
OPENAI_API_KEY=your_openai_key
```

### 4. Go to Production
- Get production Plaid keys (requires business verification)
- Change `PLAID_ENV=production`
- Link real bank accounts!

---

## 📞 Support

**Need help?**
- Check console logs in browser DevTools
- Check terminal logs for API errors
- Verify all environment variables are set
- Make sure database migration ran successfully

**Plaid Dashboard:**
https://dashboard.plaid.com

**Supabase Dashboard:**
https://supabase.com/dashboard

---

## 🎊 You're All Set!

Your Plaid banking integration is ready! 

Go to **http://localhost:3000/finance** and link your first account! 🏦✨



