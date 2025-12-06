'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CreditCard, DollarSign, Calendar, Percent, TrendingDown } from 'lucide-react'

export default function CreditCardPayoffCalculator() {
  const [balance, setBalance] = useState('5000')
  const [interestRate, setInterestRate] = useState('18.99')
  const [monthlyPayment, setMonthlyPayment] = useState('200')
  const [result, setResult] = useState<{
    monthsToPayoff: number
    totalInterest: number
    totalPaid: number
    payoffDate: Date
    minimumPaymentWarning: boolean
  } | null>(null)

  const calculatePayoff = () => {
    const bal = parseFloat(balance)
    const rate = parseFloat(interestRate) / 100 / 12
    const payment = parseFloat(monthlyPayment)

    if (bal <= 0 || rate < 0 || payment <= 0) return

    // Check if payment covers minimum interest
    const minPayment = bal * rate
    if (payment <= minPayment) {
      setResult({
        monthsToPayoff: Infinity,
        totalInterest: Infinity,
        totalPaid: Infinity,
        payoffDate: new Date(),
        minimumPaymentWarning: true
      })
      return
    }

    let remainingBalance = bal
    let months = 0
    let totalInterest = 0
    const maxMonths = 600 // 50 years cap

    while (remainingBalance > 0.01 && months < maxMonths) {
      const interestCharge = remainingBalance * rate
      const principalPayment = payment - interestCharge
      
      if (principalPayment <= 0) break

      totalInterest += interestCharge
      remainingBalance -= principalPayment
      months++

      // If last payment
      if (remainingBalance < payment) {
        totalInterest += remainingBalance * rate
        months++
        remainingBalance = 0
      }
    }

    const totalPaid = bal + totalInterest
    const payoffDate = new Date()
    payoffDate.setMonth(payoffDate.getMonth() + months)

    setResult({
      monthsToPayoff: months,
      totalInterest,
      totalPaid,
      payoffDate,
      minimumPaymentWarning: false
    })
  }

  const getPayoffTimeColor = (months: number) => {
    if (months <= 12) return 'text-green-600'
    if (months <= 36) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <CreditCard className="mr-3 h-10 w-10 text-primary" />
          Credit Card Payoff Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate how long it will take to pay off your credit card debt
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Credit Card Details</CardTitle>
            <CardDescription>Enter your credit card information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Current Balance ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="balance"
                  type="number"
                  placeholder="5000"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Interest Rate (APR %)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  placeholder="18.99"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment">Monthly Payment ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="payment"
                  type="number"
                  placeholder="200"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button onClick={calculatePayoff} className="w-full">
              Calculate Payoff Time
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Payoff Results</CardTitle>
              <CardDescription>Your debt payoff timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.minimumPaymentWarning ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                    Warning: Payment Too Low
                  </p>
                  <p className="text-xs text-red-900 dark:text-red-300">
                    Your monthly payment doesn't cover the monthly interest. You need to pay more 
                    than ${(parseFloat(balance) * (parseFloat(interestRate) / 100 / 12)).toFixed(2)} per month 
                    to make progress on your debt.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Time to Pay Off</p>
                    <p className={`text-3xl font-bold ${getPayoffTimeColor(result.monthsToPayoff)}`}>
                      {result.monthsToPayoff} months
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ({Math.floor(result.monthsToPayoff / 12)} years, {result.monthsToPayoff % 12} months)
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Interest Paid</p>
                    <p className="text-3xl font-bold text-red-600">
                      ${result.totalInterest.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Amount Paid</p>
                    <p className="text-3xl font-bold text-primary">
                      ${result.totalPaid.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Payoff Date</p>
                    <p className="text-xl font-bold text-primary">
                      {result.payoffDate.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      <strong>Interest:</strong> ${result.totalInterest.toFixed(2)} 
                      ({((result.totalInterest / parseFloat(balance)) * 100).toFixed(1)}% of original balance)
                    </p>
                  </div>

                  {result.monthsToPayoff > 36 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs text-yellow-900 dark:text-yellow-300">
                        <strong>Tip:</strong> Consider increasing your monthly payment to pay off 
                        your debt faster and save on interest charges.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Debt Payoff Strategies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Pay More Than Minimum:</strong> Always pay more than the minimum payment to 
            reduce principal faster and save on interest.
          </p>
          <p>
            <strong>Avalanche Method:</strong> Pay off cards with highest interest rates first 
            while making minimum payments on others.
          </p>
          <p>
            <strong>Snowball Method:</strong> Pay off smallest balances first for psychological wins, 
            then roll those payments into larger debts.
          </p>
          <p>
            <strong>Balance Transfer:</strong> Consider transferring to a card with 0% intro APR 
            to save on interest (watch for fees).
          </p>
          <p>
            <strong>Stop Using the Card:</strong> Avoid adding new charges while paying off debt.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}






