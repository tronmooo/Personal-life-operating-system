'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wallet, DollarSign } from 'lucide-react'

export function PaycheckCalculator() {
  const [grossPay, setGrossPay] = useState('')
  const [payFrequency, setPayFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('biweekly')
  const [federalTax, setFederalTax] = useState('22')
  const [stateTax, setStateTax] = useState('5')
  const [socialSecurity, setSocialSecurity] = useState('6.2')
  const [medicare, setMedicare] = useState('1.45')
  const [otherDeductions, setOtherDeductions] = useState('')
  const [result, setResult] = useState<{
    grossPay: number
    federalTax: number
    stateTax: number
    socialSecurity: number
    medicare: number
    otherDeductions: number
    totalDeductions: number
    netPay: number
    annualGross: number
    annualNet: number
  } | null>(null)

  const calculatePaycheck = () => {
    if (!grossPay) return

    const gross = parseFloat(grossPay)
    const federal = gross * (parseFloat(federalTax) / 100)
    const state = gross * (parseFloat(stateTax) / 100)
    const ss = gross * (parseFloat(socialSecurity) / 100)
    const med = gross * (parseFloat(medicare) / 100)
    const other = parseFloat(otherDeductions) || 0

    const totalDeductions = federal + state + ss + med + other
    const net = gross - totalDeductions

    // Calculate annual amounts
    const periodsPerYear = payFrequency === 'weekly' ? 52 : payFrequency === 'biweekly' ? 26 : 12
    const annualGross = gross * periodsPerYear
    const annualNet = net * periodsPerYear

    setResult({
      grossPay: gross,
      federalTax: federal,
      stateTax: state,
      socialSecurity: ss,
      medicare: med,
      otherDeductions: other,
      totalDeductions,
      netPay: net,
      annualGross,
      annualNet
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gross">Gross Pay</Label>
          <Input
            id="gross"
            type="number"
            placeholder="e.g., 3000"
            value={grossPay}
            onChange={(e) => setGrossPay(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Pay Frequency</Label>
          <Select value={payFrequency} onValueChange={(value: any) => setPayFrequency(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Biweekly (Every 2 weeks)</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="federal">Federal Tax (%)</Label>
          <Input
            id="federal"
            type="number"
            step="0.1"
            placeholder="e.g., 22"
            value={federalTax}
            onChange={(e) => setFederalTax(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State Tax (%)</Label>
          <Input
            id="state"
            type="number"
            step="0.1"
            placeholder="e.g., 5"
            value={stateTax}
            onChange={(e) => setStateTax(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ss">Social Security (%)</Label>
          <Input
            id="ss"
            type="number"
            step="0.1"
            value={socialSecurity}
            onChange={(e) => setSocialSecurity(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="medicare">Medicare (%)</Label>
          <Input
            id="medicare"
            type="number"
            step="0.1"
            value={medicare}
            onChange={(e) => setMedicare(e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="other">Other Deductions ($)</Label>
          <Input
            id="other"
            type="number"
            placeholder="401k, insurance, etc."
            value={otherDeductions}
            onChange={(e) => setOtherDeductions(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={calculatePaycheck} className="w-full">
        <Wallet className="mr-2 h-4 w-4" />
        Calculate Take-Home Pay
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Paycheck Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center pb-4 border-b">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {formatCurrency(result.netPay)}
                </div>
                <p className="text-muted-foreground">Take-Home Pay</p>
                <p className="text-sm text-muted-foreground mt-1">
                  From {formatCurrency(result.grossPay)} gross
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <span>Federal Tax</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(result.federalTax)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <span>State Tax</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(result.stateTax)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <span>Social Security</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(result.socialSecurity)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <span>Medicare</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(result.medicare)}</span>
                </div>
                {result.otherDeductions > 0 && (
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <span>Other Deductions</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(result.otherDeductions)}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Deductions</span>
                  <span className="text-red-600">-{formatCurrency(result.totalDeductions)}</span>
                </div>
                <p className="text-sm text-muted-foreground text-right mt-1">
                  {((result.totalDeductions / result.grossPay) * 100).toFixed(1)}% of gross
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Annual Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(result.annualGross)}</div>
                  <p className="text-sm text-muted-foreground">Annual Gross</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(result.annualNet)}</div>
                  <p className="text-sm text-muted-foreground">Annual Net</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              <p><strong>Note:</strong> This is a simplified calculation. Actual paycheck may vary based on tax withholdings, exemptions, pre-tax deductions, and local taxes. Consult a tax professional for accurate calculations.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
