'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TrendingUp, DollarSign, Calendar } from 'lucide-react'

export default function PaybackPeriodCalculator() {
  const [initialInvestment, setInitialInvestment] = useState('50000')
  const [annualCashFlow, setAnnualCashFlow] = useState('12000')
  
  const [result, setResult] = useState<{
    paybackPeriod: number
    years: number
    months: number
  } | null>(null)

  const calculate = () => {
    const investment = parseFloat(initialInvestment)
    const cashFlow = parseFloat(annualCashFlow)

    if (investment <= 0 || cashFlow <= 0) return

    const paybackPeriod = investment / cashFlow
    const years = Math.floor(paybackPeriod)
    const months = Math.round((paybackPeriod - years) * 12)

    setResult({
      paybackPeriod,
      years,
      months
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <TrendingUp className="mr-3 h-10 w-10 text-primary" />
          Payback Period Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate how long it takes to recover your investment
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
              <Label htmlFor="investment">Initial Investment ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="investment"
                  type="number"
                  value={initialInvestment}
                  onChange={(e) => setInitialInvestment(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashflow">Annual Cash Flow ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cashflow"
                  type="number"
                  value={annualCashFlow}
                  onChange={(e) => setAnnualCashFlow(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Net annual profit or savings from investment
              </p>
            </div>

            <Button onClick={calculate} className="w-full">
              Calculate Payback Period
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Time to recover investment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Payback Period</p>
                <p className="text-5xl font-bold text-green-600">
                  {result.paybackPeriod.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">years</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Time to Break Even</p>
                <p className="text-2xl font-bold text-primary">
                  {result.years} years, {result.months} months
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-900 dark:text-blue-300">
                  <strong>Note:</strong> Shorter payback periods indicate faster investment recovery. 
                  This calculation doesn't account for time value of money or changing cash flows.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Understanding Payback Period</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Payback Period</strong> = Initial Investment ÷ Annual Cash Flow
          </p>
          <p>
            A shorter payback period is generally better, indicating you'll recover your 
            investment faster and reduce risk.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}






