'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Home, DollarSign, TrendingUp } from 'lucide-react'

export function HomeAffordability() {
  const [annualIncome, setAnnualIncome] = useState<string>('')
  const [monthlyDebts, setMonthlyDebts] = useState<string>('')
  const [downPayment, setDownPayment] = useState<string>('')
  const [interestRate, setInterestRate] = useState<string>('7')
  const [result, setResult] = useState<any>(null)

  const calculate = () => {
    const income = parseFloat(annualIncome) || 0
    const debts = parseFloat(monthlyDebts) || 0
    const down = parseFloat(downPayment) || 0
    const rate = parseFloat(interestRate) / 100 / 12

    // Calculate maximum monthly payment (28% of gross monthly income - front-end ratio)
    const monthlyIncome = income / 12
    const maxMonthlyPayment = monthlyIncome * 0.28

    // Calculate using back-end ratio (36% of monthly income - all debts)
    const maxTotalDebt = monthlyIncome * 0.36
    const maxMonthlyPaymentBackEnd = maxTotalDebt - debts

    // Use the more conservative estimate
    const maxPayment = Math.min(maxMonthlyPayment, maxMonthlyPaymentBackEnd)

    // Assume property tax (1.2%) + insurance (0.5%) + HOA ($200)
    const monthlyEscrow = 200 // Simplified HOA estimate
    const availableForPrincipalInterest = maxPayment - monthlyEscrow

    // Calculate maximum loan amount using mortgage formula
    // M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
    // Solving for P: P = M * [ (1 + i)^n – 1 ] / [ i(1 + i)^n ]
    const n = 30 * 12 // 30 years
    const maxLoanAmount = availableForPrincipalInterest * ((Math.pow(1 + rate, n) - 1) / (rate * Math.pow(1 + rate, n)))

    const maxHomePrice = maxLoanAmount + down
    const estimatedPropertyTax = (maxHomePrice * 0.012) / 12
    const estimatedInsurance = (maxHomePrice * 0.005) / 12
    const totalMonthlyPayment = availableForPrincipalInterest + estimatedPropertyTax + estimatedInsurance + monthlyEscrow

    setResult({
      maxHomePrice,
      maxLoanAmount,
      downPayment: down,
      monthlyPayment: totalMonthlyPayment,
      principalInterest: availableForPrincipalInterest,
      propertyTax: estimatedPropertyTax,
      insurance: estimatedInsurance,
      hoa: monthlyEscrow,
      frontEndRatio: (totalMonthlyPayment / monthlyIncome) * 100,
      backEndRatio: ((totalMonthlyPayment + debts) / monthlyIncome) * 100
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Home className="h-8 w-8 text-orange-500" />
          Home Affordability Calculator
        </h1>
        <p className="text-muted-foreground mt-2">
          Determine how much house you can afford based on your income and debts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Financial Information</CardTitle>
            <CardDescription>Enter your income and debt details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="income">Annual Gross Income</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="income"
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  className="pl-10"
                  placeholder="75000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="debts">Monthly Debt Payments</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="debts"
                  type="number"
                  value={monthlyDebts}
                  onChange={(e) => setMonthlyDebts(e.target.value)}
                  className="pl-10"
                  placeholder="500"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Car loans, credit cards, student loans, etc.
              </p>
            </div>

            <div>
              <Label htmlFor="down">Down Payment Saved</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="down"
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  className="pl-10"
                  placeholder="60000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="rate">Interest Rate (%)</Label>
              <Input
                id="rate"
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="7.0"
              />
            </div>

            <Button onClick={calculate} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Calculate Affordability
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader>
              <CardTitle>You Can Afford</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-lg bg-orange-50 dark:bg-orange-950 text-center">
                <div className="text-sm text-muted-foreground mb-1">Maximum Home Price</div>
                <div className="text-4xl font-bold text-orange-600">
                  ${result.maxHomePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Loan Amount</span>
                  <span className="font-medium">${result.maxLoanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Down Payment</span>
                  <span className="font-medium">${result.downPayment.toLocaleString()}</span>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-accent">
                  <div className="font-semibold mb-3">Estimated Monthly Payment</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Principal & Interest</span>
                      <span>${result.principalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Property Tax (est.)</span>
                      <span>${result.propertyTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Insurance (est.)</span>
                      <span>${result.insurance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">HOA (est.)</span>
                      <span>${result.hoa.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total Monthly</span>
                      <span className="text-lg">${result.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-accent text-center">
                    <div className="text-xs text-muted-foreground mb-1">Front-End Ratio</div>
                    <div className="text-xl font-bold">{result.frontEndRatio.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Target: ≤28%</div>
                  </div>
                  <div className="p-3 rounded-lg bg-accent text-center">
                    <div className="text-xs text-muted-foreground mb-1">Back-End Ratio</div>
                    <div className="text-xl font-bold">{result.backEndRatio.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Target: ≤36%</div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground p-3 rounded-lg bg-accent">
                <p className="font-medium mb-1">📋 Note:</p>
                <p>This is an estimate based on 28/36 debt-to-income ratios. Actual approval may vary by lender.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {!result && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter your financial information to see how much home you can afford</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}







