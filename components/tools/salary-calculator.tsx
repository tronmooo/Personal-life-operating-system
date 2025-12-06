'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, Calculator } from 'lucide-react'

export function SalaryCalculator() {
  const [inputAmount, setInputAmount] = useState('')
  const [inputType, setInputType] = useState<'annual' | 'monthly' | 'biweekly' | 'weekly' | 'hourly'>('annual')
  const [hoursPerWeek, setHoursPerWeek] = useState('40')
  const [result, setResult] = useState<{
    annual: number
    monthly: number
    biweekly: number
    weekly: number
    daily: number
    hourly: number
  } | null>(null)

  const calculateSalary = () => {
    if (!inputAmount) return

    const amount = parseFloat(inputAmount)
    const hours = parseFloat(hoursPerWeek)

    let annualSalary = 0

    // Convert input to annual salary
    switch (inputType) {
      case 'annual':
        annualSalary = amount
        break
      case 'monthly':
        annualSalary = amount * 12
        break
      case 'biweekly':
        annualSalary = amount * 26
        break
      case 'weekly':
        annualSalary = amount * 52
        break
      case 'hourly':
        annualSalary = amount * hours * 52
        break
    }

    const monthly = annualSalary / 12
    const biweekly = annualSalary / 26
    const weekly = annualSalary / 52
    const daily = weekly / 5
    const hourly = annualSalary / (hours * 52)

    setResult({
      annual: Math.round(annualSalary),
      monthly: Math.round(monthly),
      biweekly: Math.round(biweekly),
      weekly: Math.round(weekly),
      daily: Math.round(daily),
      hourly: Math.round(hourly * 100) / 100
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Pay Period</Label>
          <Select value={inputType} onValueChange={(value: any) => setInputType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annual">Annual Salary</SelectItem>
              <SelectItem value="monthly">Monthly Salary</SelectItem>
              <SelectItem value="biweekly">Biweekly (Every 2 weeks)</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="hourly">Hourly Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours">Hours Per Week</Label>
          <Input
            id="hours"
            type="number"
            placeholder="e.g., 40"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Standard: 40 hours</p>
        </div>
      </div>

      <Button onClick={calculateSalary} className="w-full">
        <Calculator className="mr-2 h-4 w-4" />
        Calculate Salary
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Salary Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center pb-4 border-b">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {formatCurrency(result.annual)}
                </div>
                <p className="text-muted-foreground">Annual Salary</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(result.monthly)}</div>
                  <p className="text-sm text-muted-foreground">Monthly</p>
                </div>

                <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(result.biweekly)}</div>
                  <p className="text-sm text-muted-foreground">Biweekly</p>
                </div>

                <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">{formatCurrency(result.weekly)}</div>
                  <p className="text-sm text-muted-foreground">Weekly</p>
                </div>

                <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-teal-600">{formatCurrency(result.daily)}</div>
                  <p className="text-sm text-muted-foreground">Daily</p>
                </div>

                <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg text-center col-span-2">
                  <div className="text-3xl font-bold text-green-600">${result.hourly.toFixed(2)}/hr</div>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Annual to Monthly:</span>
                  <span className="font-semibold">÷ 12</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Annual to Biweekly:</span>
                  <span className="font-semibold">÷ 26</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Annual to Weekly:</span>
                  <span className="font-semibold">÷ 52</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Hourly to Annual:</span>
                  <span className="font-semibold">× {hoursPerWeek} × 52</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> These calculations show gross pay (before taxes and deductions).
                Actual take-home pay will be lower after federal, state, and local taxes, plus any deductions
                for health insurance, retirement contributions, etc.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
