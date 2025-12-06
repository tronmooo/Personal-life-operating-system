'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Home, Sparkles } from 'lucide-react'
import { useCalculatorAI } from '@/lib/hooks/use-calculator-ai'
import { CalculatorAIInsightsComponent } from './calculator-ai-insights'

export function MortgageCalculator() {
  const [homePrice, setHomePrice] = useState('300000')
  const [downPayment, setDownPayment] = useState('60000')
  const [interestRate, setInterestRate] = useState('6.5')
  const [loanTerm, setLoanTerm] = useState('30')
  const [result, setResult] = useState<any>(null)
  
  // AI Insights
  const { insights, loading: aiLoading, error: aiError, generateInsights } = useCalculatorAI()

  const calculate = async () => {
    const price = parseFloat(homePrice) || 0
    const down = parseFloat(downPayment) || 0
    const rate = (parseFloat(interestRate) || 0) / 100 / 12
    const term = (parseFloat(loanTerm) || 0) * 12

    const loanAmount = price - down

    // Monthly payment formula
    const monthlyPayment = loanAmount * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1)

    const totalPayment = monthlyPayment * term
    const totalInterest = totalPayment - loanAmount

    const resultData = {
      monthlyPayment,
      loanAmount,
      totalPayment,
      totalInterest,
      downPaymentPercent: (down / price) * 100
    }
    
    setResult(resultData)
    
    // Generate AI insights
    await generateInsights({
      calculatorType: 'mortgage',
      inputData: {
        homePrice: price,
        downPayment: down,
        interestRate: parseFloat(interestRate),
        loanTerm: parseFloat(loanTerm)
      },
      result: resultData
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Home className="h-5 w-5 mr-2" />
            Mortgage Calculator
          </CardTitle>
          <CardDescription>
            Calculate your monthly mortgage payment with AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="homePrice">Home Price</Label>
              <Input
                id="homePrice"
                type="number"
                placeholder="300000"
                value={homePrice}
                onChange={(e) => setHomePrice(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="downPayment">Down Payment</Label>
              <Input
                id="downPayment"
                type="number"
                placeholder="60000"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                placeholder="6.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanTerm">Loan Term (Years)</Label>
              <Input
                id="loanTerm"
                type="number"
                placeholder="30"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={calculate} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Calculate with AI Insights
          </Button>

          {result && (
            <div className="space-y-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Monthly Payment</p>
                    <p className="text-4xl font-bold text-primary">
                      {formatCurrency(result.monthlyPayment)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Loan Amount</p>
                    <p className="text-xl font-bold">{formatCurrency(result.loanAmount)}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Down Payment</p>
                    <p className="text-xl font-bold">{result.downPaymentPercent.toFixed(1)}%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Payment</p>
                    <p className="text-xl font-bold">{formatCurrency(result.totalPayment)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Interest</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(result.totalInterest)}
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
            calculatorType: 'mortgage',
            inputData: {
              homePrice: parseFloat(homePrice),
              downPayment: parseFloat(downPayment),
              interestRate: parseFloat(interestRate),
              loanTerm: parseFloat(loanTerm)
            },
            result
          })}
        />
      )}
    </div>
  )
}
