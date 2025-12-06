'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp, DollarSign, Bell } from 'lucide-react'

export function PriceTracker() {
  const [productUrl, setProductUrl] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [tracking, setTracking] = useState(false)
  const [priceData, setPriceData] = useState<{
    currentPrice: number
    lowestPrice: number
    highestPrice: number
    averagePrice: number
    priceHistory: Array<{ date: string; price: number }>
    recommendation: string
  } | null>(null)

  const trackPrice = () => {
    setTracking(true)

    setTimeout(() => {
      const current = 299.99
      setPriceData({
        currentPrice: current,
        lowestPrice: 249.99,
        highestPrice: 349.99,
        averagePrice: 289.99,
        priceHistory: [
          { date: 'Oct 1', price: 329.99 },
          { date: 'Oct 5', price: 319.99 },
          { date: 'Oct 10', price: 299.99 },
          { date: 'Oct 15', price: 289.99 },
          { date: 'Oct 20', price: 299.99 },
          { date: 'Today', price: current }
        ],
        recommendation: current < 290 ? 'Good time to buy - price is below average' : 'Wait for better price - currently above average'
      })
      setTracking(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            AI Price Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Track product prices across retailers and get notified when prices drop.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Product URL</Label>
              <Input
                id="url"
                placeholder="https://www.amazon.com/product..."
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Price (optional)</Label>
              <Input
                id="target"
                type="number"
                placeholder="e.g., 250"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">We'll notify you when price drops to this amount</p>
            </div>

            <Button
              onClick={trackPrice}
              className="w-full"
              disabled={!productUrl || tracking}
            >
              {tracking ? 'Tracking...' : 'Track This Product'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {priceData && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center pb-4 border-b">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  ${priceData.currentPrice}
                </div>
                <p className="text-muted-foreground">Current Price</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <TrendingDown className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-xl font-bold text-green-600">${priceData.lowestPrice}</div>
                  <p className="text-xs text-muted-foreground">Lowest (30d)</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-red-600" />
                  <div className="text-xl font-bold text-red-600">${priceData.highestPrice}</div>
                  <p className="text-xs text-muted-foreground">Highest (30d)</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-xl font-bold text-blue-600">${priceData.averagePrice}</div>
                  <p className="text-xs text-muted-foreground">Average (30d)</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className={`p-4 rounded-lg ${priceData.currentPrice < priceData.averagePrice ? 'bg-green-50 dark:bg-green-950/20' : 'bg-yellow-50 dark:bg-yellow-950/20'}`}>
                  <p className="font-semibold mb-1">
                    {priceData.currentPrice < priceData.averagePrice ? '✓ Good Deal!' : '⏳ Wait for Better Price'}
                  </p>
                  <p className="text-sm text-muted-foreground">{priceData.recommendation}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Price History (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {priceData.priceHistory.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm font-medium">{entry.date}</span>
                    <Badge variant={entry.price === priceData.lowestPrice ? 'default' : 'outline'}>
                      ${entry.price}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 flex items-start gap-3">
              <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Price Alert Active</p>
                <p className="text-sm text-muted-foreground">
                  We'll email you when the price drops {targetPrice ? `to $${targetPrice} or lower` : 'significantly'}.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
