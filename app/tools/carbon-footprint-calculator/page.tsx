'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Leaf, Car, Home, Plane, ShoppingBag } from 'lucide-react'

export default function CarbonFootprintCalculator() {
  // Transportation
  const [carMiles, setCarMiles] = useState('12000')
  const [carType, setCarType] = useState('average')
  const [flightHours, setFlightHours] = useState('10')
  const [publicTransit, setPublicTransit] = useState('50')

  // Home
  const [electricityKwh, setElectricityKwh] = useState('900')
  const [naturalGas, setNaturalGas] = useState('50')
  const [homeSize, setHomeSize] = useState('medium')

  // Diet
  const [diet, setDiet] = useState('average')

  // Shopping
  const [shopping, setShopping] = useState('average')

  const [result, setResult] = useState<{
    transportation: number
    home: number
    food: number
    goods: number
    total: number
    comparison: string
  } | null>(null)

  const calculateFootprint = () => {
    // Transportation (tons CO2/year)
    const carFactors: any = {
      'small': 0.24, // kg CO2 per mile
      'average': 0.35,
      'suv': 0.45,
      'electric': 0.08
    }
    const carEmissions = (parseFloat(carMiles) * carFactors[carType]) / 1000 // convert to tons
    const flightEmissions = parseFloat(flightHours) * 0.18 // 0.18 tons per hour
    const transitEmissions = parseFloat(publicTransit) * 0.14 / 1000 // kg per mile to tons

    const transportationTotal = carEmissions + flightEmissions + transitEmissions

    // Home energy (tons CO2/year)
    const electricityEmissions = parseFloat(electricityKwh) * 12 * 0.92 / 2000 // lbs to tons
    const gasEmissions = parseFloat(naturalGas) * 12 * 11.7 / 2000 // therms to lbs to tons
    const sizeFactors: any = { 'small': 0.8, 'medium': 1.0, 'large': 1.3 }
    const homeTotal = (electricityEmissions + gasEmissions) * sizeFactors[homeSize]

    // Diet (tons CO2/year)
    const dietFactors: any = {
      'vegan': 1.5,
      'vegetarian': 1.7,
      'pescatarian': 2.0,
      'average': 2.5,
      'meat-heavy': 3.3
    }
    const foodTotal = dietFactors[diet]

    // Goods & Services (tons CO2/year)
    const shoppingFactors: any = {
      'minimal': 0.5,
      'low': 1.0,
      'average': 1.5,
      'high': 2.5
    }
    const goodsTotal = shoppingFactors[shopping]

    const total = transportationTotal + homeTotal + foodTotal + goodsTotal

    // Comparison (US average is ~16 tons, global average is ~4 tons)
    let comparison = ''
    if (total < 4) {
      comparison = 'Well below global average (4 tons) - Excellent!'
    } else if (total < 8) {
      comparison = 'Below average - Good job!'
    } else if (total < 16) {
      comparison = 'Around US average (16 tons)'
    } else {
      comparison = 'Above average - Consider reducing'
    }

    setResult({
      transportation: transportationTotal,
      home: homeTotal,
      food: foodTotal,
      goods: goodsTotal,
      total,
      comparison
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <Leaf className="mr-3 h-10 w-10 text-green-600" />
          Carbon Footprint Calculator
        </h1>
        <p className="text-muted-foreground">
          Estimate your annual carbon footprint and environmental impact
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="mr-2 h-5 w-5" />
                Transportation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carMiles">Annual Car Miles</Label>
                  <Input
                    id="carMiles"
                    type="number"
                    value={carMiles}
                    onChange={(e) => setCarMiles(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Car Type</Label>
                  <Select value={carType} onValueChange={setCarType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small/Compact</SelectItem>
                      <SelectItem value="average">Average Car</SelectItem>
                      <SelectItem value="suv">SUV/Truck</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flights">Flight Hours (yearly)</Label>
                  <Input
                    id="flights"
                    type="number"
                    value={flightHours}
                    onChange={(e) => setFlightHours(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transit">Public Transit (miles/month)</Label>
                  <Input
                    id="transit"
                    type="number"
                    value={publicTransit}
                    onChange={(e) => setPublicTransit(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="mr-2 h-5 w-5" />
                Home Energy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="electricity">Electricity (kWh/month)</Label>
                  <Input
                    id="electricity"
                    type="number"
                    value={electricityKwh}
                    onChange={(e) => setElectricityKwh(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gas">Natural Gas (therms/month)</Label>
                  <Input
                    id="gas"
                    type="number"
                    value={naturalGas}
                    onChange={(e) => setNaturalGas(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Home Size</Label>
                  <Select value={homeSize} onValueChange={setHomeSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (&lt;1000 sqft)</SelectItem>
                      <SelectItem value="medium">Medium (1000-2000 sqft)</SelectItem>
                      <SelectItem value="large">Large (&gt;2000 sqft)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Diet & Shopping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Diet Type</Label>
                  <Select value={diet} onValueChange={setDiet}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="pescatarian">Pescatarian</SelectItem>
                      <SelectItem value="average">Average/Balanced</SelectItem>
                      <SelectItem value="meat-heavy">Meat Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Shopping Habits</Label>
                  <Select value={shopping} onValueChange={setShopping}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={calculateFootprint} className="w-full" size="lg">
            Calculate My Carbon Footprint
          </Button>
        </div>

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Results</CardTitle>
                <CardDescription>Annual CO₂ emissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-muted-foreground mb-1">Total Carbon Footprint</p>
                  <p className="text-5xl font-bold text-green-600">
                    {result.total.toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">tons CO₂/year</p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-300">
                    {result.comparison}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span className="text-sm">🚗 Transportation</span>
                    <span className="font-bold">{result.transportation.toFixed(1)}t</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span className="text-sm">🏠 Home</span>
                    <span className="font-bold">{result.home.toFixed(1)}t</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span className="text-sm">🍽️ Food</span>
                    <span className="font-bold">{result.food.toFixed(1)}t</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded">
                    <span className="text-sm">🛍️ Goods</span>
                    <span className="font-bold">{result.goods.toFixed(1)}t</span>
                  </div>
                </div>

                <div className="pt-4 border-t text-xs text-muted-foreground space-y-2">
                  <p><strong>Global Average:</strong> 4 tons/year</p>
                  <p><strong>US Average:</strong> 16 tons/year</p>
                  <p><strong>Target (Paris Agreement):</strong> &lt;2 tons/year by 2050</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reduction Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p>• Walk, bike, or use public transit</p>
                <p>• Drive an electric or hybrid vehicle</p>
                <p>• Reduce air travel</p>
                <p>• Use renewable energy at home</p>
                <p>• Eat more plant-based meals</p>
                <p>• Buy less, reuse more</p>
                <p>• Improve home insulation</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}






