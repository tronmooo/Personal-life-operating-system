'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Heart, DollarSign } from 'lucide-react'

interface Category {
  name: string
  percentage: number
  amount: number
}

export default function WeddingBudgetCalculator() {
  const [totalBudget, setTotalBudget] = useState('30000')
  const [guests, setGuests] = useState('100')
  const [breakdown, setBreakdown] = useState<Category[] | null>(null)

  const categories = [
    { name: 'Venue & Catering', percentage: 45 },
    { name: 'Photography & Video', percentage: 12 },
    { name: 'Flowers & Decor', percentage: 10 },
    { name: 'Music & Entertainment', percentage: 10 },
    { name: 'Attire & Beauty', percentage: 8 },
    { name: 'Invitations & Stationery', percentage: 3 },
    { name: 'Wedding Cake', percentage: 2 },
    { name: 'Transportation', percentage: 3 },
    { name: 'Favors & Gifts', percentage: 2 },
    { name: 'Miscellaneous', percentage: 5 },
  ]

  const calculate = () => {
    const budget = parseFloat(totalBudget)
    const breakdown = categories.map(cat => ({
      ...cat,
      amount: (budget * cat.percentage) / 100
    }))
    setBreakdown(breakdown)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <Heart className="mr-3 h-10 w-10 text-pink-500" />
          Wedding Budget Calculator
        </h1>
        <p className="text-muted-foreground">
          Plan your wedding budget with recommended allocations
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Total Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="budget"
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guests">Number of Guests</Label>
              <Input
                id="guests"
                type="number"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              />
            </div>

            <Button onClick={calculate} className="w-full">
              Calculate Budget
            </Button>
          </CardContent>
        </Card>

        {breakdown && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recommended Budget Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-pink-50 dark:bg-pink-900/10 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">Cost Per Guest</p>
                <p className="text-3xl font-bold text-pink-600">
                  ${(parseFloat(totalBudget) / parseFloat(guests)).toFixed(0)}
                </p>
              </div>

              {breakdown.map((cat, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded">
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.percentage}% of budget</p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    ${cat.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}






