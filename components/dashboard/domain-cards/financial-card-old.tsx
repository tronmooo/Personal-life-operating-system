'use client'

import { TrendingUp, TrendingDown, DollarSign, PiggyBank, CreditCard } from 'lucide-react'

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

  if (size === 'small') {
    return (
      <div className="h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-2xl">💰</span>
          <span className={`text-xs px-2 py-1 rounded ${
            monthlyChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {monthlyChange >= 0 ? '+' : ''}{monthlyChange}%
          </span>
        </div>
        <div>
          <div className="text-3xl font-bold">${formatNumber(netWorth)}</div>
          <div className="text-xs text-gray-500">Net Worth</div>
        </div>
      </div>
    )
  }

  if (size === 'medium') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="font-semibold">Financial</span>
          </div>
          <span className={`flex items-center gap-1 text-xs ${
            monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {monthlyChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {monthlyChange >= 0 ? '+' : ''}{monthlyChange}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">${formatNumber(netWorth)}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Net Worth</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">${formatNumber(totalAssets)}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Assets</div>
          </div>
        </div>
      </div>
    )
  }

  // Large size
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          <span className="text-lg font-semibold">Financial Overview</span>
        </div>
        <span className={`flex items-center gap-1 text-sm font-medium ${
          monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {monthlyChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {monthlyChange >= 0 ? '+' : ''}{monthlyChange}% this month
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Net Worth</span>
          </div>
          <div className="text-3xl font-bold text-green-600">${formatNumber(netWorth)}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Assets</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">${formatNumber(totalAssets)}</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-red-600" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Liabilities</span>
          </div>
          <div className="text-3xl font-bold text-red-600">${formatNumber(totalLiabilities)}</div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 flex items-end gap-1">
        {[45, 52, 48, 61, 58, 65, 70, 68, 75, 80, 78, 85].map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-green-500 rounded-t"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      <div className="mt-3 text-xs text-center text-gray-500">
        {financial.length} accounts • Updated today
      </div>
    </div>
  )
}

// Helper functions
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
  // Placeholder - calculate actual monthly change
  return Math.round(Math.random() * 10 - 2)
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



