'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain, TrendingUp, Heart, Lightbulb, AlertCircle,
  BarChart3, Calendar, Sparkles, RefreshCw
} from 'lucide-react'
import { format, subDays, isWithinInterval } from 'date-fns'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface JournalEntry {
  id: string
  data: {
    title?: string
    entry: string
    mood: string
    energy?: string
    gratitude?: string
    date: string
  }
  timestamp: string
}

interface JournalAIInsightsProps {
  journalEntries: JournalEntry[]
}

export function JournalAIInsights({ journalEntries }: JournalAIInsightsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [analyzing, setAnalyzing] = useState(false)

  // Filter entries by time range
  const filteredEntries = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const cutoffDate = subDays(new Date(), days)
    return journalEntries.filter(entry => {
      const entryDate = new Date(entry.data.date || entry.timestamp)
      return isWithinInterval(entryDate, { start: cutoffDate, end: new Date() })
    })
  }, [journalEntries, timeRange])

  // AI-Powered Mood Analysis
  const moodAnalysis = useMemo(() => {
    const moodCounts: Record<string, number> = {}
    const moodTrend: Array<{ date: string, moodScore: number }> = []
    
    filteredEntries.forEach(entry => {
      const mood = entry.data.mood
      moodCounts[mood] = (moodCounts[mood] || 0) + 1
      
      // Convert mood to score (1-10)
      const moodScore = mood.includes('Amazing') ? 10 :
                       mood.includes('Happy') ? 8 :
                       mood.includes('Content') ? 7 :
                       mood.includes('Neutral') ? 5 :
                       mood.includes('Sad') && !mood.includes('Very') ? 3 :
                       mood.includes('Very Sad') ? 2 :
                       mood.includes('Angry') ? 2 :
                       mood.includes('Anxious') ? 3 :
                       mood.includes('Tired') ? 4 :
                       mood.includes('Unwell') ? 2 : 5
      
      moodTrend.push({
        date: format(new Date(entry.data.date), 'MMM d'),
        moodScore
      })
    })

    const chartData = Object.entries(moodCounts).map(([mood, count]) => ({
      mood: mood.replace(/[^a-zA-Z\s]/g, '').trim(),
      count
    }))

    const avgMoodScore = moodTrend.length > 0
      ? moodTrend.reduce((sum, item) => sum + item.moodScore, 0) / moodTrend.length
      : 0

    return {
      distribution: chartData,
      trend: moodTrend.reverse().slice(-14), // Last 14 entries
      avgScore: avgMoodScore,
      mostCommonMood: Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    }
  }, [filteredEntries])

  // Energy Level Analysis
  const energyAnalysis = useMemo(() => {
    const energyCounts: Record<string, number> = { High: 0, Medium: 0, Low: 0 }
    filteredEntries.forEach(entry => {
      if (entry.data.energy) {
        energyCounts[entry.data.energy]++
      }
    })
    return Object.entries(energyCounts).map(([level, count]) => ({ level, count }))
  }, [filteredEntries])

  // AI-Generated Insights
  const aiInsights = useMemo(() => {
    const insights: Array<{ type: 'positive' | 'warning' | 'tip', message: string }> = []
    
    // Mood insights
    if (moodAnalysis.avgScore >= 7) {
      insights.push({
        type: 'positive',
        message: `Great job! Your average mood score is ${moodAnalysis.avgScore.toFixed(1)}/10. You're maintaining positive mental health. Keep it up!`
      })
    } else if (moodAnalysis.avgScore < 5) {
      insights.push({
        type: 'warning',
        message: `Your average mood score is ${moodAnalysis.avgScore.toFixed(1)}/10. Consider talking to someone or trying stress-relief activities.`
      })
    }

    // Consistency insights
    if (filteredEntries.length >= (timeRange === '7d' ? 5 : timeRange === '30d' ? 20 : 60)) {
      insights.push({
        type: 'positive',
        message: `Excellent journaling consistency! You've logged ${filteredEntries.length} entries. Regular reflection is key to self-awareness.`
      })
    } else if (filteredEntries.length < 5) {
      insights.push({
        type: 'tip',
        message: `Try to journal more regularly. Even 5 minutes a day can significantly improve self-awareness and emotional regulation.`
      })
    }

    // Gratitude insights
    const entriesWithGratitude = filteredEntries.filter(e => e.data.gratitude && e.data.gratitude.length > 10)
    if (entriesWithGratitude.length >= filteredEntries.length * 0.7) {
      insights.push({
        type: 'positive',
        message: `You're practicing gratitude in ${entriesWithGratitude.length} of your entries. Studies show gratitude practices improve overall well-being!`
      })
    } else {
      insights.push({
        type: 'tip',
        message: `Consider adding gratitude to more entries. Listing 3 things you're grateful for can boost your mood significantly.`
      })
    }

    // Pattern detection
    const recentEntries = filteredEntries.slice(0, 5)
    const recentMoodScores = recentEntries.map(e => {
      const mood = e.data.mood
      return mood.includes('Amazing') || mood.includes('Happy') ? 1 : 0
    })
    const positiveTrend = recentMoodScores.reduce((a: number, b: number) => a + b, 0) >= 4
    
    if (positiveTrend) {
      insights.push({
        type: 'positive',
        message: `Your mood has been trending upward lately! Whatever you're doing, keep it going. 🌟`
      })
    }

    // Word frequency (simple AI-like analysis)
    const allText = filteredEntries.map(e => e.data.entry.toLowerCase()).join(' ')
    const positiveWords = ['happy', 'grateful', 'thankful', 'joy', 'love', 'great', 'wonderful', 'amazing', 'blessed']
    const negativeWords = ['sad', 'angry', 'frustrated', 'worried', 'anxious', 'stressed', 'upset', 'bad']
    
    const positiveCount = positiveWords.filter(word => allText.includes(word)).length
    const negativeCount = negativeWords.filter(word => allText.includes(word)).length
    
    if (positiveCount > negativeCount * 2) {
      insights.push({
        type: 'positive',
        message: `Your journal entries contain predominantly positive language. Your mindset is in a great place! 😊`
      })
    } else if (negativeCount > positiveCount) {
      insights.push({
        type: 'warning',
        message: `Your entries contain more negative than positive language. Consider cognitive reframing exercises or speaking with a therapist.`
      })
    }

    return insights
  }, [filteredEntries, moodAnalysis, timeRange])

  const handleAnalyze = () => {
    setAnalyzing(true)
    setTimeout(() => setAnalyzing(false), 1500)
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a78bfa', '#f97316']

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-500/50 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                AI Journal Insights
              </CardTitle>
              <CardDescription>
                Intelligent analysis of your journal entries and mood patterns
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                disabled={analyzing || filteredEntries.length === 0}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
                {analyzing ? 'Analyzing...' : 'Re-analyze'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">Time Range:</span>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range as typeof timeRange)}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No journal entries in this time range.</p>
            <p className="text-sm mt-2">Start journaling to see AI-powered insights!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* AI Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiInsights.map((insight, idx) => (
              <Card key={idx} className={
                insight.type === 'positive' ? 'border-green-500/50 bg-green-50 dark:bg-green-950' :
                insight.type === 'warning' ? 'border-orange-500/50 bg-orange-50 dark:bg-orange-950' :
                'border-blue-500/50 bg-blue-50 dark:bg-blue-950'
              }>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {insight.type === 'positive' && <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />}
                    {insight.type === 'warning' && <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />}
                    {insight.type === 'tip' && <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                    <p className="text-sm">{insight.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mood Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Overall Mood Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl font-bold text-pink-500 mb-2">
                  {moodAnalysis.avgScore.toFixed(1)}
                  <span className="text-2xl text-muted-foreground">/10</span>
                </div>
                <p className="text-lg text-muted-foreground mb-4">
                  Most Common: {moodAnalysis.mostCommonMood.replace(/[^a-zA-Z\s]/g, '')}
                </p>
                <Badge variant="outline" className="text-sm">
                  Based on {filteredEntries.length} entries
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Mood Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Mood Trend Over Time
              </CardTitle>
              <CardDescription>Your mood score progression (1-10 scale)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moodAnalysis.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="moodScore" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Mood Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Mood Distribution
                </CardTitle>
                <CardDescription>Frequency of different moods</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={moodAnalysis.distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.mood}: ${entry.count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {moodAnalysis.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Energy Levels
                </CardTitle>
                <CardDescription>Your energy throughout the period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={energyAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#10b981" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}







