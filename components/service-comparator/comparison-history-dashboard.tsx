'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  History, 
  TrendingDown, 
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  Trash2,
  Eye,
  Bell,
  CheckCircle
} from 'lucide-react'

interface ComparisonHistory {
  id: string
  serviceType: string
  date: string
  bestProvider: string
  bestPrice: number
  totalSavings: number
  providersCompared: number
}

const MOCK_HISTORY: ComparisonHistory[] = [
  {
    id: '1',
    serviceType: 'Auto Insurance',
    date: '2024-01-15',
    bestProvider: 'Geico',
    bestPrice: 115,
    totalSavings: 360,
    providersCompared: 5
  },
  {
    id: '2',
    serviceType: 'Internet',
    date: '2024-01-10',
    bestProvider: 'FiberNet',
    bestPrice: 65,
    totalSavings: 120,
    providersCompared: 4
  },
  {
    id: '3',
    serviceType: 'Mobile Phone',
    date: '2024-01-05',
    bestProvider: 'Mint Mobile',
    bestPrice: 30,
    totalSavings: 600,
    providersCompared: 6
  },
  {
    id: '4',
    serviceType: 'Electricity',
    date: '2023-12-28',
    bestProvider: 'Budget Electric',
    bestPrice: 70,
    totalSavings: 180,
    providersCompared: 3
  },
]

export function ComparisonHistoryDashboard() {
  const [history, setHistory] = useState<ComparisonHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setHistory(MOCK_HISTORY)
      setLoading(false)
    }, 500)
  }, [])

  const totalSavings = history.reduce((sum, item) => sum + item.totalSavings, 0)
  const totalComparisons = history.length
  const avgSavings = totalComparisons > 0 ? totalSavings / totalComparisons : 0

  const deleteComparison = (id: string) => {
    setHistory(history.filter(h => h.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">${totalSavings}/yr</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comparisons</p>
                <p className="text-2xl font-bold">{totalComparisons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingDown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Savings</p>
                <p className="text-2xl font-bold">${Math.round(avgSavings)}/yr</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Comparisons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            Comparison History
          </CardTitle>
          <CardDescription>
            Your recent service comparisons and potential savings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-muted-foreground">No comparison history yet</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.serviceType}</h3>
                    <p className="text-sm text-muted-foreground">
                      Best: {item.bestProvider} • ${item.bestPrice}/mo • {item.providersCompared} providers compared
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-green-600">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Save ${item.totalSavings}/yr
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteComparison(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Savings Breakdown */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingDown className="h-5 w-5 text-green-500" />
            Your Savings Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{item.serviceType}</span>
                </div>
                <span className="font-semibold text-green-600">
                  ${item.totalSavings}/yr
                </span>
              </div>
            ))}
            <div className="border-t pt-3 mt-3 flex items-center justify-between">
              <span className="font-bold">Total Annual Savings</span>
              <span className="text-2xl font-bold text-green-600">
                ${totalSavings}/yr
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-orange-500" />
            Price Alerts
          </CardTitle>
          <CardDescription>
            Get notified when prices drop for services you're tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <div>
              <p className="font-medium">Auto Insurance</p>
              <p className="text-sm text-muted-foreground">Alert when rate drops below $100/mo</p>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <div>
              <p className="font-medium">Internet</p>
              <p className="text-sm text-muted-foreground">Alert when 1Gbps plans drop below $50/mo</p>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <div>
              <p className="font-medium">Mobile Phone</p>
              <p className="text-sm text-muted-foreground">Alert for unlimited plans under $25/mo</p>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
          <Button variant="outline" className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Add New Alert
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Default export for compatibility
export default ComparisonHistoryDashboard
