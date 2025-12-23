'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import {
  Brain, Send, Sparkles, Target, TrendingUp, Calendar, CheckCircle,
  MessageSquare, Loader2, RefreshCw, ChevronRight, ArrowLeft,
  Star, Award, Flame, Heart, Clock, DollarSign, Users, Smile,
  BookOpen, Lightbulb, Compass, Shield, Mic, ThumbsUp, ThumbsDown, Plus
} from 'lucide-react'
import { format, addDays, differenceInDays, startOfWeek, endOfWeek } from 'date-fns'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  action?: {
    type: 'goal' | 'task' | 'reflection'
    data?: any
  }
}

interface LifeArea {
  id: string
  name: string
  icon: React.ComponentType<any>
  color: string
  score: number
  lastReview?: string
}

interface WeeklyGoal {
  id: string
  title: string
  area: string
  progress: number
  dueDate: string
  status: 'on_track' | 'behind' | 'completed'
}

const LIFE_AREAS: LifeArea[] = [
  { id: 'career', name: 'Career & Purpose', icon: Compass, color: 'text-violet-500', score: 0 },
  { id: 'health', name: 'Health & Vitality', icon: Heart, color: 'text-rose-500', score: 0 },
  { id: 'relationships', name: 'Relationships', icon: Users, color: 'text-pink-500', score: 0 },
  { id: 'finances', name: 'Financial Security', icon: DollarSign, color: 'text-emerald-500', score: 0 },
  { id: 'growth', name: 'Personal Growth', icon: TrendingUp, color: 'text-blue-500', score: 0 },
  { id: 'recreation', name: 'Fun & Recreation', icon: Star, color: 'text-amber-500', score: 0 },
  { id: 'environment', name: 'Physical Environment', icon: Shield, color: 'text-teal-500', score: 0 },
  { id: 'mindset', name: 'Mindset & Emotions', icon: Smile, color: 'text-sky-500', score: 0 }
]

const QUICK_PROMPTS = [
  "Help me set my goals for this week",
  "I'm feeling unmotivated - help me",
  "What areas of my life need attention?",
  "Guide me through a life review",
  "Help me make an important decision",
  "I want to build a new habit"
]

const COACH_INTRO = `Hello! I'm Atlas, your Life Coach. 👋

I'm here to help you:
• **Clarify your vision** and set meaningful goals
• **Balance all areas** of your life harmoniously
• **Overcome obstacles** and build momentum
• **Create action plans** that actually work
• **Stay accountable** with regular check-ins

How can I support you today? You can ask me anything about goal-setting, life balance, personal development, or just talk through what's on your mind.`

export default function LifeCoachPage() {
  const { data, tasks, habits } = useData()
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
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>(LIFE_AREAS)
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([])
  const [isLoadingAreas, setIsLoadingAreas] = useState(true)
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalArea, setNewGoalArea] = useState('growth')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Calculate life area scores from user data
  const calculateLifeAreaScores = useCallback(() => {
    const updatedAreas = LIFE_AREAS.map(area => {
      let score = 50 // Base score
      
      switch (area.id) {
        case 'career':
          const careerData = (data.career || []) as any[]
          score = careerData.length > 0 ? Math.min(100, 50 + careerData.length * 10) : 45
          break
        case 'health':
          const healthData = (data.health || []) as any[]
          score = healthData.length > 0 ? Math.min(100, 45 + healthData.length * 3) : 40
          break
        case 'relationships':
          const relData = (data.relationships || []) as any[]
          score = relData.length > 0 ? Math.min(100, 50 + relData.length * 8) : 50
          break
        case 'finances':
          const finData = (data.financial || []) as any[]
          score = finData.length > 0 ? Math.min(100, 45 + finData.length * 5) : 35
          break
        case 'growth':
          const eduData = (data.education || []) as any[]
          const activeHabits = habits.filter((h: any) => h.active).length
          score = Math.min(100, 40 + eduData.length * 5 + activeHabits * 8)
          break
        case 'recreation':
          const mindData = (data.mindfulness || []) as any[]
          score = mindData.length > 0 ? Math.min(100, 50 + mindData.length * 5) : 55
          break
        case 'environment':
          const homeData = (data.home || []) as any[]
          score = homeData.length > 0 ? Math.min(100, 55 + homeData.length * 5) : 60
          break
        case 'mindset':
          const completedTasks = tasks.filter((t: any) => t.completed).length
          const totalTasks = tasks.length
          score = totalTasks > 0 ? Math.round(50 + (completedTasks / totalTasks) * 40) : 50
          break
      }
      
      return { ...area, score }
    })
    
    setLifeAreas(updatedAreas)
    setIsLoadingAreas(false)
  }, [data, tasks, habits])

  // Generate weekly goals from AI
  const generateWeeklyGoals = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-coaches/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachType: 'life-coach',
          message: 'Based on my life data, suggest 3 specific, achievable goals for this week. For each goal, specify which life area it belongs to (career, health, relationships, finances, growth, recreation, environment, or mindset).',
          context: `Active habits: ${habits.filter((h: any) => h.active).length}, Pending tasks: ${tasks.filter((t: any) => !t.completed).length}`,
          conversationHistory: []
        })
      })

      if (response.ok) {
        const result = await response.json()
        const goals = parseGoalsFromResponse(result.response || '')
        setWeeklyGoals(goals)
      }
    } catch (error) {
      console.error('Failed to generate weekly goals:', error)
      // Fallback goals
      setWeeklyGoals([
        { id: '1', title: 'Complete your highest priority task each day', area: 'growth', progress: 30, dueDate: format(endOfWeek(new Date()), 'yyyy-MM-dd'), status: 'on_track' },
        { id: '2', title: 'Exercise for at least 20 minutes, 3 times', area: 'health', progress: 0, dueDate: format(endOfWeek(new Date()), 'yyyy-MM-dd'), status: 'on_track' },
        { id: '3', title: 'Reach out to one friend or family member', area: 'relationships', progress: 0, dueDate: format(endOfWeek(new Date()), 'yyyy-MM-dd'), status: 'on_track' }
      ])
    }
  }, [data])

  const parseGoalsFromResponse = (response: string): WeeklyGoal[] => {
    const goals: WeeklyGoal[] = []
    const lines = response.split('\n').filter(l => l.trim())
    const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd')
    
    for (const line of lines) {
      const trimmed = line.replace(/^[-•*\d.]\s*/, '').trim()
      if (trimmed.length > 10 && trimmed.length < 150 && goals.length < 3) {
        // Determine area from content
        let area = 'growth'
        if (trimmed.toLowerCase().includes('health') || trimmed.toLowerCase().includes('exercise') || trimmed.toLowerCase().includes('sleep')) {
          area = 'health'
        } else if (trimmed.toLowerCase().includes('money') || trimmed.toLowerCase().includes('budget') || trimmed.toLowerCase().includes('save')) {
          area = 'finances'
        } else if (trimmed.toLowerCase().includes('friend') || trimmed.toLowerCase().includes('family') || trimmed.toLowerCase().includes('relationship')) {
          area = 'relationships'
        } else if (trimmed.toLowerCase().includes('work') || trimmed.toLowerCase().includes('career') || trimmed.toLowerCase().includes('job')) {
          area = 'career'
        }
        
        goals.push({
          id: `goal-${goals.length}`,
          title: trimmed,
          area,
          progress: 0,
          dueDate: weekEnd,
          status: 'on_track'
        })
      }
    }
    
    return goals
  }

  useEffect(() => {
    calculateLifeAreaScores()
    generateWeeklyGoals()
  }, [calculateLifeAreaScores, generateWeeklyGoals])

  // Send message to AI
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
      // Build context about life areas
      const lifeContext = lifeAreas.map(area => `${area.name}: ${area.score}%`).join(', ')
      
      const response = await fetch('/api/ai-coaches/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachType: 'life-coach',
          message: currentInput,
          context: `Current life balance scores: ${lifeContext}

Weekly goals: ${weeklyGoals.map(g => g.title).join(', ')}
Active habits: ${habits.filter((h: any) => h.active).length}
Pending tasks: ${tasks.filter((t: any) => !t.completed).length}`,
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
        content: result.response || "I'm here to help. Could you tell me more about what's on your mind?",
        timestamp: new Date(),
        suggestions: generateFollowUpSuggestions(currentInput)
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Let me try to help based on what I know. What specific area would you like to focus on today?",
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const generateFollowUpSuggestions = (userInput: string): string[] => {
    const lower = userInput.toLowerCase()
    
    if (lower.includes('goal') || lower.includes('achieve')) {
      return ['Break this down into smaller steps', 'What obstacles might I face?', 'How can I stay accountable?']
    }
    if (lower.includes('motivat') || lower.includes('stuck')) {
      return ['What usually energizes me?', 'Help me create a small win today', 'What is one thing I could do right now?']
    }
    if (lower.includes('decision') || lower.includes('choose')) {
      return ['What are the pros and cons?', 'What would my future self want?', 'What is my gut telling me?']
    }
    if (lower.includes('habit') || lower.includes('routine')) {
      return ['Start with a 2-minute version', 'What will trigger this habit?', 'How do I reward myself?']
    }
    
    return ['Tell me more about this', 'What would success look like?', 'What is one small step I can take?']
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

  const getOverallScore = () => {
    const total = lifeAreas.reduce((sum, area) => sum + area.score, 0)
    return Math.round(total / lifeAreas.length)
  }

  const getAreaIcon = (areaId: string) => {
    const area = LIFE_AREAS.find(a => a.id === areaId)
    if (!area) return Star
    return area.icon
  }

  const getAreaColor = (areaId: string) => {
    const area = LIFE_AREAS.find(a => a.id === areaId)
    return area?.color || 'text-gray-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-fuchsia-950/30">
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
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-violet-600 dark:text-violet-400">ATLAS</p>
                  <h1 className="text-2xl md:text-3xl font-bold">Life Coach</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              Online
            </Badge>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Life Wheel & Goals */}
          <div className="lg:col-span-1 space-y-6">
            {/* Life Balance Wheel Card */}
            <Card className="border-2 border-violet-200 dark:border-violet-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-violet-500" />
                  Life Balance Wheel
                </CardTitle>
                <CardDescription>Your current balance across life areas</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAreas ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Overall Score */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative h-28 w-28">
                        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeDasharray={`${getOverallScore() * 2.64} 264`} strokeLinecap="round" />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#d946ef" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold">{getOverallScore()}</span>
                          <span className="text-xs text-muted-foreground">Overall</span>
                        </div>
                      </div>
                    </div>

                    {/* Life Areas */}
                    <div className="space-y-3">
                      {lifeAreas.map(area => (
                        <div key={area.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <area.icon className={`h-4 w-4 ${area.color}`} />
                              <span className="font-medium truncate">{area.name}</span>
                            </div>
                            <span className={`font-bold ${area.score >= 70 ? 'text-green-600' : area.score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                              {area.score}%
                            </span>
                          </div>
                          <Progress value={area.score} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Weekly Goals Card */}
            <Card className="border-2 border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-amber-500" />
                    This Week's Goals
                  </CardTitle>
                  <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Weekly Goal</DialogTitle>
                        <DialogDescription>Set a new goal for this week</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Input
                          placeholder="What do you want to achieve?"
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                        />
                        <select
                          className="w-full p-2 border rounded-md"
                          value={newGoalArea}
                          onChange={(e) => setNewGoalArea(e.target.value)}
                        >
                          {LIFE_AREAS.map(area => (
                            <option key={area.id} value={area.id}>{area.name}</option>
                          ))}
                        </select>
                        <Button
                          className="w-full"
                          onClick={() => {
                            if (newGoalTitle.trim()) {
                              setWeeklyGoals(prev => [...prev, {
                                id: `goal-${Date.now()}`,
                                title: newGoalTitle,
                                area: newGoalArea,
                                progress: 0,
                                dueDate: format(endOfWeek(new Date()), 'yyyy-MM-dd'),
                                status: 'on_track'
                              }])
                              setNewGoalTitle('')
                              setShowGoalDialog(false)
                            }
                          }}
                        >
                          Add Goal
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {weeklyGoals.length > 0 ? (
                  weeklyGoals.map(goal => {
                    const AreaIcon = getAreaIcon(goal.area)
                    return (
                      <div key={goal.id} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                          <div className={`h-8 w-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center`}>
                            <AreaIcon className={`h-4 w-4 ${getAreaColor(goal.area)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{goal.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={goal.progress} className="h-1 flex-1" />
                              <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No goals set for this week yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] md:h-[700px] flex flex-col border-2 border-violet-200 dark:border-violet-800">
              <CardHeader className="border-b bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-violet-500" />
                  Chat with Atlas
                </CardTitle>
                <CardDescription>Your personal life coaching session</CardDescription>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <Brain className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-violet-600">Atlas</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-violet-600 text-white rounded-br-md'
                            : 'bg-white dark:bg-gray-800 border rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {/* Suggestions */}
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
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                          <span className="text-sm text-muted-foreground">Atlas is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Area */}
              <div className="border-t p-4 bg-white dark:bg-gray-900">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Share what's on your mind..."
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
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Atlas is here to help you live your best life • Press Enter to send
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Resources */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-violet-500" />
              Coaching Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/goals-coach">
                <div className="p-4 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 hover:shadow-md transition-all cursor-pointer group">
                  <Target className="h-8 w-8 text-pink-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">Goals Coach</p>
                  <p className="text-xs text-muted-foreground">Set SMART goals</p>
                </div>
              </Link>
              <Link href="/therapy-chat">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all cursor-pointer group">
                  <Heart className="h-8 w-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">Therapy Chat</p>
                  <p className="text-xs text-muted-foreground">Emotional support</p>
                </div>
              </Link>
              <Link href="/analytics">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all cursor-pointer group">
                  <TrendingUp className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">Analytics</p>
                  <p className="text-xs text-muted-foreground">Track progress</p>
                </div>
              </Link>
              <Link href="/insights">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all cursor-pointer group">
                  <Lightbulb className="h-8 w-8 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">Insights</p>
                  <p className="text-xs text-muted-foreground">AI analysis</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

