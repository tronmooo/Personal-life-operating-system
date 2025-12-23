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
    appliancesValue: number
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
    appliancesValue: 0,
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
  breakdown.miscValue = miscData
    .filter(item => {
      const meta = item.metadata as any
      // ✅ Filter out general-notes entries, only count actual assets
      return meta?.itemType !== 'general-notes'
    })
    .reduce((sum, item) => {
      const meta = item.metadata as any
      // ✅ Check multiple value fields including purchasePrice as fallback
      const value = parseFloat(
        meta?.estimatedValue ||
        meta?.value ||
        meta?.purchasePrice ||  // 🆕 Include purchasePrice as fallback
        '0'
      )
      if (value > 0) {
        console.log('📦 Misc asset value found:', value, 'from:', item.title)
      }
      return sum + value
    }, 0)

  // Calculate appliances value (appliances are physical assets with depreciated value)
  const appliancesData = domainData.appliances || []
  breakdown.appliancesValue = appliancesData.reduce((sum, item) => {
    const meta = item.metadata as any
    
    // If user manually set an estimated/current value, use that first
    if (meta?.estimatedValue || meta?.currentValue) {
      const manualValue = parseFloat(meta?.estimatedValue || meta?.currentValue || '0')
      if (manualValue > 0) {
        console.log('🔌 Appliance (manual value):', manualValue, 'from:', item.title)
        return sum + manualValue
      }
    }
    
    // Otherwise calculate depreciated value based on age and lifespan
    const purchasePrice = parseFloat(meta?.purchasePrice || meta?.value || '0')
    if (purchasePrice <= 0) return sum
    
    // Get purchase date and lifespan for depreciation calculation
    const purchaseDateStr = meta?.purchaseDate
    const lifespanYears = parseFloat(meta?.estimatedLifespan || meta?.expectedLifespan || '10') // Default 10 years
    
    let estimatedCurrentValue = purchasePrice
    
    if (purchaseDateStr) {
      const purchaseDate = new Date(purchaseDateStr)
      const now = new Date()
      const ageInMs = now.getTime() - purchaseDate.getTime()
      const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25)
      
      if (ageInYears > 0 && lifespanYears > 0) {
        // Linear depreciation with 10% residual value (appliances retain some scrap/resale value)
        const depreciationRate = Math.min(ageInYears / lifespanYears, 0.9) // Max 90% depreciation
        estimatedCurrentValue = purchasePrice * (1 - depreciationRate)
        
        console.log('🔌 Appliance depreciation:', {
          name: item.title,
          purchasePrice,
          purchaseDate: purchaseDateStr,
          ageInYears: ageInYears.toFixed(2),
          lifespanYears,
          depreciationRate: (depreciationRate * 100).toFixed(1) + '%',
          estimatedCurrentValue: estimatedCurrentValue.toFixed(2)
        })
      }
    } else {
      console.log('🔌 Appliance (no date, using purchase price):', purchasePrice, 'from:', item.title)
    }
    
    return sum + estimatedCurrentValue
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
      
      // Check if this is a debt item - check multiple fields for detection
      const type = String(meta.accountType || meta.type || '').toLowerCase()
      const itemType = String(meta.itemType || '').toLowerCase()
      const loanType = String(meta.loanType || '').toLowerCase()
      
      // Treat items marked as debt via itemType, or with debt-related accountType/loanType
      const isDebt = itemType === 'debt' || 
        ['credit', 'loan', 'mortgage', 'liability', 'debt'].some(k => 
          type.includes(k) || loanType.includes(k)
        )

      if (isDebt) {
        // For debt items, use currentBalance first (most common for debts), then fallback to other fields
        const rawBalance = Number(meta.currentBalance ?? meta.balance ?? meta.currentValue ?? meta.value ?? 0)
        domainLiabilities += Math.abs(rawBalance)
        console.log('💳 Debt found:', item.title, 'Balance:', rawBalance, 'Type:', itemType || loanType || type)
      } else {
        const rawBalance = Number(meta.balance ?? meta.currentValue ?? meta.value ?? 0)
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
    breakdown.appliancesValue +
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
 * Calculate the estimated current value of a single appliance
 * Uses linear depreciation based on purchase date and expected lifespan
 * Maintains 10% residual value (appliances retain some scrap/resale value)
 */
export function calculateApplianceCurrentValue(meta: Record<string, unknown>): number {
  // If user manually set an estimated/current value, use that
  if (meta?.estimatedValue || meta?.currentValue) {
    const manualValue = parseFloat(String(meta?.estimatedValue || meta?.currentValue || '0'))
    if (manualValue > 0) return manualValue
  }
  
  const purchasePrice = parseFloat(String(meta?.purchasePrice || meta?.value || '0'))
  if (purchasePrice <= 0) return 0
  
  const purchaseDateStr = meta?.purchaseDate as string | undefined
  const lifespanYears = parseFloat(String(meta?.estimatedLifespan || meta?.expectedLifespan || '10'))
  
  if (!purchaseDateStr) return purchasePrice
  
  const purchaseDate = new Date(purchaseDateStr)
  const now = new Date()
  const ageInMs = now.getTime() - purchaseDate.getTime()
  const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25)
  
  if (ageInYears <= 0 || lifespanYears <= 0) return purchasePrice
  
  // Linear depreciation with 10% residual value
  const depreciationRate = Math.min(ageInYears / lifespanYears, 0.9)
  return purchasePrice * (1 - depreciationRate)
}

/**
 * Get appliances value from domain data
 * Appliances are considered physical assets with depreciated monetary value
 */
export function getAppliancesValue(appliancesData: DomainData[]): number {
  return appliancesData.reduce((sum, item) => {
    const meta = item.metadata as Record<string, unknown> || {}
    return sum + calculateApplianceCurrentValue(meta)
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

