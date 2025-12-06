'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Grid3x3 } from 'lucide-react'

export function TileCalculator() {
  const [roomLength, setRoomLength] = useState('')
  const [roomWidth, setRoomWidth] = useState('')
  const [tileLength, setTileLength] = useState('12')
  const [tileWidth, setTileWidth] = useState('12')
  const [wasteFactor, setWasteFactor] = useState('10')
  const [pricePerTile, setPricePerTile] = useState('')
  const [result, setResult] = useState<{
    roomArea: number
    tileArea: number
    tilesNeeded: number
    tilesWithWaste: number
    totalCost: number
  } | null>(null)

  const calculateTiles = () => {
    if (!roomLength || !roomWidth || !tileLength || !tileWidth) return

    const roomL = parseFloat(roomLength)
    const roomW = parseFloat(roomWidth)
    const tileL = parseFloat(tileLength) / 12 // Convert inches to feet
    const tileW = parseFloat(tileWidth) / 12
    const waste = parseFloat(wasteFactor) / 100
    const price = parseFloat(pricePerTile) || 0

    const roomArea = roomL * roomW
    const tileArea = tileL * tileW
    const tilesNeeded = Math.ceil(roomArea / tileArea)
    const tilesWithWaste = Math.ceil(tilesNeeded * (1 + waste))
    const totalCost = tilesWithWaste * price

    setResult({
      roomArea,
      tileArea,
      tilesNeeded,
      tilesWithWaste,
      totalCost
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rlength">Room Length (feet)</Label>
          <Input
            id="rlength"
            type="number"
            placeholder="e.g., 10"
            value={roomLength}
            onChange={(e) => setRoomLength(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rwidth">Room Width (feet)</Label>
          <Input
            id="rwidth"
            type="number"
            placeholder="e.g., 12"
            value={roomWidth}
            onChange={(e) => setRoomWidth(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tlength">Tile Length (inches)</Label>
          <Input
            id="tlength"
            type="number"
            placeholder="e.g., 12"
            value={tileLength}
            onChange={(e) => setTileLength(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twidth">Tile Width (inches)</Label>
          <Input
            id="twidth"
            type="number"
            placeholder="e.g., 12"
            value={tileWidth}
            onChange={(e) => setTileWidth(e.target.value)}
          />
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

        <div className="space-y-2">
          <Label htmlFor="price">Price Per Tile (optional)</Label>
          <Input
            id="price"
            type="number"
            placeholder="e.g., 3.50"
            value={pricePerTile}
            onChange={(e) => setPricePerTile(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={calculateTiles} className="w-full">
        <Grid3x3 className="mr-2 h-4 w-4" />
        Calculate Tiles Needed
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200">
            <CardHeader>
              <CardTitle>Tile Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center pb-4 border-b">
                <div className="text-5xl font-bold text-orange-600 mb-2">
                  {result.tilesWithWaste}
                </div>
                <p className="text-muted-foreground">Tiles Needed (with waste)</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.tilesNeeded} tiles + {result.tilesWithWaste - result.tilesNeeded} waste
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.roomArea.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Room Area (sq ft)</p>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{result.tileArea.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Tile Area (sq ft)</p>
                </div>
              </div>

              {result.totalCost > 0 && (
                <div className="pt-4 border-t text-center">
                  <p className="text-sm text-muted-foreground mb-2">Estimated Cost</p>
                  <div className="text-4xl font-bold text-green-600">
                    ${result.totalCost.toFixed(2)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              <p><strong>Installation Tips:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Order extra tiles for future repairs and pattern matching</li>
                <li>Complex patterns may require higher waste factor (15-20%)</li>
                <li>Consider tile direction and layout before purchasing</li>
                <li>Don't forget grout, thinset, and other installation materials</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
