'use client'

/**
 * Proactive Insights Card
 * Displays AI-generated insights and suggestions on the dashboard
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProactiveInsights } from '@/lib/hooks/use-enhanced-ai'
import { type ProactiveInsight } from '@/lib/ai/proactive-insights-engine'
import { 
  Sparkles, 
  AlertCircle, 
  TrendingUp, 
  Trophy,
  Lightbulb,
  Link as LinkIcon,
  RefreshCw,
  ChevronRight,
  Loader2,
  X
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Icon mapping for insight types
const insightIcons: Record<string, React.ReactNode> = {
  anomaly: <AlertCircle className="h-4 w-4 text-orange-500" />,
  celebration: <Trophy className="h-4 w-4 text-yellow-500" />,
  reminder: <AlertCircle className="h-4 w-4 text-blue-500" />,
  correlation: <TrendingUp className="h-4 w-4 text-purple-500" />,
  suggestion: <Lightbulb className="h-4 w-4 text-green-500" />
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-500 border-green-500/20'
}

interface ProactiveInsightsCardProps {
  maxInsights?: number
  showRefresh?: boolean
  className?: string
}

export function ProactiveInsightsCard({
  maxInsights = 5,
  showRefresh = true,
  className
}: ProactiveInsightsCardProps) {
  const { insights, highPriority, celebrations, loading } = useProactiveInsights()
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)

  // Filter out dismissed insights
  const visibleInsights = insights
    .filter(i => !dismissedIds.has(i.id))
    .slice(0, maxInsights)

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setDismissedIds(new Set())
    // Trigger refresh by reloading the page component state
    window.location.reload()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (visibleInsights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              No insights right now. Keep tracking your life data!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
            {highPriority.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {highPriority.length} urgent
              </Badge>
            )}
          </CardTitle>
          {showRefresh && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {visibleInsights.map((insight) => (
              <InsightItem 
                key={insight.id} 
                insight={insight} 
                onDismiss={() => handleDismiss(insight.id)}
              />
            ))}
          </div>
        </ScrollArea>
        
        {celebrations.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
              <Trophy className="h-4 w-4" />
              {celebrations.length} win{celebrations.length > 1 ? 's' : ''} this week!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Individual insight item component
function InsightItem({ 
  insight, 
  onDismiss 
}: { 
  insight: ProactiveInsight
  onDismiss: () => void 
}) {
  return (
    <div 
      className={cn(
        "relative rounded-lg border p-3 transition-colors hover:bg-accent/50",
        insight.priority === 'high' && "border-red-500/30 bg-red-500/5"
      )}
    >
      <button
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="mt-0.5">
          {insightIcons[insight.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{insight.title}</span>
            <Badge 
              variant="outline" 
              className={cn("text-[10px] px-1.5", priorityColors[insight.priority])}
            >
              {insight.priority}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {insight.message}
          </p>
          
          {insight.actionPath && insight.actionLabel && (
            <Link href={insight.actionPath}>
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 mt-2 text-xs"
              >
                {insight.actionLabel}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          )}

          {insight.relatedDomains && insight.relatedDomains.length > 0 && (
            <div className="flex gap-1 mt-2">
              {insight.relatedDomains.map((domain) => (
                <Badge key={domain} variant="secondary" className="text-[10px]">
                  {domain}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProactiveInsightsCard



