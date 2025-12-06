'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CreditCard, TrendingDown, Calendar, DollarSign } from 'lucide-react'

export function DebtPayoffCalculator() {
  const [debtAmount, setDebtAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [monthlyPayment, setMonthlyPayment] = useState('')
  const [minPayment, setMinPayment] = useState('')
  const [result, setResult] = useState<{
    monthsToPayoff: number
    totalInterest: number
    totalPaid: number
    payoffDate: Date
    monthsSaved: number
    interestSaved: number
  } | null>(null)

  const calculatePayoff = () => {
    const debt = parseFloat(debtAmount)
    const rate = parseFloat(interestRate) / 100 / 12 // monthly rate
    const payment = parseFloat(monthlyPayment)
    const minimum = parseFloat(minPayment) || payment

    if (!debt || !rate || !payment) return

    // Calculate with current payment
    let balance = debt
    let months = 0
    let totalInterest = 0

    while (balance > 0 && months < 600) {
      // cap at 50 years
      const interest = balance * rate
      const principal = payment - interest
      if (principal <= 0) break // payment too low

      balance -= principal
      totalInterest += interest
      months++
    }

    // Calculate with minimum payment
    let minBalance = debt
    let minMonths = 0
    let minTotalInterest = 0

    while (minBalance > 0 && minMonths < 600) {
      const interest = minBalance * rate
      const principal = minimum - interest
      if (principal <= 0) break

      minBalance -= principal
      minTotalInterest += interest
      minMonths++
    }

    const payoffDate = new Date()
    payoffDate.setMonth(payoffDate.getMonth() + months)

    setResult({
      monthsToPayoff: months,
      totalInterest,
      totalPaid: debt + totalInterest,
      payoffDate,
      monthsSaved: minMonths - months,
      interestSaved: minTotalInterest - totalInterest,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-red-500" />
            Debt Payoff Calculator
          </CardTitle>
          <CardDescription>
            Calculate how quickly you can pay off debt and how much interest you'll save
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debtAmount">Total Debt Amount ($)</Label>
              <Input
                id="debtAmount"
                type="number"
                placeholder="10000"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                placeholder="18.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyPayment">Your Monthly Payment ($)</Label>
              <Input
                id="monthlyPayment"
                type="number"
                placeholder="300"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Amount you plan to pay each month
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPayment">Minimum Payment ($)</Label>
              <Input
                id="minPayment"
                type="number"
                placeholder="150"
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum required payment (for comparison)
              </p>
            </div>
          </div>

          <Button onClick={calculatePayoff} className="w-full">
            Calculate Payoff Plan
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle>Your Debt Payoff Plan</CardTitle>
              <CardDescription>
                With ${parseFloat(monthlyPayment).toLocaleString()}/month payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Time to Payoff</p>
                  </div>
                  <p className="text-3xl font-bold text-primary">
                    {Math.floor(result.monthsToPayoff / 12)}y {result.monthsToPayoff % 12}m
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.monthsToPayoff} months total
                  </p>
                </div>

                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-muted-foreground">Payoff Date</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.payoffDate.toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.payoffDate.toLocaleDateString()}
                  </p>
                </div>

                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <p className="text-sm text-muted-foreground">Total Interest</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ${result.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Interest you'll pay
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${result.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Debt + interest
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {minPayment && result.monthsSaved > 0 && (
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-lg">💰 Savings by Paying Extra</CardTitle>
                <CardDescription>
                  By paying ${parseFloat(monthlyPayment).toLocaleString()} instead of ${parseFloat(minPayment).toLocaleString()} minimum
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Time Saved</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {Math.floor(result.monthsSaved / 12)} years {result.monthsSaved % 12} months
                    </p>
                  </div>

                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground">Interest Saved</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      ${result.interestSaved.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  You're saving <strong>${((parseFloat(monthlyPayment) - parseFloat(minPayment)) * result.monthsToPayoff).toLocaleString()}</strong> in extra payments,
                  but avoiding <strong>${result.interestSaved.toLocaleString()}</strong> in interest!
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="text-base">Debt Payoff Strategies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <strong>Debt Avalanche:</strong> Pay minimums on all debts, put extra toward highest interest rate first
              </div>
              <div>
                <strong>Debt Snowball:</strong> Pay minimums on all debts, put extra toward smallest balance first (motivational wins)
              </div>
              <div>
                <strong>Tips:</strong>
                <ul className="list-disc ml-5 mt-1 space-y-1 text-muted-foreground">
                  <li>Always pay at least the minimum to avoid penalties</li>
                  <li>Round up payments when possible (e.g., pay $305 instead of $300)</li>
                  <li>Use windfalls (bonuses, tax refunds) for extra payments</li>
                  <li>Consider balance transfer cards for high-interest debt</li>
                  <li>Track progress monthly to stay motivated</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}







