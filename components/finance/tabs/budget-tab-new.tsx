// @ts-nocheck
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { Plus, Trash2, PieChart, TrendingUp, Target } from 'lucide-react'
import { BudgetVisual } from '../visuals/tab-visuals'
import { BudgetAllocationDonut, MonthOverMonthComparison, BudgetProgressRing } from '../charts/finance-visualizations'
import { cn } from '@/lib/utils'

interface BudgetTabProps {
  onOpenBudgetDialog?: () => void
}

export function BudgetTab({ onOpenBudgetDialog }: BudgetTabProps = {}) {
  const { monthlyBudget, goals, budgetCategories, deleteBudgetItem, transactions } = useFinance()
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Prepare data for budget allocation donut
  const budgetAllocationData = useMemo(() => {
    return budgetCategories.map(cat => ({
      category: cat.category,
      budgeted: cat.budgetedAmount,
      spent: cat.spentAmount
    }))
  }, [budgetCategories])

  // Generate mock comparison data (current vs previous month)
  const monthComparisonData = useMemo(() => {
    const currentMonth = budgetCategories.map(cat => ({
      category: cat.category,
      spent: cat.spentAmount
    }))

    // Simulate previous month data (slightly different values)
    const previousMonth = budgetCategories.map(cat => ({
      category: cat.category,
      spent: cat.spentAmount * (0.85 + Math.random() * 0.3)
    }))

    return { currentMonth, previousMonth }
  }, [budgetCategories])

  // Calculate overall budget health
  const budgetHealth = useMemo(() => {
    const totalBudget = monthlyBudget?.totalBudgeted || 0
    const totalSpent = monthlyBudget?.totalSpent || 0
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    let status: 'excellent' | 'good' | 'warning' | 'danger' = 'excellent'
    if (percentUsed > 100) status = 'danger'
    else if (percentUsed > 90) status = 'warning'
    else if (percentUsed > 70) status = 'good'

    return { totalBudget, totalSpent, percentUsed, status }
  }, [monthlyBudget])

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const overBudget = budgetCategories.filter(c => c.spentAmount > c.budgetedAmount)
    const underBudget = budgetCategories.filter(c => c.spentAmount <= c.budgetedAmount * 0.5)
    const onTrack = budgetCategories.filter(c => 
      c.spentAmount > c.budgetedAmount * 0.5 && c.spentAmount <= c.budgetedAmount
    )
    return { overBudget, underBudget, onTrack }
  }, [budgetCategories])
  
  return (
    <div className="space-y-6">
      {/* Visual Hero */}
      <BudgetVisual />
      
      {/* Top Row - 3 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Budgeted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(monthlyBudget?.totalBudgeted || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Monthly target</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(monthlyBudget?.totalSpent || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">This month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              (monthlyBudget?.variance || 0) >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {formatCurrency(monthlyBudget?.variance || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {(monthlyBudget?.variance || 0) >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Budget Visualizations Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Allocation Donut */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-teal-500" />
              <CardTitle className="text-slate-200">Budget Allocation</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              How your budget is distributed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budgetAllocationData.length > 0 ? (
              <BudgetAllocationDonut data={budgetAllocationData} height={220} />
            ) : (
              <div className="flex items-center justify-center h-[220px] text-slate-500">
                <div className="text-center">
                  <span className="text-4xl block mb-2">📊</span>
                  Add budget categories to see allocation
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overall Budget Progress */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-slate-200">Monthly Progress</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Overall spending vs budget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <BudgetProgressRing
                spent={budgetHealth.totalSpent}
                budget={budgetHealth.totalBudget || 1}
                size={160}
              />
              <div className="space-y-3">
                {/* Category Status Summary */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-slate-300">Under 50%: {categoryStats.underBudget.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-slate-300">On track: {categoryStats.onTrack.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-sm text-slate-300">Over budget: {categoryStats.overBudget.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month Over Month Comparison */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-500" />
            <CardTitle className="text-slate-200">This Month vs Last Month</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Compare spending patterns between months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthComparisonData.currentMonth.length > 0 ? (
            <MonthOverMonthComparison 
              currentMonth={monthComparisonData.currentMonth}
              previousMonth={monthComparisonData.previousMonth}
            />
          ) : (
            <div className="flex items-center justify-center py-8 text-slate-500">
              Add budget categories to see comparison
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Budget & Goals */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-200">Budget Categories</CardTitle>
              <CardDescription className="text-slate-400">
                Plan and track your spending by category
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              className="bg-black hover:bg-slate-900"
              onClick={() => onOpenBudgetDialog?.()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Budget Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {budgetCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="text-4xl mb-4">📈</div>
              <p>No budget items yet. Add your first budget category to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {budgetCategories.map((budget) => {
                const remaining = budget.budgetedAmount - budget.spentAmount
                const percentUsed = budget.budgetedAmount > 0 ? (budget.spentAmount / budget.budgetedAmount) * 100 : 0
                const isOverBudget = percentUsed > 100
                
                return (
                  <div key={budget.id} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold text-white">{budget.category}</h4>
                          {isOverBudget && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-rose-500/20 text-rose-400 rounded">
                              Over Budget
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">
                          {isOverBudget ? 'Review spending in this category' : 'Stay within budget'}
                        </p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-white">
                            {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.budgetedAmount)}
                          </p>
                          <p className={cn(
                            "text-sm font-medium",
                            remaining >= 0 ? "text-green-400" : "text-red-400"
                          )}>
                            {remaining >= 0 ? '-' : '+'}{formatCurrency(Math.abs(remaining))}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-900/30"
                          onClick={() => deleteBudgetItem(budget.id)}
                        >
                          <Trash2 className="h-5 w-5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={Math.min(percentUsed, 100)} 
                        className={cn(
                          "h-3 bg-slate-700",
                          isOverBudget && "[&>div]:bg-rose-500"
                        )}
                      />
                      {isOverBudget && (
                        <div 
                          className="absolute top-0 h-3 bg-rose-500/30 rounded-r"
                          style={{ 
                            left: '100%', 
                            width: `${Math.min(percentUsed - 100, 50)}%` 
                          }}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn(
                        percentUsed > 100 ? "text-rose-400" : 
                        percentUsed > 80 ? "text-amber-400" : "text-slate-400"
                      )}>
                        {percentUsed.toFixed(1)}% used
                      </span>
                      <span className="text-slate-400">
                        {remaining >= 0 
                          ? `${formatCurrency(remaining)} remaining`
                          : `${formatCurrency(Math.abs(remaining))} over`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Financial Goals */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-200">Financial Goals</CardTitle>
          <CardDescription className="text-slate-400">
            Track your progress toward major financial milestones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Example Goals with Progress Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-200">Emergency Fund Goal</span>
                <span className="text-sm font-medium text-white">$15,500 / $20,000</span>
              </div>
              <Progress value={77.5} className="h-2" />
              <p className="text-xs text-slate-400 mt-1">77.5% complete - $4,500 remaining</p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-200">Vacation Fund Goal</span>
                <span className="text-sm font-medium text-white">$800 / $2,500</span>
              </div>
              <Progress value={32} className="h-2" />
              <p className="text-xs text-slate-400 mt-1">32% complete - $1,700 remaining</p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-200">Pay off Prime Visa</span>
                <span className="text-sm font-medium text-white">$1,900 paid / $4,000 original</span>
              </div>
              <Progress value={47.5} className="h-2" />
              <p className="text-xs text-slate-400 mt-1">$2,100 remaining - Target: Dec 2025</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
