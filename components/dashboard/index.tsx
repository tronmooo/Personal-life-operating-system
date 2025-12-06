'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { DOMAIN_CONFIGS } from '@/types/domains'
import { Plus, TrendingUp, Heart, Briefcase, Shield, AlertCircle, Clock, Target, Zap } from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

export function Dashboard() {
  const { data } = useData()

  // Calculate summary stats
  const totalItems = Object.values(data).reduce((acc, items) => acc + items.length, 0)
  const activeDomains = Object.keys(data).filter(domain => data[domain]?.length > 0).length
  
  const recentItems = Object.entries(data)
    .flatMap(([domain, items]) => items.map(item => ({ ...item, domain })))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  // Calculate items added today
  const today = new Date().toISOString().split('T')[0]
  const todayItems = Object.values(data)
    .flat()
    .filter(item => item.createdAt.split('T')[0] === today).length

  // Get most active domains
  const mostActiveDomains = Object.entries(DOMAIN_CONFIGS)
    .map(([key, domain]) => ({
      ...domain,
      count: data[key]?.length || 0
    }))
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome to LifeHub</h1>
          <p className="text-muted-foreground">Your personal life operating system</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Link>
          </Button>
          <Button asChild>
            <Link href="/domains">
              <Plus className="h-4 w-4 mr-2" />
              Add Data
            </Link>
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <CardTitle>Critical Alerts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No critical alerts at this time. You're all caught up!
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <Target className="h-4 w-4 mr-2" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {activeDomains} domains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{todayItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Items added today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <Zap className="h-4 w-4 mr-2" />
              Active Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeDomains}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 21 domains</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-2" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {Math.round((activeDomains / 21) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Coverage</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access - Most Active Domains */}
      {mostActiveDomains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Active Domains</CardTitle>
            <CardDescription>Your top tracked life areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mostActiveDomains.map((domain) => (
                <Link key={domain.id} href={`/domains/${domain.id}`}>
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`h-12 w-12 rounded-lg ${domain.color} flex items-center justify-center text-white text-xl font-bold`}>
                            {domain.count}
                          </div>
                          <div>
                            <p className="font-semibold">{domain.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {domain.count} {domain.count === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Domain Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Domain Overview</CardTitle>
            <CardDescription>Track all aspects of your life</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.values(DOMAIN_CONFIGS).slice(0, 6).map((domain) => {
                const count = data[domain.id]?.length || 0
                return (
                  <Link
                    key={domain.id}
                    href={`/domains/${domain.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-lg ${domain.color} flex items-center justify-center text-white`}>
                        {count}
                      </div>
                      <div>
                        <p className="font-medium">{domain.name}</p>
                        <p className="text-xs text-muted-foreground">{domain.description}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/domains">View All Domains</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across all domains</CardDescription>
          </CardHeader>
          <CardContent>
            {recentItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No activity yet</p>
                <p className="text-xs mt-1">Start by adding data to any domain</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentItems.map((item) => {
                  const domainConfig = DOMAIN_CONFIGS[item.domain as keyof typeof DOMAIN_CONFIGS]
                  return (
                    <Link 
                      key={item.id} 
                      href={`/domains/${item.domain}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${domainConfig.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{domainConfig.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {formatRelativeTime(item.updatedAt)}
                        </Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{Object.keys(data).length}</p>
              <p className="text-sm text-muted-foreground">Active Domains</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">AI Advisors</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">Tools Available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


