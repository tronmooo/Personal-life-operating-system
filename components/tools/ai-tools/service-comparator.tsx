'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, TrendingDown, Star, DollarSign, Loader2 } from 'lucide-react'
import { useAITool } from '@/lib/hooks/use-ai-tool'

interface ServiceComparison {
  provider: string
  monthlyPrice: number
  features: string[]
  rating: number
  pros: string[]
  cons: string[]
}

export function ServiceComparator() {
  const [serviceType, setServiceType] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [comparisons, setComparisons] = useState<ServiceComparison[]>([])
  const [potentialSavings, setPotentialSavings] = useState<number>(0)
  
  const { loading, requestAI } = useAITool()

  const handleCompare = async () => {
    if (!serviceType || !location) return

    const prompt = `Compare ${serviceType} providers in ${location}. 

Provide a comparison of at least 3 providers with:
- Provider name
- Monthly price (realistic 2025 pricing)
- Key features
- Rating (1-5 stars)
- Pros and cons

Also calculate potential annual savings by switching to the cheapest provider.

Return JSON:
{
  "comparisons": [
    {
      "provider": "...",
      "monthlyPrice": 0,
      "features": ["...", "..."],
      "rating": 4.5,
      "pros": ["...", "..."],
      "cons": ["...", "..."]
    }
  ],
  "potentialSavings": 0
}`

    try {
      const result = await requestAI(prompt, {
        systemPrompt: 'You are a consumer research expert. Provide accurate, helpful service comparisons.',
        temperature: 0.6
      })

      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0])
        setComparisons(data.comparisons || [])
        setPotentialSavings(data.potentialSavings || 0)
      }
    } catch (error) {
      console.error('Comparison failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6 text-blue-500" />
            Service Comparator AI
          </CardTitle>
          <CardDescription>
            Compare insurance, utilities, and service providers with AI-powered analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car-insurance">Car Insurance</SelectItem>
                  <SelectItem value="home-insurance">Home Insurance</SelectItem>
                  <SelectItem value="health-insurance">Health Insurance</SelectItem>
                  <SelectItem value="internet">Internet Service</SelectItem>
                  <SelectItem value="mobile">Mobile/Cell Phone</SelectItem>
                  <SelectItem value="electricity">Electricity Provider</SelectItem>
                  <SelectItem value="gas">Natural Gas</SelectItem>
                  <SelectItem value="water">Water Service</SelectItem>
                  <SelectItem value="streaming">Streaming Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Your Location</Label>
              <Input 
                placeholder="City, State or ZIP"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleCompare} disabled={loading || !serviceType || !location} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Comparing Providers...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Compare Providers
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {potentialSavings > 0 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Potential Annual Savings</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${potentialSavings.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {comparisons.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {comparisons.map((comparison, index) => (
            <Card key={index} className={index === 0 ? 'border-green-300' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {comparison.provider}
                  {index === 0 && <Badge className="bg-green-500">Best Value</Badge>}
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <DollarSign className="h-5 w-5" />
                    <span className="text-2xl font-bold">${comparison.monthlyPrice}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(comparison.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm">{comparison.rating}/5</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Key Features:</p>
                  <ul className="space-y-1">
                    {comparison.features.map((feature, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2 text-green-600">Pros:</p>
                  <ul className="space-y-1">
                    {comparison.pros.map((pro, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span>+</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2 text-red-600">Cons:</p>
                  <ul className="space-y-1">
                    {comparison.cons.map((con, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span>-</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}






