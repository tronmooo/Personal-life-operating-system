/**
 * Data Validator - Ensures consistent data parsing across the entire app
 * This prevents display issues where data shows incorrectly in different places
 */

export interface ParsedFinancialData {
  amount: number
  type: 'income' | 'expense' | 'asset' | 'liability' | 'bill'
  original: any
}

/**
 * Parse financial amount from any possible location in the data structure
 */
export function parseAmount(item: any): number {
  const amount = parseFloat(
    item.amount || 
    item.balance || 
    item.value ||
    item.metadata?.amount || 
    item.metadata?.balance || 
    item.metadata?.value ||
    item.data?.amount ||
    item.data?.balance ||
    '0'
  )
  
  return isNaN(amount) ? 0 : amount
}

/**
 * Parse type from any possible location in the data structure
 */
export function parseType(item: any): string {
  const type = (
    item.type || 
    item.metadata?.type || 
    item.metadata?.accountType || 
    item.metadata?.category ||
    item.category ||
    item.logType ||
    ''
  ).toLowerCase()
  
  return type
}

/**
 * Parse date from any possible location in the data structure
 */
export function parseDate(item: any): Date | null {
  const dateStr = 
    item.date || 
    item.createdAt || 
    item.metadata?.date || 
    item.timestamp ||
    null
  
  if (!dateStr) return null
  
  try {
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Classify financial data into standardized categories
 */
export function classifyFinancialItem(item: any): ParsedFinancialData {
  const amount = parseAmount(item)
  const type = parseType(item)
  
  // Determine category based on type keywords
  if (type.includes('income')) {
    return { amount: Math.abs(amount), type: 'income', original: item }
  }
  
  if (type.includes('expense') || type.includes('spending')) {
    return { amount: Math.abs(amount), type: 'expense', original: item }
  }
  
  if (type.includes('bill') || type.includes('payment')) {
    return { amount: Math.abs(amount), type: 'bill', original: item }
  }
  
  if (type.includes('credit') || type.includes('debt') || type.includes('loan')) {
    return { amount: Math.abs(amount), type: 'liability', original: item }
  }
  
  if (type.includes('asset') || type.includes('savings') || type.includes('checking') || 
      type.includes('investment') || type.includes('401k') || type.includes('ira')) {
    return { amount: Math.abs(amount), type: 'asset', original: item }
  }
  
  // Default: positive = asset, negative = expense
  if (amount >= 0) {
    return { amount: Math.abs(amount), type: 'asset', original: item }
  } else {
    return { amount: Math.abs(amount), type: 'expense', original: item }
  }
}

/**
 * Calculate financial totals from an array of financial data
 */
export function calculateFinancialTotals(financialData: any[]) {
  let totalIncome = 0
  let totalExpenses = 0
  let totalAssets = 0
  let totalLiabilities = 0
  let monthlyBills = 0
  
  financialData.forEach(item => {
    const classified = classifyFinancialItem(item)
    
    switch (classified.type) {
      case 'income':
        totalIncome += classified.amount
        totalAssets += classified.amount
        break
      case 'expense':
        totalExpenses += classified.amount
        break
      case 'bill':
        monthlyBills += classified.amount
        totalExpenses += classified.amount
        break
      case 'asset':
        totalAssets += classified.amount
        break
      case 'liability':
        totalLiabilities += classified.amount
        break
    }
  })
  
  return {
    totalIncome,
    totalExpenses,
    totalAssets,
    totalLiabilities,
    monthlyBills,
    netWorth: totalAssets - totalLiabilities,
    netFlow: totalIncome - totalExpenses,
    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0,
  }
}

/**
 * Filter financial data by date range
 */
export function filterByDateRange(items: any[], daysBack: number): any[] {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysBack)
  
  return items.filter(item => {
    const date = parseDate(item)
    return date && date >= cutoffDate
  })
}

/**
 * Validate that data displays the same everywhere
 */
export function validateDataConsistency(item: any): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  
  // Check if amount exists in standard locations
  const hasAmount = !!(
    item.amount || 
    item.balance || 
    item.metadata?.amount || 
    item.metadata?.balance
  )
  
  if (!hasAmount) {
    warnings.push('No amount field found - data may not display correctly')
  }
  
  // Check if type exists
  const hasType = !!(
    item.type || 
    item.metadata?.type || 
    item.category
  )
  
  if (!hasType) {
    warnings.push('No type field found - data may be miscategorized')
  }
  
  // Check if date exists
  const hasDate = !!(
    item.date || 
    item.createdAt || 
    item.metadata?.date
  )
  
  if (!hasDate) {
    warnings.push('No date field found - data may not appear in time-based views')
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  }
}
































