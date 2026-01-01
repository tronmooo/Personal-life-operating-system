'use client'

/**
 * Weekly Digest Card Component
 * Displays the AI-generated weekly life summary
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWeeklyDigest } from '@/lib/hooks/use-enhanced-ai'
import { type WeeklyDigest, type DomainHighlight, type DigestWin, type AttentionItem } from '@/lib/ai/weekly-digest-generator'
import {
  Calendar,
  Trophy,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Target,
  Flame
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface WeeklyDigestCardProps {
  className?: string
  expanded?: boolean
}

export function WeeklyDigestCard({ className, expanded = false }: WeeklyDigestCardProps) {
  const { digest, loading, generate } = useWeeklyDigest()
  const [isExpanded, setIsExpanded] = useState(expanded)

  const handleGenerate = async () => {
    await generate()
  }

  if (!digest && !loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Weekly Digest
          </CardTitle>
          <CardDescription>
            Get a personalized summary of your week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Generate your weekly life summary with AI-powered insights
            </p>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Digest
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing your week...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!digest) return null

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Weekly Digest
            </CardTitle>
            <CardDescription>
              {new Date(digest.weekStart).toLocaleDateString()} - {new Date(digest.weekEnd).toLocaleDateString()}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleGenerate} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Life Score */}
        <div className="text-center py-4">
          <div className="relative inline-flex items-center justify-center">
            <div className="text-5xl font-bold text-primary">{digest.summary.overallScore}</div>
            <div className="text-lg text-muted-foreground ml-1">/100</div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Life Score</p>
          <p className="text-lg font-medium mt-2">{digest.summary.headline}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{digest.summary.totalEntriesLogged}</div>
            <div className="text-xs text-muted-foreground">Entries</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{digest.summary.tasksCompleted}</div>
            <div className="text-xs text-muted-foreground">Tasks Done</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{digest.summary.habitsTracked}</div>
            <div className="text-xs text-muted-foreground">Habits</div>
          </div>
        </div>

        {/* Week Over Week */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Week Over Week
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <WoWMetric 
              label="Entries" 
              current={digest.weekOverWeek.entriesLogged.current}
              change={digest.weekOverWeek.entriesLogged.change}
            />
            <WoWMetric 
              label="Tasks" 
              current={digest.weekOverWeek.tasksCompleted.current}
              change={digest.weekOverWeek.tasksCompleted.change}
            />
          </div>
        </div>

        {isExpanded && (
          <>
            <Separator />

            {/* Wins */}
            {digest.wins.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Wins This Week
                </h4>
                <div className="space-y-2">
                  {digest.wins.map((win) => (
                    <WinItem key={win.id} win={win} />
                  ))}
                </div>
              </div>
            )}

            {/* Needs Attention */}
            {digest.needsAttention.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Needs Attention
                </h4>
                <div className="space-y-2">
                  {digest.needsAttention.map((item) => (
                    <AttentionItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Domain Highlights */}
            {digest.domainHighlights.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Domain Highlights</h4>
                <div className="grid gap-2">
                  {digest.domainHighlights.map((highlight, index) => (
                    <HighlightItem key={index} highlight={highlight} />
                  ))}
                </div>
              </div>
            )}

            {/* Streak Updates */}
            {digest.streakUpdates.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Habit Streaks
                </h4>
                <div className="flex flex-wrap gap-2">
                  {digest.streakUpdates.map((streak) => (
                    <Badge 
                      key={streak.habitId} 
                      variant={streak.status === 'growing' ? 'default' : 'secondary'}
                      className="gap-1"
                    >
                      {streak.icon} {streak.habitName}: {streak.currentStreak} days
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {digest.recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  For Next Week
                </h4>
                <div className="space-y-2">
                  {digest.recommendations.map((rec) => (
                    <div 
                      key={rec.id}
                      className="p-3 rounded-lg border border-dashed"
                    >
                      <p className="font-medium text-sm">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Expand/Collapse Button */}
        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show Less' : 'Show More Details'}
          <ChevronRight className={cn(
            "h-4 w-4 ml-1 transition-transform",
            isExpanded && "rotate-90"
          )} />
        </Button>
      </CardContent>
    </Card>
  )
}

// Helper Components

function WoWMetric({ label, current, change }: { label: string; current: number; change: number }) {
  const isPositive = change >= 0
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  
  return (
    <div className="flex items-center justify-between p-2 rounded bg-muted/30">
      <div>
        <div className="text-sm font-medium">{current}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
      <div className={cn(
        "flex items-center gap-1 text-xs",
        isPositive ? "text-green-500" : "text-red-500"
      )}>
        <Icon className="h-3 w-3" />
        {Math.abs(change)}%
      </div>
    </div>
  )
}

function WinItem({ win }: { win: DigestWin }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/20">
      <span className="text-lg">{win.icon}</span>
      <div>
        <p className="font-medium text-sm">{win.title}</p>
        <p className="text-xs text-muted-foreground">{win.description}</p>
      </div>
    </div>
  )
}

function AttentionItemCard({ item }: { item: AttentionItem }) {
  return (
    <div className={cn(
      "p-2 rounded-lg border",
      item.priority === 'high' 
        ? "bg-red-500/5 border-red-500/20" 
        : "bg-yellow-500/5 border-yellow-500/20"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>
        {item.actionPath && item.actionLabel && (
          <Link href={item.actionPath}>
            <Button variant="outline" size="sm" className="shrink-0 h-7 text-xs">
              {item.actionLabel}
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

function HighlightItem({ highlight }: { highlight: DomainHighlight }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
      <span className="text-xl">{highlight.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{highlight.title}</p>
        <p className="text-xs text-muted-foreground">
          {highlight.metric}: <span className="font-medium">{highlight.value}</span>
        </p>
      </div>
      {highlight.change && (
        <div className={cn(
          "text-xs",
          highlight.change.isPositive ? "text-green-500" : "text-red-500"
        )}>
          {highlight.change.direction === 'up' ? '↑' : highlight.change.direction === 'down' ? '↓' : '→'}
          {highlight.change.amount}
        </div>
      )}
    </div>
  )
}

export default WeeklyDigestCard



