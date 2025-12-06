# 💰 Financial Data Structure Explained

## ❓ Where Do Bills Come From?

**Bills come from the `bills` TABLE in Supabase** - This is a dedicated table for recurring payments:

```
bills table (50 entries):
├── Utilities (Electric, Water, Gas, Internet, Phone)
├── Housing (Rent, HOA, Security)
├── Insurance (Auto, Health, Renters, Life, Dental)
├── Entertainment (Netflix, Spotify, Disney+, etc.)
├── Software (Adobe, Microsoft, etc.)
├── Auto (Car loan payment, parking, car wash)
├── Shopping (Amazon Prime, Costco)
└── Other categories...
```

**There is NO "utilities" domain** - Utilities are bills/recurring payments in the `bills` table.

---

## 💼 Financial Domain Structure

The **financial domain** in `domain_entries` table contains:

### 1. 🏦 ACCOUNTS (Checking, Savings, Retirement)
- Chase Checking: $5,500
- Ally Savings: $15,000
- 401k: $45,000
- Roth IRA: $25,000
- Brokerage: $12,500

### 2. 📈 ASSETS (What You Own)
- **Real Estate:** Primary residence worth $485,000
- **Vehicle:** 2020 Honda Civic worth $18,500
- **Investments:** Stock portfolio worth $12,500
- **Retirement:** 401k + IRA worth $70,000
- **Cash/Savings:** $20,500 liquid
- **Valuables:** Rolex, MacBook, etc. worth $18,300
- **Home Equity:** $200,000

**Total Assets:** ~$606,000+

### 3. 💸 LOANS (What You Owe - With Repayment Tracking)
- **Mortgage:** $285,000 balance ($1,573/mo payment)
- **Auto Loan:** $12,500 balance ($350/mo payment)
- **Student Loan:** $32,000 balance ($200/mo payment)
- **Personal Loan:** $8,500 balance ($285/mo payment)

**Total Loan Debt:** $338,000

### 4. 💳 CREDIT CARD DEBTS
- **Chase Sapphire:** $3,500 balance
- **Discover It:** $2,100 balance
- **Amex Gold:** $1,800 balance

**Total Credit Card Debt:** $7,400

### 5. 📊 LOAN PAYMENT HISTORY
- Mortgage payment Nov 2025 (Principal: $742, Interest: $831)
- Auto loan payment Nov 2025 (Principal: $325, Interest: $25)
- Student loan payment Nov 2025 (Principal: $180, Interest: $20)
- Personal loan payment Nov 2025 (Principal: $265, Interest: $20)

### 6. 💵 INCOME & EXPENSES
- Salary: $6,500/month
- Expenses: Groceries, dining, gas, shopping, etc.

---

## 📊 Your Financial Summary

### Net Worth Calculation:
```
ASSETS:                         $606,000+
  - Real Estate (home value)    $485,000
  - Retirement (401k + IRA)      $70,000
  - Cash & Savings               $20,500
  - Brokerage Account            $12,500
  - Vehicle                      $18,500
  - Valuables                    $18,300

LIABILITIES:                    -$345,400
  - Mortgage                    -$285,000
  - Auto Loan                    -$12,500
  - Student Loan                 -$32,000
  - Personal Loan                 -$8,500
  - Credit Cards                  -$7,400

NET WORTH:                       $260,600
```

### Monthly Debt Payments:
```
Loan Payments:                   $2,408/mo
  - Mortgage                     $1,573
  - Auto Loan                      $350
  - Student Loan                   $200
  - Personal Loan                  $285

Credit Card Minimum Payments:     $222/mo
  - Chase Sapphire                 $105
  - Discover                        $63
  - Amex                            $54

Other Bills (from bills table): $5,578/mo
  - See bills table breakdown

TOTAL MONTHLY OBLIGATIONS:      $8,208/mo
```

---

## 🎯 Loan Repayment Tracking

### Mortgage - Home Loan
```
Original: $350,000 (Jan 2020)
Current:  $285,000 (58 payments made)
Rate:     3.5% APR
Payment:  $1,573/month
  ├── Principal: ~$742
  └── Interest:  ~$831

Remaining: 302 payments (25.2 years)
Payoff Date: January 2050
Total Interest Paid to Date: $26,234
```

### Auto Loan - Honda Civic
```
Original: $28,000 (June 2020)
Current:  $12,500 (65 payments made)
Rate:     4.2% APR
Payment:  $350/month
  ├── Principal: ~$325
  └── Interest:  ~$25

Remaining: 7 payments (7 months)
Payoff Date: June 2026
Total Interest Paid: $3,250
```

### Student Loan - Federal
```
Original: $45,000 (Sep 2018)
Current:  $32,000 (87 payments made)
Rate:     4.5% APR
Payment:  $200/month
  ├── Principal: ~$180
  └── Interest:  ~$20

Remaining: 153 payments (12.8 years)
Payoff Date: September 2038
Total Interest Paid: $4,400
```

### Personal Loan - Renovation
```
Original: $15,000 (Mar 2023)
Current:  $8,500 (20 payments made)
Rate:     6.5% APR
Payment:  $285/month
  ├── Principal: ~$265
  └── Interest:  ~$20

Remaining: 40 payments (3.3 years)
Payoff Date: March 2028
Total Interest Paid: $1,200
```

---

## 📍 Bills vs Financial Domain

### Bills TABLE:
**Purpose:** Track recurring payments & subscriptions

**Examples:**
- Electric bill: $150/mo
- Netflix: $15.99/mo
- Gym membership: $45/mo
- Car insurance: $180/mo

**Location:** `bills` table in Supabase

### Financial DOMAIN:
**Purpose:** Track assets, loans, debts, accounts, income, expenses

**Examples:**
- Accounts: Checking, savings, retirement
- Loans: Mortgage, auto, student, personal
- Debts: Credit cards
- Assets: House, car, investments
- Loan payments: Monthly payment history

**Location:** `domain_entries` table where `domain = 'financial'`

---

## 🔍 How to View Your Financial Data

### In Command Center:
1. **Bills Card** → Shows bills from `bills` table
2. **Financial Stats** → Shows net worth from financial domain
3. **Weekly Insights** → Shows financial overview

### In Financial Domain Page:
Go to: http://localhost:3000/domains/financial

You'll see tabs:
- **Items:** All financial entries (accounts, loans, assets, debts)
- **Documents:** Financial documents
- **Analytics:** Charts and graphs

### Query Your Data:

```sql
-- All financial items
SELECT title, metadata->>'type' as type 
FROM domain_entries 
WHERE domain = 'financial' 
AND user_id = '713c0e33-31aa-4bb8-bf27-476b5eba942e';

-- Just loans
SELECT title, metadata->'currentBalance' as balance 
FROM domain_entries 
WHERE domain = 'financial' 
AND metadata->>'type' = 'loan';

-- Just assets
SELECT title, metadata->'currentValue' as value 
FROM domain_entries 
WHERE domain = 'financial' 
AND metadata->>'type' = 'asset';
```

---

## 📊 Financial Dashboard Will Show

### Assets Section:
```
💰 ASSETS ($606K+)
├── 🏠 Real Estate: $485,000
├── 📈 Retirement: $70,000
├── 💵 Cash/Savings: $20,500
├── 📊 Investments: $12,500
├── 🚗 Vehicle: $18,500
└── 💎 Valuables: $18,300
```

### Liabilities Section:
```
💸 LIABILITIES ($345K)
├── 🏠 Mortgage: -$285,000 (302 payments left)
├── 🎓 Student Loan: -$32,000 (153 payments left)
├── 🚗 Auto Loan: -$12,500 (7 payments left)
├── 🔧 Personal Loan: -$8,500 (40 payments left)
└── 💳 Credit Cards: -$7,400
    ├── Chase: -$3,500
    ├── Discover: -$2,100
    └── Amex: -$1,800
```

### Net Worth:
```
NET WORTH: $260,600
(Assets $606K - Liabilities $345K)
```

---

## 💡 Key Points

1. **Bills ≠ Financial Domain**
   - Bills table = recurring payments (utilities, subscriptions)
   - Financial domain = accounts, loans, assets, debts

2. **Utilities Are Bills**
   - Electric, water, gas, internet, phone
   - Stored in `bills` table
   - NOT a separate domain

3. **Loans Have Full Tracking**
   - Original amount
   - Current balance
   - Monthly payment breakdown (principal vs interest)
   - Payments made vs remaining
   - Maturity date
   - Interest paid to date

4. **Assets Are Valued**
   - Home: $485K (appreciating)
   - Retirement: $70K (growing)
   - Investments: $12.5K (variable)
   - Vehicle: $18.5K (depreciating)

---

## 🎯 What You Now Have

### In `bills` Table (50 bills):
- ✅ Utilities: Electric, water, gas, internet, phone
- ✅ Housing: Rent/mortgage payment, HOA
- ✅ Insurance: Auto, health, renters, life, dental
- ✅ Subscriptions: Netflix, Spotify, etc.
- ✅ All other recurring payments

**Total: $5,578.75/month**

### In `financial` Domain (now 25+ entries):
- ✅ **Accounts (5):** Checking, savings, 401k, IRA, brokerage
- ✅ **Loans (4):** Mortgage, auto, student, personal
- ✅ **Debts (3):** Credit cards with balances
- ✅ **Assets (5):** Real estate, vehicle, investments, valuables, equity
- ✅ **Loan Payments (4):** Monthly payment history
- ✅ **Transactions:** Income & expenses

**Assets:** $606K+ | **Liabilities:** $345K | **Net Worth:** $260K+

---

## 🚀 See It Now

```bash
npm run dev
```

### View Financial Data:
1. **Command Center:** http://localhost:3000/command-center
   - Financial Stats shows: Net Worth $260K+
   - Bills card shows: $5,578/month
   
2. **Financial Domain:** http://localhost:3000/domains/financial
   - See all accounts, loans, assets, debts
   - Track loan repayment progress
   - View payment history

---

**Your financial tracking is now comprehensive!** 🎉

- ✅ Loans with repayment schedules
- ✅ Assets with valuations
- ✅ Debts with payment tracking
- ✅ Bills for all utilities & subscriptions
- ✅ Net worth calculation ready


