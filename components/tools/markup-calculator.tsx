'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TrendingUp, DollarSign } from 'lucide-react'

export function MarkupCalculator() {
  const [cost, setCost] = useState('')
  const [markup, setMarkup] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [calculateFrom, setCalculateFrom] = useState<'markup' | 'price'>('markup')
  const [result, setResult] = useState<{
    cost: number
    markup: number
    margin: number
    sellingPrice: number
    profit: number
  } | null>(null)

  const calculateMarkup = () => {
    const costValue = parseFloat(cost)
    if (!costValue) return

    if (calculateFrom === 'markup') {
      const markupValue = parseFloat(markup) || 0
      const price = costValue * (1 + markupValue / 100)
      const profit = price - costValue
      const margin = (profit / price) * 100

      setResult({
        cost: costValue,
        markup: markupValue,
        margin: Math.round(margin * 100) / 100,
        sellingPrice: Math.round(price * 100) / 100,
        profit: Math.round(profit * 100) / 100
      })
    } else {
      const priceValue = parseFloat(sellingPrice)
      const profit = priceValue - costValue
      const markupValue = (profit / costValue) * 100
      const margin = (profit / priceValue) * 100

      setResult({
        cost: costValue,
        markup: Math.round(markupValue * 100) / 100,
        margin: Math.round(margin * 100) / 100,
        sellingPrice: priceValue,
        profit: Math.round(profit * 100) / 100
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cost">Cost (Your Expense)</Label>
          <Input
            id="cost"
            type="number"
            placeholder="e.g., 50"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Calculate From</Label>
          <div className="flex gap-2">
            <Button
              variant={calculateFrom === 'markup' ? 'default' : 'outline'}
              onClick={() => setCalculateFrom('markup')}
              className="flex-1"
            >
              Markup %
            </Button>
            <Button
              variant={calculateFrom === 'price' ? 'default' : 'outline'}
              onClick={() => setCalculateFrom('price')}
              className="flex-1"
            >
              Selling Price
            </Button>
          </div>
        </div>

        {calculateFrom === 'markup' ? (
          <div className="space-y-2">
            <Label htmlFor="markup">Markup Percentage (%)</Label>
            <Input
              id="markup"
              type="number"
              placeholder="e.g., 50"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Markup on cost</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="price">Selling Price</Label>
            <Input
              id="price"
              type="number"
              placeholder="e.g., 75"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
            />
          </div>
        )}
      </div>

      <Button onClick={calculateMarkup} className="w-full">
        <TrendingUp className="mr-2 h-4 w-4" />
        Calculate
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{formatCurrency(result.cost)}</div>
                  <p className="text-sm text-muted-foreground">Cost</p>
                </div>
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{formatCurrency(result.sellingPrice)}</div>
                  <p className="text-sm text-muted-foreground">Selling Price</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.markup}%</div>
                  <p className="text-xs text-muted-foreground">Markup</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{result.margin}%</div>
                  <p className="text-xs text-muted-foreground">Margin</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(result.profit)}</div>
                  <p className="text-xs text-muted-foreground">Profit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
              <p><strong>Key Differences:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Markup:</strong> Percentage added to cost (Profit / Cost × 100)</li>
                <li><strong>Margin:</strong> Percentage of selling price that is profit (Profit / Price × 100)</li>
                <li>Markup is always higher than margin for the same product</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
