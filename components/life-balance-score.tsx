'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { TrendingUp, TrendingDown, DollarSign, Heart, Briefcase, Users, Brain, Target } from 'lucide-react'

interface CategoryScore {
  category: string
  score: number
  icon: any
  color: string
}

export function LifeBalanceScore() {
  const { data, tasks, habits, bills } = useData()
  const [scores, setScores] = useState<CategoryScore[]>([])
  const [overallScore, setOverallScore] = useState(0)

  useEffect(() => {
    calculateScores()
  }, [data, tasks, habits, bills])

  const calculateScores = () => {
    const newScores: CategoryScore[] = []

    // Financial Health (0-100)
    const totalBills = bills.length
    const paidBills = bills.filter(b => b.status === 'paid').length
    const financialData = data['financial'] || []
    const financialScore = totalBills > 0
      ? Math.round((paidBills / totalBills) * 100)
      : financialData.length > 0
      ? 75 // Has financial data tracked
      : 50 // No data yet

    newScores.push({
      category: 'Financial',
      score: financialScore,
      icon: DollarSign,
      color: 'text-green-600',
    })

    // Physical Health (0-100)
    const healthData = data['health'] || []
    const healthScore = healthData.length > 0
      ? Math.min(100, 50 + (healthData.length * 5)) // More tracking = better score
      : 50

    newScores.push({
      category: 'Health',
      score: healthScore,
      icon: Heart,
      color: 'text-red-600',
    })

    // Career/Productivity (0-100)
    const careerData = data['career'] || []
    const completedTasks = tasks.filter(t => t.completed).length
    const totalTasks = tasks.length
    const careerScore = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 60 + 40) // Task completion contributes
      : careerData.length > 0
      ? 70
      : 50

    newScores.push({
      category: 'Career',
      score: careerScore,
      icon: Briefcase,
      color: 'text-blue-600',
    })

    // Relationships (0-100)
    const relationshipsData = data['relationships'] || []
    const relationshipsScore = relationshipsData.length > 0
      ? Math.min(100, 50 + (relationshipsData.length * 10))
      : 50

    newScores.push({
      category: 'Relationships',
      score: relationshipsScore,
      icon: Users,
      color: 'text-purple-600',
    })

    // Personal Growth (Habits) (0-100)
    const completedHabits = habits.filter(h => h.completed).length
    const totalHabits = habits.length
    const maxStreak = Math.max(...habits.map(h => h.streak), 0)
    const growthScore = totalHabits > 0
      ? Math.round(((completedHabits / totalHabits) * 50) + Math.min(50, maxStreak * 2))
      : 50

    newScores.push({
      category: 'Personal Growth',
      score: growthScore,
      icon: Brain,
      color: 'text-indigo-600',
    })

    // Life Organization (0-100)
    const totalItems = Object.values(data).reduce((sum, items) => sum + items.length, 0)
    const activeDomains = Object.keys(data).filter(key => data[key]?.length > 0).length
    const organizationScore = Math.min(100, 30 + (activeDomains * 7) + (totalItems * 2))

    newScores.push({
      category: 'Organization',
      score: organizationScore,
      icon: Target,
      color: 'text-orange-600',
    })

    setScores(newScores)

    // Calculate overall score (weighted average)
    const overall = Math.round(
      newScores.reduce((sum, s) => sum + s.score, 0) / newScores.length
    )
    setOverallScore(overall)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Attention'
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Life Balance Score</span>
          <div className="flex items-center gap-2">
            <span className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </CardTitle>
        <CardDescription>
          {getScoreLabel(overallScore)} - Keep tracking to improve your score
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Overall Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${overallScore}%` }}
            >
              {overallScore >= 20 && (
                <span className="text-xs font-bold text-white">
                  {overallScore}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          {scores.map(({ category, score, icon: Icon, color }) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-sm font-medium">{category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                    {score}
                  </span>
                  {score >= 70 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : score <= 50 ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : null}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    score >= 80 ? 'bg-green-500' :
                    score >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="mt-6 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
          <h4 className="font-semibold text-sm mb-2">💡 Quick Tip</h4>
          <p className="text-sm text-muted-foreground">
            {overallScore >= 80
              ? "You're doing great! Maintain your momentum by continuing to track regularly."
              : overallScore >= 60
              ? "Good progress! Focus on the lower-scoring areas to improve your overall balance."
              : "Start by adding more data to the domains that matter most to you. Consistency is key!"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}








