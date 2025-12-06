'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowLeftRight, Ruler } from 'lucide-react'

type UnitCategory = 'length' | 'weight' | 'temperature' | 'volume' | 'area' | 'speed'

const unitData = {
  length: {
    name: 'Length',
    units: [
      { code: 'mm', name: 'Millimeter', toBase: 0.001 },
      { code: 'cm', name: 'Centimeter', toBase: 0.01 },
      { code: 'm', name: 'Meter', toBase: 1 },
      { code: 'km', name: 'Kilometer', toBase: 1000 },
      { code: 'in', name: 'Inch', toBase: 0.0254 },
      { code: 'ft', name: 'Foot', toBase: 0.3048 },
      { code: 'yd', name: 'Yard', toBase: 0.9144 },
      { code: 'mi', name: 'Mile', toBase: 1609.34 },
    ],
  },
  weight: {
    name: 'Weight',
    units: [
      { code: 'mg', name: 'Milligram', toBase: 0.001 },
      { code: 'g', name: 'Gram', toBase: 1 },
      { code: 'kg', name: 'Kilogram', toBase: 1000 },
      { code: 'oz', name: 'Ounce', toBase: 28.3495 },
      { code: 'lb', name: 'Pound', toBase: 453.592 },
      { code: 'ton', name: 'Ton (US)', toBase: 907185 },
    ],
  },
  temperature: {
    name: 'Temperature',
    units: [
      { code: 'C', name: 'Celsius', toBase: 0 },
      { code: 'F', name: 'Fahrenheit', toBase: 0 },
      { code: 'K', name: 'Kelvin', toBase: 0 },
    ],
  },
  volume: {
    name: 'Volume',
    units: [
      { code: 'ml', name: 'Milliliter', toBase: 0.001 },
      { code: 'l', name: 'Liter', toBase: 1 },
      { code: 'cup', name: 'Cup (US)', toBase: 0.236588 },
      { code: 'pt', name: 'Pint (US)', toBase: 0.473176 },
      { code: 'qt', name: 'Quart (US)', toBase: 0.946353 },
      { code: 'gal', name: 'Gallon (US)', toBase: 3.78541 },
      { code: 'floz', name: 'Fluid Ounce', toBase: 0.0295735 },
    ],
  },
  area: {
    name: 'Area',
    units: [
      { code: 'mm2', name: 'Square Millimeter', toBase: 0.000001 },
      { code: 'cm2', name: 'Square Centimeter', toBase: 0.0001 },
      { code: 'm2', name: 'Square Meter', toBase: 1 },
      { code: 'km2', name: 'Square Kilometer', toBase: 1000000 },
      { code: 'in2', name: 'Square Inch', toBase: 0.00064516 },
      { code: 'ft2', name: 'Square Foot', toBase: 0.092903 },
      { code: 'ac', name: 'Acre', toBase: 4046.86 },
    ],
  },
  speed: {
    name: 'Speed',
    units: [
      { code: 'mps', name: 'Meters/Second', toBase: 1 },
      { code: 'kph', name: 'Kilometers/Hour', toBase: 0.277778 },
      { code: 'mph', name: 'Miles/Hour', toBase: 0.44704 },
      { code: 'fps', name: 'Feet/Second', toBase: 0.3048 },
      { code: 'knot', name: 'Knot', toBase: 0.514444 },
    ],
  },
}

export function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>('length')
  const [amount, setAmount] = useState('1')
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('ft')
  const [result, setResult] = useState<number | null>(null)

  const currentUnits = unitData[category].units

  const convertUnit = () => {
    const amt = parseFloat(amount)
    if (!amt && amt !== 0) return

    if (category === 'temperature') {
      // Special handling for temperature
      let celsius: number
      
      // Convert from unit to Celsius
      if (fromUnit === 'C') {
        celsius = amt
      } else if (fromUnit === 'F') {
        celsius = (amt - 32) * 5/9
      } else { // Kelvin
        celsius = amt - 273.15
      }

      // Convert from Celsius to target unit
      let converted: number
      if (toUnit === 'C') {
        converted = celsius
      } else if (toUnit === 'F') {
        converted = celsius * 9/5 + 32
      } else { // Kelvin
        converted = celsius + 273.15
      }

      setResult(converted)
    } else {
      // Standard conversion for other units
      const fromFactor = currentUnits.find((u) => u.code === fromUnit)?.toBase || 1
      const toFactor = currentUnits.find((u) => u.code === toUnit)?.toBase || 1

      const baseValue = amt * fromFactor
      const converted = baseValue / toFactor

      setResult(converted)
    }
  }

  const swapUnits = () => {
    const temp = fromUnit
    setFromUnit(toUnit)
    setToUnit(temp)
    if (result !== null) {
      setAmount(result.toString())
      convertUnit()
    }
  }

  // Update units when category changes
  const handleCategoryChange = (newCategory: UnitCategory) => {
    setCategory(newCategory)
    const firstUnit = unitData[newCategory].units[0].code
    const secondUnit = unitData[newCategory].units[1]?.code || firstUnit
    setFromUnit(firstUnit)
    setToUnit(secondUnit)
    setResult(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-6 w-6 text-purple-500" />
            Unit Converter
          </CardTitle>
          <CardDescription>
            Convert between different units of measurement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as UnitCategory)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              {Object.entries(unitData).map(([key, data]) => (
                <option key={key} value={key}>
                  {data.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="any"
              placeholder="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromUnit">From</Label>
            <select
              id="fromUnit"
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              {currentUnits.map((unit) => (
                <option key={unit.code} value={unit.code}>
                  {unit.name} ({unit.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={swapUnits}
              className="rounded-full"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toUnit">To</Label>
            <select
              id="toUnit"
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              {currentUnits.map((unit) => (
                <option key={unit.code} value={unit.code}>
                  {unit.name} ({unit.code})
                </option>
              ))}
            </select>
          </div>

          <Button onClick={convertUnit} className="w-full">
            Convert
          </Button>
        </CardContent>
      </Card>

      {result !== null && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Conversion Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {parseFloat(amount).toLocaleString()} {currentUnits.find((u) => u.code === fromUnit)?.name}
              </p>
              <p className="text-4xl font-bold text-primary">
                {result.toLocaleString('en-US', { maximumFractionDigits: 6 })}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {currentUnits.find((u) => u.code === toUnit)?.name}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Conversion Formula</h4>
              <p className="text-sm text-muted-foreground">
                {parseFloat(amount)} {fromUnit} = {result.toLocaleString('en-US', { maximumFractionDigits: 6 })} {toUnit}
              </p>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="font-semibold mb-3 text-sm">Common Conversions</h4>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {[0.1, 0.5, 1, 5, 10, 100].map((multiplier) => {
                  const baseAmt = parseFloat(amount) * multiplier
                  let converted: number

                  if (category === 'temperature') {
                    let celsius: number
                    if (fromUnit === 'C') celsius = baseAmt
                    else if (fromUnit === 'F') celsius = (baseAmt - 32) * 5/9
                    else celsius = baseAmt - 273.15

                    if (toUnit === 'C') converted = celsius
                    else if (toUnit === 'F') converted = celsius * 9/5 + 32
                    else converted = celsius + 273.15
                  } else {
                    const fromFactor = currentUnits.find((u) => u.code === fromUnit)?.toBase || 1
                    const toFactor = currentUnits.find((u) => u.code === toUnit)?.toBase || 1
                    converted = (baseAmt * fromFactor) / toFactor
                  }

                  return (
                    <div key={multiplier} className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">{baseAmt} {fromUnit}</span>
                      <span className="font-medium">{converted.toLocaleString('en-US', { maximumFractionDigits: 4 })} {toUnit}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}







