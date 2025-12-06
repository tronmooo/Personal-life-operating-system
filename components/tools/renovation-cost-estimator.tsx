'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Home, DollarSign } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export function RenovationCostEstimator() {
  const [projectType, setProjectType] = useState<'kitchen' | 'bathroom' | 'bedroom' | 'basement' | 'custom'>('kitchen')
  const [squareFeet, setSquareFeet] = useState('')
  const [quality, setQuality] = useState<'budget' | 'mid-range' | 'high-end'>('mid-range')
  const [includeLaborpercent, setIncludeLabor] = useState(true)
  const [result, setResult] = useState<{
    materialCost: number
    laborCost: number
    totalCost: number
    pricePerSqFt: number
  } | null>(null)

  const calculateRenovation = () => {
    if (!squareFeet) return

    const sqFt = parseFloat(squareFeet)

    // Base cost per square foot by project type and quality
    const baseCosts: Record<string, Record<string, number>> = {
      kitchen: { budget: 75, 'mid-range': 150, 'high-end': 250 },
      bathroom: { budget: 100, 'mid-range': 175, 'high-end': 300 },
      bedroom: { budget: 50, 'mid-range': 100, 'high-end': 175 },
      basement: { budget: 40, 'mid-range': 75, 'high-end': 150 },
      custom: { budget: 50, 'mid-range': 100, 'high-end': 200 }
    }

    const pricePerSqFt = baseCosts[projectType][quality]
    const totalCostWithoutLabor = sqFt * pricePerSqFt

    // Labor is typically 40-50% of total cost
    const materialCost = includeLaborpercent ? totalCostWithoutLabor * 0.6 : totalCostWithoutLabor
    const laborCost = includeLaborpercent ? totalCostWithoutLabor * 0.4 : 0
    const totalCost = materialCost + laborCost

    setResult({
      materialCost: Math.round(materialCost),
      laborCost: Math.round(laborCost),
      totalCost: Math.round(totalCost),
      pricePerSqFt
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="project">Project Type</Label>
          <Select value={projectType} onValueChange={(value: any) => setProjectType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kitchen">Kitchen Remodel</SelectItem>
              <SelectItem value="bathroom">Bathroom Remodel</SelectItem>
              <SelectItem value="bedroom">Bedroom Remodel</SelectItem>
              <SelectItem value="basement">Basement Finish</SelectItem>
              <SelectItem value="custom">Custom Project</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sqft">Square Feet</Label>
          <Input
            id="sqft"
            type="number"
            placeholder="e.g., 120"
            value={squareFeet}
            onChange={(e) => setSquareFeet(e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="quality">Quality Level</Label>
          <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="budget">Budget (Basic materials)</SelectItem>
              <SelectItem value="mid-range">Mid-Range (Quality materials)</SelectItem>
              <SelectItem value="high-end">High-End (Premium materials)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 md:col-span-2">
          <Checkbox
            id="labor"
            checked={includeLaborpercent}
            onCheckedChange={(checked) => setIncludeLabor(checked as boolean)}
          />
          <Label htmlFor="labor" className="cursor-pointer">
            Include labor costs (typically 40% of total)
          </Label>
        </div>
      </div>

      <Button onClick={calculateRenovation} className="w-full">
        <Home className="mr-2 h-4 w-4" />
        Estimate Renovation Cost
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Estimate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center pb-4 border-b">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {formatCurrency(result.totalCost)}
                </div>
                <p className="text-muted-foreground">Total Estimated Cost</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(result.pricePerSqFt)}/sq ft
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(result.materialCost)}
                  </div>
                  <p className="text-sm text-muted-foreground">Materials</p>
                </div>
                {includeLaborpercent && (
                  <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(result.laborCost)}
                    </div>
                    <p className="text-sm text-muted-foreground">Labor</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown by Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Budget:</span>
                  <span className="font-semibold">
                    {projectType === 'kitchen' && '$75-100/sq ft'}
                    {projectType === 'bathroom' && '$100-125/sq ft'}
                    {projectType === 'bedroom' && '$50-75/sq ft'}
                    {projectType === 'basement' && '$40-60/sq ft'}
                    {projectType === 'custom' && '$50-75/sq ft'}
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Mid-Range:</span>
                  <span className="font-semibold">
                    {projectType === 'kitchen' && '$150-200/sq ft'}
                    {projectType === 'bathroom' && '$175-225/sq ft'}
                    {projectType === 'bedroom' && '$100-150/sq ft'}
                    {projectType === 'basement' && '$75-125/sq ft'}
                    {projectType === 'custom' && '$100-150/sq ft'}
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>High-End:</span>
                  <span className="font-semibold">
                    {projectType === 'kitchen' && '$250+/sq ft'}
                    {projectType === 'bathroom' && '$300+/sq ft'}
                    {projectType === 'bedroom' && '$175+/sq ft'}
                    {projectType === 'basement' && '$150+/sq ft'}
                    {projectType === 'custom' && '$200+/sq ft'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              <p><strong>Important Considerations:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>These are rough estimates - actual costs vary by location and complexity</li>
                <li>Permits, design fees, and unexpected issues add 10-20% to costs</li>
                <li>Get multiple quotes from licensed contractors</li>
                <li>Budget an additional 20% contingency for surprises</li>
                <li>Higher quality materials typically have better ROI</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
