'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AchievementManager, Achievement } from '@/lib/achievements'
import { Trophy, Lock, TrendingUp, Target, DollarSign, Heart, CheckCircle } from 'lucide-react'

export function AchievementsDisplay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [progress, setProgress] = useState({ unlocked: 0, total: 0, percentage: 0 })

  useEffect(() => {
    if (open) {
      loadAchievements()
    }
  }, [open])

  const loadAchievements = async () => {
    const achievementsList = await AchievementManager.getAchievements()
    const progressData = await AchievementManager.getProgress()
    setAchievements(achievementsList)
    setProgress(progressData)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'habits':
        return Target
      case 'finance':
        return DollarSign
      case 'health':
        return Heart
      case 'productivity':
        return CheckCircle
      default:
        return TrendingUp
    }
  }

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
    acc[achievement.category].push(achievement)
    return acc
  }, {} as Record<string, Achievement[]>)

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const lockedAchievements = achievements.filter(a => !a.unlocked)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Achievements
          </DialogTitle>
          <DialogDescription>
            Track your progress and unlock rewards
          </DialogDescription>
        </DialogHeader>

        {/* Progress Overview */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-3xl font-bold">{progress.percentage}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Unlocked</p>
                <p className="text-2xl font-semibold">{progress.unlocked} / {progress.total}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="all" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All ({achievements.length})
            </TabsTrigger>
            <TabsTrigger value="unlocked">
              Unlocked ({unlockedAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="locked">
              Locked ({lockedAchievements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
              const Icon = getCategoryIcon(category)
              return (
                <div key={category}>
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 capitalize">
                    <Icon className="h-5 w-5" />
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {categoryAchievements.map(achievement => (
                      <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                  </div>
                </div>
              )
            })}
          </TabsContent>

          <TabsContent value="unlocked" className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {unlockedAchievements.map(achievement => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
            {unlockedAchievements.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No achievements unlocked yet. Keep going!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="locked" className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {lockedAchievements.map(achievement => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const progressPercentage = (achievement.progress / achievement.requirement) * 100

  return (
    <Card className={`${achievement.unlocked ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/10' : 'opacity-60'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{achievement.icon}</span>
            {achievement.unlocked && <Trophy className="h-4 w-4 text-yellow-500" />}
            {!achievement.unlocked && <Lock className="h-4 w-4 text-gray-400" />}
          </div>
          <Badge variant={achievement.unlocked ? 'default' : 'secondary'} className="text-xs">
            {achievement.category}
          </Badge>
        </div>
        <CardTitle className="text-base mt-2">{achievement.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {achievement.description}
        </p>
        {!achievement.unlocked && (
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{achievement.progress} / {achievement.requirement}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}
        {achievement.unlocked && achievement.unlockedAt && (
          <p className="text-xs text-muted-foreground">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}








