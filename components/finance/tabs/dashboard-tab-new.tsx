// @ts-nocheck
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { TrendingUp, TrendingDown, Wallet, DollarSign, AlertCircle, Lightbulb, Calendar, PiggyBank } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardVisual } from '../visuals/tab-visuals'
import {
  NetWorthTrendChart,
  CashFlowBarChart,
  BudgetProgressRing,
  UpcomingBillsList
} from '../charts/finance-visualizations'

export function DashboardTab() {
  const { financialSummary, billSummary, insights, loading, bills, transactions, monthlyBudget } = useFinance()
  
  // Generate net worth trend data (last 6 months - simulated for demo)
  const netWorthTrendData = useMemo(() => {
    const currentNetWorth = financialSummary?.netWorth || 0
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return months.map((month, index) => ({
      month,
      value: Math.max(0, currentNetWorth * (0.85 + (index * 0.03)) + (Math.random() - 0.5) * currentNetWorth * 0.05)
    }))
  }, [financialSummary?.netWorth])

  // Generate cash flow data for last 6 months
  const cashFlowData = useMemo(() => {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyIncome = financialSummary?.monthlyIncome || 0
    const monthlyExpenses = financialSummary?.monthlyExpenses || 0
    
    return months.map((month, index) => ({
      month,
      income: monthlyIncome * (0.9 + Math.random() * 0.2),
      expenses: monthlyExpenses * (0.85 + Math.random() * 0.3)
    }))
  }, [financialSummary])

  // Prepare upcoming bills for widget
  const upcomingBills = useMemo(() => {
    return bills.map(bill => ({
      id: bill.id,
      name: bill.name,
      amount: bill.amount,
      dueDate: bill.due_date,
      status: bill.status as 'paid' | 'pending' | 'overdue',
      provider: bill.provider
    }))
  }, [bills])

  if (loading && !financialSummary) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    )
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  const formatCurrencyDetailed = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  // Calculate insurance premiums by type
  const insuranceBills = bills.filter(b => b.category === 'insurance')
  const insurancePremiums = {
    health: insuranceBills
      .filter(b => b.provider.toLowerCase().includes('health') || b.name.toLowerCase().includes('health'))
      .reduce((sum, b) => sum + b.amount, 0),
    auto: insuranceBills
      .filter(b => b.provider.toLowerCase().includes('auto') || b.name.toLowerCase().includes('auto') || b.name.toLowerCase().includes('car'))
      .reduce((sum, b) => sum + b.amount, 0),
    home: insuranceBills
      .filter(b => b.provider.toLowerCase().includes('home') || b.name.toLowerCase().includes('home') || b.name.toLowerCase().includes('house'))
      .reduce((sum, b) => sum + b.amount, 0),
    life: insuranceBills
      .filter(b => b.provider.toLowerCase().includes('life') || b.name.toLowerCase().includes('life'))
      .reduce((sum, b) => sum + b.amount, 0)
  }
  const totalInsurancePremium = Object.values(insurancePremiums).reduce((sum, val) => sum + val, 0)
  
  // Calculate monthly expenses by category
  const expensesByCategory = bills
    .filter(b => b.recurring && b.frequency === 'monthly')
    .reduce((acc, bill) => {
      const category = bill.category || 'other'
      acc[category] = (acc[category] || 0) + bill.amount
      return acc
    }, {} as Record<string, number>)
  
  return (
    <div className="space-y-6">
      {/* Visual Hero */}
      <DashboardVisual />
      
      {/* Top Row - 4 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Net Worth */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Net Worth</CardTitle>
            <Wallet className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(financialSummary?.netWorth || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Assets - Liabilities
            </p>
          </CardContent>
        </Card>
        
        {/* Total Assets */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(financialSummary?.totalAssets || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              What you own
            </p>
          </CardContent>
        </Card>
        
        {/* Total Liabilities */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Liabilities</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(financialSummary?.totalLiabilities || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              What you owe
            </p>
          </CardContent>
        </Card>
        
        {/* Monthly Cash Flow */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Monthly Cash Flow</CardTitle>
            <TrendingUp className={cn(
              "h-4 w-4",
              (financialSummary?.monthlyCashFlow || 0) >= 0 ? "text-green-500" : "text-red-500"
            )} />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              (financialSummary?.monthlyCashFlow || 0) >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {formatCurrency(financialSummary?.monthlyCashFlow || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Income - Expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Visualization Row - Net Worth Trend & Cash Flow */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Net Worth Trend Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-slate-200">Net Worth Trend</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Track your wealth growth over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NetWorthTrendChart data={netWorthTrendData} height={200} />
          </CardContent>
        </Card>

        {/* Monthly Cash Flow Bar Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-slate-200">Monthly Cash Flow</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Income vs expenses comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CashFlowBarChart data={cashFlowData} height={200} />
          </CardContent>
        </Card>
      </div>

      {/* NEW: Budget Progress & Upcoming Bills Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Progress Ring */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-teal-500" />
              <CardTitle className="text-slate-200">Budget Progress</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Overall spending vs. budget this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <BudgetProgressRing
                spent={monthlyBudget?.totalSpent || financialSummary?.monthlyExpenses || 0}
                budget={monthlyBudget?.totalBudgeted || (financialSummary?.monthlyIncome || 0) * 0.8}
                size={160}
              />
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Budget</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(monthlyBudget?.totalBudgeted || (financialSummary?.monthlyIncome || 0) * 0.8)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Spent</p>
                  <p className="text-xl font-bold text-rose-400">
                    {formatCurrency(monthlyBudget?.totalSpent || financialSummary?.monthlyExpenses || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Remaining</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {formatCurrency((monthlyBudget?.totalBudgeted || (financialSummary?.monthlyIncome || 0) * 0.8) - (monthlyBudget?.totalSpent || financialSummary?.monthlyExpenses || 0))}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bills List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-500" />
              <CardTitle className="text-slate-200">Upcoming Bills</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              {billSummary?.upcomingBillsCount || 0} bills due • {formatCurrency(billSummary?.totalAmountDue || 0)} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpcomingBillsList bills={upcomingBills} limit={5} />
          </CardContent>
        </Card>
      </div>
      
      {/* Financial Insights & Recommendations */}
      {insights && insights.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-slate-200">Financial Insights & Recommendations</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              AI-powered analysis of your financial health
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                className={cn(
                  "p-4 rounded-lg border-l-4",
                  insight.type === 'alert' && 'bg-orange-950/30 border-orange-500',
                  insight.type === 'warning' && 'bg-yellow-950/30 border-yellow-500',
                  insight.type === 'success' && 'bg-green-950/30 border-green-500',
                  insight.type === 'opportunity' && 'bg-blue-950/30 border-blue-500',
                  insight.type === 'info' && 'bg-slate-800/50 border-slate-600'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5",
                    insight.type === 'alert' && 'text-orange-500',
                    insight.type === 'warning' && 'text-yellow-500',
                    insight.type === 'success' && 'text-green-500',
                    insight.type === 'opportunity' && 'text-blue-500',
                    insight.type === 'info' && 'text-slate-400'
                  )}>
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                    <p className="text-sm text-slate-300 mb-2">{insight.message}</p>
                    {insight.action && (
                      <p className="text-sm font-medium text-slate-200 flex items-center gap-2">
                        💡 {insight.action}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Insurance & Monthly Expenses Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Insurance Section */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200 flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              Insurance
            </CardTitle>
            <CardDescription className="text-slate-400">
              {insuranceBills.length} {insuranceBills.length === 1 ? 'policy' : 'policies'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Insurance type breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">❤️</span>
                    <span className="text-sm text-slate-400">Health</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {insurancePremiums.health > 0 ? formatCurrencyDetailed(insurancePremiums.health) : '--'}
                  </div>
                </div>
                
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🚗</span>
                    <span className="text-sm text-slate-400">Auto</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {insurancePremiums.auto > 0 ? formatCurrencyDetailed(insurancePremiums.auto) : '--'}
                  </div>
                </div>
                
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🏠</span>
                    <span className="text-sm text-slate-400">Home</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {insurancePremiums.home > 0 ? formatCurrencyDetailed(insurancePremiums.home) : '--'}
                  </div>
                </div>
                
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">💚</span>
                    <span className="text-sm text-slate-400">Life</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {insurancePremiums.life > 0 ? formatCurrencyDetailed(insurancePremiums.life) : '--'}
                  </div>
                </div>
              </div>
              
              {/* Total Premium */}
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Total Premium</span>
                  <span className="text-2xl font-bold text-white">
                    {formatCurrencyDetailed(totalInsurancePremium)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Monthly Expenses Breakdown */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200">Monthly Expenses Breakdown</CardTitle>
            <CardDescription className="text-slate-400">All expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(expensesByCategory).length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No recurring bills yet
                </div>
              ) : (
                Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-slate-200 capitalize">
                        {category}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      {formatCurrencyDetailed(amount)}
                    </span>
                  </div>
                ))
              )}
              
              {Object.entries(expensesByCategory).length > 0 && (
                <div className="pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-400">Total Monthly Bills</span>
                    <span className="text-2xl font-bold text-white">
                      {formatCurrencyDetailed(financialSummary?.monthlyExpenses || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Monthly Summary */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-slate-400" />
            <CardTitle className="text-slate-200">Monthly Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Total Income:</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(financialSummary?.monthlyIncome || 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Total Expenses:</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(financialSummary?.monthlyExpenses || 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-400">Net Cash Flow:</p>
              <p className={cn(
                "text-2xl font-bold",
                (financialSummary?.monthlyCashFlow || 0) >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {formatCurrency(financialSummary?.monthlyCashFlow || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
