'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip, Legend 
} from 'recharts'
import { Activity, TrendingUp, TrendingDown } from 'lucide-react'
import type { Domain } from '@/types/domains'

interface DomainActivity {
  domain: Domain
  count: number
  lastActivity: string | null
  trend: number
  score: number
}

interface LifeBalanceWheelProps {
  activities: DomainActivity[]
}

const domainLabels: Record<Domain, string> = {
  financial: 'Financial',
  health: 'Health',
  insurance: 'Insurance',
  home: 'Home',
  vehicles: 'Vehicles',
  appliances: 'Appliances',
  pets: 'Pets',
  relationships: 'Relationships',
  digital: 'Digital',
  mindfulness: 'Mindfulness',
  fitness: 'Fitness',
  nutrition: 'Nutrition',
  services: 'Services',
  miscellaneous: 'Misc'
}

export function LifeBalanceWheel({ activities }: LifeBalanceWheelProps) {
  const chartData = useMemo(() => {
    return activities.map(activity => ({
      domain: domainLabels[activity.domain],
      score: activity.score,
      fullMark: 100
    }))
  }, [activities])

  const overallBalance = useMemo(() => {
    const avgScore = activities.reduce((sum, a) => sum + a.score, 0) / activities.length
    return Math.round(avgScore)
  }, [activities])

  const activeDomainsCount = activities.filter(a => a.count > 0).length
  const totalDomains = activities.length

  const topDomains = useMemo(() => {
    return [...activities]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [activities])

  const leastActive = useMemo(() => {
    return activities
      .filter(a => a.count === 0)
      .map(a => domainLabels[a.domain])
  }, [activities])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Life Balance Scorecard
        </CardTitle>
        <CardDescription>
          Activity across all 21 life domains
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Overall Balance Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold">{overallBalance}</span>
              <span className="text-xl text-muted-foreground">/100</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {activeDomainsCount} of {totalDomains} domains active
            </p>
          </div>
          <Badge 
            variant={overallBalance >= 70 ? 'default' : overallBalance >= 40 ? 'secondary' : 'destructive'}
            className="text-lg px-4 py-2"
          >
            {overallBalance >= 70 ? 'Excellent' : overallBalance >= 40 ? 'Good' : 'Needs Work'}
          </Badge>
        </div>

        {/* Radar Chart */}
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis 
                dataKey="domain" 
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fill: '#64748b' }}
              />
              <Radar
                name="Activity Score"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Active Domains */}
        <div>
          <h4 className="font-semibold mb-3">Most Active Domains</h4>
          <div className="space-y-2">
            {topDomains.map((activity) => (
              <div 
                key={activity.domain} 
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="font-medium">{domainLabels[activity.domain]}</div>
                  {activity.trend !== 0 && (
                    <div className={`flex items-center gap-1 text-sm ${
                      activity.trend > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activity.trend > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{Math.abs(activity.trend)}%</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {activity.count} {activity.count === 1 ? 'entry' : 'entries'}
                  </span>
                  <Badge variant="secondary">
                    {activity.score}/100
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inactive Domains */}
        {leastActive.length > 0 && (
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
              Inactive Domains
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
              Consider tracking these areas for better life balance:
            </p>
            <div className="flex flex-wrap gap-2">
              {leastActive.map(domain => (
                <Badge key={domain} variant="outline" className="text-yellow-800 dark:text-yellow-200">
                  {domain}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



