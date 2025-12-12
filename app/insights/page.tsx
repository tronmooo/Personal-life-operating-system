'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import {
  Send, Mic, Sparkles, TrendingUp, AlertCircle, Lightbulb, Target,
  Calendar, DollarSign, Heart, Brain, Clock,
  Zap, MessageSquare, BarChart3, Settings,
  ArrowRight, ChevronDown, ChevronUp, Flame, Loader2, RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

// AI Response Type
type AIMessage = {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  insights?: Array<{
    type: 'warning' | 'success' | 'info'
    message: string
    action?: string
  }>
  quickActions?: Array<{
    label: string
    action: string
    path?: string
  }>
}

// Proactive insight type
type ProactiveInsight = {
  id: string
  type: 'warning' | 'success' | 'info' | 'celebration'
  category: string
  message: string
  action?: string
  actionPath?: string
  priority: 'high' | 'medium' | 'low'
}

// Suggested questions based on user data
const SUGGESTED_QUESTIONS = [
  "What should I focus on this week?",
  "Am I on track for my savings goal?",
  "Show me my spending trends",
  "When is my next maintenance due?",
  "How's my health progress?",
  "What goals am I behind on?",
  "Compare this month to last month",
  "What needs my attention today?"
]

// Quick command buttons
const QUICK_COMMANDS = [
  { icon: DollarSign, label: "Financial Summary", color: "text-green-600" },
  { icon: Heart, label: "Health Report", color: "text-red-600" },
  { icon: Calendar, label: "This Week's Focus", color: "text-blue-600" },
  { icon: AlertCircle, label: "What Needs Attention", color: "text-orange-600" },
  { icon: BarChart3, label: "Progress Report", color: "text-purple-600" },
  { icon: Target, label: "Goal Check-in", color: "text-pink-600" },
  { icon: Lightbulb, label: "Optimize My Life", color: "text-yellow-600" },
  { icon: Brain, label: "Deep Dive Analysis", color: "text-indigo-600" },
]

export default function AIAssistantPage() {
  const { data } = useData()
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showInsights, setShowInsights] = useState(true)
  const [proactiveInsights, setProactiveInsights] = useState<ProactiveInsight[]>([])
  const [isLoadingInsights, setIsLoadingInsights] = useState(true)
  const [aiName, setAiName] = useState('AI Assistant')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch proactive insights from AI on page load
  const fetchProactiveInsights = useCallback(async () => {
    setIsLoadingInsights(true)
    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Generate proactive insights for today. Analyze my data and tell me: 1) What needs immediate attention, 2) Positive achievements to celebrate, 3) Recommendations for improvement. Be specific and reference my actual data.',
          userData: data,
          conversationHistory: [],
          requestType: 'proactive_insights'
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Parse the AI response into structured insights
        const insights = parseInsightsFromResponse(result.response || '')
        setProactiveInsights(insights)
        
        // Get AI name from settings if available
        if (result.aiName) {
          setAiName(result.aiName)
        }
      }
    } catch (error) {
      console.error('Failed to fetch proactive insights:', error)
      // Fall back to local insights
      setProactiveInsights(generateLocalInsights())
    } finally {
      setIsLoadingInsights(false)
    }
  }, [data])

  useEffect(() => {
    // Fetch insights when data changes
    if (Object.keys(data).length > 0) {
      fetchProactiveInsights()
    } else {
      setIsLoadingInsights(false)
    }
  }, [data, fetchProactiveInsights])

  // Parse AI response into structured insights
  const parseInsightsFromResponse = (response: string): ProactiveInsight[] => {
    const insights: ProactiveInsight[] = []
    const lines = response.split('\n').filter(l => l.trim())
    
    let currentType: 'warning' | 'success' | 'info' | 'celebration' = 'info'
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Detect section headers
      if (trimmed.toLowerCase().includes('attention') || trimmed.toLowerCase().includes('warning') || trimmed.includes('⚠️')) {
        currentType = 'warning'
        continue
      }
      if (trimmed.toLowerCase().includes('celebration') || trimmed.toLowerCase().includes('achievement') || trimmed.includes('🎉') || trimmed.includes('✅')) {
        currentType = 'celebration'
        continue
      }
      if (trimmed.toLowerCase().includes('recommendation') || trimmed.toLowerCase().includes('suggest') || trimmed.includes('💡')) {
        currentType = 'info'
        continue
      }
      
      // Parse bullet points or numbered items
      if (trimmed.match(/^[-•*\d.]\s*/) || trimmed.startsWith('- ')) {
        const message = trimmed.replace(/^[-•*\d.]\s*/, '').trim()
        if (message.length > 10) {
          insights.push({
            id: `insight-${insights.length}`,
            type: currentType === 'celebration' ? 'success' : currentType,
            category: currentType === 'warning' ? 'Attention Needed' : 
                     currentType === 'celebration' ? 'Achievement' : 'Recommendation',
            message,
            priority: currentType === 'warning' ? 'high' : 'medium'
          })
        }
      }
    }
    
    // If no insights were parsed, create a generic one from the response
    if (insights.length === 0 && response.length > 50) {
      insights.push({
        id: 'insight-0',
        type: 'info',
        category: 'AI Insight',
        message: response.slice(0, 200) + (response.length > 200 ? '...' : ''),
        priority: 'medium'
      })
    }
    
    return insights.slice(0, 6) // Limit to 6 insights
  }

  // Generate local insights as fallback
  const generateLocalInsights = (): ProactiveInsight[] => {
    const insights: ProactiveInsight[] = []
    
    // Financial insights
    const financialData = (data.financial || []) as any[]
    if (financialData.length > 0) {
      const recentExpenses = financialData.filter(item => {
        const meta = item.metadata || item
        return (meta.type === 'expense') && 
          new Date(item.createdAt || item.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      })
      const weeklyTotal = recentExpenses.reduce((sum, item) => {
        const meta = item.metadata || item
        return sum + parseFloat(meta.amount || 0)
      }, 0)
      
      if (weeklyTotal > 500) {
        insights.push({
          id: 'financial-warning',
          type: 'warning',
          category: 'Financial',
          message: `You've spent $${weeklyTotal.toFixed(2)} this week. Consider reviewing your expenses.`,
          action: 'Review expenses',
          actionPath: '/domains/financial',
          priority: 'high'
        })
      } else if (weeklyTotal > 0) {
        insights.push({
          id: 'financial-info',
          type: 'info',
          category: 'Financial',
          message: `Weekly spending: $${weeklyTotal.toFixed(2)}. You're tracking well!`,
          priority: 'low'
        })
      }
    }

    // Health insights
    const healthData = (data.health || []) as any[]
    const workouts = healthData.filter(item => {
      const meta = item.metadata || item
      return meta.workout_type || meta.type === 'workout'
    })
    if (workouts.length >= 3) {
      insights.push({
        id: 'health-success',
        type: 'success',
        category: 'Health',
        message: `Great job! You've logged ${workouts.length} workouts recently. Keep up the momentum!`,
        action: 'View progress',
        actionPath: '/domains/health',
        priority: 'medium'
      })
    }

    // Domain coverage insights
    const activeDomains = Object.values(data).filter((items: any) => 
      Array.isArray(items) && items.length > 0
    ).length
    
    if (activeDomains < 5) {
      insights.push({
        id: 'coverage-info',
        type: 'info',
        category: 'Life Tracking',
        message: `You're tracking ${activeDomains} life domains. Expand to more areas for comprehensive insights.`,
        action: 'Explore domains',
        actionPath: '/domains',
        priority: 'medium'
      })
    } else {
      insights.push({
        id: 'coverage-success',
        type: 'success',
        category: 'Life Tracking',
        message: `Excellent! You're actively tracking ${activeDomains} life domains. Well organized!`,
        priority: 'low'
      })
    }

    return insights
  }

  // Send message to AI API
  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          userData: data,
          conversationHistory: messages.map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const result = await response.json()
      
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: result.response || result.message || "I couldn't process that request. Please try again.",
        timestamp: new Date(),
        quickActions: result.quickActions || [
          { label: 'View Details', action: 'details' },
          { label: 'Ask Follow-up', action: 'followup' }
        ]
      }
      
      setMessages(prev => [...prev, aiMessage])
      
      // Update AI name if returned
      if (result.aiName) {
        setAiName(result.aiName)
      }

    } catch (error) {
      console.error('AI Chat error:', error)
      
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickCommand = (command: string) => {
    setInput(command)
    setTimeout(() => handleSendMessage(), 100)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertCircle
      case 'success': return Flame
      case 'celebration': return Sparkles
      default: return Lightbulb
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-orange-100 dark:bg-orange-950/30 text-orange-600'
      case 'success': return 'bg-green-100 dark:bg-green-950/30 text-green-600'
      case 'celebration': return 'bg-purple-100 dark:bg-purple-950/30 text-purple-600'
      default: return 'bg-blue-100 dark:bg-blue-950/30 text-blue-600'
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <Brain className="h-10 w-10 text-purple-600" />
            Life Intelligence Assistant
          </h1>
          <p className="text-muted-foreground mt-2">
            Your AI-powered life coach that knows your data and helps you improve
          </p>
        </div>
        <Link href="/ai-assistant-settings">
          <Button variant="outline" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Proactive Daily Insights */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader className="cursor-pointer" onClick={() => setShowInsights(!showInsights)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Today's AI Insights
              {!isLoadingInsights && (
                <Badge variant="secondary">{proactiveInsights.length}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  fetchProactiveInsights()
                }}
                disabled={isLoadingInsights}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingInsights ? 'animate-spin' : ''}`} />
              </Button>
              {showInsights ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </div>
        </CardHeader>
        {showInsights && (
          <CardContent className="space-y-3">
            {isLoadingInsights ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : proactiveInsights.length > 0 ? (
              proactiveInsights.map((insight) => {
                const IconComponent = getInsightIcon(insight.type)
                return (
                  <div
                    key={insight.id}
                    className={`flex items-start gap-3 p-4 rounded-lg ${getInsightColor(insight.type).split(' ')[0]} dark:${getInsightColor(insight.type).split(' ')[1]}`}
                  >
                    <IconComponent className={`h-5 w-5 flex-shrink-0 mt-0.5 ${getInsightColor(insight.type).split(' ')[2]}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-muted-foreground">{insight.category}</span>
                        {insight.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs py-0">Urgent</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">{insight.message}</p>
                      {insight.action && (
                        <Link href={insight.actionPath || '#'}>
                          <Button variant="link" className="h-auto p-0 mt-1 text-xs">
                            {insight.action} <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Add more data to get personalized AI insights!</p>
                <Link href="/domains">
                  <Button variant="link" size="sm">Explore Domains</Button>
                </Link>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Quick Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_COMMANDS.map((cmd, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleQuickCommand(cmd.label)}
                disabled={isTyping}
              >
                <cmd.icon className={`h-6 w-6 ${cmd.color}`} />
                <span className="text-xs text-center">{cmd.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="min-h-[500px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat with {aiName}
          </CardTitle>
          <CardDescription>
            Ask me anything about your data, goals, and progress
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px] max-h-[500px]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Brain className="h-16 w-16 text-purple-600 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Start a conversation!</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  I have full access to your life data and can provide personalized insights. Try asking a question!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
                  {SUGGESTED_QUESTIONS.slice(0, 4).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickCommand(question)}
                      className="text-xs"
                      disabled={isTyping}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent'
                      }`}
                    >
                      {message.type === 'ai' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-600">{aiName}</span>
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      {message.quickActions && message.quickActions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.quickActions.map((action, index) => (
                            <Button 
                              key={index} 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={() => {
                                if (action.path) {
                                  window.location.href = action.path
                                } else if (action.action === 'followup') {
                                  setInput('Tell me more about this')
                                }
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      <div className="text-xs opacity-70 mt-2">
                        {format(message.timestamp, 'h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-accent rounded-lg p-4 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                        <span className="text-sm">{aiName} is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Suggested Questions (when no messages) */}
          {messages.length === 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2 text-muted-foreground">More suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.slice(4).map((question, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleQuickCommand(question)}
                  >
                    {question}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about your life data..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1"
              disabled={isTyping}
            />
            <Button size="icon" variant="outline" disabled>
              <Mic className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={handleSendMessage} disabled={!input.trim() || isTyping}>
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Recognition - Now powered by AI */}
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Pattern Recognition
          </CardTitle>
          <CardDescription>Insights discovered from analyzing your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-sm">Cross-Domain Correlation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI analyzes patterns across all your life domains to find hidden connections and opportunities for improvement.
                </p>
                <Button 
                  variant="link" 
                  className="h-auto p-0 mt-2 text-xs"
                  onClick={() => handleQuickCommand("Find correlations between my different life domains")}
                >
                  Analyze correlations <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <p className="font-medium text-sm">Trend Analysis</p>
                <p className="text-sm text-muted-foreground mt-1">
                  See how your metrics change over time and predict future patterns based on historical data.
                </p>
                <Link href="/predictive-analytics">
                  <Button variant="link" className="h-auto p-0 mt-2 text-xs">
                    View predictions <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-pink-600 mt-1" />
              <div>
                <p className="font-medium text-sm">Goal Optimization</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Get AI coaching to set better goals and actionable plans to achieve them.
                </p>
                <Link href="/goals-coach">
                  <Button variant="link" className="h-auto p-0 mt-2 text-xs">
                    Open Goals Coach <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goal Coaching Preview */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              AI Goals Coach
            </CardTitle>
            <Link href="/goals-coach">
              <Button variant="outline" size="sm">
                Open Coach <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-white dark:bg-gray-900">
            <div className="flex items-start gap-2 mb-3">
              <Brain className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Get Personalized Coaching</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Let AI analyze your goals and create actionable plans to achieve them faster.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">AI Goals Coach can help you:</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span>•</span>
                  <span>Set SMART goals based on your data patterns</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>•</span>
                  <span>Break down big goals into weekly action items</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>•</span>
                  <span>Track progress and get personalized recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
