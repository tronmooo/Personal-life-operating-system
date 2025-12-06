'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DollarSign, Package, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function BreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = useState('10000')
  const [pricePerUnit, setPricePerUnit] = useState('50')
  const [costPerUnit, setCostPerUnit] = useState('30')
  const [result, setResult] = useState<{
    breakEvenUnits: number
    breakEvenRevenue: number
    contributionMargin: number
    contributionMarginRatio: number
    chartData: any[]
  } | null>(null)

  const calculateBreakEven = () => {
    const fixed = parseFloat(fixedCosts)
    const price = parseFloat(pricePerUnit)
    const cost = parseFloat(costPerUnit)

    if (fixed <= 0 || price <= 0 || cost < 0 || price <= cost) return

    const contributionMargin = price - cost
    const contributionMarginRatio = (contributionMargin / price) * 100
    const breakEvenUnits = Math.ceil(fixed / contributionMargin)
    const breakEvenRevenue = breakEvenUnits * price

    // Generate chart data
    const chartData = []
    for (let units = 0; units <= breakEvenUnits * 1.5; units += Math.ceil(breakEvenUnits / 10)) {
      chartData.push({
        units,
        revenue: units * price,
        costs: fixed + (units * cost),
        profit: (units * price) - (fixed + (units * cost))
      })
    }

    setResult({
      breakEvenUnits,
      breakEvenRevenue,
      contributionMargin,
      contributionMarginRatio,
      chartData
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <TrendingUp className="mr-3 h-10 w-10 text-primary" />
          Break-Even Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate when your business will break even and start making profit
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Business Costs</CardTitle>
            <CardDescription>Enter your cost structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fixed">Fixed Costs ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fixed"
                  type="number"
                  placeholder="10000"
                  value={fixedCosts}
                  onChange={(e) => setFixedCosts(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Rent, salaries, insurance, etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price Per Unit ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  placeholder="50"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Selling price per item
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Variable Cost Per Unit ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cost"
                  type="number"
                  placeholder="30"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Materials, shipping, commission per item
              </p>
            </div>

            <Button onClick={calculateBreakEven} className="w-full">
              Calculate Break-Even Point
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Break-Even Analysis</CardTitle>
                <CardDescription>When you'll start making profit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Break-Even Units</p>
                    <p className="text-3xl font-bold text-primary">
                      {result.breakEvenUnits.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">units to sell</p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Break-Even Revenue</p>
                    <p className="text-3xl font-bold text-primary">
                      ${result.breakEvenRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">total revenue needed</p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Contribution Margin</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${result.contributionMargin.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">per unit</p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Margin Ratio</p>
                    <p className="text-3xl font-bold text-green-600">
                      {result.contributionMarginRatio.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">of revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Break-Even Chart</CardTitle>
                <CardDescription>Revenue vs Costs over units sold</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={result.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="units"
                      label={{ value: 'Units Sold', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <ReferenceLine
                      x={result.breakEvenUnits}
                      stroke="#666"
                      strokeDasharray="3 3"
                      label="Break-Even Point"
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" strokeWidth={2} />
                    <Line type="monotone" dataKey="costs" stroke="#ef4444" name="Total Costs" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Understanding the Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong>Break-Even Point:</strong> You need to sell {result.breakEvenUnits.toLocaleString()} units 
                  to cover all your costs. After that, each unit sold generates ${result.contributionMargin.toFixed(2)} in profit.
                </p>
                <p>
                  <strong>Contribution Margin:</strong> Each unit sold contributes ${result.contributionMargin.toFixed(2)} 
                  toward covering fixed costs and generating profit.
                </p>
                <p>
                  <strong>Margin Ratio:</strong> {result.contributionMarginRatio.toFixed(1)}% of each sale goes toward 
                  fixed costs and profit after covering variable costs.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}






