'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calculator, Car, Shield, Home, TrendingUp, TrendingDown,
  DollarSign, AlertCircle, CheckCircle2
} from 'lucide-react'

interface WhatIfScenariosProps {
  currentData: {
    monthlyIncome: number
    monthlyExpenses: number
    savings: number
    debt: number
    netWorth: number
  }
}

export function WhatIfScenarios({ currentData }: WhatIfScenariosProps) {
  // Car Purchase Scenario
  const [carPrice, setCarPrice] = useState(40000)
  const [carDownPayment, setCarDownPayment] = useState(8000)
  const [carInterestRate, setCarInterestRate] = useState(5.5)
  const [carTerm, setCarTerm] = useState(60) // months

  // Insurance Scenario
  const [currentPremium, setCurrentPremium] = useState(200)
  const [currentDeductible, setCurrentDeductible] = useState(500)
  const [newPremium, setNewPremium] = useState(150)
  const [newDeductible, setNewDeductible] = useState(2500)

  // Relocation Scenario
  const [currentCost, setCurrentCost] = useState(3500)
  const [newLocationCost, setNewLocationCost] = useState(2800)
  const [movingCosts, setMovingCosts] = useState(5000)

  // Car Purchase Impact
  const carImpact = useMemo(() => {
    const loanAmount = carPrice - carDownPayment
    const monthlyRate = carInterestRate / 100 / 12
    const monthlyPayment = monthlyRate > 0 
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, carTerm)) / (Math.pow(1 + monthlyRate, carTerm) - 1)
      : loanAmount / carTerm
    
    const insurance = 150 // estimated
    const maintenance = 100 // estimated
    const totalMonthly = monthlyPayment + insurance + maintenance
    
    const newBudget = currentData.monthlyExpenses + totalMonthly
    const newSavings = currentData.savings - carDownPayment
    const newNetWorth = currentData.netWorth + carPrice - loanAmount - carDownPayment
    const budgetImpact = ((totalMonthly / currentData.monthlyIncome) * 100)
    
    return {
      monthlyPayment: Math.round(monthlyPayment),
      insurance,
      maintenance,
      totalMonthly: Math.round(totalMonthly),
      newBudget: Math.round(newBudget),
      newSavings: Math.round(newSavings),
      newNetWorth: Math.round(newNetWorth),
      budgetImpact: Math.round(budgetImpact * 10) / 10,
      savingsImpact: Math.round(((carDownPayment / currentData.savings) * 100) * 10) / 10,
      recommendation: budgetImpact > 30 ? 'High risk - consider lower price or larger down payment' :
                      budgetImpact > 20 ? 'Moderate - ensure emergency fund is adequate' :
                      'Affordable - within recommended budget'
    }
  }, [carPrice, carDownPayment, carInterestRate, carTerm, currentData])

  // Insurance Impact
  const insuranceImpact = useMemo(() => {
    const monthlySavings = currentPremium - newPremium
    const annualSavings = monthlySavings * 12
    const deductibleIncrease = newDeductible - currentDeductible
    
    // Break-even: how many years until savings offset higher deductible
    const breakEvenYears = deductibleIncrease > 0 && annualSavings > 0
      ? deductibleIncrease / annualSavings
      : 0
    
    return {
      monthlySavings,
      annualSavings,
      deductibleIncrease,
      breakEvenYears: Math.round(breakEvenYears * 10) / 10,
      recommendation: breakEvenYears > 3 
        ? 'High deductible not recommended - break-even takes too long'
        : breakEvenYears > 1
        ? 'Consider if you have emergency savings for higher deductible'
        : 'Good deal - quick break-even with significant savings'
    }
  }, [currentPremium, currentDeductible, newPremium, newDeductible])

  // Relocation Impact
  const relocationImpact = useMemo(() => {
    const monthlySavings = currentCost - newLocationCost
    const annualSavings = monthlySavings * 12
    const breakEvenMonths = movingCosts / monthlySavings
    const fiveYearSavings = (annualSavings * 5) - movingCosts
    
    return {
      monthlySavings,
      annualSavings,
      movingCosts,
      breakEvenMonths: Math.round(breakEvenMonths * 10) / 10,
      fiveYearSavings: Math.round(fiveYearSavings),
      netChange: currentData.monthlyExpenses - monthlySavings,
      recommendation: breakEvenMonths < 12 
        ? 'Excellent financial move - quick break-even'
        : breakEvenMonths < 24
        ? 'Good move - reasonable break-even period'
        : 'Consider other factors - long break-even period'
    }
  }, [currentCost, newLocationCost, movingCosts, currentData])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-purple-600" />
          What-If Scenarios
        </CardTitle>
        <CardDescription>
          Model financial decisions and see their impact
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="car" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="car">
              <Car className="h-4 w-4 mr-2" />
              Car Purchase
            </TabsTrigger>
            <TabsTrigger value="insurance">
              <Shield className="h-4 w-4 mr-2" />
              Insurance
            </TabsTrigger>
            <TabsTrigger value="relocation">
              <Home className="h-4 w-4 mr-2" />
              Relocation
            </TabsTrigger>
          </TabsList>

          {/* Car Purchase */}
          <TabsContent value="car" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Car Price</Label>
                <Input
                  type="number"
                  value={carPrice}
                  onChange={(e) => setCarPrice(Number(e.target.value))}
                  placeholder="40000"
                />
              </div>
              <div className="space-y-2">
                <Label>Down Payment</Label>
                <Input
                  type="number"
                  value={carDownPayment}
                  onChange={(e) => setCarDownPayment(Number(e.target.value))}
                  placeholder="8000"
                />
              </div>
              <div className="space-y-2">
                <Label>Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={carInterestRate}
                  onChange={(e) => setCarInterestRate(Number(e.target.value))}
                  placeholder="5.5"
                />
              </div>
              <div className="space-y-2">
                <Label>Loan Term (months)</Label>
                <Input
                  type="number"
                  value={carTerm}
                  onChange={(e) => setCarTerm(Number(e.target.value))}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <h4 className="font-semibold text-lg">Impact Analysis</h4>
              
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                  <span className="text-sm">Monthly Payment</span>
                  <span className="font-bold">${carImpact.monthlyPayment}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                  <span className="text-sm">Total Monthly Cost</span>
                  <span className="font-bold">${carImpact.totalMonthly}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                  <span className="text-sm">Budget Impact</span>
                  <Badge variant={carImpact.budgetImpact > 20 ? 'destructive' : 'default'}>
                    {carImpact.budgetImpact}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                  <span className="text-sm">Savings Reduction</span>
                  <span className="font-bold text-red-600">-${carDownPayment}</span>
                </div>
              </div>

              <div className={`flex items-start gap-2 p-3 rounded-lg ${
                carImpact.budgetImpact > 20 ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'
              }`}>
                {carImpact.budgetImpact > 20 ? (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-sm">Recommendation</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {carImpact.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Insurance Comparison */}
          <TabsContent value="insurance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-semibold">Current Plan</h4>
                <div className="space-y-2">
                  <Label>Monthly Premium</Label>
                  <Input
                    type="number"
                    value={currentPremium}
                    onChange={(e) => setCurrentPremium(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deductible</Label>
                  <Input
                    type="number"
                    value={currentDeductible}
                    onChange={(e) => setCurrentDeductible(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">New Plan</h4>
                <div className="space-y-2">
                  <Label>Monthly Premium</Label>
                  <Input
                    type="number"
                    value={newPremium}
                    onChange={(e) => setNewPremium(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deductible</Label>
                  <Input
                    type="number"
                    value={newDeductible}
                    onChange={(e) => setNewDeductible(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
              <h4 className="font-semibold text-lg">Comparison</h4>
              
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                  <span className="text-sm">Monthly Savings</span>
                  <span className="font-bold text-green-600">
                    ${insuranceImpact.monthlySavings}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                  <span className="text-sm">Annual Savings</span>
                  <span className="font-bold text-green-600">
                    ${insuranceImpact.annualSavings}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                  <span className="text-sm">Deductible Increase</span>
                  <span className="font-bold text-red-600">
                    +${insuranceImpact.deductibleIncrease}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                  <span className="text-sm">Break-Even</span>
                  <span className="font-bold">
                    {insuranceImpact.breakEvenYears} years
                  </span>
                </div>
              </div>

              <div className={`flex items-start gap-2 p-3 rounded-lg ${
                insuranceImpact.breakEvenYears > 2 ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-green-50 dark:bg-green-950'
              }`}>
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Recommendation</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insuranceImpact.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Relocation */}
          <TabsContent value="relocation" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Current Monthly Cost</Label>
                <Input
                  type="number"
                  value={currentCost}
                  onChange={(e) => setCurrentCost(Number(e.target.value))}
                  placeholder="3500"
                />
              </div>
              <div className="space-y-2">
                <Label>New Location Cost</Label>
                <Input
                  type="number"
                  value={newLocationCost}
                  onChange={(e) => setNewLocationCost(Number(e.target.value))}
                  placeholder="2800"
                />
              </div>
              <div className="space-y-2">
                <Label>Moving Costs</Label>
                <Input
                  type="number"
                  value={movingCosts}
                  onChange={(e) => setMovingCosts(Number(e.target.value))}
                  placeholder="5000"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-orange-50 to-purple-50 dark:from-orange-950 dark:to-purple-950">
              <h4 className="font-semibold text-lg">Financial Impact</h4>
              
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                  <span className="text-sm">Monthly Savings</span>
                  <span className="font-bold text-green-600">
                    ${relocationImpact.monthlySavings}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                  <span className="text-sm">Annual Savings</span>
                  <span className="font-bold text-green-600">
                    ${relocationImpact.annualSavings}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                  <span className="text-sm">Break-Even</span>
                  <span className="font-bold">
                    {relocationImpact.breakEvenMonths} months
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                  <span className="text-sm">5-Year Net Savings</span>
                  <span className="font-bold text-green-600">
                    ${relocationImpact.fiveYearSavings}
                  </span>
                </div>
              </div>

              <div className={`flex items-start gap-2 p-3 rounded-lg ${
                relocationImpact.breakEvenMonths < 12 ? 'bg-green-50 dark:bg-green-950' : 'bg-yellow-50 dark:bg-yellow-950'
              }`}>
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Recommendation</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {relocationImpact.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
























