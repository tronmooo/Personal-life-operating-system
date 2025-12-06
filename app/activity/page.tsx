'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useData } from '@/lib/providers/data-provider'
import {
  DollarSign, Heart, Briefcase, Home, Car, Shield,
  Plus, Edit, Trash2, Calendar,
  Clock, Filter, Download, Search
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Input } from '@/components/ui/input'

export default function ActivityFeedPage() {
  const { data } = useData()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  // Generate activity feed from all domain data
  const activities = useMemo(() => {
    const allActivities: Activity[] = []

    // Extract activities from all domains
    Object.entries(data).forEach(([domain, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          // Created activity
          allActivities.push({
            id: `${item.id}-created`,
            type: 'created',
            domain: domain as any,
            title: String(item.title || item.metadata?.accountName || item.metadata?.name || 'Item'),
            description: `Created in ${domain}`,
            timestamp: item.createdAt,
            metadata: item.metadata
          })

          // Updated activity (if different from created)
          if (item.updatedAt !== item.createdAt) {
            allActivities.push({
              id: `${item.id}-updated`,
              type: 'updated',
              domain: domain as any,
              title: String(item.title || item.metadata?.accountName || item.metadata?.name || 'Item'),
              description: `Updated in ${domain}`,
              timestamp: item.updatedAt,
              metadata: item.metadata
            })
          }
        })
      }
    })

    // Sort by timestamp (newest first)
    return allActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [data])

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesSearch = searchQuery === '' || 
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesDomain = filterDomain === 'all' || activity.domain === filterDomain
      const matchesType = filterType === 'all' || activity.type === filterType

      return matchesSearch && matchesDomain && matchesType
    })
  }, [activities, searchQuery, filterDomain, filterType])

  // Activity stats
  const stats = useMemo(() => {
    const today = new Date()
    const todayActivities = activities.filter(a => 
      new Date(a.timestamp).toDateString() === today.toDateString()
    )
    const thisWeek = activities.filter(a => {
      const diff = today.getTime() - new Date(a.timestamp).getTime()
      return diff < 7 * 24 * 60 * 60 * 1000
    })
    const thisMonth = activities.filter(a => {
      const activityDate = new Date(a.timestamp)
      return activityDate.getMonth() === today.getMonth() &&
             activityDate.getFullYear() === today.getFullYear()
    })

    return {
      today: todayActivities.length,
      week: thisWeek.length,
      month: thisMonth.length,
      total: activities.length
    }
  }, [activities])

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Activity Feed
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time timeline of all your life domains
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Timeline
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">activities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.week}</div>
            <p className="text-xs text-muted-foreground">activities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.month}</div>
            <p className="text-xs text-muted-foreground">activities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">All Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">activities</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Domain Filter */}
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Domains</option>
              <option value="financial">Financial</option>
              <option value="health">Health</option>
              <option value="career">Career</option>
              <option value="home">Home</option>
              <option value="vehicles">Vehicles</option>
              <option value="insurance">Insurance</option>
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Types</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredActivities.length} of {activities.length} activities
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Your complete activity history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No activities found
              </div>
            ) : (
              filteredActivities.map((activity, index) => (
                <ActivityItem key={activity.id} activity={activity} isLast={index === filteredActivities.length - 1} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface Activity {
  id: string
  type: 'created' | 'updated' | 'deleted'
  domain: string
  title: string
  description: string
  timestamp: string
  metadata?: any
}

function ActivityItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const getDomainIcon = (domain: string) => {
    const icons: Record<string, any> = {
      financial: DollarSign,
      health: Heart,
      career: Briefcase,
      home: Home,
      vehicles: Car,
      insurance: Shield,
    }
    const Icon = icons[domain] || Calendar
    return <Icon className="h-4 w-4" />
  }

  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      financial: 'bg-green-500',
      health: 'bg-red-500',
      career: 'bg-blue-500',
      home: 'bg-orange-500',
      vehicles: 'bg-indigo-500',
      insurance: 'bg-purple-500',
    }
    return colors[domain] || 'bg-gray-500'
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      created: Plus,
      updated: Edit,
      deleted: Trash2,
    }
    const Icon = icons[type as keyof typeof icons] || Calendar
    return <Icon className="h-3 w-3" />
  }

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      created: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      deleted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="flex gap-4 relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />
      )}

      {/* Icon */}
      <div className={`rounded-full p-2 ${getDomainColor(activity.domain)} text-white z-10 flex-shrink-0`}>
        {getDomainIcon(activity.domain)}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{activity.title}</h3>
              <Badge className={getTypeBadgeColor(activity.type)}>
                <span className="flex items-center gap-1">
                  {getTypeIcon(activity.type)}
                  {activity.type}
                </span>
              </Badge>
              <Badge variant="outline" className="capitalize">
                {activity.domain}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {activity.description}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </div>
        </div>

        {/* Metadata preview */}
        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="mt-2 p-3 rounded-lg bg-accent/50 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(activity.metadata).slice(0, 4).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium text-xs text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="ml-2">{String(value).substring(0, 30)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}







