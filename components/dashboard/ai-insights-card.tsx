'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  DollarSign,
  Heart,
  Target,
  Users,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

type InsightType = 'warning' | 'success' | 'tip' | 'alert'
type InsightDomain = 'financial' | 'health' | 'productivity' | 'relationships' | 'general'

interface Insight {
  emoji: string
  title: string
  message: string
  type: InsightType
  domain: InsightDomain
  priority: number
}

const typeStyles: Record<InsightType, { bg: string; border: string; icon: typeof AlertTriangle }> = {
  alert: { 
    bg: 'bg-red-500/10 dark:bg-red-500/20', 
    border: 'border-red-500/30',
    icon: AlertTriangle 
  },
  warning: { 
    bg: 'bg-amber-500/10 dark:bg-amber-500/20', 
    border: 'border-amber-500/30',
    icon: TrendingDown 
  },
  success: { 
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', 
    border: 'border-emerald-500/30',
    icon: CheckCircle 
  },
  tip: { 
    bg: 'bg-blue-500/10 dark:bg-blue-500/20', 
    border: 'border-blue-500/30',
    icon: Lightbulb 
  }
}

const domainIcons: Record<InsightDomain, typeof DollarSign> = {
  financial: DollarSign,
  health: Heart,
  productivity: Target,
  relationships: Users,
  general: Sparkles
}

export function AIInsightsCard() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isGuest, setIsGuest] = useState(false)

  const fetchInsights = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch('/api/ai/smart-insights')
      
      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const data = await response.json()
      
      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights)
        setLastUpdated(new Date())
        setIsGuest(data.isGuest || false)
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err)
      setError('Unable to load insights')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const handleRefresh = () => {
    fetchInsights(true)
  }

  return (
    <Card className="relative overflow-hidden border-2 border-violet-500/20 dark:border-violet-400/20 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/30 dark:to-fuchsia-950/30 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-violet-500/5 animate-pulse" />
      
      <CardHeader className="relative pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                AI Insights
              </span>
              {lastUpdated && (
                <p className="text-[10px] text-muted-foreground font-normal">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={cn(
                "border-0 text-[10px] px-2",
                isGuest 
                  ? "bg-amber-500/80 text-white" 
                  : "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
              )}
            >
              {isGuest ? 'Demo' : 'GPT-4'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-violet-500/10"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4 text-violet-600 dark:text-violet-400", refreshing && "animate-spin")} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative pt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-30 animate-pulse" />
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin relative" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Analyzing your life data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => fetchInsights()}
            >
              Try Again
            </Button>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-20" />
              <Sparkles className="w-12 h-12 mx-auto text-violet-400 relative" />
            </div>
            <p className="text-sm text-muted-foreground mt-3">Add more data to unlock AI insights!</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Track finances, tasks, health & more</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {insights.map((insight, idx) => {
              const style = typeStyles[insight.type] || typeStyles.tip
              const DomainIcon = domainIcons[insight.domain] || Sparkles

              return (
                <div
                  key={idx}
                  className={cn(
                    "group relative p-3 rounded-xl border transition-all duration-200",
                    "hover:scale-[1.01] hover:shadow-md cursor-default",
                    style.bg,
                    style.border
                  )}
                  style={{
                    animationDelay: `${idx * 100}ms`
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Emoji/Icon */}
                    <div className="flex-shrink-0 text-2xl leading-none pt-0.5">
                      {insight.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {insight.title}
                        </span>
                        <DomainIcon className="w-3 h-3 text-muted-foreground flex-shrink-0 opacity-60" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {insight.message}
                      </p>
                    </div>

                    {/* Priority indicator */}
                    <div className={cn(
                      "flex-shrink-0 w-1.5 h-full rounded-full self-stretch min-h-[40px]",
                      insight.priority <= 2 ? "bg-red-500" :
                      insight.priority <= 3 ? "bg-amber-500" :
                      "bg-emerald-500"
                    )} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer hint */}
        {!loading && insights.length > 0 && (
          <div className="mt-4 pt-3 border-t border-violet-500/10">
            <p className="text-[10px] text-center text-muted-foreground/60">
              {isGuest 
                ? '🔐 Sign in to get personalized insights from your data'
                : '💡 Insights are personalized based on all your tracked data'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

