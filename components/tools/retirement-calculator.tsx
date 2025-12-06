'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TrendingUp } from 'lucide-react'

export function RetirementCalculator() {
  const [currentAge, setCurrentAge] = useState('')
  const [retirementAge, setRetirementAge] = useState('')
  const [currentSavings, setCurrentSavings] = useState('')
  const [monthlyContribution, setMonthlyContribution] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('7')
  const [monthlyRetirementIncome, setMonthlyRetirementIncome] = useState('')
  const [yearsInRetirement, setYearsInRetirement] = useState('25')
  const [result, setResult] = useState<{
    totalSavings: number
    totalContributed: number
    investmentGrowth: number
    yearsToRetirement: number
    requiredSavings: number
    shortfall: number
    isOnTrack: boolean
  } | null>(null)

  const calculateRetirement = () => {
    const age = parseFloat(currentAge)
    const retAge = parseFloat(retirementAge)
    const savings = parseFloat(currentSavings) || 0
    const monthly = parseFloat(monthlyContribution) || 0
    const returnRate = parseFloat(expectedReturn) / 100
    const monthlyIncome = parseFloat(monthlyRetirementIncome) || 0
    const retYears = parseFloat(yearsInRetirement)

    if (!age || !retAge || !returnRate) return

    const yearsToRet = retAge - age
    const monthsToRet = yearsToRet * 12
    const monthlyRate = returnRate / 12

    // Calculate future value of current savings
    const futureValueCurrentSavings = savings * Math.pow(1 + monthlyRate, monthsToRet)

    // Calculate future value of monthly contributions
    const futureValueContributions =
      monthly * ((Math.pow(1 + monthlyRate, monthsToRet) - 1) / monthlyRate)

    const totalSavings = futureValueCurrentSavings + futureValueContributions
    const totalContributed = savings + monthly * monthsToRet
    const investmentGrowth = totalSavings - totalContributed

    // Calculate required savings for retirement income
    const monthsInRetirement = retYears * 12
    const requiredSavings = monthlyIncome * monthsInRetirement
    const shortfall = requiredSavings - totalSavings
    const isOnTrack = shortfall <= 0

    setResult({
      totalSavings,
      totalContributed,
      investmentGrowth,
      yearsToRetirement: yearsToRet,
      requiredSavings,
      shortfall: Math.abs(shortfall),
      isOnTrack,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            Retirement Planning Calculator
          </CardTitle>
          <CardDescription>
            Calculate if you're on track for retirement and estimate your retirement savings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentAge">Current Age</Label>
              <Input
                id="currentAge"
                type="number"
                placeholder="30"
                value={currentAge}
                onChange={(e) => setCurrentAge(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retirementAge">Retirement Age</Label>
              <Input
                id="retirementAge"
                type="number"
                placeholder="65"
                value={retirementAge}
                onChange={(e) => setRetirementAge(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentSavings">Current Retirement Savings ($)</Label>
              <Input
                id="currentSavings"
                type="number"
                placeholder="50000"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyContribution">Monthly Contribution ($)</Label>
              <Input
                id="monthlyContribution"
                type="number"
                placeholder="500"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedReturn">Expected Annual Return (%)</Label>
              <Input
                id="expectedReturn"
                type="number"
                step="0.1"
                placeholder="7"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Historical average: 7-10%</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyRetirementIncome">Desired Monthly Income in Retirement ($)</Label>
              <Input
                id="monthlyRetirementIncome"
                type="number"
                placeholder="4000"
                value={monthlyRetirementIncome}
                onChange={(e) => setMonthlyRetirementIncome(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="yearsInRetirement">Expected Years in Retirement</Label>
              <Input
                id="yearsInRetirement"
                type="number"
                placeholder="25"
                value={yearsInRetirement}
                onChange={(e) => setYearsInRetirement(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Average: 20-30 years</p>
            </div>
          </div>

          <Button onClick={calculateRetirement} className="w-full">
            Calculate Retirement Plan
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card className={result.isOnTrack ? 'border-green-500/50' : 'border-orange-500/50'}>
            <CardHeader>
              <CardTitle>Retirement Projection</CardTitle>
              <CardDescription>
                {result.yearsToRetirement} years until retirement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Projected Retirement Savings</p>
                <p className="text-4xl font-bold text-primary">
                  ${result.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-muted-foreground">Total Contributed</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    ${result.totalContributed.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-muted-foreground">Investment Growth</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${result.investmentGrowth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <p className="text-sm text-muted-foreground">Required Savings</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    ${result.requiredSavings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {result.isOnTrack ? (
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                    ✓ You're on track for retirement!
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Your projected savings exceed your retirement income needs by{' '}
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ${result.shortfall.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    . Keep up the great work!
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-2">
                    ⚠ Retirement Savings Gap Detected
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    You're projected to be{' '}
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      ${result.shortfall.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>{' '}
                    short of your retirement goal.
                  </p>
                  <p className="text-sm font-semibold">Suggestions to close the gap:</p>
                  <ul className="text-sm space-y-1 mt-2 text-muted-foreground">
                    <li>
                      • Increase monthly contribution to{' '}
                      <span className="font-semibold">
                        ${Math.round((parseFloat(monthlyContribution || '0') + result.shortfall / (result.yearsToRetirement * 12))).toLocaleString()}
                      </span>
                    </li>
                    <li>• Work {Math.ceil(result.shortfall / (parseFloat(monthlyContribution || '1') * 12))} more years</li>
                    <li>• Reduce monthly retirement income needs</li>
                    <li>• Seek higher-return investments (with appropriate risk)</li>
                  </ul>
                </div>
              )}

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Retirement Planning Tips</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Start saving early to benefit from compound growth</li>
                  <li>• Maximize employer 401(k) match - it's free money</li>
                  <li>• Diversify investments across different asset classes</li>
                  <li>• Consider Roth IRA for tax-free retirement income</li>
                  <li>• Review and adjust your plan annually</li>
                  <li>• Account for inflation (3-4% annually)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}







