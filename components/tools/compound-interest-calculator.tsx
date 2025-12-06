'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Calculator } from 'lucide-react'

export function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState('10000')
  const [rate, setRate] = useState('7')
  const [years, setYears] = useState('10')
  const [contribution, setContribution] = useState('100')
  const [result, setResult] = useState<number | null>(null)

  const calculate = () => {
    const p = parseFloat(principal) || 0
    const r = (parseFloat(rate) || 0) / 100
    const t = parseFloat(years) || 0
    const c = parseFloat(contribution) || 0

    // Compound interest with monthly contributions
    const monthlyRate = r / 12
    const months = t * 12

    // Future value of principal
    const fvPrincipal = p * Math.pow(1 + monthlyRate, months)

    // Future value of contributions
    const fvContributions = c * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)

    const total = fvPrincipal + fvContributions
    setResult(total)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Compound Interest Calculator
          </CardTitle>
          <CardDescription>
            Calculate the future value of your investments with compound interest
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Initial Investment</Label>
              <Input
                id="principal"
                type="number"
                placeholder="10000"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rate">Annual Interest Rate (%)</Label>
              <Input
                id="rate"
                type="number"
                placeholder="7"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="years">Investment Period (Years)</Label>
              <Input
                id="years"
                type="number"
                placeholder="10"
                value={years}
                onChange={(e) => setYears(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contribution">Monthly Contribution</Label>
              <Input
                id="contribution"
                type="number"
                placeholder="100"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={calculate} className="w-full">Calculate</Button>

          {result !== null && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Future Value</p>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(result)}</p>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Invested</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(parseFloat(principal) + (parseFloat(contribution) * parseFloat(years) * 12))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Interest Earned</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(result - (parseFloat(principal) + (parseFloat(contribution) * parseFloat(years) * 12)))}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}








