// @ts-nocheck
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useFinance } from '@/lib/providers/finance-provider'
import { Calendar, Calculator, FileText } from 'lucide-react'
import { HeatmapComponent } from '../charts/heatmap-component'
import { generateSpendingHeatmap, calculateNetWorthProjection, calculateTaxSummary, formatCurrency, formatPercentage } from '@/lib/utils/finance-utils'
import { format } from 'date-fns'
import { LineChartComponent } from '../charts/line-chart-component'

export function AnalysisTab() {
  const { transactions, financialSummary, currentMonth } = useFinance()
  
  // Net Worth Projection State
  const [monthlySavings, setMonthlySavings] = useState(0)
  const [annualReturn, setAnnualReturn] = useState(7)
  const [yearsToProject, setYearsToProject] = useState(10)
  const [projection, setProjection] = useState<ReturnType<typeof calculateNetWorthProjection> | null>(null)
  
  const handleCalculateProjection = () => {
    const result = calculateNetWorthProjection(
      financialSummary?.netWorth || 0,
      monthlySavings,
      annualReturn,
      yearsToProject
    )
    setProjection(result)
  }
  
  const spendingHeatmap = generateSpendingHeatmap(transactions, currentMonth)
  const currentYear = new Date().getFullYear()
  const taxSummary = calculateTaxSummary(transactions, currentYear)
  
  // Generate projection chart data
  const projectionChartData = projection ? 
    Array.from({ length: Math.ceil(projection.years) + 1 }, (_, i) => {
      const year = i
      const monthsElapsed = year * 12
      const monthlyReturn = projection.annualReturn / 12 / 100
      
      // Conservative
      const conservative = projection.currentNetWorth + (projection.monthlySavings * monthsElapsed)
      
      // Expected
      let expected = projection.currentNetWorth
      for (let m = 0; m < monthsElapsed; m++) {
        expected = expected * (1 + monthlyReturn) + projection.monthlySavings
      }
      
      // Optimistic
      const optimisticReturn = (projection.annualReturn + 3) / 12 / 100
      let optimistic = projection.currentNetWorth
      for (let m = 0; m < monthsElapsed; m++) {
        optimistic = optimistic * (1 + optimisticReturn) + projection.monthlySavings
      }
      
      return {
        year: year.toString(),
        Conservative: Math.round(conservative),
        Expected: Math.round(expected),
        Optimistic: Math.round(optimistic)
      }
    }) : []
  
  return (
    <div className="space-y-6">
      {/* Spending Heatmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Spending Heatmap</CardTitle>
          </div>
          <CardDescription>
            {format(new Date(currentMonth + '-01'), 'MMMM yyyy')} - Daily spending patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HeatmapComponent data={spendingHeatmap} />
        </CardContent>
      </Card>
      
      {/* Net Worth Projection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <CardTitle>Net Worth Projection</CardTitle>
          </div>
          <CardDescription>
            Project your financial future based on savings and investment returns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlySavings">Monthly Savings</Label>
              <Input
                id="monthlySavings"
                type="number"
                placeholder="0"
                value={monthlySavings || ''}
                onChange={(e) => setMonthlySavings(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Avg: ${financialSummary?.monthlyCashFlow.toFixed(0) || 0}/mo</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualReturn">Annual Return (%)</Label>
              <Input
                id="annualReturn"
                type="number"
                placeholder="7"
                value={annualReturn || ''}
                onChange={(e) => setAnnualReturn(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">S&P 500 avg: ~10%</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="years">Years to Project</Label>
              <Input
                id="years"
                type="number"
                placeholder="10"
                value={yearsToProject || ''}
                onChange={(e) => setYearsToProject(Number(e.target.value))}
              />
            </div>
          </div>
          
          <Button onClick={handleCalculateProjection} className="w-full">
            Calculate Projection
          </Button>
          
          {projection && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Current Net Worth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(projection.currentNetWorth)}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Projected in {projection.years} Years</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(projection.projectedNetWorth)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">+{formatCurrency(projection.totalGrowth)}</p>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-4">Net Worth Scenarios</h4>
                <LineChartComponent
                  data={projectionChartData}
                  xKey="year"
                  lines={[
                    { key: 'Conservative', name: 'Conservative (No Returns)', color: '#ef4444' },
                    { key: 'Expected', name: `Expected (${annualReturn}% Return)`, color: '#3b82f6' },
                    { key: 'Optimistic', name: `Optimistic (${annualReturn + 3}% Return)`, color: '#10b981' }
                  ]}
                  height={350}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Conservative (No Returns)</p>
                  <p className="text-lg font-bold">{formatCurrency(projection.scenarios.conservative)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Expected ({annualReturn}% Return)</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(projection.scenarios.expected)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Optimistic ({annualReturn + 3}% Return)</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(projection.scenarios.optimistic)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tax Planning Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Tax Planning Dashboard</CardTitle>
          </div>
          <CardDescription>
            {currentYear} tax year estimates and deductions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Income (YTD)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(taxSummary.totalIncome)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Deductions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(taxSummary.totalDeductions)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Estimated Tax</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(taxSummary.estimatedTax)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Effective Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPercentage(taxSummary.effectiveRate)}</p>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Deductible Expense Categories</h4>
            <div className="space-y-2">
              {Object.entries(taxSummary.deductionsByCategory).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium">{category}</span>
                  <span className="font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-blue-600">💡</span>
              Tax Saving Opportunities
            </h4>
            <ul className="space-y-2">
              {taxSummary.savingOpportunities.map((opportunity, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>{opportunity}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

