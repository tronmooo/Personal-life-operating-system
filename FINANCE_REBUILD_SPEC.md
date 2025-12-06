# Finance Domain Complete Rebuild Specification

Based on screenshots provided by user. This is the COMPLETE specification for rebuilding the entire Financial Command Center.

## 🎯 Overall Structure

**7 Main Tabs:**
1. Dashboard
2. Transactions  
3. Assets
4. Debts
5. Bills
6. Budget
7. Analysis

**Design Theme:**
- Dark mode (navy/slate backgrounds: `from-slate-950 via-slate-900 to-slate-900`)
- Clean card-based layout with rounded corners
- Blue accent colors for primary actions
- Consistent spacing and typography

---

## 📊 TAB 1: DASHBOARD

### Top Row - 4 KPI Cards (Grid layout):

#### Card 1: Net Worth
- **Icon:** Wallet icon
- **Value:** `$0`
- **Subtitle:** "Assets - Liabilities"
- Background: Dark card with light text

#### Card 2: Total Assets  
- **Icon:** Trending up icon (green)
- **Value:** `$0`
- **Subtitle:** "What you own"

#### Card 3: Total Liabilities
- **Icon:** Trending down icon (red)
- **Value:** `$0`
- **Subtitle:** "What you owe"

#### Card 4: Monthly Cash Flow
- **Icon:** Trending up icon (green)
- **Value:** `$0` (green color)
- **Subtitle:** "Income - Expenses"

### Financial Insights & Recommendations Section

**Header:**
- 💡 Lightbulb icon
- "Financial Insights & Recommendations"
- Subtitle: "AI-powered analysis of your financial health"

**Alert Card (Example):**
- **Icon:** ⚠️ Warning icon
- **Background:** Orange/brown gradient
- **Title:** "Emergency Fund Alert"
- **Message:** "You have 0.0 months of expenses in liquid assets. Aim for 3-6 months."
- **Action:** "💡 Prioritize building your emergency fund"

### Charts Section (2 Column Grid):

#### Left: Net Worth Trend
- **Title:** "Net Worth Trend"
- **Subtitle:** "Last 6 months"
- **Chart Type:** Line chart (blue line)
- **X-Axis:** Jun, Jul, Aug, Sep, Oct, Nov
- **Y-Axis:** Formatted as $0k, -$4k, -$8k, -$16k
- **Data:** Shows upward trend from negative to positive

#### Right: Expense Categories  
- **Title:** "Expense Categories"
- **Subtitle:** "Current month breakdown"
- **Chart Type:** Donut/Pie chart
- Shows breakdown of spending by category
- Empty state if no data

### 6-Month Financial Trend Section (Full Width Card):

**Title:** "6-Month Financial Trend"
**Subtitle:** "Track your income, expenses, and savings over time"

**Chart 1: Income vs Expenses**
- Bar chart with 2 bars per month
- Green bars = Income
- Red bars = Expenses
- Legend at bottom: 🟥 Expenses  🟩 Income
- X-Axis: Jun, Jul, Aug, Sep, Oct, Nov
- Y-Axis: $0k scale

**Chart 2: Monthly Savings Trend**
- Line chart below the bar chart
- X-Axis: Jun, Jul, Aug, Sep, Oct, Nov
- Y-Axis: $0k scale
- Legend: 🟦 Actual  🟦 Budgeted

### Bottom Row (2 Column Grid):

#### Left: Upcoming Bills (Next 30 Days)
- **Title:** "Upcoming Bills (Next 30 Days)"
- **Subtitle:** "0 bills due soon"
- Empty state message if no bills

#### Right: Debt Payoff Progress
- **Title:** "Debt Payoff Progress"
- **Subtitle:** "Current balances"
- Shows total debt, liquid assets, and progress bar

### Monthly Summary Section (Full Width Card):

**Header:** 
- 💲 Dollar sign icon
- "Monthly Summary"

**3 Column Grid:**
- **Total Income:** $0 (green)
- **Total Expenses:** $0 (red)  
- **Net Cash Flow:** $0 (conditional color)

---

## 💳 TAB 2: TRANSACTIONS

### Bank Account Integration Section (Full Width Card):

**Header:**
- 🏦 Bank icon
- "Bank Account Integration"
- Subtitle: "Connect your bank accounts to automatically import transactions"

**Info Box (Blue bordered):**
- 🔒 Lock icon
- **Title:** "Secure Bank Connection via Plaid"
- **Description:** "Plaid uses bank-level encryption to securely connect to over 12,000 financial institutions. Your credentials are never stored on our servers."

**Benefits List (Green checkmarks):**
- ✅ Automatic transaction imports - no manual entry
- ✅ Real-time account balances and updates  
- ✅ Smart categorization based on merchant data
- ✅ Detect duplicate transactions automatically

**CTA Button (Full width, black):**
- 🏦 "Connect Bank Account with Plaid"
- Footer: "By connecting, you agree to Plaid's Privacy Policy" (link)

### Recurring Transactions Section:

**Header:**
- 🔄 Refresh icon
- "Recurring Transactions"
- Subtitle: "Automate your regular income and expenses"

**Action Buttons:**
- ▶️ "Generate" button
- ➕ "Add Recurring" button (black)

**Empty State:**
- 🔄 Icon
- "No recurring transactions yet. Add one to automate your finances!"

### Transactions Table Section:

**Header:**
- "Transactions"
- Subtitle: "Log and track all your financial transactions"

**Search & Filter Bar:**
- Search input: "Search..."
- Filter dropdown: "All" with dropdown icon
- 📥 "Export" button
- ➕ "Add Transaction" button (black)

**Table Columns:**
- Date
- Type
- Category
- Description
- Account
- Amount

**Empty State:** Empty table with column headers

---

## 💰 TAB 3: ASSETS

### Top Row - 3 KPI Cards:

#### Card 1: Total Assets
- **Value:** $0.00

#### Card 2: Liquid Assets  
- **Value:** $0.00
- **Subtitle:** "Easily accessible funds"

#### Card 3: Investment Assets
- **Value:** $0.00
- **Subtitle:** "Retirement & investments"

### Assets Table Section:

**Header:**
- "Assets"
- Subtitle: "Everything you own that holds value"

**Action Button:**
- ➕ "Add Asset" (top right, black)

**Table Columns:**
- Asset
- Type
- Current Value
- Last Updated
- Notes

**Empty State:** Empty table with column headers

### Investment Portfolio Section:

**Header:**
- 📈 Chart icon
- "Investment Portfolio"
- Subtitle: "Track your investment holdings and performance"

**Action Button:**
- ➕ "Add Holding" (top right, black)

**4 Metric Cards Row:**

#### Card 1: Total Value
- **Value:** $0.00

#### Card 2: Total Cost
- **Value:** $0.00

#### Card 3: Total Gain/Loss  
- **Value:** 📈 $0.00 (green)

#### Card 4: Return
- **Value:** +0.00% (green)

**Empty State:**
- 📈 Icon
- "No investments tracked yet. Add your first holding to get started!"

---

## 💸 TAB 4: DEBTS

### Top Row - 3 KPI Cards:

#### Card 1: Total Debt
- **Value:** $0.00

#### Card 2: Monthly Minimum Payments
- **Value:** $0.00
- **Subtitle:** "Required each month"

#### Card 3: Highest Interest Rate
- **Value:** 0.00% (red)
- **Subtitle:** "Priority for payoff"

### Liabilities Table Section:

**Header:**
- "Liabilities"
- Subtitle: "All debts and what you owe"

**Action Button:**
- ➕ "Add Liability" (top right, black)

**Table Columns:**
- Creditor
- Loan Type
- Interest Rate
- Original
- Current
- Min Payment
- Due Date

**Empty State:** Empty table with column headers

---

## 📅 TAB 5: BILLS

### Top Row - 3 KPI Cards:

#### Card 1: Upcoming Bills
- **Value:** 0
- **Subtitle:** "Bills due soon"

#### Card 2: Total Amount Due
- **Value:** $0.00
- **Subtitle:** "Upcoming payments"

#### Card 3: Auto-Pay Enabled
- **Value:** 0
- **Subtitle:** "Automated payments"

### Recurring Bills & Insurance Section:

**Header:**
- "Recurring Bills & Insurance"
- Subtitle: "Manage your regular payments and policies"

**Action Button:**
- ➕ "Add Bill" (top right, black)

**Table Columns:**
- Provider
- Category
- Amount
- Due Date
- Auto-Pay
- Status
- Notes

**Empty State:** Empty table with column headers

---

## 🎯 TAB 6: BUDGET

### Top Row - 3 KPI Cards:

#### Card 1: Total Budgeted
- **Value:** $0.00
- **Subtitle:** "Monthly target"

#### Card 2: Total Spent
- **Value:** $0.00
- **Subtitle:** "This month"

#### Card 3: Variance
- **Value:** $0.00 (green)
- **Subtitle:** "Under budget"

### Budget & Goals Section:

**Header:**
- "Budget & Goals"
- Subtitle: "Plan and track your spending by category"

**Action Button:**
- ➕ "Add Budget Item" (top right, black)

**Empty State:**
- 📈 Icon
- "No budget items yet. Add your first budget category to get started."

### Financial Goals Section (Full Width):

**Header:**
- "Financial Goals"
- Subtitle: "Track your progress toward major financial milestones"

**Goal Examples (Progress bars):**

#### Goal 1: Emergency Fund Goal
- Progress bar: 77.5% complete
- **Value:** $15,500 / $20,000
- **Subtitle:** "77.5% complete - $4,500 remaining"

#### Goal 2: Vacation Fund Goal
- Progress bar: 32% complete
- **Value:** $800 / $2,500
- **Subtitle:** "32% complete - $1,700 remaining"

#### Goal 3: Pay off Prime Visa
- Progress bar: 47.5% complete
- **Value:** $1,900 paid / $4,000 original
- **Subtitle:** "$2,100 remaining - Target: Dec 2025"

---

## 📊 TAB 7: ANALYSIS

### Spending Heatmap Section:

**Header:**
- 📅 Calendar icon
- "Spending Heatmap"
- Subtitle: "November 2025 - Daily spending patterns"

**Calendar Grid:**
- 7 columns (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
- Shows all days of November 2025
- Current day (13th) highlighted with blue border
- Heat intensity shows spending amounts (darker = more spending)
- Grid cells are rounded squares

### Net Worth Projection Section:

**Header:**
- 📊 Calculator icon
- "Net Worth Projection"
- Subtitle: "Project your financial future based on savings and investment returns"

**Input Fields (3 inputs in row):**

#### Input 1: Monthly Savings
- Default value: 0
- Helper text: "Avg: $0/mo"

#### Input 2: Annual Return (%)
- Default value: 7
- Helper text: "S&P 500 avg: ~10%"

#### Input 3: Years to Project
- Default value: 10

**Result Cards (3 cards in row):**

#### Card 1: Current Net Worth
- **Value:** $0

#### Card 2: Projected in 10 Years
- **Value:** $0 (blue)

#### Card 3: Total Growth
- **Value:** 📈 $0 (green)

**Projection Chart:**
- **Title:** "Net Worth Scenarios"
- **X-Axis:** Years (0.0 to 10.0)
- **Y-Axis:** Dollar amounts ($0k scale)
- **Three Lines:**
  - 🔴 Conservative (No Returns)
  - 🔵 Expected (7% Return)
  - 🟢 Optimistic (10% Return)
- **Tooltip:** Shows values on hover (example at year 6.0)
  - Conservative (No Returns): $0
  - Expected (7% Return): $0
  - Optimistic (10% Return): $0

### Tax Planning Dashboard Section:

**Header:**
- 📋 Document icon
- "Tax Planning Dashboard"
- Subtitle: "2025 tax year estimates and deductions"

**Top Row - 4 KPI Cards:**

#### Card 1: Total Income (YTD)
- **Value:** $0

#### Card 2: Deductions
- **Value:** $14,600 (green)

#### Card 3: Estimated Tax
- **Value:** $0 (orange/brown)

#### Card 4: Effective Rate
- **Value:** 0.0% (blue)

**Deductible Expense Categories:**

List with categories and amounts (right-aligned):
- Charitable Donations: $0
- Medical Expenses: $0
- Business Expenses: $0
- Education: $0
- Mortgage Interest: $0

**Tax Saving Opportunities Section (Blue card):**

**Title:** "💰 Tax Saving Opportunities"

**Opportunities List:**
- ✅ Max out your 401(k) contribution: $22500 remaining for 2025
- ✅ IRA contribution limit: $7000 for 2025
- ✅ HSA triple tax advantage: $4150 contribution limit
- ⚠️ Consider charitable donations before year-end for deductions
- 💡 Tax-loss harvesting: Review investment losses to offset gains

---

## 🎨 UI Components & Patterns

### Floating Action Button (FAB)
- Blue circular button in bottom-right corner
- ➕ Plus icon
- Opens menu with quick actions
- Question mark helper icon below it

### Color Palette
- **Primary Blue:** `#3b82f6`
- **Green (positive):** `#10b981`
- **Red (negative):** `#ef4444`
- **Orange (warning):** `#f97316`
- **Background Dark:** `#0f172a` to `#1e293b`
- **Card Background:** `#1e293b` to `#334155`

### Typography
- **Page Title:** 2xl font, bold, gradient
- **Card Titles:** sm to lg font, medium weight
- **Values:** 2xl to 4xl font, bold
- **Subtitles:** xs to sm font, muted color

### Spacing
- **Section gaps:** 6 units
- **Card padding:** 4-6 units
- **Grid gaps:** 4 units

---

## 📦 Data Structure Required

### Financial Domain Entries (`domain_entries` table)

All entries have `domain = 'financial'` and different `itemType` values:

#### ItemType: 'transaction'
```typescript
{
  domain: 'financial',
  itemType: 'transaction',
  title: string,
  description: string,
  metadata: {
    type: 'income' | 'expense' | 'transfer',
    category: string,
    subcategory?: string,
    amount: number,
    date: string,
    account: string,
    payee?: string,
    tags?: string[]
  }
}
```

#### ItemType: 'account'
```typescript
{
  domain: 'financial',
  itemType: 'account',
  title: string, // Account name
  metadata: {
    accountType: 'checking' | 'savings' | 'credit' | 'investment' | 'retirement',
    institution: string,
    accountNumber?: string,
    balance: number,
    interestRate?: number,
    openDate?: string
  }
}
```

#### ItemType: 'asset'
```typescript
{
  domain: 'financial',
  itemType: 'asset',
  title: string,
  metadata: {
    assetType: 'real-estate' | 'vehicle' | 'investment' | 'valuables' | 'other',
    currentValue: number,
    purchasePrice?: number,
    purchaseDate?: string,
    lastUpdated: string
  }
}
```

#### ItemType: 'investment'
```typescript
{
  domain: 'financial',
  itemType: 'investment',
  title: string, // Stock name or symbol
  metadata: {
    symbol: string,
    quantity: number,
    purchasePrice: number,
    currentPrice: number,
    purchaseDate: string,
    broker?: string
  }
}
```

#### ItemType: 'debt'
```typescript
{
  domain: 'financial',
  itemType: 'debt',
  title: string, // Debt name
  metadata: {
    creditor: string,
    loanType: string,
    interestRate: number,
    originalBalance: number,
    currentBalance: number,
    minimumPayment: number,
    dueDate: string
  }
}
```

#### ItemType: 'bill'
```typescript
{
  domain: 'financial',
  itemType: 'bill',
  title: string, // Bill name
  metadata: {
    provider: string,
    category: string,
    amount: number,
    dueDate: string,
    recurring: boolean,
    frequency?: 'monthly' | 'yearly' | 'quarterly',
    isAutoPay: boolean,
    status: 'pending' | 'paid' | 'overdue'
  }
}
```

#### ItemType: 'budget'
```typescript
{
  domain: 'financial',
  itemType: 'budget',
  title: string, // Category name
  metadata: {
    category: string,
    budgetedAmount: number,
    spentAmount: number,
    month: string,
    year: number
  }
}
```

#### ItemType: 'goal'
```typescript
{
  domain: 'financial',
  itemType: 'goal',
  title: string, // Goal name
  metadata: {
    goalType: 'savings' | 'debt-payoff' | 'investment' | 'other',
    targetAmount: number,
    currentAmount: number,
    targetDate?: string,
    monthlyContribution?: number,
    priority: 'low' | 'medium' | 'high'
  }
}
```

#### ItemType: 'recurring-transaction'
```typescript
{
  domain: 'financial',
  itemType: 'recurring-transaction',
  title: string,
  metadata: {
    type: 'income' | 'expense',
    category: string,
    amount: number,
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly',
    startDate: string,
    endDate?: string,
    account: string,
    isActive: boolean
  }
}
```

---

## 🔧 Implementation Priority

1. ✅ Update TypeScript types to match spec above
2. ✅ Rebuild Dashboard tab with all sections
3. ✅ Rebuild Transactions tab with Plaid UI
4. ✅ Rebuild Assets tab with investment portfolio
5. ✅ Rebuild Debts tab
6. ✅ Rebuild Bills tab
7. ✅ Rebuild Budget tab with goals
8. ✅ Rebuild Analysis tab with heatmap, projections, tax planning
9. ✅ Implement all forms/dialogs
10. ✅ Implement all calculations
11. ✅ Connect to data layer using useDomainCRUD
12. ✅ Test and verify all features

---

This specification is based on the exact screenshots provided and should be implemented pixel-perfect to match the designs.


