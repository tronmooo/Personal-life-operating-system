'use client'

import { useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp, TrendingDown, DollarSign, PiggyBank, CreditCard,
  Wallet, Home, LineChart, AlertCircle, CheckCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

interface FinancialCardProps {
  size: 'small' | 'medium' | 'large'
  data: any
}

export function FinancialCard({ size, data }: FinancialCardProps) {
  const financial = data?.financial || []
  const netWorth = calculateNetWorth(financial)
  const totalAssets = calculateAssets(financial)
  const totalLiabilities = calculateLiabilities(financial)
  const monthlyChange = calculateMonthlyChange(financial)
  const monthlyIncome = calculateMonthlyIncome(data)
  const monthlyExpenses = calculateMonthlyExpenses(data)
  const savingsRate = calculateSavingsRate(monthlyIncome, monthlyExpenses)
  const assetBreakdown = calculateAssetBreakdown(financial)
  const financialHealth = calculateFinancialHealth(netWorth, monthlyIncome, monthlyExpenses)

  useEffect(() => {
    console.log('[FinancialCard] Component mounting')
    console.log('[FinancialCard] Props received:', { size, data })
    console.log('[FinancialCard] Hook data:', { financial })
  }, [size, data, financial])

  console.log('[FinancialCard] Rendering with values:', {
    size,
    netWorth,
    totalAssets,
    totalLiabilities,
    monthlyChange,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    financialHealth,
    assetBreakdownCount: assetBreakdown.length,
  })

  if (size === 'small') {
    return (
      <Card className="h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
        <CardContent className="p-4 flex flex-col justify-center h-full">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              monthlyChange >= 0 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {monthlyChange >= 0 ? '↑' : '↓'} {Math.abs(monthlyChange)}%
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">
              ${formatNumber(netWorth)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Net Worth</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (size === 'medium') {
    return (
      <Card className="h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Financial
            </div>
            <span className={`flex items-center gap-1 text-sm ${
              monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {monthlyChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(monthlyChange)}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <PiggyBank className="h-4 w-4 text-green-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Net Worth</span>
              </div>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                ${formatNumber(netWorth)}
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Assets</span>
              </div>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                ${formatNumber(totalAssets)}
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-red-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Liabilities</span>
              </div>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                ${formatNumber(totalLiabilities)}
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Savings</span>
              </div>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {savingsRate}%
              </p>
            </div>
          </div>

          <Button variant="outline" className="w-full" size="sm">
            <LineChart className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Large size - Full financial dashboard
  return (
    <Card className="h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Financial Dashboard
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${
              financialHealth >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              financialHealth >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {financialHealth >= 80 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {financialHealth}% Health
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <PiggyBank className="h-5 w-5 text-green-600" />
              <span className={`flex items-center gap-1 text-xs font-medium ${
                monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {monthlyChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(monthlyChange)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              ${formatNumber(netWorth)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Net Worth</p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-gray-500">{financial.filter((f: any) => f.category === 'asset').length}</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              ${formatNumber(totalAssets)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Assets</p>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="h-5 w-5 text-red-600" />
              <span className="text-xs text-gray-500">{financial.filter((f: any) => f.category === 'liability').length}</span>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              ${formatNumber(totalLiabilities)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Liabilities</p>
          </div>
        </div>

        {/* Asset Breakdown */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-sm">Asset Breakdown</span>
          </div>
          <div className="space-y-2">
            {assetBreakdown.map((asset, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{asset.icon}</span>
                    <span>{asset.name}</span>
                  </span>
                  <span className="font-medium">${formatNumber(asset.value)} ({asset.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${asset.color}`}
                    style={{ width: `${asset.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Income vs Expenses */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Monthly Income</span>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              ${formatNumber(monthlyIncome)}
            </p>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Monthly Expenses</span>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              ${formatNumber(monthlyExpenses)}
            </p>
          </div>
        </div>

        {/* Savings Rate Progress */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Savings Rate</span>
            <span className="text-lg font-bold text-purple-600">{savingsRate}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
              style={{ width: `${savingsRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Target: 20% • Current: {savingsRate}%
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="w-full">
            <LineChart className="h-4 w-4 mr-2" />
            Charts
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Wallet className="h-4 w-4 mr-2" />
            Accounts
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <CreditCard className="h-4 w-4 mr-2" />
            Budget
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced helper functions
function calculateNetWorth(financial: any[]): number {
  if (!Array.isArray(financial)) return 0
  const assets = financial.filter(f => f.category === 'asset').reduce((sum, f) => sum + (f.amount || 0), 0)
  const liabilities = financial.filter(f => f.category === 'liability').reduce((sum, f) => sum + (f.amount || 0), 0)
  return assets - liabilities
}

function calculateAssets(financial: any[]): number {
  if (!Array.isArray(financial)) return 0
  return financial.filter(f => f.category === 'asset').reduce((sum, f) => sum + (f.amount || 0), 0)
}

function calculateLiabilities(financial: any[]): number {
  if (!Array.isArray(financial)) return 0
  return financial.filter(f => f.category === 'liability').reduce((sum, f) => sum + (f.amount || 0), 0)
}

function calculateMonthlyChange(financial: any[]): number {
  // Calculate based on historical data if available
  const netWorth = calculateNetWorth(financial)
  // Simulated monthly change - in production, compare with last month's data
  return netWorth > 100000 ? 6 : netWorth > 50000 ? 4 : 2
}

function calculateMonthlyIncome(data: any): number {
  // Extract from data or use default
  return data?.monthlyIncome || 8500
}

function calculateMonthlyExpenses(data: any): number {
  // Extract from data or use default
  return data?.monthlyExpenses || 5200
}

function calculateSavingsRate(income: number, expenses: number): number {
  if (income === 0) return 0
  return Math.round(((income - expenses) / income) * 100)
}

function calculateAssetBreakdown(financial: any[]): Array<{name: string, value: number, percentage: number, icon: string, color: string}> {
  const assets = financial.filter(f => f.category === 'asset')
  const total = assets.reduce((sum, f) => sum + (f.amount || 0), 0)
  
  if (total === 0) return []

  // Group by type
  const breakdown: Record<string, number> = {}
  assets.forEach(asset => {
    const type = asset.type || 'Other'
    breakdown[type] = (breakdown[type] || 0) + (asset.amount || 0)
  })

  const typeConfig: Record<string, {icon: string, color: string}> = {
    'Cash': { icon: '💵', color: 'bg-green-500' },
    'Investments': { icon: '📈', color: 'bg-blue-500' },
    'Real Estate': { icon: '🏠', color: 'bg-purple-500' },
    'Retirement': { icon: '🏦', color: 'bg-indigo-500' },
    'Business': { icon: '💼', color: 'bg-orange-500' },
    'Other': { icon: '💎', color: 'bg-gray-500' },
  }

  return Object.entries(breakdown).map(([type, value]) => ({
    name: type,
    value,
    percentage: Math.round((value / total) * 100),
    icon: typeConfig[type]?.icon || '💰',
    color: typeConfig[type]?.color || 'bg-gray-500',
  })).sort((a, b) => b.value - a.value).slice(0, 5)
}

function calculateFinancialHealth(netWorth: number, income: number, expenses: number): number {
  let score = 0
  
  // Positive net worth (40 points)
  if (netWorth > 0) score += 40
  if (netWorth > 100000) score += 10
  
  // Savings rate (30 points)
  const savingsRate = calculateSavingsRate(income, expenses)
  score += Math.min(savingsRate, 30)
  
  // Income vs expenses (20 points)
  if (income > expenses) score += 20
  
  return Math.min(score, 100)
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toFixed(0)
}


























