'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DollarSign, Users } from 'lucide-react'

export function TipCalculator() {
  const [billAmount, setBillAmount] = useState('')
  const [tipPercentage, setTipPercentage] = useState('15')
  const [numPeople, setNumPeople] = useState('1')
  const [customTip, setCustomTip] = useState('')
  const [result, setResult] = useState<{
    tipAmount: number
    totalAmount: number
    perPerson: number
    tipPerPerson: number
  } | null>(null)

  const quickTips = [10, 15, 18, 20, 25]

  const calculateTip = () => {
    const bill = parseFloat(billAmount)
    const tip = customTip ? parseFloat(customTip) : parseFloat(tipPercentage)
    const people = parseInt(numPeople) || 1

    if (!bill || !tip) return

    const tipAmount = (bill * tip) / 100
    const totalAmount = bill + tipAmount
    const perPerson = totalAmount / people
    const tipPerPerson = tipAmount / people

    setResult({
      tipAmount,
      totalAmount,
      perPerson,
      tipPerPerson,
    })
  }

  const selectQuickTip = (percentage: number) => {
    setTipPercentage(percentage.toString())
    setCustomTip('')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-500" />
            Tip Calculator
          </CardTitle>
          <CardDescription>
            Calculate tip amount and split the bill among friends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billAmount">Bill Amount ($)</Label>
            <Input
              id="billAmount"
              type="number"
              step="0.01"
              placeholder="50.00"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tip Percentage</Label>
            <div className="flex gap-2 flex-wrap">
              {quickTips.map((tip) => (
                <Button
                  key={tip}
                  variant={tipPercentage === tip.toString() && !customTip ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => selectQuickTip(tip)}
                  className="flex-1 min-w-[60px]"
                >
                  {tip}%
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customTip">Custom Tip (%)</Label>
            <Input
              id="customTip"
              type="number"
              step="0.1"
              placeholder="Enter custom percentage"
              value={customTip}
              onChange={(e) => {
                setCustomTip(e.target.value)
                setTipPercentage(e.target.value)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numPeople" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Number of People
            </Label>
            <Input
              id="numPeople"
              type="number"
              min="1"
              placeholder="1"
              value={numPeople}
              onChange={(e) => setNumPeople(e.target.value)}
            />
          </div>

          <Button onClick={calculateTip} className="w-full">
            Calculate Tip
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-500/50">
          <CardHeader>
            <CardTitle>Bill Summary</CardTitle>
            <CardDescription>
              {parseInt(numPeople) > 1 ? `Split among ${numPeople} people` : 'Total amount'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm text-muted-foreground">Tip Amount</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${result.tipAmount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {customTip || tipPercentage}% tip
                </p>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary">
                  ${result.totalAmount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Bill + tip
                </p>
              </div>
            </div>

            {parseInt(numPeople) > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-muted-foreground">Per Person</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${result.perPerson.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total per person
                  </p>
                </div>

                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-sm text-muted-foreground">Tip Per Person</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ${result.tipPerPerson.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tip share
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Bill:</span>
                  <span className="font-medium">${parseFloat(billAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tip ({customTip || tipPercentage}%):</span>
                  <span className="font-medium">${result.tipAmount.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border my-2"></div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${result.totalAmount.toFixed(2)}</span>
                </div>
                {parseInt(numPeople) > 1 && (
                  <>
                    <div className="h-px bg-border my-2"></div>
                    <div className="flex justify-between text-primary font-bold">
                      <span>Each Person Pays:</span>
                      <span>${result.perPerson.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="font-semibold mb-2 text-sm">Tipping Guidelines</h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• 15-20% for good restaurant service</li>
                <li>• 20-25% for exceptional service</li>
                <li>• 10-15% for takeout/delivery</li>
                <li>• $1-2 per drink at bars</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}







