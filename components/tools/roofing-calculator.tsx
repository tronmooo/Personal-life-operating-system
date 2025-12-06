'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Home } from 'lucide-react'

export function RoofingCalculator() {
  const [roofLength, setRoofLength] = useState('')
  const [roofWidth, setRoofWidth] = useState('')
  const [roofPitch, setRoofPitch] = useState('4/12')
  const [wasteFactor, setWasteFactor] = useState('10')
  const [pricePerSquare, setPricePerSquare] = useState('')
  const [result, setResult] = useState<{
    totalArea: number
    squares: number
    squaresWithWaste: number
    estimatedCost: number
  } | null>(null)

  const calculateRoofing = () => {
    if (!roofLength || !roofWidth) return

    const length = parseFloat(roofLength)
    const width = parseFloat(roofWidth)
    const waste = parseFloat(wasteFactor) / 100
    const price = parseFloat(pricePerSquare) || 0

    // Calculate pitch multiplier
    const pitchMap: Record<string, number> = {
      '3/12': 1.031,
      '4/12': 1.054,
      '5/12': 1.083,
      '6/12': 1.118,
      '7/12': 1.158,
      '8/12': 1.202,
      '9/12': 1.250,
      '10/12': 1.302,
      '12/12': 1.414
    }
    const pitchMultiplier = pitchMap[roofPitch] || 1.054

    // Calculate area (1 square = 100 sq ft)
    const baseArea = length * width
    const totalArea = baseArea * pitchMultiplier
    const squares = totalArea / 100
    const squaresWithWaste = squares * (1 + waste)
    const estimatedCost = squaresWithWaste * price

    setResult({
      totalArea: Math.round(totalArea),
      squares: Math.round(squares * 10) / 10,
      squaresWithWaste: Math.ceil(squaresWithWaste * 10) / 10,
      estimatedCost: Math.round(estimatedCost)
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="length">Roof Length (feet)</Label>
          <Input
            id="length"
            type="number"
            placeholder="e.g., 40"
            value={roofLength}
            onChange={(e) => setRoofLength(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="width">Roof Width (feet)</Label>
          <Input
            id="width"
            type="number"
            placeholder="e.g., 30"
            value={roofWidth}
            onChange={(e) => setRoofWidth(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pitch">Roof Pitch</Label>
          <Select value={roofPitch} onValueChange={setRoofPitch}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3/12">3:12 (Low Slope)</SelectItem>
              <SelectItem value="4/12">4:12 (Standard)</SelectItem>
              <SelectItem value="5/12">5:12</SelectItem>
              <SelectItem value="6/12">6:12 (Common)</SelectItem>
              <SelectItem value="7/12">7:12</SelectItem>
              <SelectItem value="8/12">8:12 (Steep)</SelectItem>
              <SelectItem value="9/12">9:12</SelectItem>
              <SelectItem value="10/12">10:12</SelectItem>
              <SelectItem value="12/12">12:12 (Very Steep)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Pitch affects total area</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="waste">Waste Factor (%)</Label>
          <Input
            id="waste"
            type="number"
            placeholder="e.g., 10"
            value={wasteFactor}
            onChange={(e) => setWasteFactor(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Typical: 10-15%</p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="price">Price Per Square (optional)</Label>
          <Input
            id="price"
            type="number"
            placeholder="e.g., 350"
            value={pricePerSquare}
            onChange={(e) => setPricePerSquare(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">1 square = 100 sq ft of roofing</p>
        </div>
      </div>

      <Button onClick={calculateRoofing} className="w-full">
        <Home className="mr-2 h-4 w-4" />
        Calculate Roofing
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200">
            <CardHeader>
              <CardTitle>Roofing Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center pb-4 border-b">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {result.squaresWithWaste}
                </div>
                <p className="text-muted-foreground">Squares Needed (with waste)</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.squares} squares + {(result.squaresWithWaste - result.squares).toFixed(1)} waste
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{result.totalArea}</div>
                  <p className="text-xs text-muted-foreground">Total Area (sq ft)</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{result.squares}</div>
                  <p className="text-xs text-muted-foreground">Base Squares</p>
                </div>
              </div>

              {result.estimatedCost > 0 && (
                <div className="pt-4 border-t text-center">
                  <p className="text-sm text-muted-foreground mb-2">Estimated Material Cost</p>
                  <div className="text-4xl font-bold text-green-600">
                    ${result.estimatedCost.toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              <p><strong>Important Notes:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>This estimates shingle/material quantity only</li>
                <li>Labor typically costs $100-$300 per square</li>
                <li>Add costs for underlayment, flashing, ridge caps, etc.</li>
                <li>Complex roofs may require professional measurement</li>
                <li>Get multiple quotes from licensed contractors</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
