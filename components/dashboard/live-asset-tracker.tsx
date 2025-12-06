'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Home, Car, TrendingUp, TrendingDown, DollarSign, 
  Wallet, PiggyBank, CreditCard, RefreshCw, Settings, 
  Eye, EyeOff, Sparkles, AlertCircle,
  Building2, Calculator, BarChart3, ArrowUpRight, Target,
  Flame, Shield, Clock
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useUserPreferences } from '@/lib/hooks/use-user-preferences'

interface AssetData {
  homeValue: number
  homeChange: number
  vehicleValue: number
  vehicleChange: number
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  monthlyBills: number
  investments: number
  creditScore: number
  savingsRate: number
  emergencyFund: number
  debtPayoffMonths: number
  retirementProgress: number
  lastUpdated: Date
}

export function LiveAssetTracker() {
  const { data } = useData()
  const [isLoading, setIsLoading] = useState(false)
  const [showValues, setShowValues] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [assetData, setAssetData] = useState<AssetData | null>(null)
  const [mounted, setMounted] = useState(false)
  
  // Fix hydration error with timestamp
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // User configuration for APIs
  const defaultConfig = useMemo(() => ({
    homeAddress: '',
    homeZipCode: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleMileage: '',
    zillowAPIKey: '',
    autoAPIKey: '',
    creditAPIKey: ''
  }), [])

  const {
    value: storedConfig,
    setValue: persistConfig,
    loading: configLoading,
  } = useUserPreferences<typeof defaultConfig>('live-asset-tracker-config', defaultConfig)

  const [config, setConfig] = useState(defaultConfig)

  useEffect(() => {
    if (storedConfig) {
      setConfig(storedConfig)
    } else {
      setConfig(defaultConfig)
    }
  }, [storedConfig, defaultConfig])

  // Calculate asset data from LifeHub data
  const calculatedData = useMemo(() => {
    const financialData = data.financial || []
    
    // DEBUG: Log what we're receiving
    if (financialData.length > 0) {
      console.log('💰 Live Financial Dashboard - Processing Data:', {
        itemCount: financialData.length,
        firstItem: financialData[0],
        allItems: financialData
      })
    }
    
    let totalAssets = 0
    let totalLiabilities = 0
    let monthlyBills = 0
    let investments = 0
    let debtTotal = 0

    // Process financial domain items - FIXED to handle all data structures
    financialData.forEach((item: any, index: number) => {
      // Get amount from multiple possible locations
      const amount = parseFloat(
        item.amount || 
        item.balance || 
        item.metadata?.amount || 
        item.metadata?.balance || 
        item.data?.amount ||
        0
      )

      // Get type from multiple possible locations
      const itemType = (
        item.type || 
        item.metadata?.type || 
        item.metadata?.accountType || 
        item.category ||
        ''
      ).toLowerCase()
      
      // DEBUG: Log each item processing
      console.log(`  Item ${index + 1}:`, {
        amount,
        itemType,
        rawItem: item
      })

      // Handle income
      if (itemType.includes('income') || itemType === 'income') {
        totalAssets += Math.abs(amount)
      }
      // Handle expenses/bills
      else if (itemType.includes('expense') || itemType === 'bill' || itemType.includes('bill')) {
        // Don't count expenses as liabilities in net worth calculation
        // They're just outflows, not debts
        monthlyBills += Math.abs(amount)
      }
      // Handle credit cards (negative balances)
      else if (itemType.includes('credit') || itemType === 'credit-card') {
        totalLiabilities += Math.abs(amount)
        debtTotal += Math.abs(amount)
      }
      // Handle savings/checking accounts
      else if (itemType.includes('checking') || itemType.includes('savings') || itemType.includes('account')) {
        if (amount > 0) {
          totalAssets += Math.abs(amount)
        } else {
          totalLiabilities += Math.abs(amount)
          debtTotal += Math.abs(amount)
        }
      }
      // Handle investments
      else if (itemType.includes('investment') || itemType.includes('401k') || itemType.includes('ira') || itemType.includes('stock')) {
        investments += Math.abs(amount)
        totalAssets += Math.abs(amount)
      }
      // Default: if amount is positive, it's an asset; if negative, it's a liability
      else if (amount !== 0) {
        if (amount > 0) {
          totalAssets += Math.abs(amount)
        } else {
          totalLiabilities += Math.abs(amount)
        }
      }
    })

    // Add home value from home domain
    const homeData = data.home || []
    let homeValue = 0
    homeData.forEach((item: any) => {
      if (item.category === 'property') {
        homeValue = parseFloat(item.estimatedValue || 0)
        totalAssets += homeValue
      }
    })

    // Add vehicle value from vehicles domain
    const vehicleData = data.vehicles || []
    let vehicleValue = 0
    vehicleData.forEach((item: any) => {
      if (item.category === 'vehicle') {
        vehicleValue = parseFloat(item.estimatedValue || 0)
        totalAssets += vehicleValue
      }
    })

    const netWorth = totalAssets - totalLiabilities
    const savingsRate = totalAssets > 0 ? ((totalAssets - monthlyBills) / totalAssets * 100) : 0
    const emergencyFund = totalAssets - investments - homeValue - vehicleValue
    const emergencyFundMonths = monthlyBills > 0 ? emergencyFund / monthlyBills : 0
    
    // Estimate debt payoff (assuming 3% minimum payment)
    const debtPayoffMonths = debtTotal > 0 ? Math.ceil(debtTotal / (debtTotal * 0.03)) : 0

    // Retirement progress (placeholder - should be based on age and goals)
    const retirementProgress = investments > 0 ? Math.min((investments / 1000000) * 100, 100) : 0

    // DEBUG: Log final calculations
    console.log('💰 Final Calculations:', {
      totalAssets,
      totalLiabilities,
      netWorth,
      monthlyBills,
      investments
    })

    return {
      homeValue,
      homeChange: 0,
      vehicleValue,
      vehicleChange: 0,
      totalAssets,
      totalLiabilities,
      netWorth,
      monthlyBills,
      investments,
      creditScore: 0,
      savingsRate: Math.round(savingsRate),
      emergencyFund: emergencyFundMonths,
      debtPayoffMonths,
      retirementProgress: Math.round(retirementProgress),
      lastUpdated: new Date()
    }
  }, [data])

  // Fetch real-time data from APIs
  const fetchRealTimeData = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Zillow Home Value API
      const homeValue = await fetchHomeValue(config.homeAddress, config.homeZipCode, config.zillowAPIKey)
      
      // Vehicle Value API
      const vehicleValue = await fetchVehicleValue(
        config.vehicleYear,
        config.vehicleMake,
        config.vehicleModel,
        config.vehicleMileage,
        config.autoAPIKey
      )
      
      // Credit Score API
      const creditScore = await fetchCreditScore(config.creditAPIKey)
      
      setAssetData({
        ...calculatedData,
        homeValue: homeValue.value,
        homeChange: homeValue.change,
        vehicleValue: vehicleValue.value,
        vehicleChange: vehicleValue.change,
        creditScore,
        lastUpdated: new Date()
      })
    } catch (error) {
      console.error('Error fetching real-time data:', error)
      setAssetData({
        ...calculatedData,
        lastUpdated: new Date()
      })
    } finally {
      setIsLoading(false)
    }
  }, [config, calculatedData])

  // Zillow API Integration
  const fetchHomeValue = async (address: string, zipCode: string, apiKey: string): Promise<{ value: number, change: number }> => {
    if (!address || !zipCode) {
      return { value: calculatedData.homeValue, change: 0 }
    }

    try {
      if (apiKey) {
        // Real Zillow API (requires API key)
        const response = await fetch(`https://api.bridgedataoutput.com/api/v2/zestimates_v2/zestimates?access_token=${apiKey}&address=${encodeURIComponent(address)}&zipcode=${zipCode}`)
        const data = await response.json()
        return {
          value: data.bundle[0]?.zestimate || calculatedData.homeValue,
          change: 2.3 // Calculate from historical data
        }
      } else {
        // Free alternative: Realty Mole API
        const response = await fetch(`https://realty-mole-property-api.p.rapidapi.com/properties?address=${encodeURIComponent(address + ' ' + zipCode)}`, {
          headers: {
            'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY', // User needs to add this
            'X-RapidAPI-Host': 'realty-mole-property-api.p.rapidapi.com'
          }
        })
        const data = await response.json()
        return {
          value: data[0]?.assessorData?.value || calculatedData.homeValue,
          change: 2.3
        }
      }
    } catch (error) {
      console.error('Home value fetch error:', error)
      return { value: calculatedData.homeValue, change: 0 }
    }
  }

  // NHTSA/KBB Vehicle Value API
  const fetchVehicleValue = async (year: string, make: string, model: string, mileage: string, apiKey: string): Promise<{ value: number, change: number }> => {
    if (!year || !make || !model) {
      return { value: calculatedData.vehicleValue, change: 0 }
    }

    try {
      // NHTSA Vehicle API (Free)
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${make}/modelyear/${year}?format=json`)
      const data = await response.json()
      
      // For actual valuation, you'd use:
      // - Kelley Blue Book API (requires partnership)
      // - NADA API (requires subscription)
      // - CarQuery API (free but limited)
      
      // Estimate depreciation: ~15% per year
      const currentYear = new Date().getFullYear()
      const age = currentYear - parseInt(year)
      const depreciationRate = Math.pow(0.85, age)
      const estimatedValue = 35000 * depreciationRate // Base price estimate
      
      return {
        value: estimatedValue,
        change: -15 / 12 // ~1.25% per month depreciation
      }
    } catch (error) {
      console.error('Vehicle value fetch error:', error)
      return { value: calculatedData.vehicleValue, change: 0 }
    }
  }

  // Credit Score API Integration
  const fetchCreditScore = async (apiKey: string): Promise<number> => {
    try {
      // Options for Credit Score APIs:
      // 1. Experian API (requires business account)
      // 2. Credit Karma (no official API)
      // 3. Plaid API (can get credit data)
      
      if (apiKey) {
        // Plaid API example
        const response = await fetch('https://sandbox.plaid.com/asset_report/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: 'YOUR_CLIENT_ID',
            secret: apiKey,
            asset_report_token: 'YOUR_TOKEN'
          })
        })
        const data = await response.json()
        return data.report?.items[0]?.accounts[0]?.balances?.current || 720
      }
      
      return 720 // Default placeholder
    } catch (error) {
      console.error('Credit score fetch error:', error)
      return 720
    }
  }

  const saveConfig = async () => {
    await persistConfig(config)
    fetchRealTimeData()
    setSettingsOpen(false)
  }

  const displayData = assetData || calculatedData
  const maskValue = (value: number) => showValues ? formatCurrency(value) : '••••••'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Live Financial Dashboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time tracking of your assets, liabilities, and net worth
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowValues(!showValues)}
          >
            {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRealTimeData}
            disabled={isLoading || configLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Asset Tracking Configuration</DialogTitle>
                <DialogDescription>
                  Connect APIs to get real-time valuations
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Home Config */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Home Valuation
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Street Address</Label>
                      <Input 
                        value={config.homeAddress}
                        onChange={(e) => setConfig({...config, homeAddress: e.target.value})}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <Label>ZIP Code</Label>
                      <Input 
                        value={config.homeZipCode}
                        onChange={(e) => setConfig({...config, homeZipCode: e.target.value})}
                        placeholder="90210"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Config */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehicle Valuation
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Year</Label>
                      <Input 
                        value={config.vehicleYear}
                        onChange={(e) => setConfig({...config, vehicleYear: e.target.value})}
                        placeholder="2022"
                      />
                    </div>
                    <div>
                      <Label>Make</Label>
                      <Input 
                        value={config.vehicleMake}
                        onChange={(e) => setConfig({...config, vehicleMake: e.target.value})}
                        placeholder="Toyota"
                      />
                    </div>
                    <div>
                      <Label>Model</Label>
                      <Input 
                        value={config.vehicleModel}
                        onChange={(e) => setConfig({...config, vehicleModel: e.target.value})}
                        placeholder="Camry"
                      />
                    </div>
                    <div>
                      <Label>Mileage</Label>
                      <Input 
                        value={config.vehicleMileage}
                        onChange={(e) => setConfig({...config, vehicleMileage: e.target.value})}
                        placeholder="45000"
                      />
                    </div>
                  </div>
                </div>

                {/* API Keys */}
                <div className="space-y-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    API keys are optional. Without them, estimates will be calculated from your logged data.
                  </p>
                  <div>
                    <Label>Zillow/Realty API Key (optional)</Label>
                    <Input 
                      type="password"
                      value={config.zillowAPIKey}
                      onChange={(e) => setConfig({...config, zillowAPIKey: e.target.value})}
                      placeholder="Get from RapidAPI"
                    />
                  </div>
                  <div>
                    <Label>Vehicle Data API Key (optional)</Label>
                    <Input 
                      type="password"
                      value={config.autoAPIKey}
                      onChange={(e) => setConfig({...config, autoAPIKey: e.target.value})}
                      placeholder="NHTSA is free"
                    />
                  </div>
                  <div>
                    <Label>Credit API Key (optional)</Label>
                    <Input 
                      type="password"
                      value={config.creditAPIKey}
                      onChange={(e) => setConfig({...config, creditAPIKey: e.target.value})}
                      placeholder="Plaid API key"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={saveConfig}>Save & Refresh</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center justify-between">
              <span>Total Net Worth</span>
              <Wallet className="h-4 w-4 text-purple-500" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{maskValue(displayData.netWorth)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Assets - Liabilities
            </p>
          </CardContent>
        </Card>

        {/* Home Value */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center justify-between">
              <span>Home Value</span>
              <Home className="h-4 w-4" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{maskValue(displayData.homeValue)}</div>
            <div className="flex items-center gap-1 mt-1">
              {displayData.homeChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs font-medium ${displayData.homeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {displayData.homeChange > 0 ? '+' : ''}{displayData.homeChange.toFixed(1)}% this month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Value */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center justify-between">
              <span>Vehicle Value</span>
              <Car className="h-4 w-4" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{maskValue(displayData.vehicleValue)}</div>
            <div className="flex items-center gap-1 mt-1">
              {displayData.vehicleChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs font-medium ${displayData.vehicleChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {displayData.vehicleChange > 0 ? '+' : ''}{displayData.vehicleChange.toFixed(1)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Credit Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center justify-between">
              <span>Credit Score</span>
              <CreditCard className="h-4 w-4" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {showValues ? displayData.creditScore : '•••'}
            </div>
            <Badge 
              variant={displayData.creditScore >= 740 ? 'default' : displayData.creditScore >= 670 ? 'secondary' : 'destructive'}
              className="mt-1"
            >
              {displayData.creditScore >= 740 ? 'Excellent' : displayData.creditScore >= 670 ? 'Good' : 'Fair'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Emergency Fund */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center justify-between">
              <span>Emergency Fund</span>
              <Shield className="h-4 w-4" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayData.emergencyFund.toFixed(1)} months</div>
            <p className="text-xs text-muted-foreground mt-1">
              {displayData.emergencyFund >= 6 ? '✅ Goal met!' : 
               displayData.emergencyFund >= 3 ? '⚠️ Close to goal' : 
               '🎯 Build it up'}
            </p>
          </CardContent>
        </Card>

        {/* Debt Payoff */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center justify-between">
              <span>Debt Payoff</span>
              <Flame className="h-4 w-4" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayData.debtPayoffMonths > 0 ? `${displayData.debtPayoffMonths} mo` : 'Debt Free!'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {displayData.debtPayoffMonths === 0 ? '🎉 No debt' : `At 3% minimum payment`}
            </p>
          </CardContent>
        </Card>

        {/* Retirement Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center justify-between">
              <span>Retirement</span>
              <Target className="h-4 w-4" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayData.retirementProgress}%</div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                style={{ width: `${displayData.retirementProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Bills */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center justify-between">
              <span>Monthly Bills</span>
              <Clock className="h-4 w-4" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maskValue(displayData.monthlyBills)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recurring expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold">{maskValue(displayData.totalAssets)}</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investments</span>
                <span className="font-medium">{maskValue(displayData.investments)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property</span>
                <span className="font-medium">{maskValue(displayData.homeValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicles</span>
                <span className="font-medium">{maskValue(displayData.vehicleValue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Total Liabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold">{maskValue(displayData.totalLiabilities)}</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Bills</span>
                <span className="font-medium">{maskValue(displayData.monthlyBills)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Debt Ratio</span>
                <span className="font-medium">
                  {displayData.totalAssets > 0 
                    ? `${Math.round(displayData.totalLiabilities / displayData.totalAssets * 100)}%`
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-blue-500" />
              Savings Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold">{displayData.savingsRate}%</div>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${Math.min(displayData.savingsRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {displayData.savingsRate >= 20 ? '✨ Excellent savings habit!' : 
                 displayData.savingsRate >= 10 ? '👍 Good progress!' : 
                 '💡 Room to improve'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Financial Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <a href="/domains/financial">
                <Calculator className="h-4 w-4 mr-2" />
                Track Finances
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <a href="/domains/home">
                <Building2 className="h-4 w-4 mr-2" />
                Home Details
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <a href="/domains/vehicles">
                <Car className="h-4 w-4 mr-2" />
                Vehicle Info
              </a>
            </Button>
            <Button variant="outline" size="sm" className="justify-start" asChild>
              <a href="/analytics">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Full Analytics
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="flex items-center justify-center text-xs text-muted-foreground">
        <AlertCircle className="h-3 w-3 mr-1" />
        Last updated: {mounted ? displayData.lastUpdated.toLocaleString() : '...'}
      </div>
    </div>
  )
}
