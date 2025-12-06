'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Home, DollarSign, Calendar, TrendingUp } from 'lucide-react'

export default function RentVsBuyCalculator() {
  const [homePrice, setHomePrice] = useState('300000')
  const [downPayment, setDownPayment] = useState('60000')
  const [interestRate, setInterestRate] = useState('6.5')
  const [loanTerm, setLoanTerm] = useState('30')
  const [propertyTax, setPropertyTax] = useState('3000')
  const [homeInsurance, setHomeInsurance] = useState('1200')
  const [hoa, setHOA] = useState('0')
  const [maintenance, setMaintenance] = useState('3000')
  const [monthlyRent, setMonthlyRent] = useState('2000')
  const [rentersInsurance, setRentersInsurance] = useState('200')
  const [years, setYears] = useState('5')
  
  const [result, setResult] = useState<{
    monthlyMortgage: number
    totalMonthlyBuying: number
    totalMonthlRenting: number
    totalCostBuying: number
    totalCostRenting: number
    breakEvenYears: number
    recommendation: string
  } | null>(null)

  const calculateRentVsBuy = () => {
    const price = parseFloat(homePrice)
    const down = parseFloat(downPayment)
    const rate = parseFloat(interestRate) / 100 / 12
    const term = parseFloat(loanTerm) * 12
    const propTax = parseFloat(propertyTax)
    const insurance = parseFloat(homeInsurance)
    const hoaFee = parseFloat(hoa)
    const maint = parseFloat(maintenance)
    const rent = parseFloat(monthlyRent)
    const renterIns = parseFloat(rentersInsurance)
    const timeYears = parseFloat(years)

    // Calculate monthly mortgage payment
    const principal = price - down
    const monthlyMortgage = (principal * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1)

    // Total monthly costs for buying
    const monthlyPropertyTax = propTax / 12
    const monthlyInsurance = insurance / 12
    const monthlyMaintenance = maint / 12
    const totalMonthlyBuying = monthlyMortgage + monthlyPropertyTax + monthlyInsurance + hoaFee + monthlyMaintenance

    // Total monthly costs for renting
    const monthlyRenterInsurance = renterIns / 12
    const totalMonthlyRenting = rent + monthlyRenterInsurance

    // Total costs over time period
    const totalCostBuying = down + (totalMonthlyBuying * 12 * timeYears)
    const totalCostRenting = totalMonthlyRenting * 12 * timeYears

    // Calculate break-even point
    const monthlySavings = totalMonthlyBuying - totalMonthlyRenting
    const breakEvenYears = monthlySavings !== 0 ? down / Math.abs(monthlySavings) / 12 : 0

    // Recommendation
    let recommendation = ''
    if (totalCostBuying < totalCostRenting) {
      recommendation = `Buying is ${((totalCostRenting - totalCostBuying) / totalCostRenting * 100).toFixed(1)}% cheaper over ${timeYears} years`
    } else {
      recommendation = `Renting is ${((totalCostBuying - totalCostRenting) / totalCostBuying * 100).toFixed(1)}% cheaper over ${timeYears} years`
    }

    setResult({
      monthlyMortgage,
      totalMonthlyBuying,
      totalMonthlRenting: totalMonthlyRenting,
      totalCostBuying,
      totalCostRenting,
      breakEvenYears,
      recommendation
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <Home className="mr-3 h-10 w-10 text-primary" />
          Rent vs Buy Calculator
        </h1>
        <p className="text-muted-foreground">
          Compare the total costs of renting versus buying a home
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buying Costs</CardTitle>
              <CardDescription>Enter home purchase details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Home Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      value={homePrice}
                      onChange={(e) => setHomePrice(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="down">Down Payment</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="down"
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Interest Rate (%)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="term">Loan Term (years)</Label>
                  <Input
                    id="term"
                    type="number"
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax">Property Tax (yearly)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tax"
                      type="number"
                      value={propertyTax}
                      onChange={(e) => setPropertyTax(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance">Home Insurance (yearly)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="insurance"
                      type="number"
                      value={homeInsurance}
                      onChange={(e) => setHomeInsurance(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hoa">HOA Fee (monthly)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hoa"
                      type="number"
                      value={hoa}
                      onChange={(e) => setHOA(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance">Maintenance (yearly)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="maintenance"
                      type="number"
                      value={maintenance}
                      onChange={(e) => setMaintenance(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Renting Costs</CardTitle>
              <CardDescription>Enter rental details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rent">Monthly Rent</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rent"
                      type="number"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="renterIns">Renter's Insurance (yearly)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="renterIns"
                      type="number"
                      value={rentersInsurance}
                      onChange={(e) => setRentersInsurance(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Period</CardTitle>
              <CardDescription>How long do you plan to stay?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="years">Years</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="years"
                    type="number"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={calculateRentVsBuy} className="w-full">
            Compare Rent vs Buy
          </Button>
        </div>

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparison Results</CardTitle>
                <CardDescription>Total costs over {years} years</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    Recommendation:
                  </p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                    {result.recommendation}
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Buying</p>
                    <p className="text-3xl font-bold text-primary">
                      ${result.totalCostBuying.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ${result.totalMonthlyBuying.toFixed(0)}/month
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Renting</p>
                    <p className="text-3xl font-bold text-primary">
                      ${result.totalCostRenting.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ${result.totalMonthlRenting.toFixed(0)}/month
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Break-Even Point</p>
                    <p className="text-3xl font-bold text-primary">
                      {result.breakEvenYears.toFixed(1)} years
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Mortgage:</span>
                    <span className="font-medium">${result.monthlyMortgage.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Monthly (Buy):</span>
                    <span className="font-medium">${result.totalMonthlyBuying.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Monthly (Rent):</span>
                    <span className="font-medium">${result.totalMonthlRenting.toFixed(0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Important Considerations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong>Not Included:</strong> Home appreciation, tax deductions, opportunity cost 
                  of down payment, closing costs, and selling costs.
                </p>
                <p>
                  <strong>Equity Building:</strong> When buying, you build equity as you pay down 
                  the mortgage principal.
                </p>
                <p>
                  <strong>Flexibility:</strong> Renting offers more flexibility to move, while buying 
                  ties you to a location.
                </p>
                <p>
                  <strong>Market Conditions:</strong> Consider local real estate market trends and 
                  your personal financial situation.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}






