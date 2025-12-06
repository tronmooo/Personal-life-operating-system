'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calculator, DollarSign } from 'lucide-react'

export function TaxEstimator() {
  const [income, setIncome] = useState<string>('')
  const [filingStatus, setFilingStatus] = useState<'single' | 'married' | 'head'>('single')
  const [deductions, setDeductions] = useState<string>('')
  const [result, setResult] = useState<any>(null)

  const calculateTax = () => {
    const annualIncome = parseFloat(income) || 0
    const standardDeduction = filingStatus === 'married' ? 27700 : filingStatus === 'head' ? 20800 : 13850
    const itemizedDeductions = parseFloat(deductions) || 0
    const totalDeductions = Math.max(standardDeduction, itemizedDeductions)
    const taxableIncome = Math.max(0, annualIncome - totalDeductions)

    // 2024 Tax Brackets
    const brackets = filingStatus === 'married' ? [
      { rate: 0.10, max: 22000 },
      { rate: 0.12, max: 89075 },
      { rate: 0.22, max: 190750 },
      { rate: 0.24, max: 364200 },
      { rate: 0.32, max: 462500 },
      { rate: 0.35, max: 693750 },
      { rate: 0.37, max: Infinity }
    ] : [
      { rate: 0.10, max: 11000 },
      { rate: 0.12, max: 44725 },
      { rate: 0.22, max: 95375 },
      { rate: 0.24, max: 182100 },
      { rate: 0.32, max: 231250 },
      { rate: 0.35, max: 578125 },
      { rate: 0.37, max: Infinity }
    ]

    let totalTax = 0
    let remainingIncome = taxableIncome
    let previousMax = 0

    for (const bracket of brackets) {
      const bracketIncome = Math.min(remainingIncome, bracket.max - previousMax)
      if (bracketIncome <= 0) break
      
      totalTax += bracketIncome * bracket.rate
      remainingIncome -= bracketIncome
      previousMax = bracket.max
      
      if (remainingIncome <= 0) break
    }

    const effectiveRate = (totalTax / annualIncome) * 100
    const takeHome = annualIncome - totalTax
    const monthlyTakeHome = takeHome / 12

    setResult({
      taxableIncome,
      totalDeductions,
      totalTax,
      effectiveRate,
      takeHome,
      monthlyTakeHome,
      marginalRate: brackets.find(b => taxableIncome <= b.max)?.rate || 0.37
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calculator className="h-8 w-8 text-green-500" />
          Federal Tax Estimator
        </h1>
        <p className="text-muted-foreground mt-2">
          Estimate your federal income tax based on 2024 tax brackets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Income Information</CardTitle>
            <CardDescription>Enter your annual income details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="income">Annual Gross Income</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="income"
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="pl-10"
                  placeholder="75000"
                />
              </div>
            </div>

            <div>
              <Label>Filing Status</Label>
              <select
                value={filingStatus}
                onChange={(e) => setFilingStatus(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="single">Single</option>
                <option value="married">Married Filing Jointly</option>
                <option value="head">Head of Household</option>
              </select>
            </div>

            <div>
              <Label htmlFor="deductions">Itemized Deductions (Optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deductions"
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="pl-10"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to use standard deduction
              </p>
            </div>

            <Button onClick={calculateTax} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Tax
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader>
              <CardTitle>Tax Estimate</CardTitle>
              <CardDescription>Your estimated federal tax obligation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Taxable Income</span>
                  <span className="font-medium">${result.taxableIncome.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Deductions</span>
                  <span className="font-medium">${result.totalDeductions.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Federal Tax</span>
                  <span className="font-semibold text-red-600">
                    ${result.totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Effective Tax Rate</span>
                  <span className="font-medium">{result.effectiveRate.toFixed(2)}%</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Marginal Tax Rate</span>
                  <span className="font-medium">{(result.marginalRate * 100).toFixed(0)}%</span>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-700 dark:text-green-300">Annual Take-Home</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${result.takeHome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-green-600 dark:text-green-400">Monthly Take-Home</span>
                    <span className="text-lg font-semibold text-green-600">
                      ${result.monthlyTakeHome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground p-3 rounded-lg bg-accent">
                <p className="font-medium mb-1">📋 Note:</p>
                <p>This calculator provides an estimate based on 2024 federal tax brackets. Actual tax may vary based on credits, state taxes, and other factors. Consult a tax professional for accurate planning.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {!result && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter your income information to calculate your estimated taxes</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}







