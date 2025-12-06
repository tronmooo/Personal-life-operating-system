// @ts-nocheck
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { Plus, Trash2, TrendingDown, Target, Clock } from 'lucide-react'
import { DebtsVisual } from '../visuals/tab-visuals'
import { DebtComparisonChart, PayoffTimeline, DebtToIncomeGauge } from '../charts/finance-visualizations'

interface DebtsTabProps {
  onOpenDebtDialog?: () => void
}

export function DebtsTab({ onOpenDebtDialog }: DebtsTabProps = {}) {
  const { debtSummary, debts, financialSummary, deleteDebt } = useFinance()
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Prepare data for debt comparison chart
  const debtComparisonData = useMemo(() => {
    return debts.map(debt => ({
      name: debt.creditor || debt.name,
      balance: debt.currentBalance,
      interestRate: debt.interestRate
    })).sort((a, b) => b.balance - a.balance)
  }, [debts])

  // Calculate payoff timeline for each debt
  const payoffTimelineData = useMemo(() => {
    return debts.map(debt => {
      // Simple calculation: balance / minimum payment = months to payoff
      const monthsRemaining = debt.minimumPayment > 0 
        ? Math.ceil(debt.currentBalance / debt.minimumPayment)
        : 120 // Default to 10 years if no payment info

      const payoffDate = new Date()
      payoffDate.setMonth(payoffDate.getMonth() + monthsRemaining)

      return {
        name: debt.creditor || debt.name,
        monthsRemaining,
        projectedPayoffDate: payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        balance: debt.currentBalance
      }
    }).sort((a, b) => a.monthsRemaining - b.monthsRemaining)
  }, [debts])

  // Calculate debt-to-income ratio
  const debtToIncomeRatio = useMemo(() => {
    const monthlyIncome = financialSummary?.monthlyIncome || 1
    const monthlyDebtPayments = debtSummary?.totalMinimumPayments || 0
    return monthlyIncome > 0 ? (monthlyDebtPayments / monthlyIncome) * 100 : 0
  }, [financialSummary, debtSummary])

  // Snowball vs Avalanche comparison
  const payoffStrategies = useMemo(() => {
    const sortedByBalance = [...debts].sort((a, b) => a.currentBalance - b.currentBalance)
    const sortedByRate = [...debts].sort((a, b) => b.interestRate - a.interestRate)

    return {
      snowball: {
        firstTarget: sortedByBalance[0]?.creditor || 'N/A',
        description: 'Pay smallest balance first for quick wins'
      },
      avalanche: {
        firstTarget: sortedByRate[0]?.creditor || 'N/A',
        description: 'Pay highest interest first to save money'
      }
    }
  }, [debts])
  
  return (
    <div className="space-y-6">
      {/* Visual Hero */}
      <DebtsVisual />
      
      {/* Top Row - 3 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Debt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(debtSummary?.totalDebt || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Monthly Minimum Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(debtSummary?.totalMinimumPayments || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Required each month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Highest Interest Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {(debtSummary?.highestInterestRate || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-slate-400 mt-1">Priority for payoff</p>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Debt Visualizations Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Debt Comparison Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              <CardTitle className="text-slate-200">Debt Comparison</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Balance by creditor (colored by interest rate)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {debtComparisonData.length > 0 ? (
              <DebtComparisonChart data={debtComparisonData} height={220} />
            ) : (
              <div className="flex items-center justify-center h-[220px] text-slate-500">
                <div className="text-center">
                  <span className="text-4xl block mb-2">🎉</span>
                  No debts to display
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debt-to-Income Gauge */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-slate-200">Debt-to-Income Ratio</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Monthly payments as % of income
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <DebtToIncomeGauge ratio={debtToIncomeRatio} size={160} />
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-400">0-36%: Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-slate-400">36-50%: Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-slate-400">50%+: High Risk</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payoff Timeline & Strategies */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payoff Timeline */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-violet-500" />
              <CardTitle className="text-slate-200">Payoff Timeline</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Projected payoff dates based on minimum payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payoffTimelineData.length > 0 ? (
              <PayoffTimeline data={payoffTimelineData} />
            ) : (
              <div className="flex items-center justify-center h-[150px] text-slate-500">
                No debts to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Snowball vs Avalanche */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200">Payoff Strategies</CardTitle>
            <CardDescription className="text-slate-400">
              Compare debt elimination approaches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Snowball Method */}
            <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-800/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">❄️</span>
                <h4 className="font-semibold text-white">Debt Snowball</h4>
              </div>
              <p className="text-sm text-slate-300 mb-2">
                {payoffStrategies.snowball.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">First target:</span>
                <span className="text-sm font-medium text-blue-400">
                  {payoffStrategies.snowball.firstTarget}
                </span>
              </div>
            </div>

            {/* Avalanche Method */}
            <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-800/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🏔️</span>
                <h4 className="font-semibold text-white">Debt Avalanche</h4>
              </div>
              <p className="text-sm text-slate-300 mb-2">
                {payoffStrategies.avalanche.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">First target:</span>
                <span className="text-sm font-medium text-rose-400">
                  {payoffStrategies.avalanche.firstTarget}
                </span>
              </div>
            </div>

            {/* Recommendation */}
            {debts.length > 0 && (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50">
                <p className="text-xs text-emerald-300">
                  💡 <strong>Recommendation:</strong> The Avalanche method typically saves more in interest, 
                  but Snowball provides psychological wins that help maintain motivation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Liabilities Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-200">Liabilities</CardTitle>
              <CardDescription className="text-slate-400">
                All debts and what you owe
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              className="bg-black hover:bg-slate-900"
              onClick={() => onOpenDebtDialog?.()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Liability
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Creditor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Loan Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Interest Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Original</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Current</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Min Payment</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Due Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {debts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      No debts yet. Track your liabilities to manage your financial obligations.
                    </td>
                  </tr>
                ) : (
                  debts.map(debt => (
                    <tr key={debt.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-4 px-4 text-base font-medium text-white">{debt.creditor}</td>
                      <td className="py-4 px-4 text-sm text-slate-400">{debt.loanType}</td>
                      <td className="py-4 px-4 text-base font-semibold text-red-400">{debt.interestRate.toFixed(2)}%</td>
                      <td className="py-4 px-4 text-sm text-slate-400">
                        {formatCurrency(debt.originalBalance)}
                      </td>
                      <td className="py-4 px-4 text-base font-semibold text-white">
                        {formatCurrency(debt.currentBalance)}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-400">
                        {formatCurrency(debt.minimumPayment)}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-400">{debt.dueDate}</td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-900/30"
                          onClick={() => deleteDebt(debt.id)}
                        >
                          <Trash2 className="h-5 w-5 text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
