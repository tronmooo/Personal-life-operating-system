'use client'

import { useMemo } from 'react'
// eslint-disable-next-line no-restricted-imports -- Hook wrapper for cross-domain aggregation
import { useData } from '@/lib/providers/data-provider'
import { useServiceProviders } from './use-service-providers'
import { usePetsStats } from './use-pets-stats'

/**
 * Represents an expense item with its source domain
 */
export interface CrossDomainExpenseItem {
  id: string
  title: string
  amount: number
  category: ExpenseCategory
  domain: ExpenseDomain
  domainLabel: string
  domainIcon: string
  type?: string
  date?: string
  isRecurring?: boolean
}

/**
 * Expense categories that appear in the Command Center breakdown
 */
export type ExpenseCategory = 
  | 'housing'
  | 'food'
  | 'insurance'
  | 'transport'
  | 'utilities'
  | 'pets'
  | 'health'
  | 'education'
  | 'subscriptions'
  | 'other'

/**
 * Source domains that contribute to expenses
 */
export type ExpenseDomain = 
  | 'financial'
  | 'insurance'
  | 'digital'
  | 'home'
  | 'vehicles'
  | 'pets'
  | 'health'
  | 'education'
  | 'services'
  | 'bills'

/**
 * Domain display configuration
 */
const DOMAIN_CONFIG: Record<ExpenseDomain, { label: string; icon: string }> = {
  financial: { label: 'Financial', icon: '💰' },
  insurance: { label: 'Insurance', icon: '🛡️' },
  digital: { label: 'Digital', icon: '📱' },
  home: { label: 'Home', icon: '🏠' },
  vehicles: { label: 'Vehicles', icon: '🚗' },
  pets: { label: 'Pets', icon: '🐾' },
  health: { label: 'Health', icon: '🏥' },
  education: { label: 'Education', icon: '🎓' },
  services: { label: 'Services', icon: '🔧' },
  bills: { label: 'Bills', icon: '💳' },
}

/**
 * Category display configuration
 */
export const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  housing: { label: 'Housing', icon: '🏠', color: 'text-orange-500' },
  food: { label: 'Food', icon: '🍽️', color: 'text-red-500' },
  insurance: { label: 'Insurance', icon: '🛡️', color: 'text-purple-500' },
  transport: { label: 'Transport', icon: '⛽', color: 'text-blue-500' },
  utilities: { label: 'Utilities', icon: '💡', color: 'text-yellow-500' },
  pets: { label: 'Pets', icon: '🐾', color: 'text-pink-500' },
  health: { label: 'Health', icon: '🏥', color: 'text-teal-500' },
  education: { label: 'Education', icon: '🎓', color: 'text-indigo-500' },
  subscriptions: { label: 'Subscriptions', icon: '🔄', color: 'text-cyan-500' },
  other: { label: 'Other', icon: '📋', color: 'text-gray-500' },
}

/**
 * Summary of expenses by category
 */
export interface ExpenseSummary {
  housing: number
  food: number
  insurance: number
  transport: number
  utilities: number
  pets: number
  health: number
  education: number
  subscriptions: number
  other: number
}

/**
 * Return type of the useCrossDomainExpenses hook
 */
export interface CrossDomainExpensesResult {
  /** All expense items with domain attribution */
  items: CrossDomainExpenseItem[]
  /** Expense totals by category */
  totals: ExpenseSummary
  /** Grand total of all expenses */
  totalExpenses: number
  /** Items grouped by category */
  byCategory: Record<ExpenseCategory, CrossDomainExpenseItem[]>
  /** Items grouped by source domain */
  byDomain: Record<ExpenseDomain, CrossDomainExpenseItem[]>
  /** Loading state */
  isLoading: boolean
}

/**
 * Hook to aggregate expenses from all domains with source attribution.
 * 
 * This hook consolidates expenses from:
 * - Financial domain (expenses, bills, payments)
 * - Insurance domain (premiums)
 * - Digital domain (subscriptions)
 * - Home domain (utility bills, housing costs)
 * - Vehicles domain (fuel, maintenance, insurance)
 * - Pets domain (vet visits, food, insurance)
 * - Health domain (prescriptions, appointments)
 * - Education domain (tuition, loans)
 * - Services domain (service provider payments)
 * 
 * Each expense item includes its source domain for proper attribution
 * in the Command Center unified view.
 */
export function useCrossDomainExpenses(daysBack: number = 30): CrossDomainExpensesResult {
  const { data, isLoading } = useData()
  const { analytics: serviceProvidersAnalytics } = useServiceProviders()
  const { stats: petsStats } = usePetsStats()

  return useMemo(() => {
    const items: CrossDomainExpenseItem[] = []
    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

    // Helper functions
    const parseAmount = (meta: Record<string, unknown>): number => {
      const raw = meta?.amount ?? meta?.value ?? meta?.balance ?? meta?.cost ?? meta?.monthlyCost ?? 0
      const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw))
      return Number.isFinite(parsed) ? Math.abs(parsed) : 0
    }

    const normalizeTokens = (meta: Record<string, unknown>): string[] =>
      [meta?.type, meta?.itemType, meta?.logType, meta?.category, meta?.transactionCategory]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())

    const isWithinPeriod = (dateValue: unknown): boolean => {
      if (!dateValue) return true
      const date = new Date(String(dateValue))
      return !isNaN(date.getTime()) && date >= cutoffDate
    }

    const categorizeExpense = (meta: Record<string, unknown>, tokens: string[]): ExpenseCategory => {
      const category = String(meta?.category || meta?.transactionCategory || '').toLowerCase()
      
      if (category.includes('hous') || category.includes('rent') || category.includes('mort') || category === 'tax') {
        return 'housing'
      }
      if (category.includes('food') || category.includes('groc') || category.includes('dining') || category.includes('restaurant')) {
        return 'food'
      }
      if (category.includes('insur')) {
        return 'insurance'
      }
      if (category.includes('trans') || category.includes('car') || category.includes('gas') || category.includes('fuel')) {
        return 'transport'
      }
      if (category.includes('utilit') || category.includes('electric') || category.includes('water') || category.includes('internet') || category.includes('phone')) {
        return 'utilities'
      }
      if (category.includes('pet') || tokens.includes('pet')) {
        return 'pets'
      }
      if (category.includes('health') || category.includes('medical') || category.includes('doctor') || category.includes('prescription')) {
        return 'health'
      }
      if (category.includes('education') || category.includes('tuition') || category.includes('school')) {
        return 'education'
      }
      if (category.includes('subscription') || tokens.includes('subscription')) {
        return 'subscriptions'
      }
      return 'other'
    }

    const createExpenseItem = (
      id: string,
      title: string,
      amount: number,
      category: ExpenseCategory,
      domain: ExpenseDomain,
      type?: string,
      date?: string,
      isRecurring?: boolean
    ): CrossDomainExpenseItem => ({
      id,
      title,
      amount,
      category,
      domain,
      domainLabel: DOMAIN_CONFIG[domain].label,
      domainIcon: DOMAIN_CONFIG[domain].icon,
      type,
      date,
      isRecurring,
    })

    // 1. Process FINANCIAL domain expenses
    const financialItems = Array.isArray(data.financial) ? data.financial : []
    financialItems.forEach((item: any) => {
      const meta = (item?.metadata || {}) as Record<string, unknown>
      const amount = parseAmount(meta)
      if (!amount) return

      const tokens = normalizeTokens(meta)
      const dateValue = meta?.date || meta?.timestamp || meta?.transactionDate || item?.createdAt
      if (!isWithinPeriod(dateValue)) return

      const isExpense = tokens.some(token =>
        ['expense', 'spending', 'purchase', 'payment', 'cashflow-expense', 'bill'].includes(token)
      ) || meta?.logType === 'expense'

      if (!isExpense) return

      const category = categorizeExpense(meta, tokens)
      items.push(createExpenseItem(
        item.id || `fin-${items.length}`,
        item.title || String(meta?.name) || 'Expense',
        amount,
        category,
        'financial',
        String(meta?.type || meta?.itemType || ''),
        dateValue ? String(dateValue) : undefined,
        Boolean(meta?.recurring || meta?.frequency)
      ))
    })

    // 2. Process INSURANCE domain (premiums)
    const insuranceItems = Array.isArray(data.insurance) ? data.insurance : []
    insuranceItems.forEach((item: any) => {
      const meta = (item?.metadata || {}) as Record<string, unknown>
      const premium = parseFloat(String(meta?.monthlyPremium || meta?.premium || 0))
      if (premium <= 0) return

      items.push(createExpenseItem(
        item.id || `ins-${items.length}`,
        item.title || String(meta?.policyName) || 'Insurance Premium',
        premium,
        'insurance',
        'insurance',
        String(meta?.policyType || 'Premium'),
        undefined,
        true
      ))
    })

    // 3. Process DIGITAL domain (subscriptions)
    const digitalItems = Array.isArray(data.digital) ? data.digital : []
    digitalItems.forEach((item: any) => {
      const meta = (item?.metadata || {}) as Record<string, unknown>
      const tokens = normalizeTokens(meta)
      const isSubscription = tokens.includes('subscription') ||
                            meta?.type === 'subscription' ||
                            meta?.category === 'subscription'

      if (!isSubscription) return

      const cost = parseFloat(String(meta?.monthlyCost || meta?.cost || 0))
      if (cost <= 0) return

      items.push(createExpenseItem(
        item.id || `dig-${items.length}`,
        item.title || String(meta?.name) || 'Subscription',
        cost,
        'subscriptions',
        'digital',
        'Subscription',
        undefined,
        true
      ))
    })

    // 4. Process HOME domain (bills, utilities, housing costs)
    const homeItems = Array.isArray(data.home) ? data.home : []
    homeItems.forEach((item: any) => {
      const meta = (item?.metadata || {}) as Record<string, unknown>
      const itemType = String(meta?.itemType || '').toLowerCase()
      
      if (itemType !== 'bill') return

      const amount = parseFloat(String(meta?.amount || meta?.monthlyCost || 0))
      if (amount <= 0) return

      const categoryStr = String(meta?.category || '').toLowerCase()
      let category: ExpenseCategory = 'other'
      
      if (categoryStr === 'mortgage' || categoryStr === 'rent' || categoryStr === 'tax') {
        category = 'housing'
      } else if (categoryStr === 'utilities') {
        category = 'utilities'
      } else if (categoryStr === 'insurance') {
        category = 'insurance'
      }

      items.push(createExpenseItem(
        item.id || `home-${items.length}`,
        item.title || String(meta?.billName) || 'Home Bill',
        amount,
        category,
        'home',
        categoryStr,
        String(meta?.dueDate || ''),
        Boolean(meta?.recurring || meta?.frequency)
      ))
    })

    // 5. Process VEHICLES domain (costs: fuel, maintenance, insurance)
    const vehicleItems = Array.isArray(data.vehicles) ? data.vehicles : []
    vehicleItems.forEach((item: any) => {
      const meta = (item?.metadata || {}) as Record<string, unknown>
      const itemType = String(meta?.type || '').toLowerCase()

      if (itemType !== 'cost') return

      const amount = parseFloat(String(meta?.amount || 0))
      if (amount <= 0) return

      const dateValue = meta?.date || item?.createdAt
      if (!isWithinPeriod(dateValue)) return

      items.push(createExpenseItem(
        item.id || `veh-${items.length}`,
        item.title || 'Vehicle Cost',
        amount,
        'transport',
        'vehicles',
        String(meta?.costType || 'Vehicle Expense'),
        dateValue ? String(dateValue) : undefined,
        false
      ))
    })

    // 6. Process PETS domain (vet, food, insurance, medications)
    const petItems = Array.isArray(data.pets) ? data.pets : []
    petItems.forEach((item: any) => {
      const meta = (item?.metadata || {}) as Record<string, unknown>
      const expenses = meta?.expenses as Array<{ date: string; amount: number | string; type?: string }> | undefined

      if (Array.isArray(expenses)) {
        expenses.forEach((expense, idx) => {
          const amount = typeof expense.amount === 'number' ? expense.amount : parseFloat(String(expense.amount || 0))
          if (amount <= 0) return
          if (!isWithinPeriod(expense.date)) return

          items.push(createExpenseItem(
            `${item.id}-exp-${idx}`,
            `${item.title || 'Pet'} - ${expense.type || 'Expense'}`,
            amount,
            'pets',
            'pets',
            expense.type || 'Pet Expense',
            expense.date,
            false
          ))
        })
      }

      // Pet insurance
      if (meta?.insurancePremium || meta?.petInsuranceCost) {
        const premium = parseFloat(String(meta?.insurancePremium || meta?.petInsuranceCost || 0))
        if (premium > 0) {
          items.push(createExpenseItem(
            `${item.id}-ins`,
            `${item.title || 'Pet'} - Insurance`,
            premium,
            'pets',
            'pets',
            'Pet Insurance',
            undefined,
            true
          ))
        }
      }
    })

    // 7. Process HEALTH domain (prescriptions, appointments)
    const healthItems = Array.isArray(data.health) ? data.health : []
    healthItems.forEach((item: any) => {
      const meta = (item?.metadata || {}) as Record<string, unknown>
      const cost = parseFloat(String(meta?.cost || meta?.estimatedCost || meta?.prescriptionCost || 0))
      if (cost <= 0) return

      const dateValue = meta?.date || meta?.appointmentDate || meta?.refillDate || item?.createdAt
      if (!isWithinPeriod(dateValue)) return

      items.push(createExpenseItem(
        item.id || `health-${items.length}`,
        item.title || String(meta?.medicationName) || 'Health Expense',
        cost,
        'health',
        'health',
        String(meta?.type || meta?.recordType || 'Health'),
        dateValue ? String(dateValue) : undefined,
        Boolean(meta?.refillDate)
      ))
    })

    // 8. Process EDUCATION domain (tuition, loans, fees)
    const educationItems = Array.isArray(data.education) ? data.education : []
    educationItems.forEach((item: any) => {
      const meta = (item?.metadata || {}) as Record<string, unknown>
      const amount = parseFloat(String(meta?.tuitionAmount || meta?.amount || meta?.loanPayment || meta?.monthlyPayment || 0))
      if (amount <= 0) return

      const dateValue = meta?.tuitionDue || meta?.paymentDue || meta?.loanPaymentDue || item?.createdAt
      if (!isWithinPeriod(dateValue)) return

      items.push(createExpenseItem(
        item.id || `edu-${items.length}`,
        item.title || String(meta?.institution) || 'Education Expense',
        amount,
        'education',
        'education',
        String(meta?.type || 'Education'),
        dateValue ? String(dateValue) : undefined,
        Boolean(meta?.recurring)
      ))
    })

    // 9. Process SERVICE PROVIDERS analytics
    if (serviceProvidersAnalytics?.spending_by_category) {
      serviceProvidersAnalytics.spending_by_category.forEach(({ category, amount }: { category: string; amount: number }, idx: number) => {
        if (amount <= 0) return

        let expenseCategory: ExpenseCategory = 'other'
        if (category === 'insurance') expenseCategory = 'insurance'
        else if (category === 'utilities' || category === 'telecom') expenseCategory = 'utilities'

        items.push(createExpenseItem(
          `svc-${idx}`,
          `Service Provider - ${category}`,
          amount,
          expenseCategory,
          'services',
          category,
          undefined,
          true
        ))
      })
    }

    // 10. Add aggregate pet costs from usePetsStats if not already itemized
    if (petsStats?.totalCosts && petsStats.totalCosts > 0) {
      const existingPetTotal = items
        .filter(i => i.domain === 'pets')
        .reduce((sum, i) => sum + i.amount, 0)

      // Only add if there's a difference (catch-all for unitemized pet costs)
      const unitemizedPetCosts = petsStats.totalCosts - existingPetTotal
      if (unitemizedPetCosts > 10) { // threshold to avoid floating point issues
        items.push(createExpenseItem(
          'pets-aggregate',
          'Other Pet Expenses',
          unitemizedPetCosts,
          'pets',
          'pets',
          'Aggregate',
          undefined,
          false
        ))
      }
    }

    // Calculate totals by category
    const totals: ExpenseSummary = {
      housing: 0,
      food: 0,
      insurance: 0,
      transport: 0,
      utilities: 0,
      pets: 0,
      health: 0,
      education: 0,
      subscriptions: 0,
      other: 0,
    }

    // Group by category and domain
    const byCategory: Record<ExpenseCategory, CrossDomainExpenseItem[]> = {
      housing: [],
      food: [],
      insurance: [],
      transport: [],
      utilities: [],
      pets: [],
      health: [],
      education: [],
      subscriptions: [],
      other: [],
    }

    const byDomain: Record<ExpenseDomain, CrossDomainExpenseItem[]> = {
      financial: [],
      insurance: [],
      digital: [],
      home: [],
      vehicles: [],
      pets: [],
      health: [],
      education: [],
      services: [],
      bills: [],
    }

    items.forEach(item => {
      totals[item.category] += item.amount
      byCategory[item.category].push(item)
      byDomain[item.domain].push(item)
    })

    const totalExpenses = Object.values(totals).reduce((sum, val) => sum + val, 0)

    return {
      items,
      totals,
      totalExpenses,
      byCategory,
      byDomain,
      isLoading,
    }
  }, [data, serviceProvidersAnalytics, petsStats, daysBack, isLoading])
}

/**
 * Get the domain configuration for display
 */
export function getDomainConfig(domain: ExpenseDomain) {
  return DOMAIN_CONFIG[domain]
}

/**
 * Get the category configuration for display
 */
export function getCategoryConfig(category: ExpenseCategory) {
  return CATEGORY_CONFIG[category]
}






