// @ts-nocheck
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFinance } from '@/lib/providers/finance-provider'
import { Plus, TrendingUp, Wallet } from 'lucide-react'
import { formatCurrency, formatCurrencyDetailed, formatPercentage } from '@/lib/utils/finance-utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ASSET_TYPE_LABELS } from '@/types/finance'
import { format } from 'date-fns'
import { AssetDialog } from '../dialogs/asset-dialog'
import { InvestmentDialog } from '../dialogs/investment-dialog'

export function AssetsTab() {
  const { assets, investments, investmentPortfolio, financialSummary, assetsLoading } = useFinance()
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [investmentDialogOpen, setInvestmentDialogOpen] = useState(false)
  
  const liquidAssets = assets.filter(a => a.is_liquid)
  const illiquidAssets = assets.filter(a => !a.is_liquid)
  
  const liquidAssetsValue = liquidAssets.reduce((sum, a) => sum + Number(a.current_value), 0)
  const illiquidAssetsValue = illiquidAssets.reduce((sum, a) => sum + Number(a.current_value), 0)
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialSummary?.totalAssets || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquid Assets</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(liquidAssetsValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Easily accessible funds
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(illiquidAssetsValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Retirement & investments
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Assets List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assets</CardTitle>
              <CardDescription>Everything you own that holds value</CardDescription>
            </div>
            <Button onClick={() => setAssetDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading assets...
                    </TableCell>
                  </TableRow>
                ) : assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No assets added yet. Track your valuable possessions and investments.
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ASSET_TYPE_LABELS[asset.type] || asset.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrencyDetailed(Number(asset.current_value))}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(asset.updated_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {asset.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Investment Portfolio */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle>Investment Portfolio</CardTitle>
              </div>
              <CardDescription>Track your investment holdings and performance</CardDescription>
            </div>
            <Button onClick={() => setInvestmentDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Holding
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {investmentPortfolio && (
            <div className="grid grid-cols-4 gap-4 mb-6 p-4 rounded-lg bg-muted">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(investmentPortfolio.totalValue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(investmentPortfolio.totalCost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
                <p className={`text-2xl font-bold ${investmentPortfolio.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {investmentPortfolio.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(investmentPortfolio.totalGainLoss)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Return</p>
                <p className={`text-2xl font-bold ${investmentPortfolio.totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {investmentPortfolio.totalGainLossPercent >= 0 ? '+' : ''}{formatPercentage(investmentPortfolio.totalGainLossPercent)}
                </p>
              </div>
            </div>
          )}
          
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name/Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Cost Basis</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">Gain/Loss</TableHead>
                  <TableHead className="text-right">Return %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-2">
                        No investments tracked yet. Add your first holding to get started!
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  investments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{investment.name}</p>
                          {investment.symbol && (
                            <p className="text-xs text-muted-foreground">{investment.symbol}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{investment.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{Number(investment.quantity).toFixed(4)}</TableCell>
                      <TableCell className="text-right">{formatCurrencyDetailed(Number(investment.cost_basis))}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrencyDetailed(Number(investment.current_value))}</TableCell>
                      <TableCell className={`text-right font-semibold ${
                        Number(investment.gain_loss) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Number(investment.gain_loss) >= 0 ? '+' : ''}{formatCurrencyDetailed(Number(investment.gain_loss))}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${
                        Number(investment.gain_loss_percent) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Number(investment.gain_loss_percent) >= 0 ? '+' : ''}{formatPercentage(Number(investment.gain_loss_percent))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      <AssetDialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen} />
      <InvestmentDialog open={investmentDialogOpen} onOpenChange={setInvestmentDialogOpen} />
    </div>
  )
}

