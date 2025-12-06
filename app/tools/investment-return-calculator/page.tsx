'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TrendingUp, DollarSign, Calendar, Percent } from 'lucide-react'

export default function InvestmentReturnCalculator() {
  const [initialInvestment, setInitialInvestment] = useState('10000')
  const [finalValue, setFinalValue] = useState('15000')
  const [timeYears, setTimeYears] = useState('5')
  const [result, setResult] = useState<{
    totalReturn: number
    totalReturnPercentage: number
    annualizedReturn: number
    profitLoss: number
  } | null>(null)

  const calculateReturn = () => {
    const initial = parseFloat(initialInvestment)
    const final = parseFloat(finalValue)
    const years = parseFloat(timeYears)

    if (initial <= 0 || final <= 0 || years <= 0) return

    const profitLoss = final - initial
    const totalReturnPercentage = ((final - initial) / initial) * 100
    const annualizedReturn = (Math.pow(final / initial, 1 / years) - 1) * 100

    setResult({
      totalReturn: final,
      totalReturnPercentage,
      annualizedReturn,
      profitLoss,
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <TrendingUp className="mr-3 h-10 w-10 text-primary" />
          Investment Return Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate your investment returns, profit/loss, and annualized return rate
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Investment Details</CardTitle>
            <CardDescription>Enter your investment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initial">Initial Investment ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="initial"
                  type="number"
                  placeholder="10000"
                  value={initialInvestment}
                  onChange={(e) => setInitialInvestment(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="final">Final Value ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="final"
                  type="number"
                  placeholder="15000"
                  value={finalValue}
                  onChange={(e) => setFinalValue(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="years">Time Period (Years)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="years"
                  type="number"
                  placeholder="5"
                  value={timeYears}
                  onChange={(e) => setTimeYears(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button onClick={calculateReturn} className="w-full">
              Calculate Return
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Your Results</CardTitle>
              <CardDescription>Investment performance summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Profit/Loss</p>
                  <p className={`text-2xl font-bold ${result.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {result.profitLoss >= 0 ? '+' : ''}${result.profitLoss.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Return</p>
                  <p className={`text-2xl font-bold ${result.totalReturnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {result.totalReturnPercentage >= 0 ? '+' : ''}{result.totalReturnPercentage.toFixed(2)}%
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Annualized Return</p>
                  <p className={`text-2xl font-bold ${result.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {result.annualizedReturn >= 0 ? '+' : ''}{result.annualizedReturn.toFixed(2)}% per year
                  </p>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Initial Investment:</span>
                    <span className="font-medium">${parseFloat(initialInvestment).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Final Value:</span>
                    <span className="font-medium">${parseFloat(finalValue).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time Period:</span>
                    <span className="font-medium">{timeYears} years</span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-900 dark:text-blue-300">
                    <strong>Annualized Return</strong> shows your average yearly return rate, 
                    which is more accurate for comparing investments over different time periods.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Understanding Investment Returns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Total Return:</strong> The overall percentage gain or loss on your investment.
          </p>
          <p>
            <strong>Annualized Return:</strong> Your average annual return rate, calculated using compound growth. 
            This is the rate you'd need each year to go from initial investment to final value.
          </p>
          <p>
            <strong>Profit/Loss:</strong> The absolute dollar amount you gained or lost.
          </p>
          <p className="text-xs pt-2 border-t">
            <strong>Note:</strong> This calculator doesn't account for taxes, fees, or inflation. 
            Your actual returns may differ.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}






