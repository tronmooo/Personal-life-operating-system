'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Flame, DollarSign, Calendar, TrendingUp } from 'lucide-react'

export default function FIRECalculator() {
  const [annualExpenses, setAnnualExpenses] = useState('40000')
  const [currentSavings, setCurrentSavings] = useState('50000')
  const [annualSavings, setAnnualSavings] = useState('20000')
  const [returnRate, setReturnRate] = useState('7')
  const [withdrawalRate, setWithdrawalRate] = useState('4')
  
  const [result, setResult] = useState<{
    fireNumber: number
    yearsToFIRE: number
    fireAge: number
    currentAge: number
  } | null>(null)

  const calculateFIRE = () => {
    const expenses = parseFloat(annualExpenses)
    const savings = parseFloat(currentSavings)
    const annual = parseFloat(annualSavings)
    const returns = parseFloat(returnRate) / 100
    const withdrawal = parseFloat(withdrawalRate) / 100

    if (expenses <= 0 || withdrawal <= 0) return

    // Calculate FIRE number (25x annual expenses is common, but use withdrawal rate)
    const fireNumber = expenses / withdrawal

    // Calculate years to FIRE with compound growth
    let currentAmount = savings
    let years = 0
    const maxYears = 100

    while (currentAmount < fireNumber && years < maxYears) {
      currentAmount = currentAmount * (1 + returns) + annual
      years++
    }

    const currentAge = 30 // Default, could be made an input
    const fireAge = currentAge + years

    setResult({
      fireNumber,
      yearsToFIRE: years,
      fireAge,
      currentAge
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <Flame className="mr-3 h-10 w-10 text-orange-500" />
          FIRE Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate when you can achieve Financial Independence, Retire Early (FIRE)
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>FIRE Parameters</CardTitle>
            <CardDescription>Enter your financial information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expenses">Annual Expenses ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expenses"
                  type="number"
                  placeholder="40000"
                  value={annualExpenses}
                  onChange={(e) => setAnnualExpenses(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your expected annual spending in retirement
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="savings">Current Savings ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="savings"
                  type="number"
                  placeholder="50000"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annual">Annual Savings ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="annual"
                  type="number"
                  placeholder="20000"
                  value={annualSavings}
                  onChange={(e) => setAnnualSavings(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                How much you save each year
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="return">Expected Return Rate (%)</Label>
              <Input
                id="return"
                type="number"
                step="0.1"
                placeholder="7"
                value={returnRate}
                onChange={(e) => setReturnRate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Average annual investment return
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawal">Safe Withdrawal Rate (%)</Label>
              <Input
                id="withdrawal"
                type="number"
                step="0.1"
                placeholder="4"
                value={withdrawalRate}
                onChange={(e) => setWithdrawalRate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                4% is the traditional "safe" rate
              </p>
            </div>

            <Button onClick={calculateFIRE} className="w-full">
              Calculate FIRE Timeline
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Your FIRE Plan</CardTitle>
              <CardDescription>Path to financial independence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-muted-foreground mb-1">Your FIRE Number</p>
                <p className="text-4xl font-bold text-orange-600">
                  ${result.fireNumber.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Amount needed to retire safely
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Years to FIRE</p>
                <p className="text-3xl font-bold text-primary">
                  {result.yearsToFIRE} years
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">FIRE Age</p>
                <p className="text-3xl font-bold text-primary">
                  {result.fireAge} years old
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  (Assuming current age: {result.currentAge})
                </p>
              </div>

              <div className="pt-4 border-t space-y-3">
                <p className="text-sm">
                  <strong>Monthly Retirement Income:</strong> ${(parseFloat(annualExpenses) / 12).toLocaleString()}
                </p>
                <p className="text-sm">
                  <strong>Savings Rate:</strong> {((parseFloat(annualSavings) / (parseFloat(annualExpenses) + parseFloat(annualSavings))) * 100).toFixed(1)}%
                </p>
              </div>

              {result.yearsToFIRE > 30 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-900 dark:text-yellow-300">
                    <strong>Consider:</strong> Increasing your savings rate or reducing expenses 
                    to reach FIRE sooner.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Understanding FIRE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>FIRE Number:</strong> The amount of money you need to retire. Calculated as 
            annual expenses divided by safe withdrawal rate (typically 25x annual expenses for 4% rule).
          </p>
          <p>
            <strong>4% Rule:</strong> The traditional safe withdrawal rate suggests withdrawing 
            4% of your portfolio annually, which historically has sustained retirement for 30+ years.
          </p>
          <p>
            <strong>Savings Rate:</strong> The percentage of your income you save is the biggest 
            factor in reaching FIRE. Higher savings rate = faster FIRE.
          </p>
          <p>
            <strong>Types of FIRE:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li><strong>Lean FIRE:</strong> Retire with minimal expenses</li>
            <li><strong>Fat FIRE:</strong> Retire with luxury lifestyle</li>
            <li><strong>Barista FIRE:</strong> Part-time work covers some expenses</li>
            <li><strong>Coast FIRE:</strong> Save enough early, then coast to retirement</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}






