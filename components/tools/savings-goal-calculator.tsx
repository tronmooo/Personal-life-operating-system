'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Target, TrendingUp, Calendar, DollarSign } from 'lucide-react'

export function SavingsGoalCalculator() {
  const [goalAmount, setGoalAmount] = useState('')
  const [currentSavings, setCurrentSavings] = useState('')
  const [monthlyDeposit, setMonthlyDeposit] = useState('')
  const [interestRate, setInterestRate] = useState('1')
  const [targetDate, setTargetDate] = useState('')
  const [result, setResult] = useState<{
    monthsToGoal: number
    totalDeposits: number
    interestEarned: number
    finalAmount: number
    requiredMonthly?: number
  } | null>(null)

  const calculateGoal = () => {
    const goal = parseFloat(goalAmount)
    const current = parseFloat(currentSavings) || 0
    const monthly = parseFloat(monthlyDeposit)
    const rate = parseFloat(interestRate) / 100 / 12

    if (!goal) return

    // If monthly deposit is provided, calculate time to goal
    if (monthly > 0) {
      let balance = current
      let months = 0
      let totalInterest = 0

      while (balance < goal && months < 1200) { // cap at 100 years
        const interest = balance * rate
        balance += monthly + interest
        totalInterest += interest
        months++
      }

      setResult({
        monthsToGoal: months,
        totalDeposits: monthly * months,
        interestEarned: totalInterest,
        finalAmount: balance,
      })
    }
    // If target date is provided, calculate required monthly
    else if (targetDate) {
      const target = new Date(targetDate)
      const now = new Date()
      const monthsDiff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())

      if (monthsDiff > 0) {
        const remaining = goal - current
        // Use future value of annuity formula to calculate required monthly payment
        const requiredMonthly = remaining / ((Math.pow(1 + rate, monthsDiff) - 1) / rate)

        let balance = current
        let totalDeposits = 0
        let totalInterest = 0

        for (let i = 0; i < monthsDiff; i++) {
          const interest = balance * rate
          balance += requiredMonthly + interest
          totalDeposits += requiredMonthly
          totalInterest += interest
        }

        setResult({
          monthsToGoal: monthsDiff,
          totalDeposits,
          interestEarned: totalInterest,
          finalAmount: balance,
          requiredMonthly,
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-purple-500" />
            Savings Goal Calculator
          </CardTitle>
          <CardDescription>
            Calculate how to reach your savings goals with regular deposits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goalAmount">Savings Goal ($)</Label>
              <Input
                id="goalAmount"
                type="number"
                placeholder="20000"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentSavings">Current Savings ($)</Label>
              <Input
                id="currentSavings"
                type="number"
                placeholder="5000"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyDeposit">Monthly Deposit ($)</Label>
              <Input
                id="monthlyDeposit"
                type="number"
                placeholder="500"
                value={monthlyDeposit}
                onChange={(e) => setMonthlyDeposit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to calculate required monthly deposit
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                placeholder="1.0"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="targetDate">Target Date (optional)</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Set a date if you want to calculate required monthly deposit
              </p>
            </div>
          </div>

          <Button onClick={calculateGoal} className="w-full">
            Calculate Savings Plan
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle>Your Savings Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Time to Goal</p>
                  </div>
                  <p className="text-3xl font-bold text-primary">
                    {Math.floor(result.monthsToGoal / 12)}y {result.monthsToGoal % 12}m
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.monthsToGoal} months total
                  </p>
                </div>

                {result.requiredMonthly !== undefined && (
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm text-muted-foreground">Required Monthly</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      ${result.requiredMonthly.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      To reach goal by {targetDate}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-muted-foreground">Interest Earned</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${result.interestEarned.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Free money from interest
                  </p>
                </div>

                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <p className="text-sm text-muted-foreground">Total Deposits</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ${result.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your contributions
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Final Amount</p>
                <p className="text-4xl font-bold text-primary">
                  ${result.finalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="text-base">Savings Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <strong>Automate your savings:</strong> Set up automatic transfers on payday
              </div>
              <div>
                <strong>High-yield savings:</strong> Use a high-yield savings account for better interest
              </div>
              <div>
                <strong>Pay yourself first:</strong> Save before spending on discretionary items
              </div>
              <div>
                <strong>Track progress:</strong> Review monthly to stay motivated
              </div>
              <div>
                <strong>Boost with windfalls:</strong> Add bonuses, tax refunds, or extra income
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}







