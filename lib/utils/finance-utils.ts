import { FinancialAccount, Transaction, FinancialGoal } from '@/types/finance'
import { format, parseISO, addMonths, differenceInMonths } from 'date-fns'

// ============ CURRENCY FORMATTING ============
export function formatCurrency(amount: number, currency: string = 'USD', showSign: boolean = false): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
  
  if (showSign && amount !== 0) {
    return amount > 0 ? `+${formatted}` : `-${formatted}`
  }
  
  return formatted
}

export function formatCurrencyCompact(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return `$${amount.toFixed(0)}`
}

// ============ PERCENTAGE FORMATTING ============
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

// ============ STATUS & COLOR HELPERS ============
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: '#10b981',
    cleared: '#10b981',
    completed: '#10b981',
    active: '#3b82f6',
    pending: '#f59e0b',
    'in-progress': '#3b82f6',
    overdue: '#ef4444',
    paused: '#64748b',
    cancelled: '#64748b',
  }
  return colors[status.toLowerCase()] || '#64748b'
}

export function getBudgetStatusColor(spent: number, budget: number): string {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0
  if (percentage >= 100) return '#ef4444' // Red - over budget
  if (percentage >= 85) return '#f59e0b' // Yellow - warning
  return '#10b981' // Green - on track
}

export function getAmountColor(amount: number, type: 'income' | 'expense' | 'transfer'): string {
  if (type === 'income') return '#10b981' // Green
  if (type === 'expense') return '#ef4444' // Red
  return '#3b82f6' // Blue for transfers
}

// ============ BUDGET CALCULATIONS ============
export function calculateBudgetProgress(spent: number, budget: number): number {
  if (budget === 0) return 0
  return Math.min((spent / budget) * 100, 100)
}

export function getRemainingBudget(budget: number, spent: number): number {
  return Math.max(budget - spent, 0)
}

export function isOverBudget(spent: number, budget: number): boolean {
  return spent > budget
}

// ============ TRANSACTION GROUPING ============
export function groupTransactionsByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  const grouped: Record<string, Transaction[]> = {}
  
  transactions.forEach(t => {
    const dateKey = t.date
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    grouped[dateKey].push(t)
  })
  
  // Sort dates descending
  const sorted: Record<string, Transaction[]> = {}
  Object.keys(grouped)
    .sort((a, b) => b.localeCompare(a))
    .forEach(key => {
      sorted[key] = grouped[key].sort((a, b) => b.created_at.localeCompare(a.created_at))
    })
  
  return sorted
}

export function formatDateHeader(dateString: string): string {
  try {
    const date = parseISO(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today'
    }
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday'
    }
    return format(date, 'EEEE, MMMM d, yyyy')
  } catch {
    return dateString
  }
}

// ============ NET WORTH CALCULATIONS ============
export function calculateNetWorth(accounts: FinancialAccount[]): {
  assets: number
  liabilities: number
  netWorth: number
} {
  const assets = accounts
    .filter(a => a.isActive && ['checking', 'savings', 'investment', 'asset'].includes(a.type))
    .reduce((sum, a) => sum + a.balance, 0)
  
  const liabilities = accounts
    .filter(a => a.isActive && ['credit', 'loan', 'mortgage'].includes(a.type))
    .reduce((sum, a) => sum + Math.abs(a.balance), 0)
  
  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
  }
}

export function getAccountTypeLabel(type: Account['type']): string {
  const labels: Record<Account['type'], string> = {
    checking: 'Checking',
    savings: 'Savings',
    credit: 'Credit Card',
    investment: 'Investment',
    loan: 'Loan',
    mortgage: 'Mortgage',
    asset: 'Asset',
  }
  return labels[type] || type
}

export function isAssetAccount(type: Account['type']): boolean {
  return ['checking', 'savings', 'investment', 'asset'].includes(type)
}

export function isLiabilityAccount(type: Account['type']): boolean {
  return ['credit', 'loan', 'mortgage'].includes(type)
}

// ============ GOAL PROJECTIONS ============
export function projectGoalCompletion(goal: FinancialGoal): Date | null {
  if (goal.currentAmount >= goal.targetAmount) {
    return new Date() // Already completed
  }

  if (!goal.monthlyContribution || goal.monthlyContribution <= 0) {
    return null // Cannot project without contributions
  }

  const remaining = goal.targetAmount - goal.currentAmount
  const monthsNeeded = Math.ceil(remaining / goal.monthlyContribution)

  return addMonths(new Date(), monthsNeeded)
}

export function calculateGoalProgress(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min((current / target) * 100, 100)
}

export function getGoalStatus(goal: FinancialGoal): {
  status: 'on-track' | 'ahead' | 'behind' | 'completed'
  message: string
} {
  if (goal.currentAmount >= goal.targetAmount) {
    return { status: 'completed', message: 'Goal achieved!' }
  }

  if (!goal.targetDate) {
    return { status: 'on-track', message: 'No target date set' }
  }

  const targetDate = parseISO(goal.targetDate)
  const now = new Date()
  const monthsUntilTarget = differenceInMonths(targetDate, now)

  if (monthsUntilTarget <= 0) {
    return { status: 'behind', message: 'Target date passed' }
  }

  const remaining = goal.targetAmount - goal.currentAmount
  const monthlyNeeded = remaining / monthsUntilTarget

  if (!goal.monthlyContribution || monthlyNeeded <= goal.monthlyContribution) {
    return { status: 'on-track', message: 'On track to reach goal' }
  }

  if (monthlyNeeded <= goal.monthlyContribution * 1.2) {
    return { status: 'behind', message: 'Slightly behind pace' }
  }

  return { status: 'behind', message: 'Significantly behind pace' }
}

// ============ RECURRING TRANSACTIONS ============
export function generateRecurringTransactions(
  transaction: Transaction,
  months: number
): Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[] {
  // Note: Transaction type doesn't have recurring fields currently
  // This function is a placeholder for future functionality
  return []
}

// ============ DATE HELPERS ============
export function getMonthName(month: string): string {
  // month format: YYYY-MM
  try {
    return format(parseISO(month + '-01'), 'MMMM yyyy')
  } catch {
    return month
  }
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

export function getPreviousMonth(): string {
  return format(addMonths(new Date(), -1), 'yyyy-MM')
}

export function getNextMonth(): string {
  return format(addMonths(new Date(), 1), 'yyyy-MM')
}

// ============ VALIDATION ============
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0
}

export function sanitizeAmount(amount: string): number {
  return Math.max(0, parseFloat(amount) || 0)
}

// ============ SEARCH & FILTER ============
export function searchTransactions(transactions: Transaction[], query: string): Transaction[] {
  const lowerQuery = query.toLowerCase()
  return transactions.filter(t =>
    (t.description || '').toLowerCase().includes(lowerQuery) ||
    (t.payee || '').toLowerCase().includes(lowerQuery) ||
    (t.notes || '').toLowerCase().includes(lowerQuery) ||
    (t.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}



















