'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import {
  Clock, Send, CheckSquare, ListTodo, Timer, Flame, Target,
  Calendar, ArrowLeft, MessageSquare, Mic, Loader2, TrendingUp,
  Zap, Focus, BarChart3, AlertCircle, CheckCircle, Trophy,
  Play, Pause, RotateCcw, Coffee, Brain, Sparkles
} from 'lucide-react'
import { format, isToday, isTomorrow, isPast, differenceInHours } from 'date-fns'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface TaskItem {
  id: string
  title: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
  category?: string
}

interface ProductivityMetric {
  label: string
  value: number | string
  icon: React.ComponentType<any>
  color: string
  suffix?: string
}

const QUICK_PROMPTS = [
  "Help me prioritize my tasks",
  "Create a productive morning routine",
  "I keep procrastinating - help!",
  "How to stay focused longer",
  "Build a habit tracking system",
  "Plan my perfect workday"
]

const COACH_INTRO = `Hello! I'm Kronos, your Productivity Coach. ⏰

I'm here to help you master your time and achieve more:
• **Task Management** - Prioritize and conquer your to-do list
• **Time Blocking** - Structure your day for maximum output
• **Focus Techniques** - Deep work and concentration strategies
• **Habit Building** - Create routines that stick
• **Energy Management** - Work with your natural rhythms

What productivity challenge can I help you tackle today?`

export default function ProductivityCoachPage() {
  const { tasks, habits } = useData()
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
  const [metrics, setMetrics] = useState<ProductivityMetric[]>([])
  const [topTasks, setTopTasks] = useState<TaskItem[]>([])
  const [productivityScore, setProductivityScore] = useState(0)
  
  // Pomodoro Timer State
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60) // 25 minutes
  const [pomodoroActive, setPomodoroActive] = useState(false)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const pomodoroRef = useRef<NodeJS.Timeout | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Pomodoro Timer Effect
  useEffect(() => {
    if (pomodoroActive && pomodoroTime > 0) {
      pomodoroRef.current = setTimeout(() => {
        setPomodoroTime(prev => prev - 1)
      }, 1000)
    } else if (pomodoroTime === 0 && pomodoroActive) {
      setPomodoroActive(false)
      setPomodoroCount(prev => prev + 1)
      setPomodoroTime(25 * 60)
      // Could add notification here
    }

    return () => {
      if (pomodoroRef.current) clearTimeout(pomodoroRef.current)
    }
  }, [pomodoroActive, pomodoroTime])

  // Calculate productivity metrics
  const calculateMetrics = useCallback(() => {
    const completedTasks = tasks.filter((t: any) => t.completed).length
    const totalTasks = tasks.length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const pendingTasks = tasks.filter((t: any) => !t.completed)
    const overdueTasks = pendingTasks.filter((t: any) => t.dueDate && isPast(new Date(t.dueDate))).length
    const dueTodayTasks = pendingTasks.filter((t: any) => t.dueDate && isToday(new Date(t.dueDate))).length

    const activeHabits = habits.filter((h: any) => h.active).length
    const totalStreakDays = habits.reduce((sum: number, h: any) => sum + (h.streak || 0), 0)

    setMetrics([
      {
        label: 'Tasks Completed',
        value: completedTasks,
        icon: CheckSquare,
        color: 'text-green-500',
        suffix: `/ ${totalTasks}`
      },
      {
        label: 'Completion Rate',
        value: completionRate,
        icon: TrendingUp,
        color: 'text-blue-500',
        suffix: '%'
      },
      {
        label: 'Due Today',
        value: dueTodayTasks,
        icon: Calendar,
        color: 'text-amber-500'
      },
      {
        label: 'Overdue',
        value: overdueTasks,
        icon: AlertCircle,
        color: overdueTasks > 0 ? 'text-red-500' : 'text-green-500'
      },
      {
        label: 'Active Habits',
        value: activeHabits,
        icon: Flame,
        color: 'text-orange-500'
      },
      {
        label: 'Streak Days',
        value: totalStreakDays,
        icon: Trophy,
        color: 'text-purple-500'
      }
    ])

    // Top 5 priority tasks
    const priorityTasks = pendingTasks
      .sort((a: any, b: any) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 2)
      })
      .slice(0, 5)
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        priority: t.priority || 'medium',
        dueDate: t.dueDate,
        category: t.category
      }))
    
    setTopTasks(priorityTasks)

    // Calculate productivity score
    let score = 40
    if (completionRate >= 80) score += 25
    else if (completionRate >= 50) score += 15
    else if (completionRate > 0) score += 5
    
    if (overdueTasks === 0) score += 15
    else if (overdueTasks <= 2) score += 5
    
    if (activeHabits >= 3) score += 10
    else if (activeHabits > 0) score += 5
    
    if (totalStreakDays >= 30) score += 10
    else if (totalStreakDays >= 7) score += 5
    
    setProductivityScore(Math.min(100, score))
    setIsLoadingMetrics(false)
  }, [tasks, habits])

  useEffect(() => {
    calculateMetrics()
  }, [calculateMetrics])

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
      const metricsContext = metrics.map(m => `${m.label}: ${m.value}${m.suffix || ''}`).join(', ')
      const topTasksList = topTasks.map(t => t.title).join(', ')
      
      const response = await fetch('/api/ai-coaches/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachType: 'productivity-coach',
          message: currentInput,
          context: `Productivity Stats: ${metricsContext}

Productivity Score: ${productivityScore}/100

Top Priority Tasks: ${topTasksList || 'No pending tasks'}

Pomodoro Sessions Completed Today: ${pomodoroCount}`,
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
        content: result.response || "Let's boost your productivity! What specific challenge are you facing?",
        timestamp: new Date(),
        suggestions: generateProductivitySuggestions(currentInput)
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having connection issues, but here's a quick tip: Try the 2-minute rule - if a task takes less than 2 minutes, do it now instead of adding it to your list!",
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const generateProductivitySuggestions = (userInput: string): string[] => {
    const lower = userInput.toLowerCase()
    
    if (lower.includes('focus') || lower.includes('distract')) {
      return ['Pomodoro technique tips', 'Best focus apps', 'Create a focus ritual']
    }
    if (lower.includes('procrastinat')) {
      return ['2-minute rule', 'Eat the frog technique', 'Temptation bundling']
    }
    if (lower.includes('habit') || lower.includes('routine')) {
      return ['Habit stacking strategy', 'Morning routine ideas', 'Evening wind-down routine']
    }
    if (lower.includes('task') || lower.includes('priorit')) {
      return ['Eisenhower matrix', 'Time blocking setup', 'Weekly planning session']
    }
    if (lower.includes('time') || lower.includes('schedule')) {
      return ['Ideal daily schedule', 'Batch similar tasks', 'Protect your peak hours']
    }
    
    return ['Plan tomorrow today', 'Track my time', 'Optimize my workflow']
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30">
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
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">KRONOS</p>
                  <h1 className="text-2xl md:text-3xl font-bold">Productivity Coach</h1>
                </div>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Online
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoadingMetrics ? (
            [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24" />)
          ) : (
            metrics.map((metric, idx) => (
              <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className={`h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2`}>
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <p className="text-xl font-bold">{metric.value}{metric.suffix}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pomodoro Timer */}
            <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Timer className="h-5 w-5 text-red-500" />
                  Pomodoro Timer
                </CardTitle>
                <CardDescription>Focus sessions completed: {pomodoroCount}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative h-40 w-40 mb-4">
                    <svg className="h-40 w-40 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-200 dark:text-gray-700" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#pomodoroGradient)" strokeWidth="6" strokeDasharray={`${(pomodoroTime / (25 * 60)) * 283} 283`} strokeLinecap="round" />
                      <defs>
                        <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold font-mono">{formatTime(pomodoroTime)}</span>
                      <span className="text-xs text-muted-foreground">
                        {pomodoroActive ? 'Focus Mode' : 'Ready'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPomodoroActive(!pomodoroActive)}
                      className={pomodoroActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'}
                    >
                      {pomodoroActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {pomodoroActive ? 'Pause' : 'Start'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPomodoroActive(false)
                        setPomodoroTime(25 * 60)
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Priority Tasks */}
            <Card className="border-2 border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListTodo className="h-5 w-5 text-amber-500" />
                  Priority Tasks
                </CardTitle>
                <CardDescription>Focus on these today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {topTasks.length > 0 ? (
                  topTasks.map(task => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        task.completed ? 'bg-green-50 dark:bg-green-950/30 border-green-200' : 'bg-white dark:bg-gray-900 border-gray-200'
                      }`}
                    >
                      <Checkbox checked={task.completed} disabled />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            {isToday(new Date(task.dueDate)) ? 'Due today' :
                             isTomorrow(new Date(task.dueDate)) ? 'Due tomorrow' :
                             `Due ${format(new Date(task.dueDate), 'MMM d')}`}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No pending tasks - great job!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Productivity Score */}
            <Card className="border-2 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-green-500" />
                  Productivity Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{productivityScore}</span>
                    <span className="text-lg text-muted-foreground">/ 100</span>
                  </div>
                  <Progress value={productivityScore} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {productivityScore >= 80 ? '🔥 You\'re on fire!' :
                     productivityScore >= 60 ? '💪 Great progress!' :
                     productivityScore >= 40 ? '📈 Room to grow' :
                     '🌱 Let\'s build momentum'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] md:h-[700px] flex flex-col border-2 border-amber-200 dark:border-amber-800">
              <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                  Chat with Kronos
                </CardTitle>
                <CardDescription>Your personal productivity coaching session</CardDescription>
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
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-amber-600">Kronos</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-amber-600 text-white rounded-br-md'
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
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                          <span className="text-sm text-muted-foreground">Kronos is thinking...</span>
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
                    placeholder="Ask about productivity, time management, habits..."
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
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Kronos is here to help you master your time • Press Enter to send
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

