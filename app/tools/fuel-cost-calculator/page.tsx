'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Fuel, DollarSign, Gauge } from 'lucide-react'

export default function FuelCostCalculator() {
  const [distance, setDistance] = useState('300')
  const [fuelPrice, setFuelPrice] = useState('3.50')
  const [mpg, setMpg] = useState('28')
  
  const [result, setResult] = useState<{
    fuelNeeded: number
    totalCost: number
    costPerMile: number
  } | null>(null)

  const calculate = () => {
    const dist = parseFloat(distance)
    const price = parseFloat(fuelPrice)
    const efficiency = parseFloat(mpg)

    if (dist <= 0 || price <= 0 || efficiency <= 0) return

    const fuelNeeded = dist / efficiency
    const totalCost = fuelNeeded * price
    const costPerMile = totalCost / dist

    setResult({
      fuelNeeded,
      totalCost,
      costPerMile
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <Fuel className="mr-3 h-10 w-10 text-primary" />
          Fuel Cost Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate trip fuel costs and consumption
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="distance">Distance (miles)</Label>
              <Input
                id="distance"
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Fuel Price ($/gallon)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mpg">Fuel Efficiency (MPG)</Label>
              <div className="relative">
                <Gauge className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mpg"
                  type="number"
                  step="0.1"
                  value={mpg}
                  onChange={(e) => setMpg(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button onClick={calculate} className="w-full">
              Calculate Cost
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Fuel Cost</p>
                <p className="text-5xl font-bold text-primary">
                  ${result.totalCost.toFixed(2)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-muted rounded">
                  <span className="text-sm">Fuel Needed</span>
                  <span className="font-bold">{result.fuelNeeded.toFixed(2)} gal</span>
                </div>

                <div className="flex justify-between p-3 bg-muted rounded">
                  <span className="text-sm">Cost Per Mile</span>
                  <span className="font-bold">${result.costPerMile.toFixed(3)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}






