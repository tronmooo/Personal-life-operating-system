'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Award, Lock, Star, TrendingUp, Target, Calendar, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: 'award' | 'star' | 'trending' | 'target' | 'calendar' | 'zap'
  category: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  requirement: number
  currentProgress: number
  unlockedAt?: string
  isUnlocked: boolean
}

interface AchievementSystemProps {
  achievements: Achievement[]
  onAchievementClick?: (achievement: Achievement) => void
}

export function AchievementSystem({ achievements, onAchievementClick }: AchievementSystemProps) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<Set<string>>(new Set())

  // Check for newly unlocked achievements
  useEffect(() => {
    const newlyUnlocked = achievements.filter(
      a => a.isUnlocked && 
      a.unlockedAt && 
      new Date(a.unlockedAt).getTime() > Date.now() - 5000 // Within last 5 seconds
    )
    
    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach(a => {
        setRecentlyUnlocked(prev => new Set(prev).add(a.id))
        setTimeout(() => {
          setRecentlyUnlocked(prev => {
            const next = new Set(prev)
            next.delete(a.id)
            return next
          })
        }, 3000)
      })
    }
  }, [achievements])

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.isUnlocked).length,
    bronze: achievements.filter(a => a.isUnlocked && a.tier === 'bronze').length,
    silver: achievements.filter(a => a.isUnlocked && a.tier === 'silver').length,
    gold: achievements.filter(a => a.isUnlocked && a.tier === 'gold').length,
    platinum: achievements.filter(a => a.isUnlocked && a.tier === 'platinum').length,
  }

  const completionPercentage = (stats.unlocked / stats.total) * 100

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.isUnlocked
    if (filter === 'locked') return !a.isUnlocked
    return true
  })

  const getIcon = (iconType: Achievement['icon']) => {
    const iconClass = "h-5 w-5"
    switch (iconType) {
      case 'star': return <Star className={iconClass} />
      case 'trending': return <TrendingUp className={iconClass} />
      case 'target': return <Target className={iconClass} />
      case 'calendar': return <Calendar className={iconClass} />
      case 'zap': return <Zap className={iconClass} />
      default: return <Award className={iconClass} />
    }
  }

  const getTierColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return 'from-orange-700 to-orange-500'
      case 'silver': return 'from-gray-400 to-gray-300'
      case 'gold': return 'from-yellow-600 to-yellow-400'
      case 'platinum': return 'from-purple-600 to-blue-500'
    }
  }

  const getTierBadgeColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200'
      case 'silver': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
      case 'platinum': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Achievement Progress
          </CardTitle>
          <CardDescription>Unlock achievements by reaching milestones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{stats.unlocked}</span>
              <span className="text-2xl text-muted-foreground">/ {stats.total}</span>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {completionPercentage.toFixed(0)}%
            </Badge>
          </div>
          <Progress value={completionPercentage} className="h-3" />
          
          {/* Tier Breakdown */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            <div className="text-center p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
              <div className="text-2xl font-bold text-orange-600">{stats.bronze}</div>
              <div className="text-xs text-muted-foreground">Bronze</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-2xl font-bold text-gray-600">{stats.silver}</div>
              <div className="text-xs text-muted-foreground">Silver</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <div className="text-2xl font-bold text-yellow-600">{stats.gold}</div>
              <div className="text-xs text-muted-foreground">Gold</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <div className="text-2xl font-bold text-purple-600">{stats.platinum}</div>
              <div className="text-xs text-muted-foreground">Platinum</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-secondary p-1 rounded-lg w-fit">
        {(['all', 'unlocked', 'locked'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-background shadow-sm' 
                : 'hover:bg-background/50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAchievements.map(achievement => {
          const progress = Math.min((achievement.currentProgress / achievement.requirement) * 100, 100)
          const isRecent = recentlyUnlocked.has(achievement.id)
          
          return (
            <Card
              key={achievement.id}
              className={`
                cursor-pointer transition-all hover:shadow-lg
                ${achievement.isUnlocked ? 'border-purple-200 dark:border-purple-900' : 'opacity-75'}
                ${isRecent ? 'animate-pulse ring-2 ring-purple-500' : ''}
              `}
              onClick={() => onAchievementClick?.(achievement)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`
                    p-4 rounded-xl flex-shrink-0
                    ${achievement.isUnlocked 
                      ? `bg-gradient-to-br ${getTierColor(achievement.tier)}` 
                      : 'bg-gray-200 dark:bg-gray-800'
                    }
                  `}>
                    {achievement.isUnlocked ? (
                      <div className="text-white">
                        {getIcon(achievement.icon)}
                      </div>
                    ) : (
                      <Lock className="h-5 w-5 text-gray-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm leading-tight">
                        {achievement.name}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getTierBadgeColor(achievement.tier)}`}
                      >
                        {achievement.tier}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {achievement.description}
                    </p>

                    {/* Progress */}
                    {!achievement.isUnlocked && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {achievement.currentProgress} / {achievement.requirement}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {/* Unlocked Badge */}
                    {achievement.isUnlocked && achievement.unlockedAt && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Award className="h-3 w-3" />
                        <span>
                          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No {filter} achievements</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}





