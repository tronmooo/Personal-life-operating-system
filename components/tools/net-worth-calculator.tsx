'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, TrendingUp, Sparkles, RefreshCw, Loader2 } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useAutoFillData, formatCurrency } from '@/lib/tools/auto-fill'
import { getAISuggestions, AISuggestion } from '@/lib/tools/ai-suggestions'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface Item {
  id: string
  name: string
  value: number
}

export function NetWorthCalculator() {
  const { data } = useData()
  const autoFillData = useAutoFillData()
  
  const [assets, setAssets] = useState<Item[]>([])
  const [liabilities, setLiabilities] = useState<Item[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isAutoFilled, setIsAutoFilled] = useState(false)

  // Auto-fill from user data
  const handleAutoFill = () => {
    const autoAssets: Item[] = []
    const autoLiabilities: Item[] = []
    
    // Add assets from breakdown
    autoFillData.assets.breakdown.forEach((item, idx) => {
      if (item.value > 0) {
        autoAssets.push({
          id: `auto-asset-${idx}`,
          name: item.category,
          value: item.value
        })
      }
    })
    
    // Add liabilities from breakdown
    autoFillData.liabilities.breakdown.forEach((item, idx) => {
      if (item.balance > 0) {
        autoLiabilities.push({
          id: `auto-liability-${idx}`,
          name: item.type,
          value: item.balance
        })
      }
    })
    
    // If no auto-fill data, add default placeholders
    if (autoAssets.length === 0) {
      autoAssets.push(
        { id: '1', name: 'Checking Account', value: 0 },
        { id: '2', name: 'Savings Account', value: 0 },
        { id: '3', name: 'Home Value', value: 0 }
      )
    }
    
    if (autoLiabilities.length === 0) {
      autoLiabilities.push(
        { id: '1', name: 'Mortgage', value: 0 },
        { id: '2', name: 'Car Loan', value: 0 }
      )
    }
    
    setAssets(autoAssets)
    setLiabilities(autoLiabilities)
    setIsAutoFilled(true)
  }
  
  // Auto-fill on mount
  useEffect(() => {
    handleAutoFill()
  }, [])

  const addAsset = () => {
    setAssets([...assets, { id: Date.now().toString(), name: '', value: 0 }])
  }

  const addLiability = () => {
    setLiabilities([...liabilities, { id: Date.now().toString(), name: '', value: 0 }])
  }

  const updateAsset = (id: string, field: 'name' | 'value', value: string | number) => {
    setAssets(assets.map((a) => (a.id === id ? { ...a, [field]: value } : a)))
  }

  const updateLiability = (id: string, field: 'name' | 'value', value: string | number) => {
    setLiabilities(liabilities.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  const removeAsset = (id: string) => setAssets(assets.filter((a) => a.id !== id))
  const removeLiability = (id: string) => setLiabilities(liabilities.filter((l) => l.id !== id))

  const totalAssets = assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0)
  const totalLiabilities = liabilities.reduce((sum, l) => sum + (Number(l.value) || 0), 0)
  const netWorth = totalAssets - totalLiabilities

  // Get AI suggestions
  const handleGetAISuggestions = async () => {
    setIsLoadingAI(true)
    try {
      const suggestions = await getAISuggestions('net-worth', {
        netWorth,
        assets: totalAssets,
        liabilities: totalLiabilities,
        income: autoFillData.income.monthly,
        expenses: autoFillData.expenses.monthly,
        age: autoFillData.profile.age || undefined
      })
      setAiSuggestions(suggestions)
    } catch (error) {
      console.error('Error getting AI suggestions:', error)
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Chart data
  const assetBreakdown = assets
    .filter(a => a.value > 0)
    .map(a => ({ name: a.name, value: a.value }))
  
  const liabilityBreakdown = liabilities
    .filter(l => l.value > 0)
    .map(l => ({ name: l.name, value: l.value }))

  const comparisonData = [
    { category: 'Assets', amount: totalAssets },
    { category: 'Liabilities', amount: totalLiabilities },
    { category: 'Net Worth', amount: Math.max(0, netWorth) }
  ]

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6">
      {/* Header with Auto-Fill Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            Net Worth Calculator
            {isAutoFilled && (
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Auto-Filled
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Calculate your total net worth by tracking assets and liabilities
          </p>
        </div>
        <Button onClick={handleAutoFill} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload My Data
        </Button>
      </div>

      {/* Summary Cards */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-sm text-muted-foreground">Total Assets</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalAssets)}
              </p>
            </div>

            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-sm text-muted-foreground">Total Liabilities</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalLiabilities)}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${netWorth >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <p className="text-sm text-muted-foreground">Net Worth</p>
              <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(netWorth)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Breakdown Pie Chart */}
        {assetBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assets Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={assetBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  >
                    {assetBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Bar Chart Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Assets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Assets (What You Own)</CardTitle>
            <Button onClick={addAsset} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {assets.map((asset) => (
            <div key={asset.id} className="grid grid-cols-12 gap-2">
              <Input
                placeholder="Asset name"
                value={asset.name}
                onChange={(e) => updateAsset(asset.id, 'name', e.target.value)}
                className="col-span-7"
              />
              <Input
                type="number"
                placeholder="Value"
                value={asset.value || ''}
                onChange={(e) => updateAsset(asset.id, 'value', parseFloat(e.target.value) || 0)}
                className="col-span-4"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeAsset(asset.id)}
                className="col-span-1"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Liabilities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Liabilities (What You Owe)</CardTitle>
            <Button onClick={addLiability} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Liability
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {liabilities.map((liability) => (
            <div key={liability.id} className="grid grid-cols-12 gap-2">
              <Input
                placeholder="Liability name"
                value={liability.name}
                onChange={(e) => updateLiability(liability.id, 'name', e.target.value)}
                className="col-span-7"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={liability.value || ''}
                onChange={(e) => updateLiability(liability.id, 'value', parseFloat(e.target.value) || 0)}
                className="col-span-4"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeLiability(liability.id)}
                className="col-span-1"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Financial Health Metrics */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-base">Financial Health Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Debt-to-Asset Ratio</p>
              <p className="font-bold text-lg">
                {totalAssets > 0 ? `${((totalLiabilities / totalAssets) * 100).toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Asset Coverage</p>
              <p className="font-bold text-lg">
                {totalLiabilities > 0 ? `${((totalAssets / totalLiabilities) * 100).toFixed(0)}%` : '100%'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Liquid Assets</p>
              <p className="font-bold text-lg">{formatCurrency(autoFillData.assets.cash)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Monthly Surplus</p>
              <p className="font-bold text-lg">
                {formatCurrency(autoFillData.income.monthly - autoFillData.expenses.monthly)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">AI-Powered Suggestions</CardTitle>
            </div>
            <Button 
              onClick={handleGetAISuggestions} 
              disabled={isLoadingAI}
              size="sm"
              variant="outline"
            >
              {isLoadingAI ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Advice
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Personalized recommendations to improve your net worth
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aiSuggestions.length > 0 ? (
            <div className="space-y-4">
              {aiSuggestions.map((suggestion, idx) => (
                <div 
                  key={idx} 
                  className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{suggestion.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        {suggestion.priority && (
                          <Badge 
                            variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {suggestion.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                      {suggestion.impact && (
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          💰 {suggestion.impact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Click "Get AI Advice" to receive personalized recommendations based on your financial data
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Pro Tip:</strong> Track your net worth monthly to see progress toward financial goals. 
            A positive trend indicates you're building wealth over time.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
