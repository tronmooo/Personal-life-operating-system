// @ts-nocheck
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinance } from '@/lib/providers/finance-provider'
import { TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, PiggyBank, AlertCircle, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils/finance-utils'
import { LineChartComponent } from '../charts/line-chart-component'
import { BarChartComponent } from '../charts/bar-chart-component'
import { format, subMonths, startOfMonth } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export function DashboardTab() {
  const { 
    financialSummary, 
    billSummary, 
    insights,
    transactions,
    loading 
  } = useFinance()
  
  if (loading && !financialSummary) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }
  
  // Calculate 6-month trend data
  const getLast6MonthsTrend = () => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthStart = startOfMonth(date)
      const monthKey = format(monthStart, 'MMM')
      
      const monthTransactions = transactions.filter(t => {
        const transDate = new Date(t.date)
        return transDate.getMonth() === monthStart.getMonth() && 
               transDate.getFullYear() === monthStart.getFullYear()
      })
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      months.push({
        month: monthKey,
        income: Math.round(income),
        expenses: Math.round(expenses),
        savings: Math.round(income - expenses)
      })
    }
    return months
  }
  
  const trendData = getLast6MonthsTrend()
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertCircle className="h-5 w-5" />
      case 'warning': return <AlertTriangle className="h-5 w-5" />
      case 'success': return <CheckCircle2 className="h-5 w-5" />
      case 'opportunity': return <Lightbulb className="h-5 w-5" />
      default: return <AlertCircle className="h-5 w-5" />
    }
  }
  
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'alert': return 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
      case 'success': return 'border-green-500 bg-green-50 dark:bg-green-950/30'
      case 'opportunity': return 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-950/30'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Net Worth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialSummary?.netWorth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Assets - Liabilities
            </p>
          </CardContent>
        </Card>
        
        {/* Total Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialSummary?.totalAssets || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              What you own
            </p>
          </CardContent>
        </Card>
        
        {/* Total Liabilities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialSummary?.totalLiabilities || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              What you owe
            </p>
          </CardContent>
        </Card>
        
        {/* Monthly Cash Flow */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cash Flow</CardTitle>
            <DollarSign className={cn(
              "h-4 w-4",
              (financialSummary?.monthlyCashFlow || 0) >= 0 ? "text-green-600" : "text-red-600"
            )} />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              (financialSummary?.monthlyCashFlow || 0) >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(financialSummary?.monthlyCashFlow || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Income - Expenses
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Financial Insights & Recommendations */}
      {insights && insights.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <CardTitle>Financial Insights & Recommendations</CardTitle>
            </div>
            <CardDescription>AI-powered analysis of your financial health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                className={cn(
                  "p-4 rounded-lg border-l-4",
                  getInsightColor(insight.type)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    insight.type === 'alert' && 'text-orange-600',
                    insight.type === 'warning' && 'text-yellow-600',
                    insight.type === 'success' && 'text-green-600',
                    insight.type === 'opportunity' && 'text-blue-600'
                  )}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{insight.message}</p>
                    {insight.action && (
                      <p className="text-sm font-medium flex items-center gap-2">
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
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Net Worth Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Trend</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChartComponent
              data={trendData}
              xKey="month"
              lines={[
                { key: 'savings', name: 'Net Worth', color: '#3b82f6' }
              ]}
              height={250}
            />
          </CardContent>
        </Card>
        
        {/* Monthly Cash Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
            <CardDescription>Current month breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Income:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(financialSummary?.monthlyIncome || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Expenses:</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(financialSummary?.monthlyExpenses || 0)}
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Net Cash Flow:</span>
                  <span className={cn(
                    "text-lg font-bold",
                    (financialSummary?.monthlyCashFlow || 0) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(financialSummary?.monthlyCashFlow || 0)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 6-Month Financial Trend */}
      <Card>
        <CardHeader>
          <CardTitle>6-Month Financial Trend</CardTitle>
          <CardDescription>Track your income, expenses, and savings over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Income vs Expenses</h4>
            <BarChartComponent
              data={trendData}
              xKey="month"
              bars={[
                { key: 'income', name: 'Income', color: '#10b981' },
                { key: 'expenses', name: 'Expenses', color: '#ef4444' }
              ]}
              height={300}
            />
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Monthly Savings Trend</h4>
            <LineChartComponent
              data={trendData}
              xKey="month"
              lines={[
                { key: 'savings', name: 'Savings', color: '#3b82f6' }
              ]}
              height={200}
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Bills */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bills (Next 30 Days)</CardTitle>
            <CardDescription>{billSummary?.upcomingBillsCount || 0} bills due soon</CardDescription>
          </CardHeader>
          <CardContent>
            {billSummary && billSummary.nextBills && billSummary.nextBills.length > 0 ? (
              <div className="space-y-3">
                {billSummary.nextBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{bill.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {format(new Date(bill.due_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(bill.amount))}</p>
                      {bill.is_autopay && (
                        <Badge variant="secondary" className="text-xs">Auto-pay</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No upcoming bills
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Debt Payoff Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Debt Payoff Progress</CardTitle>
            <CardDescription>Current balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Debt:</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(financialSummary?.totalLiabilities || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Liquid Assets:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(financialSummary?.liquidAssets || 0)}
                </span>
              </div>
              {financialSummary && financialSummary.totalLiabilities > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Debt Payoff Progress</span>
                    <span className="font-medium">
                      {Math.round((financialSummary.liquidAssets / financialSummary.totalLiabilities) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(financialSummary.liquidAssets / financialSummary.totalLiabilities) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Monthly Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Income:</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialSummary?.monthlyIncome || 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Expenses:</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(financialSummary?.monthlyExpenses || 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Net Cash Flow:</p>
                <p className={cn(
                  "text-2xl font-bold",
                  (financialSummary?.monthlyCashFlow || 0) >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(financialSummary?.monthlyCashFlow || 0)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="text-sm font-medium">Savings Rate:</span>
                <span className="text-lg font-bold">
                  {formatPercentage(financialSummary?.savingsRate || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="text-sm font-medium">Emergency Fund:</span>
                <span className="text-lg font-bold">
                  {(financialSummary?.emergencyFundMonths || 0).toFixed(1)} months
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

