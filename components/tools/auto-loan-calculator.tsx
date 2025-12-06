'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Car, DollarSign } from 'lucide-react'

export function AutoLoanCalculator() {
  const [carPrice, setCarPrice] = useState<string>('')
  const [downPayment, setDownPayment] = useState<string>('')
  const [interestRate, setInterestRate] = useState<string>('6.5')
  const [loanTerm, setLoanTerm] = useState<string>('60')
  const [tradeIn, setTradeIn] = useState<string>('')
  const [result, setResult] = useState<any>(null)

  const calculate = () => {
    const price = parseFloat(carPrice) || 0
    const down = parseFloat(downPayment) || 0
    const trade = parseFloat(tradeIn) || 0
    const rate = parseFloat(interestRate) / 100 / 12
    const months = parseFloat(loanTerm) || 60

    const loanAmount = price - down - trade
    const monthlyPayment = loanAmount * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1)
    const totalPaid = monthlyPayment * months
    const totalInterest = totalPaid - loanAmount

    setResult({
      loanAmount,
      monthlyPayment,
      totalPaid,
      totalInterest,
      totalCost: totalPaid + down + trade
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Car className="h-8 w-8 text-blue-500" />
          Auto Loan Calculator
        </h1>
        <p className="text-muted-foreground mt-2">
          Calculate your monthly car loan payments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Car Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={carPrice}
                  onChange={(e) => setCarPrice(e.target.value)}
                  className="pl-10"
                  placeholder="30000"
                />
              </div>
            </div>

            <div>
              <Label>Down Payment</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  className="pl-10"
                  placeholder="5000"
                />
              </div>
            </div>

            <div>
              <Label>Trade-In Value</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={tradeIn}
                  onChange={(e) => setTradeIn(e.target.value)}
                  className="pl-10"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label>Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="6.5"
              />
            </div>

            <div>
              <Label>Loan Term (months)</Label>
              <select
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="36">36 months (3 years)</option>
                <option value="48">48 months (4 years)</option>
                <option value="60">60 months (5 years)</option>
                <option value="72">72 months (6 years)</option>
                <option value="84">84 months (7 years)</option>
              </select>
            </div>

            <Button onClick={calculate} className="w-full">
              <Car className="h-4 w-4 mr-2" />
              Calculate Payment
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle>Your Auto Loan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-lg bg-blue-50 dark:bg-blue-950 text-center">
                <div className="text-sm text-muted-foreground mb-1">Monthly Payment</div>
                <div className="text-4xl font-bold text-blue-600">
                  ${result.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Loan Amount</span>
                  <span className="font-medium">${result.loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Interest</span>
                  <span className="font-medium text-red-600">${result.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Paid</span>
                  <span className="font-medium">${result.totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between pb-2 border-b font-bold">
                  <span>Total Cost of Car</span>
                  <span className="text-lg">${result.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
