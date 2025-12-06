'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, DollarSign } from 'lucide-react'

export function InvestmentCalculator() {
  const [initialInvestment, setInitialInvestment] = useState('')
  const [monthlyContribution, setMonthlyContribution] = useState('')
  const [annualReturn, setAnnualReturn] = useState('7')
  const [years, setYears] = useState('10')
  const [contributionTiming, setContributionTiming] = useState<'start' | 'end'>('end')
  const [result, setResult] = useState<{
    finalValue: number
    totalContributions: number
    totalInterest: number
    yearlyBreakdown: Array<{ year: number; balance: number; contributions: number; interest: number }>
  } | null>(null)

  const calculateInvestment = () => {
    if (!initialInvestment || !years) return

    const principal = parseFloat(initialInvestment)
    const monthly = parseFloat(monthlyContribution) || 0
    const rate = parseFloat(annualReturn) / 100
    const periods = parseInt(years)

    const yearlyData: Array<{ year: number; balance: number; contributions: number; interest: number }> = []
    let balance = principal
    let totalContributions = principal
    let totalInterest = 0

    for (let year = 1; year <= periods; year++) {
      const startBalance = balance
      const yearContributions = monthly * 12

      if (contributionTiming === 'start') {
        // Contributions at start of period
        balance += yearContributions
        balance *= (1 + rate)
      } else {
        // Contributions at end of period
        balance *= (1 + rate)
        balance += yearContributions
      }

      const yearInterest = balance - startBalance - yearContributions
      totalContributions += yearContributions
      totalInterest += yearInterest

      yearlyData.push({
        year,
        balance: Math.round(balance),
        contributions: Math.round(totalContributions),
        interest: Math.round(totalInterest)
      })
    }

    setResult({
      finalValue: Math.round(balance),
      totalContributions: Math.round(totalContributions),
      totalInterest: Math.round(totalInterest),
      yearlyBreakdown: yearlyData
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="initial">Initial Investment</Label>
          <Input
            id="initial"
            type="number"
            placeholder="e.g., 10000"
            value={initialInvestment}
            onChange={(e) => setInitialInvestment(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthly">Monthly Contribution</Label>
          <Input
            id="monthly"
            type="number"
            placeholder="e.g., 500"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="return">Expected Annual Return (%)</Label>
          <Input
            id="return"
            type="number"
            step="0.1"
            placeholder="e.g., 7"
            value={annualReturn}
            onChange={(e) => setAnnualReturn(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">S&P 500 average: ~10%</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="years">Investment Period (years)</Label>
          <Input
            id="years"
            type="number"
            placeholder="e.g., 10"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timing">Contribution Timing</Label>
          <Select value={contributionTiming} onValueChange={(value: 'start' | 'end') => setContributionTiming(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="end">End of Period (typical)</SelectItem>
              <SelectItem value="start">Start of Period</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={calculateInvestment} className="w-full">
        <TrendingUp className="mr-2 h-4 w-4" />
        Calculate Investment
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Investment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {formatCurrency(result.finalValue)}
                </div>
                <p className="text-muted-foreground">Final Portfolio Value</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(result.totalContributions)}</div>
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(result.totalInterest)}</div>
                  <p className="text-sm text-muted-foreground">Total Gains</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {((result.totalInterest / result.totalContributions) * 100).toFixed(1)}% Return
                  </div>
                  <p className="text-xs text-muted-foreground">on total investment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Year-by-Year Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {result.yearlyBreakdown.map((year) => (
                  <div key={year.year} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Year {year.year}</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(year.balance)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Contributions: {formatCurrency(year.contributions)}</div>
                      <div>Interest: {formatCurrency(year.interest)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Investment Strategies:</strong>
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Dollar-cost averaging: Invest consistently regardless of market conditions</li>
                <li>Diversification: Spread investments across different asset classes</li>
                <li>Long-term focus: Time in the market beats timing the market</li>
                <li>Rebalance annually: Maintain your target asset allocation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
