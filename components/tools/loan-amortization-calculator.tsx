'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface PaymentSchedule {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export function LoanAmortizationCalculator() {
  const [loanAmount, setLoanAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [loanTerm, setLoanTerm] = useState('')
  const [schedule, setSchedule] = useState<PaymentSchedule[]>([])
  const [summary, setSummary] = useState<{
    monthlyPayment: number
    totalPayment: number
    totalInterest: number
  } | null>(null)
  const [showFullSchedule, setShowFullSchedule] = useState(false)

  const calculateAmortization = () => {
    const principal = parseFloat(loanAmount)
    const annualRate = parseFloat(interestRate) / 100
    const monthlyRate = annualRate / 12
    const months = parseFloat(loanTerm) * 12

    if (!principal || !annualRate || !months) return

    // Calculate monthly payment using amortization formula
    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)

    let balance = principal
    const newSchedule: PaymentSchedule[] = []

    for (let month = 1; month <= months; month++) {
      const interestPayment = balance * monthlyRate
      const principalPayment = monthlyPayment - interestPayment
      balance -= principalPayment

      newSchedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      })
    }

    const totalPayment = monthlyPayment * months
    const totalInterest = totalPayment - principal

    setSchedule(newSchedule)
    setSummary({
      monthlyPayment,
      totalPayment,
      totalInterest,
    })
  }

  const displaySchedule = showFullSchedule ? schedule : schedule.slice(0, 12)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Loan Amortization Calculator</CardTitle>
          <CardDescription>
            View your complete loan payment schedule and see how principal and interest change over time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Loan Amount ($)</Label>
              <Input
                id="loanAmount"
                type="number"
                placeholder="50000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                placeholder="5.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanTerm">Loan Term (years)</Label>
              <Input
                id="loanTerm"
                type="number"
                placeholder="5"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={calculateAmortization} className="w-full">
            Generate Amortization Schedule
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Loan Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Monthly Payment</p>
                  <p className="text-2xl font-bold text-primary">
                    ${summary.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Payment</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${summary.totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-4 bg-orange-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Interest</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ${summary.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Schedule</CardTitle>
              <CardDescription>
                Showing {showFullSchedule ? 'all' : 'first 12'} payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-right p-2">Payment</th>
                      <th className="text-right p-2">Principal</th>
                      <th className="text-right p-2">Interest</th>
                      <th className="text-right p-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displaySchedule.map((payment) => (
                      <tr key={payment.month} className="border-b hover:bg-muted/50">
                        <td className="p-2">{payment.month}</td>
                        <td className="text-right p-2">
                          ${payment.payment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-2 text-green-600 dark:text-green-400">
                          ${payment.principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-2 text-orange-600 dark:text-orange-400">
                          ${payment.interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-2 font-medium">
                          ${payment.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {schedule.length > 12 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setShowFullSchedule(!showFullSchedule)}
                >
                  {showFullSchedule ? 'Show Less' : `Show All ${schedule.length} Payments`}
                </Button>
              )}

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Key Insights</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Early payments are mostly interest, later payments are mostly principal</li>
                  <li>• Making extra principal payments can significantly reduce total interest</li>
                  <li>• Interest percentage: {((summary.totalInterest / parseFloat(loanAmount)) * 100).toFixed(1)}% of loan amount</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}







