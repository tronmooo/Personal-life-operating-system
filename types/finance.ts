// ===================================================================
// FINANCE DOMAIN - COMPLETE TYPE DEFINITIONS
// Based on Financial Command Center specification
// ===================================================================

// ============ CATEGORY TYPE ============
export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: 'income' | 'expense'
  isDefault?: boolean
}

// ============ BASE DOMAIN ENTRY ============
export interface FinancialDomainEntry {
  id: string
  user_id?: string
  domain: 'financial'
  title: string
  description?: string
  metadata: FinancialMetadata
  created_at: string
  updated_at: string
}

// ============ FINANCIAL METADATA UNION ============
export type FinancialMetadata = 
  | TransactionMetadata
  | AccountMetadata
  | AssetMetadata
  | InvestmentMetadata
  | DebtMetadata
  | BillMetadata
  | BudgetMetadata
  | GoalMetadata
  | RecurringTransactionMetadata
  | NetWorthSnapshotMetadata
  | TaxDeductionMetadata

// ============ TRANSACTION ============
export interface TransactionMetadata {
  itemType: 'transaction'
  type: 'income' | 'expense' | 'transfer'
  category: string
  subcategory?: string
  amount: number
  date: string // ISO date
  account?: string
  payee?: string
  payer?: string
  tags?: string[]
  paymentMethod?: 'cash' | 'debit' | 'credit' | 'transfer' | 'check'
  status?: 'pending' | 'cleared' | 'reconciled'
  receiptUrl?: string
  notes?: string
}

export interface Transaction {
  id: string
  title: string
  description?: string
  type: 'income' | 'expense' | 'transfer'
  category: string
  subcategory?: string
  amount: number
  date: string
  account?: string
  payee?: string
  payer?: string
  tags?: string[]
  paymentMethod?: string
  status?: string
  receiptUrl?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface TransactionFormData {
  title: string
  description?: string
  type: 'income' | 'expense' | 'transfer'
  category: string
  subcategory?: string
  amount: number
  date: string
  account?: string
  payee?: string
  tags?: string[]
  paymentMethod?: string
  notes?: string
}

// ============ ACCOUNT ============
export interface AccountMetadata {
  itemType: 'account'
  accountType: 'checking' | 'savings' | 'credit' | 'investment' | 'retirement' | 'loan' | 'mortgage'
  institution: string
  accountNumber?: string
  balance: number
  interestRate?: number
  creditLimit?: number
  openDate?: string
  lastUpdated?: string
  isActive?: boolean
  routingNumber?: string
}

export interface FinancialAccount {
  id: string
  name: string // Title from domain_entries
  accountType: string
  institution: string
  accountNumber?: string
  balance: number
  interestRate?: number
  creditLimit?: number
  openDate?: string
  lastUpdated?: string
  isActive?: boolean
  created_at: string
  updated_at: string
}

export interface AccountFormData {
  name: string
  accountType: 'checking' | 'savings' | 'credit' | 'investment' | 'retirement'
  institution: string
  accountNumber?: string
  balance: number
  interestRate?: number
  creditLimit?: number
  openDate?: string
}

// ============ ASSET ============
export interface AssetMetadata {
  itemType: 'asset'
  assetType: 'real-estate' | 'vehicle' | 'investment' | 'valuables' | 'property' | 'other'
  currentValue: number
  purchasePrice?: number
  purchaseDate?: string
  lastUpdated: string
  appreciationRate?: number
  location?: string
  notes?: string
}

export interface Asset {
  id: string
  name: string // Title from domain_entries
  assetType: string
  currentValue: number
  purchasePrice?: number
  purchaseDate?: string
  lastUpdated: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface AssetFormData {
  name: string
  assetType: 'real-estate' | 'vehicle' | 'investment' | 'valuables' | 'other'
  currentValue: number
  purchasePrice?: number
  purchaseDate?: string
  notes?: string
}

// ============ INVESTMENT ============
export interface InvestmentMetadata {
  itemType: 'investment'
  symbol: string
  quantity: number
  purchasePrice: number
  currentPrice: number
  purchaseDate: string
  broker?: string
  investmentType?: 'stock' | 'bond' | 'etf' | 'mutual-fund' | 'crypto' | 'other'
  totalValue?: number
  totalCost?: number
  gainLoss?: number
  returnPercent?: number
}

export interface Investment {
  id: string
  name: string // Stock name
  symbol: string
  quantity: number
  purchasePrice: number
  currentPrice: number
  purchaseDate: string
  broker?: string
  investmentType?: string
  totalValue: number
  totalCost: number
  gainLoss: number
  returnPercent: number
  created_at: string
  updated_at: string
}

export interface InvestmentFormData {
  name: string
  symbol: string
  quantity: number
  purchasePrice: number
  currentPrice: number
  purchaseDate: string
  broker?: string
  investmentType?: 'stock' | 'bond' | 'etf' | 'mutual-fund' | 'crypto' | 'other'
}

// ============ DEBT / LIABILITY ============
export interface DebtMetadata {
  itemType: 'debt'
  creditor: string
  loanType: 'mortgage' | 'auto' | 'student' | 'personal' | 'credit-card' | 'medical' | 'other'
  interestRate: number
  originalBalance: number
  currentBalance: number
  minimumPayment: number
  dueDate: string // Day of month or full date
  accountNumber?: string
  termMonths?: number
  monthsRemaining?: number
  payoffDate?: string
  isAutoPay?: boolean
}

export interface Debt {
  id: string
  name: string // Debt name
  creditor: string
  loanType: string
  interestRate: number
  originalBalance: number
  currentBalance: number
  minimumPayment: number
  dueDate: string
  accountNumber?: string
  termMonths?: number
  monthsRemaining?: number
  payoffDate?: string
  isAutoPay?: boolean
  created_at: string
  updated_at: string
}

export interface DebtFormData {
  name: string
  creditor: string
  loanType: 'mortgage' | 'auto' | 'student' | 'personal' | 'credit-card' | 'medical' | 'other'
  interestRate: number
  originalBalance: number
  currentBalance: number
  minimumPayment: number
  dueDate: string
  accountNumber?: string
  termMonths?: number
  isAutoPay?: boolean
}

// ============ BILL ============
export interface BillMetadata {
  itemType: 'bill'
  provider: string
  category: 'utilities' | 'housing' | 'insurance' | 'entertainment' | 'auto' | 'health' | 'software' | 'education' | 'other'
  amount: number
  dueDate: string // Day of month or full date
  recurring: boolean
  frequency?: 'monthly' | 'quarterly' | 'semi-annual' | 'annual'
  isAutoPay: boolean
  status: 'pending' | 'paid' | 'overdue' | 'scheduled'
  account?: string
  website?: string
  lastPaidDate?: string
  nextDueDate?: string
  notes?: string
}

export interface Bill {
  id: string
  name: string // Bill name
  provider: string
  category: string
  amount: number
  due_date: string
  dueDate: string
  recurring: boolean
  frequency?: string
  is_autopay: boolean
  isAutoPay: boolean
  status: string
  account?: string
  website?: string
  lastPaidDate?: string
  nextDueDate?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface BillFormData {
  name: string
  provider: string
  category: string
  amount: number
  dueDate: string
  recurring: boolean
  frequency?: 'monthly' | 'quarterly' | 'semi-annual' | 'annual'
  isAutoPay: boolean
  status?: 'pending' | 'paid' | 'overdue'
  account?: string
  notes?: string
}

// ============ BUDGET ============
export interface BudgetMetadata {
  itemType: 'budget'
  category: string
  budgetedAmount: number
  spentAmount: number
  month: string // YYYY-MM
  year: number
  rollover?: boolean
  carryoverAmount?: number
}

export interface BudgetCategory {
  id: string
  category: string
  budgetedAmount: number
  spentAmount: number
  month: string
  year: number
  variance: number
  percentUsed: number
  rollover?: boolean
  created_at: string
  updated_at: string
}

export interface BudgetItemFormData {
  category: string
  budgetedAmount: number
  month: string
  year: number
  rollover?: boolean
}

// ============ GOAL ============
export interface GoalMetadata {
  itemType: 'goal'
  goalType: 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'retirement' | 'other'
  targetAmount: number
  currentAmount: number
  targetDate?: string
  monthlyContribution?: number
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  progress?: number // 0-100
  account?: string
  milestones?: Array<{ amount: number; date: string; achieved: boolean }>
}

export interface FinancialGoal {
  id: string
  title: string
  description?: string
  goalType: string
  targetAmount: number
  currentAmount: number
  targetDate?: string
  monthlyContribution?: number
  priority: string
  status: string
  progress: number
  account?: string
  created_at: string
  updated_at: string
}

export interface GoalFormData {
  title: string
  description?: string
  goalType: 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other'
  targetAmount: number
  currentAmount: number
  targetDate?: string
  monthlyContribution?: number
  priority: 'low' | 'medium' | 'high'
}

// ============ RECURRING TRANSACTION ============
export interface RecurringTransactionMetadata {
  itemType: 'recurring-transaction'
  type: 'income' | 'expense'
  category: string
  amount: number
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual'
  startDate: string
  endDate?: string
  account: string
  isActive: boolean
  lastGenerated?: string
  nextGeneration?: string
}

export interface RecurringTransaction {
  id: string
  name: string
  type: 'income' | 'expense'
  category: string
  amount: number
  frequency: string
  startDate: string
  endDate?: string
  account: string
  isActive: boolean
  lastGenerated?: string
  nextGeneration?: string
  created_at: string
  updated_at: string
}

export interface RecurringTransactionFormData {
  name: string
  type: 'income' | 'expense'
  category: string
  amount: number
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual'
  startDate: string
  endDate?: string
  account: string
}

// ============ NET WORTH SNAPSHOT ============
export interface NetWorthSnapshotMetadata {
  itemType: 'networth-snapshot'
  date: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  liquidAssets?: number
  investmentAssets?: number
  realEstateAssets?: number
  otherAssets?: number
  breakdown?: {
    accounts: Array<{ id: string; name: string; balance: number }>
    assets: Array<{ id: string; name: string; value: number }>
    debts: Array<{ id: string; name: string; balance: number }>
  }
}

export interface NetWorthSnapshot {
  id: string
  date: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  liquidAssets?: number
  investmentAssets?: number
  breakdown?: any
  created_at: string
}

// ============ TAX DEDUCTION ============
export interface TaxDeductionMetadata {
  itemType: 'tax-deduction'
  deductionType: 'charitable' | 'medical' | 'business' | 'education' | 'mortgage-interest' | 'state-tax' | 'other'
  amount: number
  date: string
  year: number
  description?: string
  category?: string
  receiptUrl?: string
  isEstimated?: boolean
}

export interface TaxDeduction {
  id: string
  deductionType: string
  amount: number
  date: string
  year: number
  description?: string
  category?: string
  receiptUrl?: string
  created_at: string
}

// ============ CALCULATED SUMMARIES ============
export interface FinancialSummary {
  // Assets
  totalAssets: number
  liquidAssets: number
  investmentAssets: number
  realEstateAssets: number
  otherAssets: number
  
  // Liabilities
  totalLiabilities: number
  totalDebt: number
  creditCardDebt: number
  loanDebt: number
  
  // Net Worth
  netWorth: number
  netWorthChange?: number
  netWorthChangePercent?: number
  
  // Cash Flow
  monthlyIncome: number
  monthlyExpenses: number
  monthlyCashFlow: number
  
  // Metrics
  savingsRate: number
  debtToIncomeRatio: number
  emergencyFundMonths: number
  
  // Last Updated
  lastCalculated: string
}

export interface DebtSummary {
  totalDebt: number
  totalMinimumPayments: number
  highestInterestRate: number
  highestInterestDebt?: Debt
  averageInterestRate: number
  debtByType: Record<string, number>
  monthlyPayments: number
  totalInterestPaid?: number
  debtFreeDate?: string
}

export interface BillSummary {
  upcomingBillsCount: number
  totalAmountDue: number
  autoPayCount: number
  overdueCount: number
  nextBills: Bill[]
  monthlyRecurringTotal: number
  billsByCategory: Record<string, number>
}

export interface InvestmentPortfolio {
  totalValue: number
  totalCost: number
  totalGainLoss: number
  totalReturn: number
  returnPercent: number
  dayChange?: number
  dayChangePercent?: number
  investments: Investment[]
  byType: Record<string, { value: number; gainLoss: number; returnPercent: number }>
}

export interface MonthlyBudgetSummary {
  month: string
  year: number
  totalBudgeted: number
  totalSpent: number
  variance: number
  variancePercent: number
  categories: BudgetCategory[]
  overBudgetCategories: string[]
  underBudgetCategories: string[]
}

// ============ INSIGHTS & RECOMMENDATIONS ============
export interface FinancialInsight {
  id: string
  type: 'alert' | 'warning' | 'success' | 'opportunity' | 'info'
  title: string
  message: string
  action?: string
  priority: 'low' | 'medium' | 'high'
  category: 'emergency-fund' | 'debt' | 'budget' | 'savings' | 'investment' | 'bills' | 'taxes' | 'other'
  createdAt: string
  dismissible: boolean
  dismissed?: boolean
}

// ============ SPENDING ANALYTICS ============
export interface SpendingByCategory {
  category: string
  amount: number
  percentage: number
  transactionCount: number
  budget?: number
  variance?: number
}

export interface SpendingTrend {
  month: string
  year: number
  totalSpending: number
  byCategory: Record<string, number>
  topCategories: SpendingByCategory[]
}

export interface DailySpending {
  date: string // YYYY-MM-DD
  amount: number
  transactionCount: number
  categories: string[]
}

// ============ TAX PLANNING ============
export interface TaxSummary {
  year: number
  totalIncome: number
  totalDeductions: number
  standardDeduction: number
  itemizedDeductions: number
  taxableIncome: number
  estimatedTax: number
  effectiveRate: number
  deductionsByCategory: Record<string, number>
  taxSavingOpportunities: Array<{
    title: string
    description: string
    potentialSavings?: number
    type: 'suggestion' | 'reminder' | 'opportunity'
  }>
}

// ============ NET WORTH PROJECTION ============
export interface NetWorthProjection {
  years: number
  monthlyContribution: number
  annualReturn: number
  currentNetWorth: number
  projectedNetWorth: number
  totalGrowth: number
  scenarios: {
    conservative: Array<{ year: number; value: number }>
    expected: Array<{ year: number; value: number }>
    optimistic: Array<{ year: number; value: number }>
  }
}

// ============ CHART DATA TYPES ============
export interface ChartDataPoint {
  month: string
  year?: number
  value: number
  label?: string
  [key: string]: any
}

export interface TrendChartData {
  month: string
  income: number
  expenses: number
  savings: number
  netWorth?: number
}

export interface CategoryChartData {
  category: string
  value: number
  percentage: number
  color?: string
}

// ============ FILTER & SORT ============
export interface TransactionFilters {
  dateRange?: { start: string; end: string }
  type?: 'income' | 'expense' | 'transfer' | 'all'
  categories?: string[]
  accounts?: string[]
  minAmount?: number
  maxAmount?: number
  searchQuery?: string
  status?: string[]
  tags?: string[]
}

export interface FinancialDataFilters {
  dateRange?: { start: string; end: string }
  categories?: string[]
  types?: string[]
  status?: string[]
  searchQuery?: string
}

// ============ EXPORT DATA ============
export interface ExportData {
  format: 'csv' | 'json' | 'pdf' | 'xlsx'
  dataType: 'transactions' | 'bills' | 'budgets' | 'goals' | 'all'
  dateRange?: { start: string; end: string }
  includeCategories?: boolean
  includeNotes?: boolean
}

// ============ PLAID INTEGRATION ============
export interface PlaidAccount {
  id: string
  name: string
  mask: string
  type: string
  subtype: string
  balance: {
    available: number | null
    current: number
    limit: number | null
  }
}

export interface PlaidTransaction {
  id: string
  accountId: string
  amount: number
  date: string
  name: string
  merchantName?: string
  category?: string[]
  pending: boolean
}

export interface PlaidConnection {
  id: string
  institutionId: string
  institutionName: string
  accounts: PlaidAccount[]
  lastSync: string
  status: 'active' | 'error' | 'pending'
  error?: string
}

// ============ CONTEXT TYPE ============
export interface FinanceContextType {
  // Data
  accounts: FinancialAccount[]
  transactions: Transaction[]
  assets: Asset[]
  investments: Investment[]
  debts: Debt[]
  bills: Bill[]
  budgetCategories: BudgetCategory[]
  goals: FinancialGoal[]
  recurringTransactions: RecurringTransaction[]
  taxDeductions: TaxDeduction[]
  
  // Calculated Summaries
  financialSummary: FinancialSummary | null
  debtSummary: DebtSummary | null
  billSummary: BillSummary | null
  investmentPortfolio: InvestmentPortfolio | null
  monthlyBudget: MonthlyBudgetSummary | null
  insights: FinancialInsight[]
  
  // Loading States
  loading: boolean
  accountsLoading: boolean
  transactionsLoading: boolean
  assetsLoading: boolean
  debtsLoading: boolean
  billsLoading: boolean
  budgetLoading: boolean
  goalsLoading: boolean
  
  // CRUD Functions - Accounts
  createAccount: (data: AccountFormData) => Promise<FinancialAccount | null>
  updateAccount: (id: string, data: Partial<AccountFormData>) => Promise<boolean>
  deleteAccount: (id: string) => Promise<boolean>
  
  // CRUD Functions - Transactions
  createTransaction: (data: TransactionFormData) => Promise<Transaction | null>
  updateTransaction: (id: string, data: Partial<TransactionFormData>) => Promise<boolean>
  deleteTransaction: (id: string) => Promise<boolean>
  
  // CRUD Functions - Assets
  createAsset: (data: AssetFormData) => Promise<Asset | null>
  updateAsset: (id: string, data: Partial<AssetFormData>) => Promise<boolean>
  deleteAsset: (id: string) => Promise<boolean>
  
  // CRUD Functions - Investments
  createInvestment: (data: InvestmentFormData) => Promise<Investment | null>
  updateInvestment: (id: string, data: Partial<InvestmentFormData>) => Promise<boolean>
  deleteInvestment: (id: string) => Promise<boolean>
  
  // CRUD Functions - Debts
  createDebt: (data: DebtFormData) => Promise<Debt | null>
  updateDebt: (id: string, data: Partial<DebtFormData>) => Promise<boolean>
  deleteDebt: (id: string) => Promise<boolean>
  
  // CRUD Functions - Bills
  createBill: (data: BillFormData) => Promise<Bill | null>
  updateBill: (id: string, data: Partial<BillFormData>) => Promise<boolean>
  deleteBill: (id: string) => Promise<boolean>
  
  // CRUD Functions - Budget
  createBudgetItem: (data: BudgetItemFormData) => Promise<BudgetCategory | null>
  updateBudgetItem: (id: string, data: Partial<BudgetItemFormData>) => Promise<boolean>
  deleteBudgetItem: (id: string) => Promise<boolean>
  
  // CRUD Functions - Goals
  createGoal: (data: GoalFormData) => Promise<FinancialGoal | null>
  updateGoal: (id: string, data: Partial<GoalFormData>) => Promise<boolean>
  deleteGoal: (id: string) => Promise<boolean>
  updateGoalProgress: (id: string, amount: number) => Promise<boolean>
  
  // CRUD Functions - Recurring Transactions
  createRecurringTransaction: (data: RecurringTransactionFormData) => Promise<RecurringTransaction | null>
  updateRecurringTransaction: (id: string, data: Partial<RecurringTransactionFormData>) => Promise<boolean>
  deleteRecurringTransaction: (id: string) => Promise<boolean>
  generateRecurringTransactions: () => Promise<number>
  
  // Utility Functions
  refreshData: () => Promise<void>
  exportData: (options: ExportData) => Promise<Blob | null>
  calculateProjection: (years: number, monthlyContribution: number, annualReturn: number) => NetWorthProjection
  getTaxSummary: (year: number) => TaxSummary
  getSpendingTrend: (months: number) => SpendingTrend[]
  getDailySpending: (month: string) => DailySpending[]
}
