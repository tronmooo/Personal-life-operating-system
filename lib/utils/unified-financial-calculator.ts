/**
 * Unified Financial Calculator
 * 
 * Single source of truth for all net worth and financial calculations
 * across the entire application
 */

import { DomainData } from '@/types/domains'

export interface NetWorthCalculation {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  breakdown: {
    homeValue: number
    vehicleValue: number
    collectiblesValue: number
    miscValue: number
    financialAssets: number
    financialLiabilities: number
    cashIncome: number
  }
}

/**
 * Calculate net worth from all domains
 * This is the SINGLE source of truth for net worth calculations
 */
export function calculateUnifiedNetWorth(
  domainData: Record<string, DomainData[]>,
  financeData?: {
    assets: number
    liabilities: number
    income?: number
    expenses?: number
  }
): NetWorthCalculation {
  
  // Initialize breakdown
  const breakdown = {
    homeValue: 0,
    vehicleValue: 0,
    collectiblesValue: 0,
    miscValue: 0,
    financialAssets: 0,
    financialLiabilities: 0,
    cashIncome: 0
  }
  
  // Calculate home/property value
  const homeData = domainData.home || []
  breakdown.homeValue = homeData
    .filter(item => {
      const meta = item.metadata as any
      return meta?.type === 'property' ||
        meta?.itemType === 'property' ||
        meta?.logType === 'property-value'
    })
    .reduce((sum, item) => {
      const meta = item.metadata as any
      const value = parseFloat(
        meta?.value ||
        meta?.estimatedValue ||
        meta?.propertyValue ||
        meta?.currentValue ||
        '0'
      )
      console.log('🏠 Home value found:', value, 'from:', item.title)
      return sum + value
    }, 0)

  // Calculate vehicle value
  const vehicleData = domainData.vehicles || []
  breakdown.vehicleValue = vehicleData
    .filter(item => (item.metadata as any)?.type === 'vehicle')
    .reduce((sum, item) => {
      const meta = item.metadata as any
      const value = parseFloat(
        meta?.estimatedValue ||
        meta?.value ||
        '0'
      )
      console.log('🚗 Vehicle value found:', value, 'from:', item.title)
      return sum + value
    }, 0)

  // Calculate collectibles value
  const collectiblesData = domainData.collectibles || []
  breakdown.collectiblesValue = collectiblesData.reduce((sum, item) => {
    const meta = item.metadata as any
    const value = parseFloat(
      meta?.estimatedValue ||
      meta?.value ||
      meta?.currentValue ||
      '0'
    )
    return sum + value
  }, 0)

  // Calculate miscellaneous assets
  const miscData = domainData.miscellaneous || []
  breakdown.miscValue = miscData.reduce((sum, item) => {
    const meta = item.metadata as any
    const value = parseFloat(
      meta?.estimatedValue ||
      meta?.value ||
      '0'
    )
    return sum + value
  }, 0)
  
  // Add finance data if provided
  if (financeData) {
    breakdown.financialAssets = financeData.assets || 0
    breakdown.financialLiabilities = financeData.liabilities || 0
    breakdown.cashIncome = financeData.income || 0
  }

  // Also derive financial assets/liabilities from the 'financial' domain if present
  // This ensures totals are populated even when Plaid/local bridge is not used
  const financialDomain = (domainData as any).financial || []
  if (Array.isArray(financialDomain) && financialDomain.length > 0) {
    let domainAssets = 0
    let domainLiabilities = 0

    for (const item of financialDomain) {
      const meta = item?.metadata || {}
      const rawBalance = Number(meta.balance ?? meta.currentValue ?? meta.value ?? 0)
      const type = String(meta.accountType || meta.type || '').toLowerCase()

      // Treat credit/loan/mortgage as liabilities; otherwise assets
      const isDebt = ['credit', 'loan', 'mortgage', 'liability', 'debt'].some(k => type.includes(k))

      if (isDebt) {
        domainLiabilities += Math.abs(rawBalance)
      } else {
        // Some datasets store liabilities as negative balances; guard against that
        domainAssets += rawBalance > 0 ? rawBalance : 0
      }
    }

    breakdown.financialAssets += domainAssets
    breakdown.financialLiabilities += domainLiabilities
  }
  
  // Calculate totals
  // NOTE: Do NOT include cashIncome in assets - income is not an asset, only account balances are
  const totalAssets = 
    breakdown.homeValue + 
    breakdown.vehicleValue + 
    breakdown.collectiblesValue + 
    breakdown.miscValue + 
    breakdown.financialAssets
  
  const totalLiabilities = breakdown.financialLiabilities
  
  const netWorth = totalAssets - totalLiabilities
  
  console.log('💰 Unified Net Worth Calculation:', {
    totalAssets,
    totalLiabilities,
    netWorth,
    breakdown
  })
  
  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    breakdown
  }
}

/**
 * Get home value from domain data
 */
export function getHomeValue(homeData: DomainData[]): number {
  return homeData
    .filter(item => {
      const meta = item.metadata as any
      return meta?.type === 'property' ||
        meta?.itemType === 'property' ||
        meta?.logType === 'property-value'
    })
    .reduce((sum, item) => {
      const meta = item.metadata as any
      const value = parseFloat(
        meta?.value ||
        meta?.estimatedValue ||
        meta?.propertyValue ||
        '0'
      )
      return sum + value
    }, 0)
}

/**
 * Get vehicle value from domain data
 */
export function getVehicleValue(vehicleData: DomainData[]): number {
  return vehicleData
    .filter(item => (item.metadata as any)?.type === 'vehicle')
    .reduce((sum, item) => {
      const meta = item.metadata as any
      const value = parseFloat(
        meta?.estimatedValue ||
        meta?.value ||
        '0'
      )
      return sum + value
    }, 0)
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

