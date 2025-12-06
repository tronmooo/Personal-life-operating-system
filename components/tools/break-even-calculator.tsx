'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TrendingUp, Target } from 'lucide-react'

export function BreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = useState('')
  const [variableCostPerUnit, setVariableCostPerUnit] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [result, setResult] = useState<{
    breakEvenUnits: number
    breakEvenRevenue: number
    contributionMargin: number
    contributionMarginRatio: number
  } | null>(null)

  const calculateBreakEven = () => {
    if (!fixedCosts || !variableCostPerUnit || !pricePerUnit) return

    const fixed = parseFloat(fixedCosts)
    const variableCost = parseFloat(variableCostPerUnit)
    const price = parseFloat(pricePerUnit)

    if (price <= variableCost) {
      alert('Price must be greater than variable cost per unit')
      return
    }

    const contributionMargin = price - variableCost
    const contributionMarginRatio = (contributionMargin / price) * 100
    const breakEvenUnits = Math.ceil(fixed / contributionMargin)
    const breakEvenRevenue = breakEvenUnits * price

    setResult({
      breakEvenUnits,
      breakEvenRevenue,
      contributionMargin,
      contributionMarginRatio
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
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="fixed">Fixed Costs (Monthly)</Label>
          <Input
            id="fixed"
            type="number"
            placeholder="e.g., 10000"
            value={fixedCosts}
            onChange={(e) => setFixedCosts(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Rent, salaries, insurance, utilities, etc.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="variable">Variable Cost Per Unit</Label>
          <Input
            id="variable"
            type="number"
            placeholder="e.g., 25"
            value={variableCostPerUnit}
            onChange={(e) => setVariableCostPerUnit(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Materials, labor, etc.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price Per Unit</Label>
          <Input
            id="price"
            type="number"
            placeholder="e.g., 50"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Selling price</p>
        </div>
      </div>

      <Button onClick={calculateBreakEven} className="w-full">
        <Target className="mr-2 h-4 w-4" />
        Calculate Break-Even Point
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Break-Even Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center pb-4 border-b">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {result.breakEvenUnits.toLocaleString()}
                </div>
                <p className="text-muted-foreground">Units to Break Even</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(result.breakEvenRevenue)}
                  </div>
                  <p className="text-sm text-muted-foreground">Break-Even Revenue</p>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(result.contributionMargin)}
                  </div>
                  <p className="text-sm text-muted-foreground">Contribution Margin</p>
                </div>
              </div>

              <div className="pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground mb-2">Contribution Margin Ratio</p>
                <div className="text-3xl font-bold text-green-600">
                  {result.contributionMarginRatio.toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Per Unit Economics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>Selling Price</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(pricePerUnit))}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span>Variable Cost</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(parseFloat(variableCostPerUnit))}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200">
                  <span className="font-semibold">Contribution per Unit</span>
                  <span className="font-bold text-green-600">{formatCurrency(result.contributionMargin)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
              <p><strong>Key Insights:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>You need to sell {result.breakEvenUnits.toLocaleString()} units to cover all costs</li>
                <li>Each unit sold contributes {formatCurrency(result.contributionMargin)} toward fixed costs</li>
                <li>After break-even, each unit sold is {formatCurrency(result.contributionMargin)} profit</li>
                <li>Target at least 20-30% above break-even for a healthy business</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
