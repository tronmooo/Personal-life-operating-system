'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { 
  Bot, Sparkles, Brain, MessageSquare, Zap, Target, TrendingUp, Settings,
  Heart, DollarSign, Dumbbell, Clock, Smile, Users, BookOpen, Lightbulb,
  ChevronRight, Activity, Flame, Award, Calendar, Shield, Coffee, Moon,
  Sun, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Loader2, Star
} from 'lucide-react'
import Link from 'next/link'

// AI Coach types
interface CoachCard {
  id: string
  name: string
  title: string
  description: string
  icon: React.ComponentType<any>
  gradient: string
  bgColor: string
  iconColor: string
  features: string[]
  href: string
  status: 'available' | 'coming_soon'
}

interface DailyCoachTip {
  id: string
  coach: string
  tip: string
  category: string
  priority: 'high' | 'medium' | 'low'
}

interface LifeScore {
  category: string
  score: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<any>
  color: string
}

// AI Coaches configuration
const AI_COACHES: CoachCard[] = [
  {
    id: 'life-coach',
    name: 'Atlas',
    title: 'Life Coach',
    description: 'Your personal guide to achieving balance and fulfillment across all life domains',
    icon: Brain,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    iconColor: 'text-violet-600',
    features: ['Goal setting & tracking', 'Life balance analysis', 'Personal growth plans', 'Weekly check-ins'],
    href: '/ai/life-coach',
    status: 'available'
  },
  {
    id: 'financial-coach',
    name: 'Fortuna',
    title: 'Financial Coach',
    description: 'Expert guidance on budgeting, saving, investing, and achieving financial freedom',
    icon: DollarSign,
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-emerald-600',
    features: ['Budget optimization', 'Spending analysis', 'Savings strategies', 'Investment guidance'],
    href: '/ai/financial-coach',
    status: 'available'
  },
  {
    id: 'health-coach',
    name: 'Vitalis',
    title: 'Health & Wellness Coach',
    description: 'Holistic health guidance including fitness, nutrition, sleep, and mental wellness',
    icon: Heart,
    gradient: 'from-rose-500 via-red-500 to-pink-500',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    iconColor: 'text-rose-600',
    features: ['Fitness planning', 'Nutrition guidance', 'Sleep optimization', 'Stress management'],
    href: '/ai/health-coach',
    status: 'available'
  },
  {
    id: 'productivity-coach',
    name: 'Kronos',
    title: 'Productivity Coach',
    description: 'Master your time, build powerful habits, and maximize your daily effectiveness',
    icon: Clock,
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-600',
    features: ['Time management', 'Habit building', 'Task prioritization', 'Focus techniques'],
    href: '/ai/productivity-coach',
    status: 'available'
  },
  {
    id: 'mindfulness-coach',
    name: 'Serenity',
    title: 'Mindfulness Coach',
    description: 'Find inner peace through meditation, reflection, and emotional intelligence',
    icon: Smile,
    gradient: 'from-sky-500 via-blue-500 to-indigo-500',
    bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    iconColor: 'text-sky-600',
    features: ['Guided meditation', 'Mood tracking', 'Journaling prompts', 'Breathing exercises'],
    href: '/ai/mindfulness-coach',
    status: 'available'
  },
  {
    id: 'relationship-coach',
    name: 'Harmony',
    title: 'Relationship Coach',
    description: 'Strengthen connections with family, friends, and professional networks',
    icon: Users,
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    iconColor: 'text-pink-600',
    features: ['Communication tips', 'Conflict resolution', 'Network building', 'Quality time planning'],
    href: '/ai/relationship-coach',
    status: 'available'
  }
]

// Quick Actions for AI
const QUICK_ACTIONS = [
  { label: 'Get Daily Briefing', icon: Sun, href: '/insights', color: 'text-amber-500' },
  { label: 'Set a New Goal', icon: Target, href: '/goals-coach', color: 'text-pink-500' },
  { label: 'Chat with AI', icon: MessageSquare, href: '/ai-chat', color: 'text-blue-500' },
  { label: 'View Analytics', icon: TrendingUp, href: '/analytics', color: 'text-green-500' },
  { label: 'Therapy Session', icon: Heart, href: '/therapy-chat', color: 'text-rose-500' },
  { label: 'Scan Document', icon: BookOpen, href: '/tools/document-scanner', color: 'text-purple-500' }
]

export default function AIPage() {
  const { data, tasks, habits, bills } = useData()
  const [isLoadingScores, setIsLoadingScores] = useState(true)
  const [isLoadingTips, setIsLoadingTips] = useState(true)
  const [lifeScores, setLifeScores] = useState<LifeScore[]>([])
  const [dailyTips, setDailyTips] = useState<DailyCoachTip[]>([])
  const [overallScore, setOverallScore] = useState(0)
  const [greeting, setGreeting] = useState('')
  const [selectedTab, setSelectedTab] = useState('coaches')

  // Set time-based greeting
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  // Calculate life scores from user data
  const calculateLifeScores = useCallback(() => {
    const scores: LifeScore[] = []
    
    // Financial score
    const financialData = (data.financial || []) as any[]
    const hasFinancialData = financialData.length > 0
    const financialScore = hasFinancialData ? Math.min(100, 50 + financialData.length * 5) : 0
    scores.push({
      category: 'Financial',
      score: financialScore,
      trend: financialScore > 60 ? 'up' : financialScore > 40 ? 'stable' : 'down',
      icon: DollarSign,
      color: 'text-emerald-500'
    })

    // Health score
    const healthData = (data.health || []) as any[]
    const healthScore = healthData.length > 0 ? Math.min(100, 50 + healthData.length * 3) : 0
    scores.push({
      category: 'Health',
      score: healthScore,
      trend: healthScore > 60 ? 'up' : healthScore > 40 ? 'stable' : 'down',
      icon: Heart,
      color: 'text-rose-500'
    })

    // Productivity score
    const completedTasks = tasks.filter((t: any) => t.completed).length
    const totalTasks = tasks.length
    const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 50
    scores.push({
      category: 'Productivity',
      score: productivityScore,
      trend: productivityScore > 70 ? 'up' : productivityScore > 40 ? 'stable' : 'down',
      icon: Clock,
      color: 'text-amber-500'
    })

    // Habits score
    const activeHabits = habits.filter((h: any) => h.active).length
    const habitsScore = activeHabits > 0 ? Math.min(100, 40 + activeHabits * 10) : 30
    scores.push({
      category: 'Habits',
      score: habitsScore,
      trend: habitsScore > 60 ? 'up' : habitsScore > 40 ? 'stable' : 'down',
      icon: Flame,
      color: 'text-orange-500'
    })

    // Mindfulness score (based on various factors)
    const mindfulnessData = (data.mindfulness || []) as any[]
    const mindfulnessScore = mindfulnessData.length > 0 ? Math.min(100, 45 + mindfulnessData.length * 5) : 35
    scores.push({
      category: 'Mindfulness',
      score: mindfulnessScore,
      trend: mindfulnessScore > 50 ? 'up' : 'stable',
      icon: Smile,
      color: 'text-sky-500'
    })

    // Relationships score
    const relationshipsData = (data.relationships || []) as any[]
    const relationshipsScore = relationshipsData.length > 0 ? Math.min(100, 50 + relationshipsData.length * 8) : 45
    scores.push({
      category: 'Relationships',
      score: relationshipsScore,
      trend: relationshipsScore > 60 ? 'up' : 'stable',
      icon: Users,
      color: 'text-pink-500'
    })

    setLifeScores(scores)
    
    // Calculate overall score
    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length
    setOverallScore(Math.round(avgScore))
    setIsLoadingScores(false)
  }, [data, tasks, habits])

  // Generate daily coaching tips
  const generateDailyTips = useCallback(async () => {
    setIsLoadingTips(true)
    
    try {
      const response = await fetch('/api/ai-coaches/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachType: 'life-coach',
          message: `Provide 4-5 brief, actionable daily tips. Each tip should:
1. Be specific and actionable (under 100 characters)
2. Reference a specific coach (Life, Financial, Health, Productivity, Mindfulness, or Relationship)
3. Be categorized by priority (high, medium, low)
Format as bullet points with coach name and priority.`,
          context: `User data summary: ${JSON.stringify({
            tasksCount: Object.values(data).flat().length,
            habitsCount: habits.length,
            activeHabits: habits.filter((h: any) => h.active).length,
            completedTasks: tasks.filter((t: any) => t.completed).length,
            pendingTasks: tasks.filter((t: any) => !t.completed).length
          })}`,
          conversationHistory: []
        })
      })

      if (response.ok) {
        const result = await response.json()
        const tips = parseTipsFromResponse(result.response || '')
        setDailyTips(tips)
      } else {
        // Fallback to generated tips
        setDailyTips(generateFallbackTips())
      }
    } catch (error) {
      console.error('Failed to fetch daily tips:', error)
      setDailyTips(generateFallbackTips())
    } finally {
      setIsLoadingTips(false)
    }
  }, [data])

  const parseTipsFromResponse = (response: string): DailyCoachTip[] => {
    const tips: DailyCoachTip[] = []
    const lines = response.split('\n').filter(l => l.trim())
    
    const coaches = ['life', 'financial', 'health', 'productivity', 'mindfulness', 'relationship']
    
    for (const line of lines) {
      const trimmed = line.replace(/^[-•*\d.]\s*/, '').trim()
      if (trimmed.length > 15 && trimmed.length < 200) {
        let coach = 'Life'
        for (const c of coaches) {
          if (trimmed.toLowerCase().includes(c)) {
            coach = c.charAt(0).toUpperCase() + c.slice(1)
            break
          }
        }
        
        const priority: 'high' | 'medium' | 'low' = 
          trimmed.toLowerCase().includes('urgent') || trimmed.toLowerCase().includes('important') ? 'high' :
          trimmed.toLowerCase().includes('consider') || trimmed.toLowerCase().includes('try') ? 'low' : 'medium'
        
        tips.push({
          id: `tip-${tips.length}`,
          coach,
          tip: trimmed.replace(/\((high|medium|low)\)/gi, '').trim(),
          category: coach,
          priority
        })
      }
    }
    
    return tips.slice(0, 5)
  }

  const generateFallbackTips = (): DailyCoachTip[] => {
    const completedTasks = tasks.filter((t: any) => t.completed).length
    const pendingTasks = tasks.filter((t: any) => !t.completed).length
    const activeHabits = habits.filter((h: any) => h.active).length
    
    const tips: DailyCoachTip[] = []
    
    if (pendingTasks > 5) {
      tips.push({
        id: 'prod-1',
        coach: 'Productivity',
        tip: `You have ${pendingTasks} pending tasks. Consider prioritizing the top 3 for today.`,
        category: 'Productivity',
        priority: 'high'
      })
    }
    
    if (activeHabits < 3) {
      tips.push({
        id: 'habit-1',
        coach: 'Life',
        tip: 'Start building momentum with small daily habits. Try adding one new habit this week.',
        category: 'Habits',
        priority: 'medium'
      })
    }
    
    tips.push({
      id: 'health-1',
      coach: 'Health',
      tip: 'Take a 5-minute stretch break every hour to maintain energy and focus.',
      category: 'Health',
      priority: 'medium'
    })
    
    tips.push({
      id: 'mind-1',
      coach: 'Mindfulness',
      tip: 'Start your day with 3 deep breaths to center yourself before diving into tasks.',
      category: 'Mindfulness',
      priority: 'low'
    })
    
    tips.push({
      id: 'finance-1',
      coach: 'Financial',
      tip: 'Review your recent transactions to stay on top of your spending patterns.',
      category: 'Financial',
      priority: 'medium'
    })
    
    return tips
  }

  useEffect(() => {
    calculateLifeScores()
    generateDailyTips()
  }, [calculateLifeScores, generateDailyTips])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
      default: return <ArrowRight className="h-3 w-3 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 dark:bg-red-950/50 border-red-200 dark:border-red-800'
      case 'medium': return 'bg-amber-100 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
      default: return 'bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-8 md:p-12 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">{greeting}</p>
                    <h1 className="text-3xl md:text-4xl font-bold">AI Command Center</h1>
                  </div>
                </div>
                <p className="text-white/80 max-w-xl text-lg">
                  Your personal team of AI coaches, ready to help you optimize every aspect of your life.
                </p>
              </div>
              
              {/* Overall Life Score */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="relative h-32 w-32">
                    <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="white"
                        strokeWidth="8"
                        strokeDasharray={`${overallScore * 2.83} 283`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{isLoadingScores ? '--' : overallScore}</span>
                      <span className="text-xs text-white/70">Life Score</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action, idx) => (
            <Link key={idx} href={action.href}>
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group border-2 hover:border-purple-200 dark:hover:border-purple-800">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <span className="text-sm font-medium truncate">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="coaches" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Coaches
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Daily Tips
            </TabsTrigger>
            <TabsTrigger value="scores" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Life Scores
            </TabsTrigger>
          </TabsList>

          {/* Coaches Tab */}
          <TabsContent value="coaches" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {AI_COACHES.map((coach) => (
                <Link key={coach.id} href={coach.href}>
                  <Card className={`h-full hover:shadow-xl transition-all cursor-pointer group overflow-hidden border-2 hover:border-purple-300 dark:hover:border-purple-700 ${coach.bgColor}`}>
                    <CardHeader className="pb-4">
                      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${coach.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                        <coach.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{coach.name}</p>
                          <CardTitle className="text-xl">{coach.title}</CardTitle>
                        </div>
                        {coach.status === 'available' ? (
                          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Soon</Badge>
                        )}
                      </div>
                      <CardDescription className="mt-2">
                        {coach.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {coach.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Button className={`w-full bg-gradient-to-r ${coach.gradient} text-white hover:opacity-90 group-hover:shadow-lg transition-all`}>
                        Start Session
                        <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Additional AI Tools */}
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  More AI Tools
                </CardTitle>
                <CardDescription>Specialized AI-powered features for your daily life</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/ai-chat">
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:shadow-md transition-all cursor-pointer group">
                      <MessageSquare className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="font-medium text-sm">AI Chat</p>
                      <p className="text-xs text-muted-foreground">General assistant</p>
                    </div>
                  </Link>
                  <Link href="/therapy-chat">
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 hover:shadow-md transition-all cursor-pointer group">
                      <Heart className="h-8 w-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="font-medium text-sm">Therapy Chat</p>
                      <p className="text-xs text-muted-foreground">Emotional support</p>
                    </div>
                  </Link>
                  <Link href="/goals-coach">
                    <div className="p-4 rounded-xl bg-pink-50 dark:bg-pink-950/30 hover:shadow-md transition-all cursor-pointer group">
                      <Target className="h-8 w-8 text-pink-500 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="font-medium text-sm">Goals Coach</p>
                      <p className="text-xs text-muted-foreground">Set & achieve goals</p>
                    </div>
                  </Link>
                  <Link href="/predictive-analytics">
                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 hover:shadow-md transition-all cursor-pointer group">
                      <TrendingUp className="h-8 w-8 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="font-medium text-sm">Predictions</p>
                      <p className="text-xs text-muted-foreground">Future insights</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Tips Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-amber-500" />
                    Today's Coaching Tips
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => generateDailyTips()}
                    disabled={isLoadingTips}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTips ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <CardDescription>Personalized recommendations from your AI coaches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingTips ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : dailyTips.length > 0 ? (
                  dailyTips.map((tip) => (
                    <div
                      key={tip.id}
                      className={`p-4 rounded-xl border ${getPriorityColor(tip.priority)} transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                          {tip.coach === 'Financial' && <DollarSign className="h-5 w-5 text-emerald-500" />}
                          {tip.coach === 'Health' && <Heart className="h-5 w-5 text-rose-500" />}
                          {tip.coach === 'Productivity' && <Clock className="h-5 w-5 text-amber-500" />}
                          {tip.coach === 'Mindfulness' && <Smile className="h-5 w-5 text-sky-500" />}
                          {tip.coach === 'Life' && <Brain className="h-5 w-5 text-violet-500" />}
                          {tip.coach === 'Relationship' && <Users className="h-5 w-5 text-pink-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs font-medium">
                              {tip.coach} Coach
                            </Badge>
                            {tip.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs">Priority</Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium">{tip.tip}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Add more data to get personalized tips!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Life Scores Tab */}
          <TabsContent value="scores" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Life Balance Scores
                </CardTitle>
                <CardDescription>How well you're managing different life domains</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingScores ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    {lifeScores.map((score, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
                              <score.icon className={`h-4 w-4 ${score.color}`} />
                            </div>
                            <span className="font-medium">{score.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(score.trend)}
                            <span className={`font-bold ${
                              score.score >= 70 ? 'text-green-600' :
                              score.score >= 40 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {score.score}%
                            </span>
                          </div>
                        </div>
                        <Progress 
                          value={score.score} 
                          className="h-2"
                        />
                      </div>
                    ))}

                    {/* Score Legend */}
                    <div className="flex items-center justify-center gap-6 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span className="text-xs text-muted-foreground">Excellent (70+)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                        <span className="text-xs text-muted-foreground">Good (40-69)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-xs text-muted-foreground">Needs Work (&lt;40)</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Improvement Suggestions */}
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  How to Improve Your Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {lifeScores.filter(s => s.score < 70).slice(0, 4).map((score, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border">
                      <div className="flex items-center gap-2 mb-2">
                        <score.icon className={`h-5 w-5 ${score.color}`} />
                        <span className="font-medium">{score.category}</span>
                        <Badge variant="outline" className="ml-auto">{score.score}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {score.category === 'Financial' && 'Track more transactions and set a budget goal'}
                        {score.category === 'Health' && 'Log more health activities and track your metrics'}
                        {score.category === 'Productivity' && 'Complete more tasks and break down large goals'}
                        {score.category === 'Habits' && 'Add more daily habits and maintain streaks'}
                        {score.category === 'Mindfulness' && 'Try meditation or journaling exercises'}
                        {score.category === 'Relationships' && 'Connect with friends and family more often'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Settings Link */}
        <Card className="bg-gray-50 dark:bg-gray-900/50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <Settings className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <h3 className="font-semibold">AI Settings</h3>
                <p className="text-sm text-muted-foreground">Customize your AI assistant's behavior and preferences</p>
              </div>
            </div>
            <Link href="/ai-assistant-settings">
              <Button variant="outline">
                Configure
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
