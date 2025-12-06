'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TrendingUp, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function ROICalculator() {
  const [initialInvestment, setInitialInvestment] = useState('')
  const [finalValue, setFinalValue] = useState('')
  const [additionalCosts, setAdditionalCosts] = useState('')
  const [timeHeld, setTimeHeld] = useState('')
  const [result, setResult] = useState<{
    roi: number
    gain: number
    annualizedROI: number
    totalReturn: number
    percentGain: number
  } | null>(null)

  const calculateROI = () => {
    const initial = parseFloat(initialInvestment)
    const final = parseFloat(finalValue)
    const costs = parseFloat(additionalCosts) || 0
    const years = parseFloat(timeHeld)

    if (!initial || !final) return

    const totalInvestment = initial + costs
    const gain = final - totalInvestment
    const roi = (gain / totalInvestment) * 100
    const percentGain = ((final - initial) / initial) * 100

    // Calculate annualized ROI
    let annualizedROI = 0
    if (years > 0) {
      annualizedROI = (Math.pow((final / totalInvestment), (1 / years)) - 1) * 100
    }

    setResult({
      roi,
      gain,
      annualizedROI,
      totalReturn: final,
      percentGain,
    })
  }

  const getRatingadge = (roi: number) => {
    if (roi < 0) return { label: 'Loss', variant: 'destructive' as const }
    if (roi < 5) return { label: 'Poor', variant: 'outline' as const }
    if (roi < 10) return { label: 'Fair', variant: 'outline' as const }
    if (roi < 15) return { label: 'Good', variant: 'default' as const }
    if (roi < 25) return { label: 'Very Good', variant: 'default' as const }
    return { label: 'Excellent', variant: 'default' as const }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            ROI Calculator
          </CardTitle>
          <CardDescription>
            Calculate Return on Investment for stocks, real estate, or any investment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialInvestment">Initial Investment ($)</Label>
              <Input
                id="initialInvestment"
                type="number"
                placeholder="10000"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalValue">Current/Final Value ($)</Label>
              <Input
                id="finalValue"
                type="number"
                placeholder="15000"
                value={finalValue}
                onChange={(e) => setFinalValue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalCosts">Additional Costs ($)</Label>
              <Input
                id="additionalCosts"
                type="number"
                placeholder="500"
                value={additionalCosts}
                onChange={(e) => setAdditionalCosts(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Fees, commissions, maintenance, etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeHeld">Time Held (years)</Label>
              <Input
                id="timeHeld"
                type="number"
                step="0.1"
                placeholder="3"
                value={timeHeld}
                onChange={(e) => setTimeHeld(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                For annualized ROI calculation
              </p>
            </div>
          </div>

          <Button onClick={calculateROI} className="w-full">
            Calculate ROI
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card className={`border-${result.roi >= 0 ? 'green' : 'red'}-500/50`}>
            <CardHeader>
              <CardTitle>Investment Returns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-primary/10 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <p className="text-sm text-muted-foreground">Return on Investment (ROI)</p>
                  <Badge {...getRatingadge(result.roi)}>
                    {getRatingadge(result.roi).label}
                  </Badge>
                </div>
                <p className={`text-5xl font-bold ${result.roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {result.roi.toFixed(2)}%
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 ${result.gain >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} rounded-lg border`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className={`h-4 w-4 ${result.gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                    <p className="text-sm text-muted-foreground">Net Gain/Loss</p>
                  </div>
                  <p className={`text-2xl font-bold ${result.gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {result.gain >= 0 ? '+' : ''}${result.gain.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-muted-foreground">Annualized ROI</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.annualizedROI > 0 ? result.annualizedROI.toFixed(2) : 'N/A'}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Per year</p>
                </div>

                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <p className="text-sm text-muted-foreground">Total Return</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ${result.totalReturn.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Initial + Costs</p>
                  <p className="text-lg font-bold">
                    ${(parseFloat(initialInvestment) + (parseFloat(additionalCosts) || 0)).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Percent Gain</p>
                  <p className={`text-lg font-bold ${result.percentGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {result.percentGain >= 0 ? '+' : ''}{result.percentGain.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="text-base">ROI Benchmarks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>S&P 500 Average (annualized):</span>
                <span className="font-bold">~10%</span>
              </div>
              <div className="flex justify-between">
                <span>Real Estate Average:</span>
                <span className="font-bold">8-12%</span>
              </div>
              <div className="flex justify-between">
                <span>High-Yield Savings:</span>
                <span className="font-bold">1-5%</span>
              </div>
              <div className="flex justify-between">
                <span>Inflation Average:</span>
                <span className="font-bold">~3%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Your annualized ROI should beat inflation to grow wealth in real terms.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}







