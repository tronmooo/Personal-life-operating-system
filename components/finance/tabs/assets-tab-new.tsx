// @ts-nocheck
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { Plus, TrendingUp, Trash2, Layers, LineChart } from 'lucide-react'
import { AssetsVisual } from '../visuals/tab-visuals'
import { AssetAllocationTreemap, AssetValueTrendChart } from '../charts/finance-visualizations'

interface AssetsTabProps {
  onOpenAssetDialog?: () => void
  onOpenInvestmentDialog?: () => void
}

export function AssetsTab({ onOpenAssetDialog, onOpenInvestmentDialog }: AssetsTabProps = {}) {
  const { financialSummary, investments, assets, accounts, investmentPortfolio, deleteAsset, deleteInvestment, loading } = useFinance()
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Calculate asset allocation for treemap
  const assetAllocationData = useMemo(() => {
    const allocation: { name: string; value: number }[] = []
    
    // Cash & Liquid (checking + savings accounts)
    const liquidAccounts = accounts
      .filter(a => ['checking', 'savings'].includes(a.accountType))
      .reduce((sum, a) => sum + a.balance, 0)
    if (liquidAccounts > 0) {
      allocation.push({ name: 'Cash & Liquid', value: liquidAccounts })
    }

    // Investments (stocks, bonds, ETFs)
    const investmentValue = investments.reduce((sum, i) => sum + i.totalValue, 0)
    if (investmentValue > 0) {
      allocation.push({ name: 'Investments', value: investmentValue })
    }

    // Retirement accounts
    const retirementAccounts = accounts
      .filter(a => a.accountType === 'retirement')
      .reduce((sum, a) => sum + a.balance, 0)
    if (retirementAccounts > 0) {
      allocation.push({ name: 'Retirement', value: retirementAccounts })
    }

    // Real Estate
    const realEstate = assets
      .filter(a => a.assetType === 'real-estate')
      .reduce((sum, a) => sum + a.currentValue, 0)
    if (realEstate > 0) {
      allocation.push({ name: 'Real Estate', value: realEstate })
    }

    // Other Assets (vehicles, valuables, etc.)
    const otherAssets = assets
      .filter(a => a.assetType !== 'real-estate')
      .reduce((sum, a) => sum + a.currentValue, 0)
    if (otherAssets > 0) {
      allocation.push({ name: 'Other Assets', value: otherAssets })
    }

    return allocation
  }, [accounts, investments, assets])

  // Generate asset value trend data (last 6 months - simulated)
  const assetValueTrendData = useMemo(() => {
    const totalAssets = financialSummary?.totalAssets || 0
    const liquidAssets = financialSummary?.liquidAssets || 0
    const investmentAssets = financialSummary?.investmentAssets || 0
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return months.map((month, index) => ({
      month,
      total: totalAssets * (0.9 + (index * 0.02)),
      liquid: liquidAssets * (0.95 + (index * 0.01)),
      investments: investmentAssets * (0.85 + (index * 0.03))
    }))
  }, [financialSummary])
  
  return (
    <div className="space-y-6">
      {/* Visual Hero */}
      <AssetsVisual />
      
      {/* Top Row - 3 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(financialSummary?.totalAssets || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Liquid Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(financialSummary?.liquidAssets || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Easily accessible funds</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Investment Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(financialSummary?.investmentAssets || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Retirement & investments</p>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Asset Allocation & Trend Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Asset Allocation Treemap */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-slate-200">Asset Allocation</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Visual breakdown of your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssetAllocationTreemap data={assetAllocationData} height={220} />
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-3">
              {assetAllocationData.map((item, index) => {
                const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899']
                const total = assetAllocationData.reduce((s, i) => s + i.value, 0)
                const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
                return (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-slate-400">{item.name}</span>
                    <span className="text-white font-medium">{percent}%</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Asset Value Trend */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-slate-200">Asset Value Over Time</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Track total asset growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssetValueTrendChart data={assetValueTrendData} height={220} />
          </CardContent>
        </Card>
      </div>
      
      {/* Assets Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-200">Assets</CardTitle>
              <CardDescription className="text-slate-400">
                Everything you own that holds value
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              className="bg-black hover:bg-slate-900"
              onClick={() => onOpenAssetDialog?.()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Account</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Balance</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Last Updated</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Description</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400"></th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      No assets yet. Add your first asset to track your net worth.
                    </td>
                  </tr>
                ) : (
                  assets.map(asset => (
                    <tr key={asset.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <p className="text-base font-medium text-white">{asset.name}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            ['checking', 'savings'].includes(asset.assetType.toLowerCase())
                              ? 'bg-blue-900/30 text-blue-400 border border-blue-800'
                              : 'bg-green-900/30 text-green-400 border border-green-800'
                          }`}>
                            {asset.assetType === 'real-estate' ? 'Property' : 
                             ['checking', 'savings'].includes(asset.assetType.toLowerCase()) ? 'Liquid' : 'Investment'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-base font-semibold text-white">
                        {formatCurrency(asset.currentValue)}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-400">{asset.lastUpdated?.split('T')[0] || asset.lastUpdated}</td>
                      <td className="py-4 px-4 text-sm text-slate-400">{asset.notes || '-'}</td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-900/30"
                          onClick={() => deleteAsset(asset.id)}
                        >
                          <Trash2 className="h-5 w-5 text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Investment Portfolio */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-slate-400" />
                <CardTitle className="text-slate-200">Investment Portfolio</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Track your investment holdings and performance
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              className="bg-black hover:bg-slate-900"
              onClick={() => onOpenInvestmentDialog?.()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Holding
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 4 Metric Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(investmentPortfolio?.totalValue || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(investmentPortfolio?.totalCost || 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Total Gain/Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(investmentPortfolio?.totalGainLoss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(investmentPortfolio?.totalGainLoss || 0) >= 0 ? '📈' : '📉'} {formatCurrency(Math.abs(investmentPortfolio?.totalGainLoss || 0))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Return</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(investmentPortfolio?.returnPercent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(investmentPortfolio?.returnPercent || 0) >= 0 ? '+' : ''}{(investmentPortfolio?.returnPercent || 0).toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Empty State */}
          {investments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="text-4xl mb-4">📈</div>
              <p>No investments tracked yet. Add your first holding to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {investments.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800/70 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white text-lg">{inv.symbol}</p>
                        <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                          {inv.investmentType || 'Stock'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {inv.quantity} shares @ {formatCurrency(inv.currentPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xl font-semibold text-white">{formatCurrency(inv.totalValue)}</p>
                      <p className={`text-sm font-medium ${inv.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {inv.returnPercent.toFixed(2)}%
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-red-900/30"
                      onClick={() => deleteInvestment(inv.id)}
                    >
                      <Trash2 className="h-5 w-5 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
