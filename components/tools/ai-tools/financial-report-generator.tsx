'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Download, FileText, DollarSign, PieChart } from 'lucide-react'
import { useAutoFillData } from '@/lib/tools/auto-fill'
import { Badge } from '@/components/ui/badge'

export function FinancialReportGenerator() {
  const autoFillData = useAutoFillData()

  const reports = [
    { name: 'Monthly Income Statement', icon: DollarSign, color: 'text-green-600' },
    { name: 'Balance Sheet', icon: BarChart3, color: 'text-blue-600' },
    { name: 'Cash Flow Analysis', icon: TrendingUp, color: 'text-purple-600' },
    { name: 'Budget vs Actual', icon: PieChart, color: 'text-orange-600' },
  ]

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-4xl">📊</span>
          Financial Report Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate comprehensive financial reports with AI-powered insights
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Income</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              ${autoFillData.income.monthly.toFixed(0)}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Expenses</div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              ${autoFillData.expenses.monthly.toFixed(0)}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Assets</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              ${autoFillData.assets.total.toFixed(0)}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Net Worth</div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              ${autoFillData.netWorth.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Report Types */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Available Reports
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {reports.map((report, index) => {
              const Icon = report.icon
              return (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <div>
                      <div className="font-semibold">{report.name}</div>
                      <Badge variant="secondary" className="mt-1">Ready</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <FileText className="h-3 w-3 mr-2" />
                      Generate
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Report Options */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Report Options</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="charts" defaultChecked className="rounded" />
              <label htmlFor="charts" className="text-sm">Include charts</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="trends" defaultChecked className="rounded" />
              <label htmlFor="trends" className="text-sm">Show trends</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="comparisons" defaultChecked className="rounded" />
              <label htmlFor="comparisons" className="text-sm">Period comparisons</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ai-insights" defaultChecked className="rounded" />
              <label htmlFor="ai-insights" className="text-sm">AI insights</label>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">📈 Financial Health Summary:</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Savings Rate:</strong> {autoFillData.income.monthly > 0 ? 
              (((autoFillData.income.monthly - autoFillData.expenses.monthly) / autoFillData.income.monthly * 100).toFixed(1)) : 0}% 
              (Target: 20%)
            </p>
            <p>• <strong>Net Worth Trend:</strong> {autoFillData.netWorth >= 0 ? 'Positive' : 'Negative'} - 
              {autoFillData.netWorth >= 0 ? ' Keep building!' : ' Focus on debt reduction'}
            </p>
            <p>• <strong>Debt-to-Income:</strong> {autoFillData.income.monthly > 0 ?
              ((autoFillData.liabilities.total / (autoFillData.income.annual)) * 100).toFixed(1) : 0}% 
              (Healthy: &lt;36%)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Generate Full Report
          </Button>
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}































