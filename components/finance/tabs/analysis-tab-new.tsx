'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useFinance } from '@/lib/providers/finance-provider-new'

export function AnalysisTab() {
  const { getTaxSummary } = useFinance()
  
  const taxSummary = getTaxSummary(2025)
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  return (
    <div className="space-y-6">
      {/* Spending Heatmap */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span>📅</span>
            <CardTitle className="text-slate-200">Spending Heatmap</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            November 2025 - Daily spending patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <p>Heatmap calendar placeholder</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Net Worth Projection */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span>📊</span>
            <CardTitle className="text-slate-200">Net Worth Projection</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Project your financial future based on savings and investment returns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Fields */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Monthly Savings</label>
              <Input 
                type="number" 
                defaultValue={0} 
                className="bg-slate-900 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Avg: $0/mo</p>
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Annual Return (%)</label>
              <Input 
                type="number" 
                defaultValue={7} 
                className="bg-slate-900 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">S&P 500 avg: ~10%</p>
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Years to Project</label>
              <Input 
                type="number" 
                defaultValue={10} 
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
          
          {/* Result Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Current Net Worth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">$0</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Projected in 10 Years</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">$0</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Total Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">📈 $0</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Chart Placeholder */}
          <div className="h-[300px] flex items-center justify-center text-slate-500 border border-slate-700 rounded-lg">
            Net Worth Projection Chart
          </div>
        </CardContent>
      </Card>
      
      {/* Tax Planning Dashboard */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span>📋</span>
            <CardTitle className="text-slate-200">Tax Planning Dashboard</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            2025 tax year estimates and deductions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Top Row - 4 KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-400">Total Income (YTD)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(taxSummary.totalIncome)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-400">Deductions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-500">
                  {formatCurrency(taxSummary.totalDeductions)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-400">Estimated Tax</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-orange-500">
                  {formatCurrency(taxSummary.estimatedTax)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-400">Effective Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-500">
                  {taxSummary.effectiveRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Deductible Expense Categories */}
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">Deductible Expense Categories</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-300">Charitable Donations</span>
                <span className="text-sm font-medium text-white">$0</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-300">Medical Expenses</span>
                <span className="text-sm font-medium text-white">$0</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-300">Business Expenses</span>
                <span className="text-sm font-medium text-white">$0</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-300">Education</span>
                <span className="text-sm font-medium text-white">$0</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-300">Mortgage Interest</span>
                <span className="text-sm font-medium text-white">$0</span>
              </div>
            </div>
          </div>
          
          {/* Tax Saving Opportunities */}
          <Card className="bg-blue-950/30 border-blue-800/50">
            <CardHeader>
              <CardTitle className="text-sm text-blue-300">💰 Tax Saving Opportunities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {taxSummary.taxSavingOpportunities.map((opp, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-400 mt-0.5">✅</span>
                  <div>
                    <span className="text-slate-200 font-medium">{opp.title}</span>
                    {opp.description && (
                      <span className="text-slate-400">: {opp.description}</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}


