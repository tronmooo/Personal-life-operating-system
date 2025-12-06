'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { PiggyBank, Sparkles } from 'lucide-react'
import { useCalculatorAI } from '@/lib/hooks/use-calculator-ai'
import { CalculatorAIInsightsComponent } from './calculator-ai-insights'

export function RetirementCalculatorEnhanced() {
  const [currentAge, setCurrentAge] = useState('30')
  const [retirementAge, setRetirementAge] = useState('65')
  const [currentSavings, setCurrentSavings] = useState('50000')
  const [monthlyContribution, setMonthlyContribution] = useState('500')
  const [annualReturn, setAnnualReturn] = useState('7')
  const [result, setResult] = useState<any>(null)
  
  // AI Insights
  const { insights, loading: aiLoading, error: aiError, generateInsights } = useCalculatorAI()

  const calculate = async () => {
    const current = parseFloat(currentSavings) || 0
    const monthly = parseFloat(monthlyContribution) || 0
    const rate = (parseFloat(annualReturn) || 0) / 100 / 12
    const years = (parseFloat(retirementAge) || 0) - (parseFloat(currentAge) || 0)
    const months = years * 12

    // Future value calculation
    const futureValueOfCurrent = current * Math.pow(1 + rate, months)
    const futureValueOfContributions = monthly * ((Math.pow(1 + rate, months) - 1) / rate)
    const totalSavings = futureValueOfCurrent + futureValueOfContributions

    const resultData = {
      totalSavings,
      fromCurrentSavings: futureValueOfCurrent,
      fromContributions: futureValueOfContributions,
      yearsToRetirement: years,
      totalContributed: current + (monthly * months)
    }
    
    setResult(resultData)
    
    // Generate AI insights
    await generateInsights({
      calculatorType: 'retirement',
      inputData: {
        currentAge: parseFloat(currentAge),
        retirementAge: parseFloat(retirementAge),
        currentSavings: current,
        monthlyContribution: monthly,
        annualReturn: parseFloat(annualReturn)
      },
      result: resultData
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PiggyBank className="h-5 w-5 mr-2" />
            Retirement Calculator
          </CardTitle>
          <CardDescription>
            Plan your retirement with AI-powered insights
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
              <Label htmlFor="currentSavings">Current Savings</Label>
              <Input
                id="currentSavings"
                type="number"
                placeholder="50000"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
              <Input
                id="monthlyContribution"
                type="number"
                placeholder="500"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualReturn">Expected Annual Return (%)</Label>
              <Input
                id="annualReturn"
                type="number"
                step="0.1"
                placeholder="7"
                value={annualReturn}
                onChange={(e) => setAnnualReturn(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={calculate} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Calculate Retirement Plan with AI
          </Button>

          {result && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Projected Retirement Savings</p>
                    <p className="text-4xl font-bold text-green-600">
                      {formatCurrency(result.totalSavings)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      in {result.yearsToRetirement} years
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">From Current Savings</p>
                    <p className="text-xl font-bold">{formatCurrency(result.fromCurrentSavings)}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">From Contributions</p>
                    <p className="text-xl font-bold">{formatCurrency(result.fromContributions)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Contributed</p>
                    <p className="text-xl font-bold">{formatCurrency(result.totalContributed)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Investment Growth</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(result.totalSavings - result.totalContributed)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI-Powered Insights */}
      {result && (
        <CalculatorAIInsightsComponent
          insights={insights}
          loading={aiLoading}
          error={aiError}
          onRefresh={() => generateInsights({
            calculatorType: 'retirement',
            inputData: {
              currentAge: parseFloat(currentAge),
              retirementAge: parseFloat(retirementAge),
              currentSavings: parseFloat(currentSavings),
              monthlyContribution: parseFloat(monthlyContribution),
              annualReturn: parseFloat(annualReturn)
            },
            result
          })}
        />
      )}
    </div>
  )
}

