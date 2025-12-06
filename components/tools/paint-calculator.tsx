'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Paintbrush } from 'lucide-react'

export function PaintCalculator() {
  const [roomLength, setRoomLength] = useState('')
  const [roomWidth, setRoomWidth] = useState('')
  const [wallHeight, setWallHeight] = useState('8')
  const [coats, setCoats] = useState('2')
  const [doors, setDoors] = useState('1')
  const [windows, setWindows] = useState('1')
  const [coverage, setCoverage] = useState('350')
  const [result, setResult] = useState<{
    totalArea: number
    paintableArea: number
    gallonsNeeded: number
    quartsNeeded: number
    estimatedCost: number
  } | null>(null)

  const calculatePaint = () => {
    if (!roomLength || !roomWidth || !wallHeight) return

    const length = parseFloat(roomLength)
    const width = parseFloat(roomWidth)
    const height = parseFloat(wallHeight)
    const numCoats = parseInt(coats)
    const numDoors = parseInt(doors)
    const numWindows = parseInt(windows)
    const sqFtPerGallon = parseFloat(coverage)

    // Calculate wall area
    const wallArea = 2 * (length + width) * height

    // Subtract doors and windows (average sizes)
    const doorArea = numDoors * 21 // 7ft x 3ft
    const windowArea = numWindows * 15 // 5ft x 3ft
    const paintableArea = wallArea - doorArea - windowArea

    // Account for coats
    const totalAreaToPaint = paintableArea * numCoats

    // Calculate gallons needed
    const gallonsNeeded = Math.ceil((totalAreaToPaint / sqFtPerGallon) * 10) / 10
    const quartsNeeded = Math.ceil(gallonsNeeded * 4)

    // Estimate cost ($30 per gallon average)
    const estimatedCost = Math.ceil(gallonsNeeded) * 30

    setResult({
      totalArea: Math.round(wallArea),
      paintableArea: Math.round(paintableArea),
      gallonsNeeded,
      quartsNeeded,
      estimatedCost
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="length">Room Length (feet)</Label>
          <Input
            id="length"
            type="number"
            placeholder="e.g., 12"
            value={roomLength}
            onChange={(e) => setRoomLength(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="width">Room Width (feet)</Label>
          <Input
            id="width"
            type="number"
            placeholder="e.g., 10"
            value={roomWidth}
            onChange={(e) => setRoomWidth(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">Wall Height (feet)</Label>
          <Input
            id="height"
            type="number"
            placeholder="e.g., 8"
            value={wallHeight}
            onChange={(e) => setWallHeight(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coats">Number of Coats</Label>
          <Select value={coats} onValueChange={setCoats}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Coat</SelectItem>
              <SelectItem value="2">2 Coats (Recommended)</SelectItem>
              <SelectItem value="3">3 Coats</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="doors">Number of Doors</Label>
          <Input
            id="doors"
            type="number"
            value={doors}
            onChange={(e) => setDoors(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="windows">Number of Windows</Label>
          <Input
            id="windows"
            type="number"
            value={windows}
            onChange={(e) => setWindows(e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="coverage">Coverage (sq ft/gallon)</Label>
          <Input
            id="coverage"
            type="number"
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Standard: 350-400 sq ft per gallon</p>
        </div>
      </div>

      <Button onClick={calculatePaint} className="w-full">
        <Paintbrush className="mr-2 h-4 w-4" />
        Calculate Paint Needed
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200">
            <CardHeader>
              <CardTitle>Paint Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-4xl font-bold text-purple-600">{result.gallonsNeeded}</div>
                  <p className="text-sm text-muted-foreground">Gallons</p>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-4xl font-bold text-blue-600">{result.quartsNeeded}</div>
                  <p className="text-sm text-muted-foreground">Quarts</p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between p-2">
                  <span className="text-muted-foreground">Total Wall Area:</span>
                  <span className="font-semibold">{result.totalArea} sq ft</span>
                </div>
                <div className="flex justify-between p-2">
                  <span className="text-muted-foreground">Paintable Area:</span>
                  <span className="font-semibold">{result.paintableArea} sq ft</span>
                </div>
                <div className="flex justify-between p-2">
                  <span className="text-muted-foreground">Estimated Cost:</span>
                  <span className="font-semibold text-green-600">${result.estimatedCost}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              <p><strong>Pro Tips:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Always buy 10-15% extra paint for touch-ups and mistakes</li>
                <li>One gallon covers approximately 350-400 sq ft with one coat</li>
                <li>Primer may require less paint than finish coats</li>
                <li>Darker colors may need more coats for full coverage</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
