'use client'

export const dynamic = 'force-dynamic'

import { useMemo, useState } from 'react'
import {
  DollarSign, Heart, Briefcase, Home, Car, Shield,
  Plus, Edit, Trash2, Calendar,
  Clock, Filter, Download, Search
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Activity = {
  id: string
  type: 'created' | 'updated' | 'deleted'
  domain: string
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, string | number>
}

const sampleActivities: Activity[] = [
  {
    id: '1',
    type: 'created',
    domain: 'financial',
    title: 'Checking Account',
    description: 'Created in financial',
    timestamp: new Date().toISOString(),
    metadata: { bank: 'Chase', account: 'Checking' },
  },
  {
    id: '2',
    type: 'updated',
    domain: 'health',
    title: 'Annual Physical',
    description: 'Updated in health',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: { provider: 'Kaiser', status: 'Scheduled' },
  },
  {
    id: '3',
    type: 'created',
    domain: 'vehicles',
    title: 'Oil Change',
    description: 'Created in vehicles',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    metadata: { vehicle: 'Tesla Model Y', mileage: '21,450' },
  },
]

const domainOptions = [
  { value: 'all', label: 'All Domains' },
  { value: 'financial', label: 'Financial' },
  { value: 'health', label: 'Health' },
  { value: 'career', label: 'Career' },
  { value: 'home', label: 'Home' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'insurance', label: 'Insurance' },
]

export default function ActivityFeedPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const activities = useMemo(() => {
    return [...sampleActivities].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [])

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch =
        searchQuery === '' ||
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDomain = filterDomain === 'all' || activity.domain === filterDomain
      const matchesType = filterType === 'all' || activity.type === filterType

      return matchesSearch && matchesDomain && matchesType
    })
  }, [activities, searchQuery, filterDomain, filterType])

  const stats = useMemo(() => {
    const today = new Date()
    const todayActivities = activities.filter(
      (a) => new Date(a.timestamp).toDateString() === today.toDateString()
    )
    const thisWeek = activities.filter((a) => {
      const diff = today.getTime() - new Date(a.timestamp).getTime()
      return diff < 7 * 24 * 60 * 60 * 1000
    })
    const thisMonth = activities.filter((a) => {
      const activityDate = new Date(a.timestamp)
      return activityDate.getMonth() === today.getMonth() && activityDate.getFullYear() === today.getFullYear()
    })

    return {
      today: todayActivities.length,
      week: thisWeek.length,
      month: thisMonth.length,
      total: activities.length,
    }
  }, [activities])

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Activity Feed
          </h1>
          <p className="text-gray-500 mt-1">Realtime timeline of all your life domains</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
          <Download className="h-4 w-4" />
          Export Timeline
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: stats.today },
          { label: 'This Week', value: stats.week },
          { label: 'This Month', value: stats.month },
          { label: 'All Time', value: stats.total },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400">activities</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Filter className="h-5 w-5" />
          Filters
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
          </div>
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            {domainOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <option value="all">All Types</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">Showing {filteredActivities.length} of {activities.length} activities</div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="mb-2">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <p className="text-sm text-gray-500">Your complete activity history</p>
        </div>
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No activities found</div>
          ) : (
            filteredActivities.map((activity, index) => (
              <ActivityItem key={activity.id} activity={activity} isLast={index === filteredActivities.length - 1} />
            ))
          )}
        </div>
      </div>
    </div>
  )
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
      {!isLast && <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />}

      <div className={`rounded-full p-2 ${getDomainColor(activity.domain)} text-white z-10 flex-shrink-0`}>
        {getDomainIcon(activity.domain)}
      </div>

      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{activity.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(activity.type)}`}>
                <span className="inline-flex items-center gap-1">
                  {getTypeIcon(activity.type)}
                  {activity.type}
                </span>
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 capitalize">
                {activity.domain}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </div>
        </div>

        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(activity.metadata).slice(0, 4).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium text-xs text-gray-500 capitalize">
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







