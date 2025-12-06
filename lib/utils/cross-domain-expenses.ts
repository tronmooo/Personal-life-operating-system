/**
 * Cross-Domain Expense Aggregation
 * 
 * Aggregates expenses from ALL domains (pets, home, vehicles, financial, etc.)
 * for total financial calculations in the command center
 */

export interface DomainExpense {
  amount: number
  description: string
  date: string
  domain: string
  category?: string
}

export interface ExpenseAggregation {
  totalExpenses: number
  byDomain: {
    financial: number
    pets: number
    home: number
    vehicles: number
    health: number
    [key: string]: number
  }
  recentExpenses: DomainExpense[]
}

/**
 * Aggregate expenses from all domains
 */
export function aggregateCrossDomainExpenses(data: any): ExpenseAggregation {
  const result: ExpenseAggregation = {
    totalExpenses: 0,
    byDomain: {
      financial: 0,
      pets: 0,
      home: 0,
      vehicles: 0,
      health: 0,
    },
    recentExpenses: []
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // 1. Financial domain expenses
  const financialItems = Array.isArray(data.financial) ? data.financial : []
  financialItems.forEach((item: any) => {
    const meta = item.metadata || {}
    const type = (meta.type || meta.logType || '').toLowerCase()
    
    if (type === 'expense' || type.includes('expense')) {
      const amount = parseFloat(meta.amount || meta.expenseAmount || 0) || 0
      const date = item.createdAt || meta.date || new Date().toISOString()
      
      if (amount > 0) {
        result.totalExpenses += amount
        result.byDomain.financial += amount
        
        if (new Date(date) >= thirtyDaysAgo) {
          result.recentExpenses.push({
            amount,
            description: item.title || meta.description || 'Financial expense',
            date,
            domain: 'financial',
            category: meta.category
          })
        }
      }
    }
  })

  // 2. Pet domain expenses (from domain_entries, not pet_costs table)
  const petItems = Array.isArray(data.pets) ? data.pets : []
  petItems.forEach((item: any) => {
    const meta = item.metadata || {}
    const type = (meta.type || meta.logType || '').toLowerCase()
    
    // Pet expenses: vet visits, grooming, supplies
    if (type === 'vet_appointment' || type === 'expense' || type === 'cost') {
      const amount = parseFloat(meta.amount || meta.cost || 0) || 0
      const date = item.createdAt || meta.date || new Date().toISOString()
      
      if (amount > 0) {
        result.totalExpenses += amount
        result.byDomain.pets += amount
        
        if (new Date(date) >= thirtyDaysAgo) {
          result.recentExpenses.push({
            amount,
            description: item.title || meta.description || 'Pet expense',
            date,
            domain: 'pets',
            category: meta.category || 'pet care'
          })
        }
      }
    }
  })

  // 3. Home domain expenses (rent, utilities, repairs, mortgage)
  const homeItems = Array.isArray(data.home) ? data.home : []
  homeItems.forEach((item: any) => {
    const meta = item.metadata || {}
    const type = (meta.type || meta.logType || '').toLowerCase()
    
    if (type === 'expense' || type === 'cost' || type === 'bill') {
      const amount = parseFloat(meta.amount || meta.cost || 0) || 0
      const date = item.createdAt || meta.date || new Date().toISOString()
      
      if (amount > 0) {
        result.totalExpenses += amount
        result.byDomain.home += amount
        
        if (new Date(date) >= thirtyDaysAgo) {
          result.recentExpenses.push({
            amount,
            description: item.title || meta.description || 'Home expense',
            date,
            domain: 'home',
            category: meta.category || 'housing'
          })
        }
      }
    }
  })

  // 4. Property domain expenses (mortgage, property tax, HOA)
  const propertyItems = Array.isArray(data.property) ? data.property : []
  propertyItems.forEach((item: any) => {
    const meta = item.metadata || {}
    const type = (meta.type || meta.logType || '').toLowerCase()
    
    if (type === 'expense' || type === 'cost' || type === 'tax' || type === 'mortgage') {
      const amount = parseFloat(meta.amount || meta.cost || meta.payment || 0) || 0
      const date = item.createdAt || meta.date || new Date().toISOString()
      
      if (amount > 0) {
        result.totalExpenses += amount
        result.byDomain.home += amount // Add to home total
        
        if (new Date(date) >= thirtyDaysAgo) {
          result.recentExpenses.push({
            amount,
            description: item.title || meta.description || 'Property expense',
            date,
            domain: 'property',
            category: meta.category || 'property'
          })
        }
      }
    }
  })

  // 5. Vehicles domain expenses (maintenance, fuel, repairs)
  const vehicleItems = Array.isArray(data.vehicles) ? data.vehicles : []
  vehicleItems.forEach((item: any) => {
    const meta = item.metadata || {}
    const type = (meta.type || meta.logType || '').toLowerCase()
    
    if (type === 'cost' || type === 'maintenance' || type === 'expense' || type === 'fuel') {
      const amount = parseFloat(meta.amount || meta.cost || 0) || 0
      const date = item.createdAt || meta.date || new Date().toISOString()
      
      if (amount > 0) {
        result.totalExpenses += amount
        result.byDomain.vehicles += amount
        
        if (new Date(date) >= thirtyDaysAgo) {
          result.recentExpenses.push({
            amount,
            description: item.title || meta.description || 'Vehicle expense',
            date,
            domain: 'vehicles',
            category: meta.costType || meta.category || 'vehicle'
          })
        }
      }
    }
  })

  // 6. Health domain expenses (medical bills, medications)
  const healthItems = Array.isArray(data.health) ? data.health : []
  healthItems.forEach((item: any) => {
    const meta = item.metadata || {}
    const type = (meta.type || meta.logType || '').toLowerCase()
    
    if (type === 'expense' || type === 'cost' || type === 'medical_bill' || type === 'medication_cost') {
      const amount = parseFloat(meta.amount || meta.cost || 0) || 0
      const date = item.createdAt || meta.date || new Date().toISOString()
      
      if (amount > 0) {
        result.totalExpenses += amount
        result.byDomain.health += amount
        
        if (new Date(date) >= thirtyDaysAgo) {
          result.recentExpenses.push({
            amount,
            description: item.title || meta.description || 'Health expense',
            date,
            domain: 'health',
            category: meta.category || 'medical'
          })
        }
      }
    }
  })

  // Sort recent expenses by date (newest first)
  result.recentExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return result
}

/**
 * Calculate monthly expenses across all domains
 */
export function calculateMonthlyExpenses(data: any): number {
  const aggregation = aggregateCrossDomainExpenses(data)
  return aggregation.totalExpenses
}

/**
 * Get expense breakdown by domain
 */
export function getExpenseBreakdown(data: any): { domain: string; amount: number; percentage: number }[] {
  const aggregation = aggregateCrossDomainExpenses(data)
  const total = aggregation.totalExpenses

  if (total === 0) return []

  return Object.entries(aggregation.byDomain)
    .filter(([_, amount]) => amount > 0)
    .map(([domain, amount]) => ({
      domain,
      amount,
      percentage: (amount / total) * 100
    }))
    .sort((a, b) => b.amount - a.amount)
}

