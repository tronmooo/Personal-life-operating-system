'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Shield, DollarSign, Calendar, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function EmergencyFundCalculator() {
  const [monthlyExpenses, setMonthlyExpenses] = useState('')
  const [monthsCoverage, setMonthsCoverage] = useState('6')
  const [currentSavings, setCurrentSavings] = useState('')
  const [monthlySavings, setMonthlySavings] = useState('')
  const [result, setResult] = useState<{
    targetAmount: number
    remaining: number
    monthsToGoal: number
    percentComplete: number
    recommendation: string
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  } | null>(null)

  const calculateEmergencyFund = () => {
    const expenses = parseFloat(monthlyExpenses)
    const months = parseFloat(monthsCoverage)
    const savings = parseFloat(currentSavings) || 0
    const monthly = parseFloat(monthlySavings) || 0

    if (!expenses || !months) return

    const targetAmount = expenses * months
    const remaining = Math.max(0, targetAmount - savings)
    const percentComplete = (savings / targetAmount) * 100
    const monthsToGoal = monthly > 0 ? Math.ceil(remaining / monthly) : 0

    let recommendation = ''
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'

    if (percentComplete >= 100) {
      recommendation = 'Excellent! You have a fully funded emergency fund.'
      riskLevel = 'low'
    } else if (percentComplete >= 75) {
      recommendation = 'Great progress! You\'re almost there.'
      riskLevel = 'low'
    } else if (percentComplete >= 50) {
      recommendation = 'Good start! Keep building your emergency fund.'
      riskLevel = 'medium'
    } else if (percentComplete >= 25) {
      recommendation = 'You\'re making progress, but need to save more.'
      riskLevel = 'medium'
    } else if (percentComplete > 0) {
      recommendation = 'Critical: Increase your emergency savings as soon as possible.'
      riskLevel = 'high'
    } else {
      recommendation = 'Critical: Start building your emergency fund immediately!'
      riskLevel = 'critical'
    }

    setResult({
      targetAmount,
      remaining,
      monthsToGoal,
      percentComplete,
      recommendation,
      riskLevel,
    })
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'high':
        return 'bg-orange-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            Emergency Fund Calculator
          </CardTitle>
          <CardDescription>
            Calculate how much you should save for financial emergencies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyExpenses">Monthly Expenses ($)</Label>
              <Input
                id="monthlyExpenses"
                type="number"
                placeholder="3000"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your total monthly living expenses
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthsCoverage">Months of Coverage</Label>
              <select
                id="monthsCoverage"
                value={monthsCoverage}
                onChange={(e) => setMonthsCoverage(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="3">3 months (minimum)</option>
                <option value="6">6 months (recommended)</option>
                <option value="9">9 months (conservative)</option>
                <option value="12">12 months (very safe)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Financial experts recommend 3-6 months
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentSavings">Current Emergency Savings ($)</Label>
              <Input
                id="currentSavings"
                type="number"
                placeholder="5000"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlySavings">Monthly Savings Contribution ($)</Label>
              <Input
                id="monthlySavings"
                type="number"
                placeholder="500"
                value={monthlySavings}
                onChange={(e) => setMonthlySavings(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                How much can you save each month?
              </p>
            </div>
          </div>

          <Button onClick={calculateEmergencyFund} className="w-full">
            Calculate Emergency Fund
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle>Your Emergency Fund Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Target Emergency Fund</p>
                <p className="text-4xl font-bold text-primary">
                  ${result.targetAmount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {monthsCoverage} months of expenses
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-muted-foreground">Current Savings</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${parseFloat(currentSavings || '0').toLocaleString()}
                  </p>
                </div>

                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-sm text-muted-foreground">Still Needed</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ${result.remaining.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-muted-foreground">Time to Goal</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.monthsToGoal > 0
                      ? `${Math.floor(result.monthsToGoal / 12)}y ${result.monthsToGoal % 12}m`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{result.percentComplete.toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getRiskColor(result.riskLevel)}`}
                    style={{ width: `${Math.min(result.percentComplete, 100)}%` }}
                  />
                </div>
              </div>

              {/* Risk Assessment */}
              <Card className={`${getRiskColor(result.riskLevel)}/10 border-${getRiskColor(result.riskLevel)}/20`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Risk Assessment</span>
                    <Badge
                      variant={result.riskLevel === 'low' ? 'default' : 'destructive'}
                      className="capitalize"
                    >
                      {result.riskLevel} Risk
                    </Badge>
                  </div>
                  <p className="text-sm">{result.recommendation}</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {monthlySavings && parseFloat(monthlySavings) > 0 && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="text-base">Savings Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Contribution</p>
                    <p className="text-xl font-bold">${parseFloat(monthlySavings).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Date</p>
                    <p className="text-xl font-bold">
                      {new Date(
                        Date.now() + result.monthsToGoal * 30 * 24 * 60 * 60 * 1000
                      ).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  At ${parseFloat(monthlySavings).toLocaleString()}/month, you'll reach your emergency fund goal in{' '}
                  <strong>{result.monthsToGoal} months</strong>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="text-base">Emergency Fund Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <strong>Minimum (3 months):</strong> If you have stable employment, dual income, low expenses
              </div>
              <div>
                <strong>Recommended (6 months):</strong> Standard recommendation for most people
              </div>
              <div>
                <strong>Conservative (9-12 months):</strong> If you're self-employed, single income, or in unstable industry
              </div>
              <div className="mt-3">
                <strong>Where to keep it:</strong>
                <ul className="list-disc ml-5 mt-1 space-y-1 text-muted-foreground">
                  <li>High-yield savings account (easy access, earns interest)</li>
                  <li>Money market account (slightly higher rates)</li>
                  <li>NOT in checking (too easy to spend)</li>
                  <li>NOT in stocks (too volatile for emergencies)</li>
                </ul>
              </div>
              <div className="mt-3">
                <strong>What qualifies as an emergency:</strong>
                <ul className="list-disc ml-5 mt-1 space-y-1 text-muted-foreground">
                  <li>Job loss or reduced income</li>
                  <li>Medical emergencies not covered by insurance</li>
                  <li>Major home or car repairs</li>
                  <li>NOT vacations, shopping, or planned expenses</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}







