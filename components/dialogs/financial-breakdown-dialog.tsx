'use client'

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Home,
  Car,
  Gem,
  Package,
  Zap,
  CreditCard,
  Wallet,
  ShoppingCart,
  Utensils,
  Shield,
  Fuel,
  Lightbulb,
  PawPrint,
  MoreHorizontal,
  Building,
  Banknote,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { ExpenseDomain } from '@/lib/hooks/use-cross-domain-expenses'

export type BreakdownViewType = 
  | 'net-worth' 
  | 'assets' 
  | 'liabilities' 
  | 'monthly-bills' 
  | 'expense-housing'
  | 'expense-food'
  | 'expense-insurance'
  | 'expense-transport'
  | 'expense-utilities'
  | 'expense-pets'
  | 'expense-health'
  | 'expense-education'
  | 'expense-subscriptions'
  | 'expense-other'

/**
 * Expense item with optional domain attribution
 */
export interface ExpenseItemWithDomain {
  title: string
  amount: number
  type?: string
  domain?: ExpenseDomain
  domainLabel?: string
  domainIcon?: string
  isRecurring?: boolean
}

interface FinancialBreakdownDialogProps {
  open: boolean
  onClose: () => void
  viewType: BreakdownViewType
  netWorthData: {
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
  monthlyExpenses: {
    housing: number
    food: number
    insurance: number
    transport: number
    utilities: number
    pets: number
    health?: number
    education?: number
    subscriptions?: number
    other: number
  }
  expenseItems?: {
    housing: ExpenseItemWithDomain[]
    food: ExpenseItemWithDomain[]
    insurance: ExpenseItemWithDomain[]
    transport: ExpenseItemWithDomain[]
    utilities: ExpenseItemWithDomain[]
    pets: ExpenseItemWithDomain[]
    health?: ExpenseItemWithDomain[]
    education?: ExpenseItemWithDomain[]
    subscriptions?: ExpenseItemWithDomain[]
    other: ExpenseItemWithDomain[]
  }
  assetItems?: {
    home: Array<{ title: string; value: number; type?: string }>
    vehicles: Array<{ title: string; value: number; type?: string }>
    collectibles: Array<{ title: string; value: number; type?: string }>
    appliances: Array<{ title: string; value: number; type?: string }>
    misc: Array<{ title: string; value: number; type?: string }>
    financial: Array<{ title: string; value: number; type?: string }>
  }
  liabilityItems?: Array<{ title: string; amount: number; type?: string }>
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatCurrencyShort = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return formatCurrency(value)
}

export function FinancialBreakdownDialog({
  open,
  onClose,
  viewType,
  netWorthData,
  monthlyExpenses,
  expenseItems,
  assetItems,
  liabilityItems,
}: FinancialBreakdownDialogProps) {
  const totalMonthlyExpenses = useMemo(() => {
    return Object.values(monthlyExpenses).reduce((sum, val) => sum + val, 0)
  }, [monthlyExpenses])

  const assetBreakdown = useMemo(() => {
    const { breakdown } = netWorthData
    return [
      { label: 'Home/Property', value: breakdown.homeValue, icon: Home, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
      { label: 'Vehicles', value: breakdown.vehicleValue, icon: Car, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
      { label: 'Collectibles', value: breakdown.collectiblesValue, icon: Gem, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
      { label: 'Appliances', value: breakdown.appliancesValue, icon: Zap, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
      { label: 'Miscellaneous', value: breakdown.miscValue, icon: Package, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800' },
      { label: 'Financial Accounts', value: breakdown.financialAssets, icon: Banknote, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
    ].filter(item => item.value > 0)
  }, [netWorthData])

  const expenseBreakdown = useMemo(() => {
    const categories = [
      { label: 'Housing', value: monthlyExpenses.housing, icon: Home, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', key: 'housing' },
      { label: 'Food', value: monthlyExpenses.food, icon: Utensils, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30', key: 'food' },
      { label: 'Insurance', value: monthlyExpenses.insurance, icon: Shield, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30', key: 'insurance' },
      { label: 'Transport', value: monthlyExpenses.transport, icon: Fuel, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', key: 'transport' },
      { label: 'Utilities', value: monthlyExpenses.utilities, icon: Lightbulb, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', key: 'utilities' },
      { label: 'Pets', value: monthlyExpenses.pets, icon: PawPrint, color: 'text-pink-500', bgColor: 'bg-pink-100 dark:bg-pink-900/30', key: 'pets' },
    ]

    // Add optional categories if they have values
    if (monthlyExpenses.health && monthlyExpenses.health > 0) {
      categories.push({ label: 'Health', value: monthlyExpenses.health, icon: Shield, color: 'text-teal-500', bgColor: 'bg-teal-100 dark:bg-teal-900/30', key: 'health' })
    }
    if (monthlyExpenses.education && monthlyExpenses.education > 0) {
      categories.push({ label: 'Education', value: monthlyExpenses.education, icon: Building, color: 'text-indigo-500', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', key: 'education' })
    }
    if (monthlyExpenses.subscriptions && monthlyExpenses.subscriptions > 0) {
      categories.push({ label: 'Subscriptions', value: monthlyExpenses.subscriptions, icon: RefreshCw, color: 'text-cyan-500', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', key: 'subscriptions' })
    }

    categories.push({ label: 'Other', value: monthlyExpenses.other, icon: MoreHorizontal, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800', key: 'other' })

    return categories
  }, [monthlyExpenses])

  const getDialogTitle = () => {
    switch (viewType) {
      case 'net-worth': return 'Net Worth Breakdown'
      case 'assets': return 'Total Assets Breakdown'
      case 'liabilities': return 'Liabilities Overview'
      case 'monthly-bills': return 'Monthly Expenses Breakdown'
      case 'expense-housing': return 'Housing Expenses'
      case 'expense-food': return 'Food & Dining Expenses'
      case 'expense-insurance': return 'Insurance Expenses'
      case 'expense-transport': return 'Transportation Expenses'
      case 'expense-utilities': return 'Utilities Expenses'
      case 'expense-pets': return 'Pet Expenses'
      case 'expense-health': return 'Health Expenses'
      case 'expense-education': return 'Education Expenses'
      case 'expense-subscriptions': return 'Subscription Expenses'
      case 'expense-other': return 'Other Expenses'
      default: return 'Financial Breakdown'
    }
  }

  const getDialogDescription = () => {
    switch (viewType) {
      case 'net-worth': return 'A detailed view of how your net worth is calculated'
      case 'assets': return 'All your assets organized by category'
      case 'liabilities': return 'Your debts and liabilities across all accounts'
      case 'monthly-bills': return 'Your monthly spending broken down by category. Each expense shows its source domain.'
      default: 
        if (viewType.startsWith('expense-')) {
          const category = viewType.replace('expense-', '')
          return `Detailed breakdown of your ${category} expenses this month. Items are pulled from their respective domains.`
        }
        return 'Financial details'
    }
  }

  // Get link to the relevant domain based on expense category
  const getDomainLink = (domain?: ExpenseDomain): string => {
    if (!domain) return '/domains/financial'
    const domainLinks: Record<ExpenseDomain, string> = {
      financial: '/domains/financial',
      insurance: '/domains/insurance',
      digital: '/domains/digital',
      home: '/domains/home',
      vehicles: '/domains/vehicles',
      pets: '/domains/pets',
      health: '/domains/health',
      education: '/domains/education',
      services: '/domains/financial', // Services are shown in financial
      bills: '/domains/financial',
    }
    return domainLinks[domain]
  }

  const renderNetWorthView = () => (
    <div className="space-y-6">
      {/* Net Worth Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{formatCurrencyShort(netWorthData.totalAssets)}</div>
            <div className="text-sm text-green-700 dark:text-green-400">Total Assets</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-red-600">{formatCurrencyShort(netWorthData.totalLiabilities)}</div>
            <div className="text-sm text-red-700 dark:text-red-400">Total Liabilities</div>
          </CardContent>
        </Card>
        <Card className={cn(
          "border-2",
          netWorthData.netWorth >= 0 
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400" 
            : "bg-orange-50 dark:bg-orange-900/20 border-orange-400"
        )}>
          <CardContent className="p-4 text-center">
            <Wallet className={cn("w-6 h-6 mx-auto mb-2", netWorthData.netWorth >= 0 ? "text-emerald-600" : "text-orange-600")} />
            <div className={cn("text-2xl font-bold", netWorthData.netWorth >= 0 ? "text-emerald-600" : "text-orange-600")}>
              {formatCurrencyShort(netWorthData.netWorth)}
            </div>
            <div className={cn("text-sm", netWorthData.netWorth >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400")}>
              Net Worth
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          ASSETS BREAKDOWN
        </h3>
        <div className="space-y-3">
          {assetBreakdown.map((item) => {
            const Icon = item.icon
            const percentage = netWorthData.totalAssets > 0 
              ? (item.value / netWorthData.totalAssets) * 100 
              : 0
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", item.bgColor)}>
                  <Icon className={cn("w-4 h-4", item.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {percentage.toFixed(1)}%
                </Badge>
              </div>
            )
          })}
        </div>
      </div>

      {/* Liabilities */}
      {netWorthData.totalLiabilities > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            LIABILITIES
          </h3>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-500" />
                <span className="font-medium">Total Debt</span>
              </div>
              <span className="text-lg font-bold text-red-600">{formatCurrency(netWorthData.totalLiabilities)}</span>
            </div>
            {liabilityItems && liabilityItems.length > 0 && (
              <div className="mt-3 space-y-2">
                {liabilityItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.title}</span>
                    <span className="text-red-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderAssetsView = () => (
    <div className="space-y-6">
      {/* Total Assets Header */}
      <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
        <TrendingUp className="w-10 h-10 mx-auto mb-2 text-green-600" />
        <div className="text-4xl font-bold text-green-600">{formatCurrencyShort(netWorthData.totalAssets)}</div>
        <div className="text-sm text-muted-foreground mt-1">Total Asset Value</div>
      </div>

      {/* Asset Categories */}
      <div className="grid gap-4">
        {assetBreakdown.map((item) => {
          const Icon = item.icon
          const percentage = netWorthData.totalAssets > 0 
            ? (item.value / netWorthData.totalAssets) * 100 
            : 0
          const assetCategory = item.label.toLowerCase().replace(/[^a-z]/g, '')
          const items = assetItems?.[assetCategory as keyof typeof assetItems] || []
          
          return (
            <Card key={item.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2 rounded-lg", item.bgColor)}>
                    <Icon className={cn("w-5 h-5", item.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-lg font-bold">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={percentage} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                {items.length > 0 && (
                  <div className="pl-11 space-y-1.5 border-t pt-3">
                    {items.slice(0, 5).map((asset, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate">{asset.title}</span>
                        <span className="font-medium shrink-0">{formatCurrency(asset.value)}</span>
                      </div>
                    ))}
                    {items.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center pt-1">
                        +{items.length - 5} more items
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  const renderLiabilitiesView = () => (
    <div className="space-y-6">
      {/* Total Liabilities Header */}
      <div className="text-center p-6 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl">
        <CreditCard className="w-10 h-10 mx-auto mb-2 text-red-600" />
        <div className="text-4xl font-bold text-red-600">{formatCurrencyShort(netWorthData.totalLiabilities)}</div>
        <div className="text-sm text-muted-foreground mt-1">Total Debt</div>
      </div>

      {/* Liabilities List */}
      {liabilityItems && liabilityItems.length > 0 ? (
        <div className="space-y-3">
          {liabilityItems.map((item, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <CreditCard className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      {item.type && (
                        <div className="text-xs text-muted-foreground capitalize">{item.type}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-red-600">{formatCurrency(item.amount)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No liabilities recorded</p>
          <p className="text-sm">Great job staying debt-free! 🎉</p>
        </div>
      )}

      {/* Debt-Free Note */}
      {netWorthData.totalLiabilities === 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <div className="text-green-600 font-semibold">✨ You're debt-free!</div>
          <div className="text-sm text-muted-foreground mt-1">
            Your assets ({formatCurrency(netWorthData.totalAssets)}) are 100% equity
          </div>
        </div>
      )}
    </div>
  )

  const renderMonthlyBillsView = () => (
    <div className="space-y-6">
      {/* Total Header */}
      <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
        <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-purple-600" />
        <div className="text-4xl font-bold text-purple-600">{formatCurrencyShort(totalMonthlyExpenses)}</div>
        <div className="text-sm text-muted-foreground mt-1">Total Monthly Expenses</div>
      </div>

      {/* Expense Categories */}
      <div className="space-y-3">
        {expenseBreakdown.map((item) => {
          const Icon = item.icon
          const percentage = totalMonthlyExpenses > 0 
            ? (item.value / totalMonthlyExpenses) * 100 
            : 0
          
          return (
            <div key={item.key} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className={cn("p-2 rounded-lg", item.bgColor)}>
                <Icon className={cn("w-4 h-4", item.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                </div>
                <Progress value={percentage} className="h-1.5" />
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {percentage.toFixed(0)}%
              </Badge>
            </div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Daily Average</div>
          <div className="text-lg font-semibold">{formatCurrency(totalMonthlyExpenses / 30)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Annual Estimate</div>
          <div className="text-lg font-semibold">{formatCurrencyShort(totalMonthlyExpenses * 12)}</div>
        </div>
      </div>
    </div>
  )

  const renderExpenseCategoryView = (category: string) => {
    const categoryData = expenseBreakdown.find(e => e.key === category)
    const items = expenseItems?.[category as keyof typeof expenseItems] || []
    const Icon = categoryData?.icon || MoreHorizontal
    const color = categoryData?.color || 'text-gray-500'
    const bgColor = categoryData?.bgColor || 'bg-gray-100'
    const value = categoryData?.value || 0

    // Group items by domain for summary
    const domainSummary = items.reduce((acc, item) => {
      const domain = item.domain || 'financial'
      if (!acc[domain]) {
        acc[domain] = { count: 0, total: 0, icon: item.domainIcon || '💰', label: item.domainLabel || 'Financial' }
      }
      acc[domain].count++
      acc[domain].total += item.amount
      return acc
    }, {} as Record<string, { count: number; total: number; icon: string; label: string }>)

    const domainEntries = Object.entries(domainSummary)

    return (
      <div className="space-y-6">
        {/* Category Header */}
        <div className={cn("text-center p-6 rounded-xl", bgColor)}>
          <Icon className={cn("w-10 h-10 mx-auto mb-2", color)} />
          <div className={cn("text-4xl font-bold", color)}>{formatCurrency(value)}</div>
          <div className="text-sm text-muted-foreground mt-1">This Month</div>
        </div>

        {/* Domain Sources Summary */}
        {domainEntries.length > 1 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Building className="w-4 h-4" />
              SOURCES BY DOMAIN
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {domainEntries.map(([domain, data]) => (
                <div 
                  key={domain}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <span className="text-lg">{data.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{data.label}</div>
                    <div className="text-xs text-muted-foreground">{data.count} item{data.count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-sm font-semibold">{formatCurrencyShort(data.total)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items List */}
        {items.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              EXPENSE ITEMS ({items.length})
            </h3>
            {items.map((item, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {item.domainIcon && (
                        <span className="text-lg flex-shrink-0" title={item.domainLabel}>
                          {item.domainIcon}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {item.type && (
                            <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                          )}
                          {item.domain && item.domainLabel && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5">
                              {item.domainLabel}
                            </Badge>
                          )}
                          {item.isRecurring && (
                            <span title="Recurring expense">
                              <RefreshCw className="w-3 h-3 text-blue-500" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={cn("font-semibold flex-shrink-0", color)}>
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Icon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No itemized expenses</p>
            <p className="text-sm">
              {value > 0 
                ? 'This total is calculated from your financial transactions' 
                : 'No expenses in this category this month'}
            </p>
          </div>
        )}

        {/* Links to relevant domains */}
        <div className="pt-4 border-t">
          {domainEntries.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {domainEntries.map(([domain]) => (
                <Link 
                  key={domain}
                  href={getDomainLink(domain as ExpenseDomain)}
                  className="text-sm text-primary hover:underline"
                  onClick={onClose}
                >
                  View {domain} →
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <Link 
                href="/domains/financial" 
                className="text-sm text-primary hover:underline"
                onClick={onClose}
              >
                View all financial records →
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (viewType) {
      case 'net-worth':
        return renderNetWorthView()
      case 'assets':
        return renderAssetsView()
      case 'liabilities':
        return renderLiabilitiesView()
      case 'monthly-bills':
        return renderMonthlyBillsView()
      default:
        if (viewType.startsWith('expense-')) {
          const category = viewType.replace('expense-', '')
          return renderExpenseCategoryView(category)
        }
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <DollarSign className="h-6 w-6 text-green-500" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}



