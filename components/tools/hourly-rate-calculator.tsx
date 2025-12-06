'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Clock, DollarSign } from 'lucide-react'

export function HourlyRateCalculator() {
  const [desiredSalary, setDesiredSalary] = useState('')
  const [billableHours, setBillableHours] = useState('1500')
  const [overhead, setOverhead] = useState('30')
  const [profitMargin, setProfitMargin] = useState('20')
  const [result, setResult] = useState<{
    minimumRate: number
    targetRate: number
    premiumRate: number
    annualRevenue: number
  } | null>(null)

  const calculateRate = () => {
    if (!desiredSalary || !billableHours) return

    const salary = parseFloat(desiredSalary)
    const hours = parseFloat(billableHours)
    const overheadPercent = parseFloat(overhead) / 100
    const profitPercent = parseFloat(profitMargin) / 100

    // Base hourly rate (just to cover salary)
    const baseRate = salary / hours

    // Rate with overhead
    const rateWithOverhead = baseRate * (1 + overheadPercent)

    // Rate with overhead + profit
    const targetRate = rateWithOverhead * (1 + profitPercent)

    // Premium rate (1.5x target)
    const premiumRate = targetRate * 1.5

    const annualRevenue = targetRate * hours

    setResult({
      minimumRate: Math.round(baseRate),
      targetRate: Math.round(targetRate),
      premiumRate: Math.round(premiumRate),
      annualRevenue: Math.round(annualRevenue)
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
          <Label htmlFor="salary">Desired Annual Salary</Label>
          <Input
            id="salary"
            type="number"
            placeholder="e.g., 80000"
            value={desiredSalary}
            onChange={(e) => setDesiredSalary(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">What you want to take home</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours">Billable Hours/Year</Label>
          <Input
            id="hours"
            type="number"
            placeholder="e.g., 1500"
            value={billableHours}
            onChange={(e) => setBillableHours(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Typical: 1500-1800 hours</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="overhead">Overhead (%)</Label>
          <Input
            id="overhead"
            type="number"
            placeholder="e.g., 30"
            value={overhead}
            onChange={(e) => setOverhead(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Software, office, insurance, etc.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profit">Profit Margin (%)</Label>
          <Input
            id="profit"
            type="number"
            placeholder="e.g., 20"
            value={profitMargin}
            onChange={(e) => setProfitMargin(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Business growth & savings</p>
        </div>
      </div>

      <Button onClick={calculateRate} className="w-full">
        <Clock className="mr-2 h-4 w-4" />
        Calculate Hourly Rate
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Recommended Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center pb-4 border-b">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {formatCurrency(result.targetRate)}/hr
                </div>
                <p className="text-muted-foreground">Target Hourly Rate</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{formatCurrency(result.minimumRate)}</div>
                  <p className="text-xs text-muted-foreground">Minimum (Break-even)</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{formatCurrency(result.targetRate)}</div>
                  <p className="text-xs text-muted-foreground">Target (Recommended)</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{formatCurrency(result.premiumRate)}</div>
                  <p className="text-xs text-muted-foreground">Premium (Specialized)</p>
                </div>
              </div>

              <div className="pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground mb-2">Annual Revenue at Target Rate</p>
                <div className="text-3xl font-bold text-green-600">{formatCurrency(result.annualRevenue)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
              <p><strong>Pricing Strategy:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Start with target rate for standard projects</li>
                <li>Use minimum rate only for long-term contracts with guaranteed hours</li>
                <li>Charge premium rate for rush jobs, specialized work, or difficult clients</li>
                <li>Consider value-based pricing for high-impact projects</li>
                <li>Review and adjust rates annually or semi-annually</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
