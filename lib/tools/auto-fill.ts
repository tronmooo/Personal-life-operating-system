/**
 * Auto-Fill System for Tools
 * Intelligently pulls data from all domains to pre-fill calculator inputs
 */

import { DomainData } from '@/types/domains'
import { differenceInYears } from 'date-fns'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface AutoFillData {
  // Financial Data
  income: {
    monthly: number
    annual: number
    sources: string[]
  }
  
  // Expenses
  expenses: {
    monthly: number
    byCategory: Record<string, number>
    recurring: Array<{
      name: string
      amount: number
      frequency: string
    }>
  }
  
  // Assets
  assets: {
    realEstate: number
    vehicles: number
    cash: number
    investments: number
    collectibles: number
    appliances: number
    total: number
    breakdown: Array<{
      category: string
      value: number
      items: number
    }>
  }
  
  // Liabilities
  liabilities: {
    mortgage: number
    autoLoans: number
    creditCards: number
    studentLoans: number
    otherLoans: number
    total: number
    breakdown: Array<{
      type: string
      balance: number
      rate: number
      payment: number
    }>
  }
  
  // Insurance
  insurance: {
    policies: any[]
    totalPremiums: number
    totalCoverage: number
    byType: Record<string, {
      premium: number
      coverage: number
      policies: number
    }>
  }
  
  // Personal
  profile: {
    name?: string
    email?: string
    phone?: string
    age: number | null
    dependents: number
    filingStatus: string
    state: string | null
  }
  
  // Net Worth
  netWorth: number
}

export function useAutoFillData(): AutoFillData {
  const { data, bills } = useData()
  
  // Return empty data if not loaded yet
  if (!data) {
    return {
      income: { monthly: 0, annual: 0, sources: [] },
      expenses: { monthly: 0, byCategory: {}, recurring: [] },
      assets: { realEstate: 0, vehicles: 0, cash: 0, investments: 0, collectibles: 0, appliances: 0, total: 0, breakdown: [] },
      liabilities: { mortgage: 0, autoLoans: 0, creditCards: 0, studentLoans: 0, otherLoans: 0, total: 0, breakdown: [] },
      insurance: { policies: [], totalPremiums: 0, totalCoverage: 0, byType: {} },
      profile: { name: undefined, email: undefined, phone: undefined, age: null, dependents: 0, filingStatus: 'single', state: null },
      netWorth: 0
    }
  }
  
  // Calculate Income
  const calculateIncome = () => {
    const finance = data.finance || []
    let totalMonthly = 0
    const sources: string[] = []

    finance.forEach(item => {
      const meta = item.metadata as any
      if (meta?.itemType === 'income' || meta?.type === 'income') {
        const amount = parseFloat(meta?.amount || '0')
        const frequency = meta?.frequency || 'monthly'
        
        // Convert to monthly
        let monthlyAmount = amount
        if (frequency === 'annual' || frequency === 'yearly') {
          monthlyAmount = amount / 12
        } else if (frequency === 'weekly') {
          monthlyAmount = amount * 4.33
        } else if (frequency === 'biweekly') {
          monthlyAmount = amount * 2.17
        }
        
        totalMonthly += monthlyAmount
        sources.push(item.title)
      }
    })
    
    return {
      monthly: Math.round(totalMonthly),
      annual: Math.round(totalMonthly * 12),
      sources
    }
  }
  
  // Calculate Expenses
  const calculateExpenses = () => {
    const bills = data.finance || []
    let totalMonthly = 0
    const byCategory: Record<string, number> = {}
    const recurring: Array<{ name: string; amount: number; frequency: string }> = []

    bills.forEach(item => {
      const meta = item.metadata as any
      if (meta?.itemType === 'bill' || meta?.type === 'expense') {
        const amount = parseFloat(meta?.amount || '0')
        const category = meta?.category || 'Other'
        const frequency = meta?.frequency || 'monthly'
        
        // Convert to monthly
        let monthlyAmount = amount
        if (frequency === 'annual' || frequency === 'yearly') {
          monthlyAmount = amount / 12
        } else if (frequency === 'weekly') {
          monthlyAmount = amount * 4.33
        } else if (frequency === 'biweekly') {
          monthlyAmount = amount * 2.17
        }
        
        totalMonthly += monthlyAmount
        byCategory[category] = (byCategory[category] || 0) + monthlyAmount
        
        recurring.push({
          name: item.title,
          amount: monthlyAmount,
          frequency: 'monthly'
        })
      }
    })
    
    // Add insurance premiums
    const insurance = data.insurance || []
    insurance.forEach(item => {
      const meta = item.metadata as any
      if (meta?.itemType === 'policy') {
        const premium = parseFloat(meta?.monthlyPremium || meta?.premium || '0')
        totalMonthly += premium
        byCategory['Insurance'] = (byCategory['Insurance'] || 0) + premium
      }
    })
    
    return {
      monthly: Math.round(totalMonthly),
      byCategory,
      recurring
    }
  }
  
  // Calculate Assets
  const calculateAssets = () => {
    const home = data.home || []
    const vehicles = data.vehicles || []
    const finance = data.finance || []
    const collectibles = data.collectibles || []
    const appliances = data.appliances || []
    
    // Real Estate
    const realEstate = home.reduce((sum, h) => {
      const meta = h.metadata as any
      return sum + (parseFloat(meta?.value || meta?.estimatedValue || '0'))
    }, 0)

    // Vehicles
    const vehiclesValue = vehicles.reduce((sum, v) => {
      const meta = v.metadata as any
      return sum + (parseFloat(meta?.value || meta?.estimatedValue || '0'))
    }, 0)
    
    // Cash & Investments
    let cash = 0
    let investments = 0
    finance.forEach(item => {
      const meta = item.metadata as any
      if (meta?.itemType === 'account') {
        const balance = parseFloat(meta?.balance || '0')
        const accountType = meta?.accountType || ''
        
        if (accountType.includes('checking') || accountType.includes('savings')) {
          cash += balance
        } else if (accountType.includes('investment') || accountType.includes('retirement') || accountType.includes('401k') || accountType.includes('ira')) {
          investments += balance
        }
      }
    })
    
    // Collectibles
    const collectiblesValue = collectibles.reduce((sum, c) => {
      const meta = c.metadata as any
      return sum + (parseFloat(meta?.estimatedValue || meta?.value || '0'))
    }, 0)

    // Appliances
    const appliancesValue = appliances.reduce((sum, a) => {
      const meta = a.metadata as any
      return sum + (parseFloat(meta?.estimatedValue || meta?.value || '0'))
    }, 0)
    
    const total = realEstate + vehiclesValue + cash + investments + collectiblesValue + appliancesValue
    
    return {
      realEstate: Math.round(realEstate),
      vehicles: Math.round(vehiclesValue),
      cash: Math.round(cash),
      investments: Math.round(investments),
      collectibles: Math.round(collectiblesValue),
      appliances: Math.round(appliancesValue),
      total: Math.round(total),
      breakdown: [
        { category: 'Real Estate', value: Math.round(realEstate), items: home.length },
        { category: 'Vehicles', value: Math.round(vehiclesValue), items: vehicles.length },
        { category: 'Cash', value: Math.round(cash), items: 0 },
        { category: 'Investments', value: Math.round(investments), items: 0 },
        { category: 'Collectibles', value: Math.round(collectiblesValue), items: collectibles.length },
        { category: 'Appliances', value: Math.round(appliancesValue), items: appliances.length }
      ].filter(b => b.value > 0)
    }
  }
  
  // Calculate Liabilities
  const calculateLiabilities = () => {
    const home = data.home || []
    const vehicles = data.vehicles || []
    const finance = data.finance || []
    
    let mortgage = 0
    let autoLoans = 0
    let creditCards = 0
    let studentLoans = 0
    let otherLoans = 0
    
    const breakdown: Array<{
      type: string
      balance: number
      rate: number
      payment: number
    }> = []
    
    // Mortgages
    home.forEach(h => {
      const meta = h.metadata as any
      if (meta?.mortgage) {
        const balance = parseFloat(meta?.mortgageBalance || '0')
        mortgage += balance
        breakdown.push({
          type: 'Mortgage',
          balance,
          rate: parseFloat(meta?.mortgageRate || '0'),
          payment: parseFloat(meta?.monthlyPayment || '0')
        })
      }
    })

    // Auto Loans
    vehicles.forEach(v => {
      const meta = v.metadata as any
      if (meta?.financed) {
        const balance = parseFloat(meta?.loanBalance || '0')
        autoLoans += balance
        breakdown.push({
          type: 'Auto Loan',
          balance,
          rate: parseFloat(meta?.loanRate || '0'),
          payment: parseFloat(meta?.monthlyPayment || '0')
        })
      }
    })

    // Credit Cards & Loans
    finance.forEach(item => {
      const meta = item.metadata as any
      if (meta?.itemType === 'loan' || meta?.type === 'loan') {
        const balance = parseFloat(meta?.balance || meta?.amount || '0')
        const loanType = (meta?.loanType || '').toLowerCase()
        const rate = parseFloat(meta?.interestRate || meta?.rate || '0')
        const payment = parseFloat(meta?.monthlyPayment || meta?.payment || '0')
        
        if (loanType.includes('credit') || loanType.includes('card')) {
          creditCards += balance
          breakdown.push({ type: 'Credit Card', balance, rate, payment })
        } else if (loanType.includes('student')) {
          studentLoans += balance
          breakdown.push({ type: 'Student Loan', balance, rate, payment })
        } else {
          otherLoans += balance
          breakdown.push({ type: item.title, balance, rate, payment })
        }
      }
    })
    
    const total = mortgage + autoLoans + creditCards + studentLoans + otherLoans
    
    return {
      mortgage: Math.round(mortgage),
      autoLoans: Math.round(autoLoans),
      creditCards: Math.round(creditCards),
      studentLoans: Math.round(studentLoans),
      otherLoans: Math.round(otherLoans),
      total: Math.round(total),
      breakdown
    }
  }
  
  // Calculate Insurance
  const calculateInsurance = () => {
    const insurance = data.insurance || []
    let totalPremiums = 0
    let totalCoverage = 0
    const byType: Record<string, { premium: number; coverage: number; policies: number }> = {}
    
    insurance.forEach(item => {
      const meta = item.metadata as any
      if (meta?.itemType === 'policy') {
        const premium = parseFloat(meta?.monthlyPremium || meta?.premium || '0')
        const coverage = parseFloat(meta?.coverage || '0')
        const type = meta?.type || 'Other'
        
        totalPremiums += premium
        totalCoverage += coverage
        
        if (!byType[type]) {
          byType[type] = { premium: 0, coverage: 0, policies: 0 }
        }
        byType[type].premium += premium
        byType[type].coverage += coverage
        byType[type].policies += 1
      }
    })
    
    return {
      policies: insurance.filter(i => (i.metadata as any)?.itemType === 'policy'),
      totalPremiums: Math.round(totalPremiums),
      totalCoverage: Math.round(totalCoverage),
      byType
    }
  }

  // Calculate Profile
  const calculateProfile = () => {
    // Try to extract age from various sources
    let age: number | null = null
    let name: string | undefined = undefined
    const email: string | undefined = undefined
    const phone: string | undefined = undefined

    // Check legal domain for driver's license
    const legal = data.legal || []
    legal.forEach(item => {
      const meta = item.metadata as any
      if (meta?.documentType === 'drivers_license') {
        if (meta?.dateOfBirth) {
          age = differenceInYears(new Date(), new Date(meta.dateOfBirth))
        }
        if (meta?.name) name = meta.name
      }
    })
    
    return {
      name,
      email,
      phone,
      age,
      dependents: 0, // TODO: Extract from profile/family data
      filingStatus: 'single', // TODO: Extract from profile
      state: null // TODO: Extract from address
    }
  }
  
  // Calculate all data
  const income = calculateIncome()
  const expenses = calculateExpenses()
  const assets = calculateAssets()
  const liabilities = calculateLiabilities()
  const insurance = calculateInsurance()
  const profile = calculateProfile()
  const netWorth = assets.total - liabilities.total
  
  return {
    income,
    expenses,
    assets,
    liabilities,
    insurance,
    profile,
    netWorth
  }
}

// Helper to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Helper to format percentage
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

