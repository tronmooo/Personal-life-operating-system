/**
 * Domain Tools Integration Hook
 * 
 * Provides bidirectional data flow between tools/calculators and domain entries:
 * - Auto-fill tool inputs from relevant domain data
 * - Save tool outputs back to appropriate domains
 * 
 * @example
 * ```typescript
 * function BMICalculator() {
 *   const { 
 *     autoFillData, 
 *     saveResult, 
 *     isAutoFilled,
 *     refreshData,
 *     domainItems 
 *   } = useDomainTools('health-calculator')
 * 
 *   // Auto-fill weight from health domain
 *   const weight = autoFillData.health.weight || ''
 *   
 *   // Save BMI result back to health domain
 *   const handleSaveResult = () => {
 *     saveResult({
 *       domain: 'health',
 *       title: 'BMI Measurement',
 *       metadata: { type: 'bmi', value: bmiResult, date: new Date().toISOString() }
 *     })
 *   }
 * }
 * ```
 */

'use client'

import { useCallback, useMemo, useEffect, useState } from 'react'
import { useDomainCRUD } from './use-domain-crud'
import { useDomainEntries } from './use-domain-entries'
import type { Domain, DomainData } from '@/types/domains'
import { toast } from '@/lib/utils/toast'
import { createSafeBrowserClient } from '@/lib/supabase/safe-client'

// Tool types and their relevant domains
export type ToolType = 
  // Health & Fitness Tools
  | 'bmi-calculator'
  | 'calorie-calculator'
  | 'body-fat-calculator'
  | 'macro-calculator'
  | 'water-intake-calculator'
  | 'heart-rate-zones'
  | 'sleep-calculator'
  | 'protein-calculator'
  | 'meal-planner'
  | 'workout-planner'
  | 'health-calculator'
  // Financial Tools
  | 'net-worth-calculator'
  | 'budget-calculator'
  | 'mortgage-calculator'
  | 'loan-calculator'
  | 'retirement-calculator'
  | 'expense-tracker'
  | 'receipt-scanner'
  | 'invoice-generator'
  | 'tax-prep'
  | 'financial-report'
  | 'budget-creator'
  // Vehicle Tools
  | 'auto-loan-calculator'
  | 'vehicle-tracker'
  // Home & Property Tools
  | 'home-affordability'
  | 'renovation-calculator'
  | 'paint-calculator'
  | 'energy-calculator'
  // Insurance Tools
  | 'insurance-tracker'
  | 'document-organizer'
  // Service Tools
  | 'service-comparator'
  | 'bill-automation'
  // General Tools
  | 'universal'

// Tool to Domain Mapping
export const TOOL_DOMAIN_MAP: Record<ToolType, Domain[]> = {
  // Health tools pull from health, nutrition, fitness
  'bmi-calculator': ['health', 'fitness'],
  'calorie-calculator': ['health', 'nutrition', 'fitness'],
  'body-fat-calculator': ['health', 'fitness'],
  'macro-calculator': ['health', 'nutrition'],
  'water-intake-calculator': ['health', 'nutrition'],
  'heart-rate-zones': ['health', 'fitness'],
  'sleep-calculator': ['health', 'mindfulness'],
  'protein-calculator': ['health', 'nutrition'],
  'meal-planner': ['nutrition', 'health'],
  'workout-planner': ['fitness', 'health'],
  'health-calculator': ['health', 'fitness', 'nutrition'],
  
  // Financial tools pull from financial, home, vehicles
  'net-worth-calculator': ['financial', 'home', 'vehicles', 'appliances', 'miscellaneous'],
  'budget-calculator': ['financial', 'services', 'digital'],
  'mortgage-calculator': ['financial', 'home'],
  'loan-calculator': ['financial'],
  'retirement-calculator': ['financial'],
  'expense-tracker': ['financial'],
  'receipt-scanner': ['financial'],
  'invoice-generator': ['financial'],
  'tax-prep': ['financial', 'home', 'vehicles', 'insurance'],
  'financial-report': ['financial', 'home', 'vehicles', 'insurance'],
  'budget-creator': ['financial', 'services'],
  
  // Vehicle tools
  'auto-loan-calculator': ['vehicles', 'financial'],
  'vehicle-tracker': ['vehicles'],
  
  // Home tools
  'home-affordability': ['home', 'financial'],
  'renovation-calculator': ['home'],
  'paint-calculator': ['home'],
  'energy-calculator': ['home', 'services'],
  
  // Insurance & Document tools
  'insurance-tracker': ['insurance', 'services'],
  'document-organizer': ['insurance'],
  
  // Service tools
  'service-comparator': ['services', 'digital'],
  'bill-automation': ['services', 'financial'],
  
  // Universal (all domains)
  'universal': ['financial', 'health', 'insurance', 'home', 'vehicles', 'appliances', 'pets', 'relationships', 'digital', 'mindfulness', 'fitness', 'nutrition', 'services', 'miscellaneous'],
}

// Auto-fill data structure for different tool categories
export interface ToolAutoFillData {
  // Health & Fitness Data
  health: {
    weight?: number
    weightUnit?: 'lbs' | 'kg'
    height?: number
    heightUnit?: 'in' | 'cm'
    heightFeet?: number
    heightInches?: number
    age?: number
    gender?: 'male' | 'female' | 'other'
    activityLevel?: string
    sleepHours?: number
    restingHeartRate?: number
    bloodPressure?: { systolic?: number; diastolic?: number }
    bodyFat?: number
    bmi?: number
  }
  
  // Nutrition Data
  nutrition: {
    dailyCalories?: number
    calorieGoal?: number
    proteinGoal?: number
    carbGoal?: number
    fatGoal?: number
    waterGoal?: number
    recentMeals?: Array<{ name: string; calories: number; date: string }>
  }
  
  // Fitness Data  
  fitness: {
    workoutsPerWeek?: number
    primaryActivity?: string
    vo2Max?: number
    runningPace?: number
    recentWorkouts?: Array<{ type: string; duration: number; calories: number; date: string }>
  }
  
  // Financial Data
  financial: {
    monthlyIncome?: number
    annualIncome?: number
    monthlyExpenses?: number
    savingsRate?: number
    totalAssets?: number
    totalLiabilities?: number
    netWorth?: number
    emergencyFund?: number
    retirementSavings?: number
    accounts?: Array<{ name: string; type: string; balance: number }>
    loans?: Array<{ name: string; balance: number; rate: number; payment: number }>
    expenses?: Array<{ category: string; amount: number }>
  }
  
  // Home Data
  home: {
    homeValue?: number
    mortgageBalance?: number
    propertyTax?: number
    sqft?: number
    yearBuilt?: number
    rooms?: number
    properties?: Array<{ address: string; value: number; type: string }>
  }
  
  // Vehicle Data
  vehicles: {
    vehicles?: Array<{
      make: string
      model: string
      year: number
      value: number
      mileage: number
      loanBalance?: number
    }>
    totalVehicleValue?: number
    totalVehicleLoans?: number
  }
  
  // Insurance Data
  insurance: {
    policies?: Array<{
      type: string
      provider: string
      premium: number
      coverage: number
      deductible: number
    }>
    totalPremiums?: number
    totalCoverage?: number
  }
  
  // Services Data
  services: {
    subscriptions?: Array<{ name: string; cost: number; frequency: string }>
    totalMonthlyCost?: number
    providers?: Array<{ name: string; type: string; monthlyCost: number }>
  }
  
  // Profile Data
  profile: {
    name?: string
    email?: string
    phone?: string
    dateOfBirth?: string
    age?: number
    address?: string
    state?: string
    zipCode?: string
  }
}

// Result to save back to domain
export interface SaveResultData {
  domain: Domain
  title: string
  description?: string
  metadata: Record<string, unknown>
}

export interface UseDomainToolsReturn {
  // Auto-filled data from domains
  autoFillData: ToolAutoFillData
  
  // Raw domain items for custom processing
  domainItems: Record<string, DomainData[]>
  
  // Loading state
  loading: boolean
  
  // Whether data has been auto-filled
  isAutoFilled: boolean
  
  // Refresh data from domains
  refreshData: () => Promise<void>
  
  // Save a result back to a domain
  saveResult: (data: SaveResultData) => Promise<DomainData | null>
  
  // Get items from a specific domain
  getDomainItems: (domain: Domain) => DomainData[]
  
  // Check if user has any data in relevant domains
  hasRelevantData: boolean
  
  // List of relevant domains for this tool
  relevantDomains: Domain[]
}

/**
 * Hook for integrating tools with domain data
 * Automatically pulls data from relevant domains and allows saving results back
 */
export function useDomainTools(toolType: ToolType): UseDomainToolsReturn {
  const relevantDomains = TOOL_DOMAIN_MAP[toolType] || []
  const [allDomainData, setAllDomainData] = useState<Record<string, DomainData[]>>({})
  const [loading, setLoading] = useState(true)
  const [isAutoFilled, setIsAutoFilled] = useState(false)

  // Fetch all domain data
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      const supabase = createSafeBrowserClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const domainData: Record<string, DomainData[]> = {}
      
      // Fetch data for all relevant domains
      for (const domain of relevantDomains) {
        try {
          const { data, error } = await supabase
            .from('domain_entries_view')
            .select('*')
            .eq('user_id', user.id)
            .eq('domain', domain)
            .order('updated_at', { ascending: false })
            .limit(100)

          if (!error && data) {
            domainData[domain] = data as DomainData[]
          }
        } catch (err) {
          console.error(`Error fetching ${domain} data:`, err)
        }
      }

      setAllDomainData(domainData)
      setIsAutoFilled(Object.keys(domainData).some(k => (domainData[k]?.length || 0) > 0))
      setLoading(false)
    }

    fetchAllData()
  }, [relevantDomains.join(',')])

  // Process data into auto-fill structure
  const autoFillData = useMemo<ToolAutoFillData>(() => {
    const result: ToolAutoFillData = {
      health: {},
      nutrition: {},
      fitness: {},
      financial: {},
      home: {},
      vehicles: {},
      insurance: {},
      services: {},
      profile: {},
    }

    // Process Health Domain
    const healthItems = allDomainData.health || []
    healthItems.forEach((item) => {
      const meta = item.metadata as Record<string, unknown>
      // Weight
      if (meta?.weight) {
        result.health.weight = parseFloat(String(meta.weight))
        result.health.weightUnit = (meta.weightUnit as 'lbs' | 'kg') || 'lbs'
      }
      // Height
      if (meta?.height) {
        result.health.height = parseFloat(String(meta.height))
        result.health.heightUnit = (meta.heightUnit as 'in' | 'cm') || 'in'
      }
      if (meta?.heightFeet) {
        result.health.heightFeet = parseFloat(String(meta.heightFeet))
      }
      if (meta?.heightInches) {
        result.health.heightInches = parseFloat(String(meta.heightInches))
      }
      // Age/DOB
      if (meta?.age) {
        result.health.age = parseInt(String(meta.age))
      }
      if (meta?.dateOfBirth) {
        const dob = new Date(String(meta.dateOfBirth))
        result.health.age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        result.profile.dateOfBirth = String(meta.dateOfBirth)
      }
      // Gender
      if (meta?.gender) {
        result.health.gender = meta.gender as 'male' | 'female' | 'other'
      }
      // Activity Level
      if (meta?.activityLevel) {
        result.health.activityLevel = String(meta.activityLevel)
      }
      // BMI
      if (meta?.bmi || meta?.type === 'bmi') {
        result.health.bmi = parseFloat(String(meta.bmi || meta.value))
      }
      // Heart Rate
      if (meta?.restingHeartRate || meta?.heartRate) {
        result.health.restingHeartRate = parseFloat(String(meta.restingHeartRate || meta.heartRate))
      }
      // Blood Pressure
      if (meta?.systolic || meta?.diastolic) {
        result.health.bloodPressure = {
          systolic: meta.systolic ? parseFloat(String(meta.systolic)) : undefined,
          diastolic: meta.diastolic ? parseFloat(String(meta.diastolic)) : undefined,
        }
      }
      // Body Fat
      if (meta?.bodyFat) {
        result.health.bodyFat = parseFloat(String(meta.bodyFat))
      }
      // Sleep
      if (meta?.sleepHours || meta?.duration && meta?.type === 'sleep') {
        result.health.sleepHours = parseFloat(String(meta.sleepHours || meta.duration))
      }
    })

    // Process Nutrition Domain
    const nutritionItems = allDomainData.nutrition || []
    const recentMeals: typeof result.nutrition.recentMeals = []
    nutritionItems.forEach((item) => {
      const meta = item.metadata as Record<string, unknown>
      if (meta?.caloriesGoal) result.nutrition.calorieGoal = parseFloat(String(meta.caloriesGoal))
      if (meta?.proteinGoal) result.nutrition.proteinGoal = parseFloat(String(meta.proteinGoal))
      if (meta?.carbsGoal) result.nutrition.carbGoal = parseFloat(String(meta.carbsGoal))
      if (meta?.fatsGoal) result.nutrition.fatGoal = parseFloat(String(meta.fatsGoal))
      if (meta?.waterGoal) result.nutrition.waterGoal = parseFloat(String(meta.waterGoal))
      
      // Collect recent meals
      if (meta?.type === 'meal' || meta?.itemType === 'meal') {
        recentMeals.push({
          name: item.title,
          calories: parseFloat(String(meta.calories || 0)),
          date: String(meta.date || item.createdAt)
        })
      }
    })
    result.nutrition.recentMeals = recentMeals.slice(0, 10)

    // Process Fitness Domain
    const fitnessItems = allDomainData.fitness || []
    const recentWorkouts: typeof result.fitness.recentWorkouts = []
    fitnessItems.forEach((item) => {
      const meta = item.metadata as Record<string, unknown>
      if (meta?.vo2Max) result.fitness.vo2Max = parseFloat(String(meta.vo2Max))
      
      // Collect recent workouts
      if (meta?.activityType || meta?.type === 'workout') {
        recentWorkouts.push({
          type: String(meta.activityType || meta.type),
          duration: parseFloat(String(meta.duration || 0)),
          calories: parseFloat(String(meta.calories || meta.caloriesBurned || 0)),
          date: String(meta.date || item.createdAt)
        })
      }
    })
    result.fitness.recentWorkouts = recentWorkouts.slice(0, 10)
    result.fitness.workoutsPerWeek = Math.round(recentWorkouts.length / 4) || undefined

    // Process Financial Domain
    const financialItems = allDomainData.financial || []
    const accounts: typeof result.financial.accounts = []
    const loans: typeof result.financial.loans = []
    const expenses: typeof result.financial.expenses = []
    let totalIncome = 0
    let totalExpenses = 0
    let totalAssets = 0
    let totalLiabilities = 0

    financialItems.forEach((item) => {
      const meta = item.metadata as Record<string, unknown>
      const itemType = meta?.itemType || meta?.type
      
      if (itemType === 'income') {
        const amount = parseFloat(String(meta?.amount || 0))
        const frequency = String(meta?.frequency || 'monthly')
        let monthlyAmount = amount
        if (frequency === 'annual' || frequency === 'yearly') monthlyAmount = amount / 12
        else if (frequency === 'weekly') monthlyAmount = amount * 4.33
        else if (frequency === 'biweekly') monthlyAmount = amount * 2.17
        totalIncome += monthlyAmount
      }
      
      if (itemType === 'account') {
        const balance = parseFloat(String(meta?.balance || meta?.currentBalance || 0))
        accounts.push({
          name: item.title,
          type: String(meta?.accountType || 'checking'),
          balance
        })
        totalAssets += balance
      }
      
      if (itemType === 'loan' || itemType === 'debt') {
        const balance = parseFloat(String(meta?.balance || meta?.amount || 0))
        loans.push({
          name: item.title,
          balance,
          rate: parseFloat(String(meta?.interestRate || meta?.rate || 0)),
          payment: parseFloat(String(meta?.monthlyPayment || meta?.payment || 0))
        })
        totalLiabilities += balance
      }
      
      if (itemType === 'expense' || itemType === 'bill') {
        const amount = parseFloat(String(meta?.amount || 0))
        totalExpenses += amount
        expenses.push({
          category: String(meta?.category || 'Other'),
          amount
        })
      }
    })

    result.financial = {
      monthlyIncome: Math.round(totalIncome),
      annualIncome: Math.round(totalIncome * 12),
      monthlyExpenses: Math.round(totalExpenses),
      savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
      totalAssets: Math.round(totalAssets),
      totalLiabilities: Math.round(totalLiabilities),
      netWorth: Math.round(totalAssets - totalLiabilities),
      accounts,
      loans,
      expenses,
    }

    // Process Home Domain
    const homeItems = allDomainData.home || []
    const properties: typeof result.home.properties = []
    let totalHomeValue = 0
    let totalMortgage = 0

    homeItems.forEach((item) => {
      const meta = item.metadata as Record<string, unknown>
      const itemType = meta?.itemType || meta?.type
      
      if (itemType === 'property' || meta?.propertyValue || meta?.currentValue || meta?.estimatedValue) {
        const value = parseFloat(String(meta?.propertyValue || meta?.currentValue || meta?.estimatedValue || 0))
        totalHomeValue += value
        properties.push({
          address: String(meta?.propertyAddress || item.title),
          value,
          type: String(meta?.propertyType || 'residence')
        })
        
        if (meta?.mortgageBalance) {
          totalMortgage += parseFloat(String(meta.mortgageBalance))
        }
        if (meta?.sqft || meta?.squareFeet) {
          result.home.sqft = parseFloat(String(meta.sqft || meta.squareFeet))
        }
        if (meta?.yearBuilt) {
          result.home.yearBuilt = parseInt(String(meta.yearBuilt))
        }
        if (meta?.propertyTax) {
          result.home.propertyTax = parseFloat(String(meta.propertyTax))
        }
      }
    })

    result.home = {
      ...result.home,
      homeValue: totalHomeValue,
      mortgageBalance: totalMortgage,
      properties,
    }
    
    // Add home value to assets, mortgage to liabilities
    result.financial.totalAssets = (result.financial.totalAssets || 0) + totalHomeValue
    result.financial.totalLiabilities = (result.financial.totalLiabilities || 0) + totalMortgage
    result.financial.netWorth = (result.financial.totalAssets || 0) - (result.financial.totalLiabilities || 0)

    // Process Vehicles Domain
    const vehicleItems = allDomainData.vehicles || []
    const vehicles: typeof result.vehicles.vehicles = []
    let totalVehicleValue = 0
    let totalVehicleLoans = 0

    vehicleItems.forEach((item) => {
      const meta = item.metadata as Record<string, unknown>
      const value = parseFloat(String(meta?.value || meta?.estimatedValue || meta?.currentValue || 0))
      const loanBalance = parseFloat(String(meta?.loanBalance || 0))
      
      vehicles.push({
        make: String(meta?.make || ''),
        model: String(meta?.model || ''),
        year: parseInt(String(meta?.year || 0)),
        value,
        mileage: parseInt(String(meta?.mileage || meta?.currentMileage || 0)),
        loanBalance: loanBalance || undefined
      })
      
      totalVehicleValue += value
      totalVehicleLoans += loanBalance
    })

    result.vehicles = {
      vehicles,
      totalVehicleValue,
      totalVehicleLoans,
    }
    
    // Add vehicle value to assets
    result.financial.totalAssets = (result.financial.totalAssets || 0) + totalVehicleValue
    result.financial.totalLiabilities = (result.financial.totalLiabilities || 0) + totalVehicleLoans

    // Process Insurance Domain
    const insuranceItems = allDomainData.insurance || []
    const policies: typeof result.insurance.policies = []
    let totalPremiums = 0
    let totalCoverage = 0

    insuranceItems.forEach((item) => {
      const meta = item.metadata as Record<string, unknown>
      if (meta?.itemType === 'policy' || meta?.policyType || meta?.premium) {
        const premium = parseFloat(String(meta?.premium || meta?.monthlyPremium || 0))
        const coverage = parseFloat(String(meta?.coverageAmount || meta?.coverage || 0))
        
        policies.push({
          type: String(meta?.policyType || meta?.type || 'other'),
          provider: String(meta?.provider || item.title),
          premium,
          coverage,
          deductible: parseFloat(String(meta?.deductible || 0))
        })
        
        totalPremiums += premium
        totalCoverage += coverage
      }
    })

    result.insurance = {
      policies,
      totalPremiums,
      totalCoverage,
    }

    // Process Services Domain
    const servicesItems = allDomainData.services || []
    const digitalItems = allDomainData.digital || []
    const subscriptions: typeof result.services.subscriptions = []
    const providers: typeof result.services.providers = []
    let totalServiceCost = 0

    ;[...servicesItems, ...digitalItems].forEach((item) => {
      const meta = item.metadata as Record<string, unknown>
      const monthlyCost = parseFloat(String(meta?.monthlyCost || meta?.cost || 0))
      
      if (meta?.serviceType || meta?.category === 'subscription') {
        subscriptions.push({
          name: item.title,
          cost: monthlyCost,
          frequency: 'monthly'
        })
        totalServiceCost += monthlyCost
      }
      
      if (meta?.providerName) {
        providers.push({
          name: String(meta.providerName),
          type: String(meta?.serviceType || 'other'),
          monthlyCost
        })
      }
    })

    result.services = {
      subscriptions,
      providers,
      totalMonthlyCost: totalServiceCost,
    }

    // Process Appliances & Miscellaneous for Assets
    const applianceItems = allDomainData.appliances || []
    const miscItems = allDomainData.miscellaneous || []
    
    let applianceValue = 0
    let miscValue = 0
    
    applianceItems.forEach((item) => {
      const meta = item.metadata as Record<string, unknown>
      applianceValue += parseFloat(String(meta?.value || meta?.purchasePrice || 0))
    })
    
    miscItems.forEach((item) => {
      const meta = item.metadata as Record<string, unknown>
      miscValue += parseFloat(String(meta?.estimatedValue || meta?.value || meta?.currentValue || 0))
    })
    
    result.financial.totalAssets = (result.financial.totalAssets || 0) + applianceValue + miscValue
    result.financial.netWorth = (result.financial.totalAssets || 0) - (result.financial.totalLiabilities || 0)

    return result
  }, [allDomainData])

  // Get items from a specific domain
  const getDomainItems = useCallback((domain: Domain): DomainData[] => {
    return allDomainData[domain] || []
  }, [allDomainData])

  // Save a result back to a domain
  const saveResult = useCallback(async (data: SaveResultData): Promise<DomainData | null> => {
    const supabase = createSafeBrowserClient()
    if (!supabase) {
      toast.error('Save Failed', 'Unable to connect to database')
      return null
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.warning('Sign In Required', 'Please sign in to save your results')
      return null
    }

    try {
      const { data: entry, error } = await supabase
        .from('domain_entries')
        .insert({
          user_id: user.id,
          domain: data.domain,
          title: data.title,
          description: data.description || null,
          metadata: {
            ...data.metadata,
            savedFromTool: toolType,
            savedAt: new Date().toISOString(),
          }
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Saved to Domain', `${data.title} added to ${data.domain}`)
      
      // Refresh domain data
      const updatedItems = [...(allDomainData[data.domain] || []), entry as DomainData]
      setAllDomainData(prev => ({
        ...prev,
        [data.domain]: updatedItems
      }))

      return entry as DomainData
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Failed to save result')
      return null
    }
  }, [toolType, allDomainData])

  // Refresh data from domains
  const refreshData = useCallback(async () => {
    setLoading(true)
    const supabase = createSafeBrowserClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const domainData: Record<string, DomainData[]> = {}
    
    for (const domain of relevantDomains) {
      try {
        const { data, error } = await supabase
          .from('domain_entries_view')
          .select('*')
          .eq('user_id', user.id)
          .eq('domain', domain)
          .order('updated_at', { ascending: false })
          .limit(100)

        if (!error && data) {
          domainData[domain] = data as DomainData[]
        }
      } catch (err) {
        console.error(`Error fetching ${domain} data:`, err)
      }
    }

    setAllDomainData(domainData)
    setIsAutoFilled(Object.keys(domainData).some(k => (domainData[k]?.length || 0) > 0))
    setLoading(false)
    toast.success('Data Refreshed', 'Your domain data has been reloaded')
  }, [relevantDomains])

  // Check if user has any relevant data
  const hasRelevantData = useMemo(() => {
    return Object.keys(allDomainData).some(k => (allDomainData[k]?.length || 0) > 0)
  }, [allDomainData])

  return {
    autoFillData,
    domainItems: allDomainData,
    loading,
    isAutoFilled,
    refreshData,
    saveResult,
    getDomainItems,
    hasRelevantData,
    relevantDomains,
  }
}

export default useDomainTools

