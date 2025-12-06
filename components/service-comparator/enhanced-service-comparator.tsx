'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Shield, 
  Zap, 
  Wifi, 
  Smartphone, 
  Car,
  Home,
  Sparkles,
  TrendingDown,
  Star,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface ComparisonResult {
  provider: string
  price: number
  features: string[]
  rating: number
  savings: number
  recommendation: string
  pros: string[]
  cons: string[]
}

const SERVICE_TYPES = [
  { id: 'auto-insurance', name: 'Auto Insurance', icon: Car },
  { id: 'home-insurance', name: 'Home Insurance', icon: Home },
  { id: 'electricity', name: 'Electricity', icon: Zap },
  { id: 'internet', name: 'Internet', icon: Wifi },
  { id: 'mobile', name: 'Mobile Phone', icon: Smartphone },
]

// Mock data for demonstration
const MOCK_PROVIDERS: Record<string, ComparisonResult[]> = {
  'auto-insurance': [
    { 
      provider: 'Progressive', 
      price: 125, 
      features: ['Roadside Assistance', 'Accident Forgiveness', 'Mobile App'],
      rating: 4.5,
      savings: 240,
      recommendation: 'Best for safe drivers',
      pros: ['Low rates for safe drivers', 'Easy claims process', 'Good mobile app'],
      cons: ['Higher rates for new drivers', 'Limited agent network']
    },
    { 
      provider: 'Geico', 
      price: 115, 
      features: ['24/7 Customer Service', 'Multi-Policy Discount', 'Easy Quotes'],
      rating: 4.3,
      savings: 360,
      recommendation: 'Best overall value',
      pros: ['Lowest rates overall', 'Easy online management', 'Fast claims'],
      cons: ['No local agents', 'Limited bundling options']
    },
    { 
      provider: 'State Farm', 
      price: 145, 
      features: ['Local Agent', 'Drive Safe & Save', 'Rental Reimbursement'],
      rating: 4.6,
      savings: 0,
      recommendation: 'Best for personalized service',
      pros: ['Local agents available', 'Excellent customer service', 'Many discounts'],
      cons: ['Higher base rates', 'Varies by state']
    },
  ],
  'home-insurance': [
    { 
      provider: 'Allstate', 
      price: 180, 
      features: ['HostAdvantage', 'Claim RateGuard', 'Easy Pay Plan'],
      rating: 4.2,
      savings: 120,
      recommendation: 'Best for bundling',
      pros: ['Bundle discounts', 'Claim RateGuard', 'New home discounts'],
      cons: ['Higher base rates', 'Complex policies']
    },
    { 
      provider: 'Liberty Mutual', 
      price: 165, 
      features: ['Better Car Replacement', 'New Home Discount', 'RightTrack'],
      rating: 4.0,
      savings: 300,
      recommendation: 'Best for new homeowners',
      pros: ['New home discounts', 'Good coverage options', 'Multi-policy savings'],
      cons: ['Average customer service', 'Higher rates in some areas']
    },
  ],
  'electricity': [
    { 
      provider: 'Green Energy Co', 
      price: 85, 
      features: ['100% Renewable', 'Fixed Rate', 'No Contract'],
      rating: 4.4,
      savings: 180,
      recommendation: 'Best for eco-conscious consumers',
      pros: ['Clean energy', 'Fixed rates', 'No cancellation fees'],
      cons: ['Slightly higher rates', 'Limited areas']
    },
    { 
      provider: 'Budget Electric', 
      price: 70, 
      features: ['Variable Rate', 'Smart Home Integration', 'Rewards Program'],
      rating: 4.1,
      savings: 360,
      recommendation: 'Best budget option',
      pros: ['Lowest rates', 'Smart home features', 'Rewards program'],
      cons: ['Variable rates', 'Longer contracts']
    },
  ],
  'internet': [
    { 
      provider: 'FiberNet', 
      price: 65, 
      features: ['1 Gbps Speed', 'No Data Caps', 'Free Installation'],
      rating: 4.7,
      savings: 120,
      recommendation: 'Best for heavy users',
      pros: ['Fastest speeds', 'No data caps', 'Reliable connection'],
      cons: ['Limited availability', 'Higher price']
    },
    { 
      provider: 'CableVision', 
      price: 55, 
      features: ['500 Mbps Speed', 'Bundle Options', 'Free WiFi Router'],
      rating: 4.0,
      savings: 240,
      recommendation: 'Best value for average users',
      pros: ['Good value', 'Widely available', 'Bundle options'],
      cons: ['Data caps on some plans', 'Speed can vary']
    },
  ],
  'mobile': [
    { 
      provider: 'T-Mobile', 
      price: 70, 
      features: ['Unlimited Data', '5G Access', 'Netflix Included'],
      rating: 4.3,
      savings: 120,
      recommendation: 'Best for unlimited data',
      pros: ['True unlimited', '5G coverage', 'Perks included'],
      cons: ['Coverage in rural areas', 'De-prioritization during congestion']
    },
    { 
      provider: 'Mint Mobile', 
      price: 30, 
      features: ['Prepaid Plans', 'Unlimited Talk/Text', '5G Ready'],
      rating: 4.5,
      savings: 600,
      recommendation: 'Best budget option',
      pros: ['Lowest prices', 'Uses T-Mobile network', 'No contracts'],
      cons: ['Must pay upfront', 'Customer service by app only']
    },
  ],
}

export function EnhancedServiceComparatorAI() {
  const [serviceType, setServiceType] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ComparisonResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleCompare = async () => {
    if (!serviceType) return
    
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setResults(MOCK_PROVIDERS[serviceType] || [])
    setHasSearched(true)
    setLoading(false)
  }

  const getBestDeal = () => {
    if (results.length === 0) return null
    return results.reduce((best, current) => 
      current.price < best.price ? current : best
    , results[0])
  }

  const bestDeal = getBestDeal()

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6 text-blue-500" />
            Compare Services
          </CardTitle>
          <CardDescription>
            Find the best deals on insurance, utilities, and more in your area
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service..." />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center gap-2">
                        <service.icon className="h-4 w-4" />
                        {service.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ZIP Code (Optional)</Label>
              <Input 
                placeholder="Enter your ZIP code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                maxLength={5}
              />
            </div>
          </div>
          <Button 
            onClick={handleCompare} 
            className="w-full"
            disabled={!serviceType || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Comparing Providers...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Compare Providers
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Service Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {SERVICE_TYPES.map(service => (
          <Button
            key={service.id}
            variant={serviceType === service.id ? 'default' : 'outline'}
            onClick={() => setServiceType(service.id)}
            className="flex items-center gap-2"
          >
            <service.icon className="h-4 w-4" />
            <span className="hidden md:inline">{service.name}</span>
          </Button>
        ))}
      </div>

      {/* Results */}
      {hasSearched && (
        <>
          {/* Best Deal Highlight */}
          {bestDeal && (
            <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <TrendingDown className="h-5 w-5" />
                    Best Deal Found!
                  </CardTitle>
                  <Badge className="bg-green-500">
                    Save ${bestDeal.savings}/year
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{bestDeal.provider}</h3>
                    <p className="text-muted-foreground">{bestDeal.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">${bestDeal.price}/mo</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{bestDeal.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Providers ({results.length})</h2>
              <Button variant="outline" size="sm" onClick={handleCompare}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {results.map((result, index) => (
              <Card key={result.provider} className={index === 0 ? 'border-green-200 dark:border-green-800' : ''}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold">{result.provider}</h3>
                        {index === 0 && (
                          <Badge className="bg-green-500">Best Price</Badge>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{result.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-1">{result.recommendation}</p>
                      
                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {result.features.map(feature => (
                          <Badge key={feature} variant="secondary">{feature}</Badge>
                        ))}
                      </div>

                      {/* Pros/Cons */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm font-medium text-green-600 mb-1">Pros</p>
                          <ul className="text-sm space-y-1">
                            {result.pros.slice(0, 2).map(pro => (
                              <li key={pro} className="flex items-start gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-orange-600 mb-1">Cons</p>
                          <ul className="text-sm space-y-1">
                            {result.cons.slice(0, 2).map(con => (
                              <li key={con} className="flex items-start gap-1">
                                <AlertTriangle className="h-3 w-3 text-orange-500 mt-1 flex-shrink-0" />
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-3xl font-bold">${result.price}</p>
                        <p className="text-sm text-muted-foreground">/month</p>
                      </div>
                      {result.savings > 0 && (
                        <Badge variant="outline" className="text-green-600">
                          Save ${result.savings}/year
                        </Badge>
                      )}
                      <Button className="w-full">Get Quote</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Insights */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Based on your profile, {bestDeal?.provider} offers the best value for your needs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Consider bundling services to save an additional 10-15%</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Set up alerts to get notified when better deals become available</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!hasSearched && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">Find Better Deals</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Select a service type above and we'll compare providers in your area to find you the best rates
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Default export
export default EnhancedServiceComparatorAI
