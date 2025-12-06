'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Plus, Edit, Trash } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'

export function RecentActivityCard() {
  const { data } = useData()

  const recentActivities = useMemo(() => {
    const allEntries: Array<{
      id: string
      title: string
      domain: string
      timestamp: Date
      action: 'added' | 'updated'
    }> = []

    Object.entries(data).forEach(([domain, entries]) => {
      entries.forEach((entry) => {
        if (entry.createdAt) {
          allEntries.push({
            id: entry.id,
            title: entry.title || 'Untitled',
            domain,
            timestamp: new Date(entry.createdAt),
            action: 'added'
          })
        }
      })
    })

    return allEntries
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
  }, [data])

  const getDomainIcon = (domain: string) => {
    const icons: Record<string, string> = {
      financial: '💰',
      health: '❤️',
      vehicles: '🚗',
      insurance: '🛡️',
      pets: '🐾',
      education: '📚',
      relationships: '👥',
      travel: '✈️',
      home: '🏠',
      digital: '💻',
      nutrition: '🥗',
      fitness: '💪'
    }
    return icons[domain] || '📋'
  }

  const getActionIcon = (action: string) => {
    if (action === 'added') return <Plus className="w-3 h-3" />
    if (action === 'updated') return <Edit className="w-3 h-3" />
    return <Activity className="w-3 h-3" />
  }

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-900 hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            <span className="text-lg">Recent Activity</span>
          </div>
          <Badge variant="secondary">{recentActivities.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivities.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
              >
                <div className="flex-shrink-0 text-xl">{getDomainIcon(activity.domain)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate">{activity.title}</span>
                    <div className="flex-shrink-0">
                      {getActionIcon(activity.action)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs capitalize">
                      {activity.domain}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

