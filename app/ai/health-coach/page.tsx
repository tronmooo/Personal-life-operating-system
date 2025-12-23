'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import {
  Heart, Send, Activity, Dumbbell, Apple, Moon, Droplets,
  Scale, Brain, Timer, Flame, TrendingUp, ArrowLeft, MessageSquare,
  Mic, Loader2, Target, Zap, Footprints, Coffee, Pill, Stethoscope,
  Smile, AlertCircle, CheckCircle
} from 'lucide-react'
import { format, differenceInDays, subDays } from 'date-fns'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface HealthMetric {
  id: string
  label: string
  value: string | number
  unit?: string
  icon: React.ComponentType<any>
  color: string
  trend?: 'up' | 'down' | 'stable'
  target?: number
}

interface DailyHabit {
  id: string
  name: string
  completed: boolean
  icon: React.ComponentType<any>
  streak: number
}

const QUICK_PROMPTS = [
  "Create a workout plan for me",
  "Help me improve my sleep",
  "What should I eat today?",
  "How can I reduce stress?",
  "Track my fitness progress",
  "Build a healthy morning routine"
]

const COACH_INTRO = `Hello! I'm Vitalis, your Health & Wellness Coach. 🏃‍♂️

I'm here to support your journey to optimal health:
• **Fitness** - Custom workout plans and exercise guidance
• **Nutrition** - Healthy eating habits and meal planning
• **Sleep** - Quality rest and recovery optimization
• **Mental Wellness** - Stress management and mindfulness
• **Holistic Health** - Balance across all wellness dimensions

How can I help you feel your best today?`

const DAILY_HABITS: DailyHabit[] = [
  { id: 'water', name: '8 glasses of water', completed: false, icon: Droplets, streak: 0 },
  { id: 'exercise', name: '30 min exercise', completed: false, icon: Dumbbell, streak: 0 },
  { id: 'sleep', name: '7+ hours sleep', completed: false, icon: Moon, streak: 0 },
  { id: 'meditation', name: 'Mindful moments', completed: false, icon: Brain, streak: 0 },
  { id: 'vegetables', name: 'Eat vegetables', completed: false, icon: Apple, streak: 0 },
  { id: 'steps', name: '10,000 steps', completed: false, icon: Footprints, streak: 0 }
]

export default function HealthCoachPage() {
  const { data, habits } = useData()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'assistant',
      content: COACH_INTRO,
      timestamp: new Date(),
      suggestions: QUICK_PROMPTS.slice(0, 3)
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([])
  const [dailyHabits, setDailyHabits] = useState<DailyHabit[]>(DAILY_HABITS)
  const [wellnessScore, setWellnessScore] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Calculate health metrics from user data
  const calculateHealthMetrics = useCallback(() => {
    const healthData = (data.health || []) as any[]
    const fitnessData = (data.fitness || []) as any[]
    const nutritionData = (data.nutrition || []) as any[]
    const mindfulnessData = (data.mindfulness || []) as any[]

    const metrics: HealthMetric[] = []

    // Weight tracking
    const weightLogs = healthData.filter((item: any) => {
      const meta = item.metadata || item
      return meta.logType === 'weight' || meta.type === 'weight'
    }).sort((a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())

    if (weightLogs.length > 0) {
      const latest = weightLogs[0].metadata || weightLogs[0]
      metrics.push({
        id: 'weight',
        label: 'Weight',
        value: latest.value || latest.weight || '--',
        unit: latest.unit || 'lbs',
        icon: Scale,
        color: 'text-blue-500',
        trend: weightLogs.length > 1 ? 
          (parseFloat(weightLogs[0].metadata?.value) < parseFloat(weightLogs[1].metadata?.value) ? 'down' : 'up') : 
          'stable'
      })
    } else {
      metrics.push({
        id: 'weight',
        label: 'Weight',
        value: '--',
        unit: 'lbs',
        icon: Scale,
        color: 'text-blue-500'
      })
    }

    // Workout count
    const recentWorkouts = fitnessData.length > 0 ? fitnessData : healthData.filter((item: any) => {
      const meta = item.metadata || item
      return meta.workout_type || meta.type === 'workout' || meta.logType === 'exercise'
    })
    
    metrics.push({
      id: 'workouts',
      label: 'Workouts This Week',
      value: recentWorkouts.length,
      icon: Dumbbell,
      color: 'text-orange-500',
      trend: recentWorkouts.length >= 3 ? 'up' : recentWorkouts.length > 0 ? 'stable' : 'down',
      target: 4
    })

    // Sleep average
    const sleepLogs = healthData.filter((item: any) => {
      const meta = item.metadata || item
      return meta.logType === 'sleep' || meta.type === 'sleep'
    })
    
    const avgSleep = sleepLogs.length > 0 
      ? sleepLogs.reduce((sum: number, log: any) => sum + (parseFloat(log.metadata?.value || log.metadata?.hours || 0)), 0) / sleepLogs.length 
      : 0
    
    metrics.push({
      id: 'sleep',
      label: 'Avg Sleep',
      value: avgSleep > 0 ? avgSleep.toFixed(1) : '--',
      unit: 'hrs',
      icon: Moon,
      color: 'text-indigo-500',
      trend: avgSleep >= 7 ? 'up' : avgSleep >= 6 ? 'stable' : 'down',
      target: 8
    })

    // Active habits
    const activeHealthHabits = habits.filter((h: any) => h.active && 
      (h.title?.toLowerCase().includes('exercise') || 
       h.title?.toLowerCase().includes('workout') ||
       h.title?.toLowerCase().includes('walk') ||
       h.title?.toLowerCase().includes('water') ||
       h.title?.toLowerCase().includes('sleep'))
    ).length

    metrics.push({
      id: 'habits',
      label: 'Health Habits',
      value: activeHealthHabits,
      icon: Flame,
      color: 'text-rose-500',
      trend: activeHealthHabits >= 3 ? 'up' : activeHealthHabits > 0 ? 'stable' : 'down'
    })

    // Mindfulness sessions
    const mindfulnessSessions = mindfulnessData.length
    metrics.push({
      id: 'mindfulness',
      label: 'Mindful Sessions',
      value: mindfulnessSessions,
      icon: Brain,
      color: 'text-purple-500',
      trend: mindfulnessSessions >= 5 ? 'up' : mindfulnessSessions > 0 ? 'stable' : 'down'
    })

    // Calories (if tracked)
    const calorieLog = nutritionData.find((item: any) => item.metadata?.calories)
    metrics.push({
      id: 'calories',
      label: 'Today\'s Calories',
      value: calorieLog?.metadata?.calories || '--',
      icon: Apple,
      color: 'text-green-500'
    })

    setHealthMetrics(metrics)

    // Calculate wellness score
    let score = 40 // Base score
    if (recentWorkouts.length >= 3) score += 15
    if (avgSleep >= 7) score += 15
    if (activeHealthHabits >= 2) score += 10
    if (mindfulnessSessions >= 3) score += 10
    if (weightLogs.length > 0) score += 5
    if (nutritionData.length > 0) score += 5
    setWellnessScore(Math.min(100, score))

    setIsLoadingMetrics(false)
  }, [data, habits])

  useEffect(() => {
    calculateHealthMetrics()
  }, [calculateHealthMetrics])

  // Toggle daily habit
  const toggleHabit = (habitId: string) => {
    setDailyHabits(prev => prev.map(h => 
      h.id === habitId ? { ...h, completed: !h.completed, streak: h.completed ? h.streak : h.streak + 1 } : h
    ))
  }

  // Send message
  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsTyping(true)

    try {
      const metricsContext = healthMetrics.map(m => `${m.label}: ${m.value}${m.unit ? ' ' + m.unit : ''}`).join(', ')
      const completedHabits = dailyHabits.filter(h => h.completed).map(h => h.name).join(', ')
      
      const response = await fetch('/api/ai-coaches/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachType: 'health-coach',
          message: currentInput,
          context: `Health Metrics: ${metricsContext}

Wellness Score: ${wellnessScore}/100

Today's completed habits: ${completedHabits || 'None yet'}`,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const result = await response.json()
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response || "I'm here to support your health journey. What aspect would you like to focus on?",
        timestamp: new Date(),
        suggestions: generateHealthSuggestions(currentInput)
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting, but here's a quick wellness tip: Take 3 deep breaths right now - inhale for 4 seconds, hold for 4, exhale for 4. This simple technique can instantly reduce stress!",
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const generateHealthSuggestions = (userInput: string): string[] => {
    const lower = userInput.toLowerCase()
    
    if (lower.includes('workout') || lower.includes('exercise') || lower.includes('fitness')) {
      return ['What exercises can I do at home?', 'How often should I work out?', 'Best exercises for energy']
    }
    if (lower.includes('sleep') || lower.includes('tired') || lower.includes('rest')) {
      return ['Sleep hygiene tips', 'How to fall asleep faster', 'Optimal sleep schedule']
    }
    if (lower.includes('eat') || lower.includes('food') || lower.includes('nutrition') || lower.includes('diet')) {
      return ['Healthy meal ideas', 'How to reduce sugar intake', 'Best foods for energy']
    }
    if (lower.includes('stress') || lower.includes('anxious') || lower.includes('relax')) {
      return ['Quick stress relief techniques', 'Breathing exercises', 'How to meditate']
    }
    if (lower.includes('weight') || lower.includes('lose') || lower.includes('gain')) {
      return ['Sustainable weight management', 'Calorie tracking tips', 'Exercise for weight goals']
    }
    
    return ['Start a fitness routine', 'Improve my nutrition', 'Build healthy habits']
  }

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input not supported in this browser')
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
    }

    recognition.start()
  }

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />
    if (trend === 'down') return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 dark:from-rose-950/30 dark:via-red-950/30 dark:to-pink-950/30">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/ai">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 via-red-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">VITALIS</p>
                  <h1 className="text-2xl md:text-3xl font-bold">Health & Wellness Coach</h1>
                </div>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Online
          </Badge>
        </div>

        {/* Health Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoadingMetrics ? (
            [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24" />)
          ) : (
            healthMetrics.map((metric) => (
              <Card key={metric.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className={`h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2`}>
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xl font-bold">{metric.value}</p>
                    {metric.unit && <span className="text-xs text-muted-foreground">{metric.unit}</span>}
                    {getTrendIcon(metric.trend)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Wellness Score & Daily Habits */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wellness Score */}
            <Card className="border-2 border-rose-200 dark:border-rose-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-rose-500" />
                  Wellness Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative h-32 w-32">
                    <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-200 dark:text-gray-700" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="url(#healthGradient)" strokeWidth="10" strokeDasharray={`${wellnessScore * 2.64} 264`} strokeLinecap="round" />
                      <defs>
                        <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{wellnessScore}</span>
                      <span className="text-xs text-muted-foreground">Score</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  {wellnessScore >= 70 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Great wellness!</span>
                    </>
                  ) : wellnessScore >= 50 ? (
                    <>
                      <Smile className="h-4 w-4 text-amber-500" />
                      <span className="text-amber-600">Good progress!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                      <span className="text-rose-600">Let's improve together</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily Health Habits */}
            <Card className="border-2 border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-amber-500" />
                  Daily Health Habits
                </CardTitle>
                <CardDescription>Track your wellness habits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dailyHabits.map(habit => (
                  <div
                    key={habit.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      habit.completed 
                        ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' 
                        : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleHabit(habit.id)}
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      habit.completed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {habit.completed ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <habit.icon className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${habit.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {habit.name}
                      </p>
                    </div>
                    {habit.streak > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Flame className="h-3 w-3 mr-1 text-orange-500" />
                        {habit.streak}
                      </Badge>
                    )}
                  </div>
                ))}
                <p className="text-xs text-center text-muted-foreground pt-2">
                  {dailyHabits.filter(h => h.completed).length}/{dailyHabits.length} completed today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] md:h-[700px] flex flex-col border-2 border-rose-200 dark:border-rose-800">
              <CardHeader className="border-b bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-rose-500" />
                  Chat with Vitalis
                </CardTitle>
                <CardDescription>Your personal health & wellness coaching session</CardDescription>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%]`}>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                            <Heart className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-rose-600">Vitalis</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-rose-600 text-white rounded-br-md'
                            : 'bg-white dark:bg-gray-800 border rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.suggestions.map((suggestion, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setInput(suggestion)
                                setTimeout(handleSendMessage, 100)
                              }}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2 px-1">
                        {format(message.timestamp, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                        <Heart className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                          <span className="text-sm text-muted-foreground">Vitalis is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input */}
              <div className="border-t p-4 bg-white dark:bg-gray-900">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask about fitness, nutrition, sleep, stress..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className="min-h-[44px] max-h-[120px] resize-none"
                    disabled={isTyping}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleVoiceInput}
                    disabled={isTyping}
                    className={isListening ? 'bg-red-100 border-red-300' : ''}
                  >
                    <Mic className={`h-4 w-4 ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Vitalis is here to support your health journey • Press Enter to send
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Health Resources */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-rose-500" />
              Health Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/domains/health">
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 hover:shadow-md transition-all cursor-pointer group">
                  <Heart className="h-8 w-8 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">Health Dashboard</p>
                  <p className="text-xs text-muted-foreground">Track metrics</p>
                </div>
              </Link>
              <Link href="/fitness">
                <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 hover:shadow-md transition-all cursor-pointer group">
                  <Dumbbell className="h-8 w-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">Fitness Tracker</p>
                  <p className="text-xs text-muted-foreground">Log workouts</p>
                </div>
              </Link>
              <Link href="/nutrition">
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 hover:shadow-md transition-all cursor-pointer group">
                  <Apple className="h-8 w-8 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">Nutrition</p>
                  <p className="text-xs text-muted-foreground">Meal tracking</p>
                </div>
              </Link>
              <Link href="/tools/bmi-calculator">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all cursor-pointer group">
                  <Scale className="h-8 w-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">BMI Calculator</p>
                  <p className="text-xs text-muted-foreground">Check metrics</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

