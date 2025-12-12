'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useData } from '@/lib/providers/data-provider'
import {
  Send, Mic, Sparkles, TrendingUp, AlertCircle, Lightbulb, Target,
  Calendar, DollarSign, Heart, Brain, Clock,
  Zap, MessageSquare, BarChart3, Settings,
  ArrowRight, ChevronDown, ChevronUp, Flame
} from 'lucide-react'
import { format } from 'date-fns'

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
  }>
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Generate AI insights based on user data
  const generateDailyInsights = () => {
    const insights = []
    
    // Financial insights
    const financialData = (data.financial || []) as any[]
    if (financialData.length > 0) {
      const recentExpenses = financialData.filter(item => 
        item.type === 'expense' && 
        new Date(item.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      )
      const weeklyTotal = recentExpenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
      
      if (weeklyTotal > 500) {
        insights.push({
          type: 'warning' as const,
          icon: AlertCircle,
          message: `You've spent $${weeklyTotal.toFixed(2)} this week - 25% above average`,
          action: 'Review expenses'
        })
      }
    }

    // Health insights
    const healthData = (data.health || []) as any[]
    const workouts = healthData.filter(item => item.workout_type)
    if (workouts.length >= 7) {
      insights.push({
        type: 'success' as const,
        icon: Flame,
        message: `${workouts.length}-day workout streak - you're crushing it!`,
        action: 'View progress'
      })
    }

    // Goal insights
    const activeDomains = Object.values(data).filter((items: any) => 
      Array.isArray(items) && items.length > 0
    ).length
    
    if (activeDomains < 5) {
      insights.push({
        type: 'info' as const,
        icon: Target,
        message: `You're tracking ${activeDomains} domains. Consider expanding to build a complete life picture.`,
        action: 'Explore domains'
      })
    }

    return insights
  }

  // Generate AI response based on user question
  const generateAIResponse = (question: string): string => {
    const q = question.toLowerCase()
    
    // Financial queries
    if (q.includes('net worth') || q.includes('financial') || q.includes('money')) {
      const financialData = (data.financial || []) as any[]
      const income = financialData.filter(item => item.type === 'income')
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
      const expenses = financialData.filter(item => item.type === 'expense')
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
      const netWorth = income - expenses
      const savingsRate = income > 0 ? ((income - expenses) / income * 100) : 0
      
      return `Your current net worth is **$${netWorth.toLocaleString()}**. 

📊 **Financial Breakdown:**
- Total Income: $${income.toLocaleString()}
- Total Expenses: $${expenses.toLocaleString()}
- Savings Rate: ${savingsRate.toFixed(1)}%

${savingsRate > 20 
  ? "🎉 Excellent! You're saving over 20% - keep up the great work!" 
  : "💡 Consider aiming for a 20% savings rate for optimal financial health."}

Your biggest expense categories are ready to review in the Financial domain.`
    }

    // Health queries
    if (q.includes('health') || q.includes('weight') || q.includes('fitness')) {
      const healthData = (data.health || []) as any[]
      const weights = healthData.filter(item => item.weight)
        .map(item => ({ date: item.date, weight: parseFloat(item.weight) }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      if (weights.length >= 2) {
        const firstWeight = weights[0].weight
        const lastWeight = weights[weights.length - 1].weight
        const change = lastWeight - firstWeight
        
        return `Your health journey is looking ${change < 0 ? 'great' : 'interesting'}! 

⚖️ **Weight Tracking:**
- Current: ${lastWeight.toFixed(1)} lbs
- Change: ${change > 0 ? '+' : ''}${change.toFixed(1)} lbs
- Total logs: ${weights.length}

${change < -5 
  ? "🎉 You've lost over 5 pounds - fantastic progress!" 
  : change > 5 
    ? "📈 Weight is trending up. Would you like tips for getting back on track?"
    : "📊 Weight is stable. Consistent tracking is key!"}

Keep logging daily to see detailed trends and patterns.`
      } else {
        return `Let's start tracking your health! 💪

Currently, I have limited health data to analyze. To give you better insights, try logging:
- Daily weight measurements
- Workout sessions
- Water intake
- Blood pressure readings

The more data you track, the smarter my insights become!`
      }
    }

    // Goals queries
    if (q.includes('goal') || q.includes('track') || q.includes('progress')) {
      const activeDomains = Object.entries(data)
        .filter(([_, items]: [string, any]) => Array.isArray(items) && items.length > 0)
        .length
      
      return `Let's check your goals! 🎯

📊 **Current Status:**
- Active Domains: ${activeDomains}
- Total Items Tracked: ${Object.values(data).flat().length}
- Life Coverage: ${Math.round((activeDomains / 16) * 100)}%

${activeDomains >= 10
  ? "🌟 Outstanding! You're tracking almost every aspect of your life."
  : activeDomains >= 5
    ? "👍 Good progress! You're building a comprehensive life picture."
    : "💡 You're just getting started. Consider tracking a few more domains for better insights."}

**Suggested focus areas:**
${activeDomains < 16 ? "• Expand to uncovered domains\n• Set specific goals in active areas\n• Review progress weekly" : "• Set stretch goals\n• Optimize your tracking\n• Share your success!"}

Would you like help setting up specific goals in any domain?`
    }

    // Focus/attention queries
    if (q.includes('focus') || q.includes('attention') || q.includes('priority')) {
      const insights = generateDailyInsights()
      const warnings = insights.filter(i => i.type === 'warning')
      
      return `Here's what needs your attention this week: 🎯

${warnings.length > 0 
  ? `⚠️ **High Priority:**\n${warnings.map(w => `• ${w.message}`).join('\n')}\n\n`
  : ''}

💡 **Recommended Focus:**
• Review your budget and adjust spending
• Schedule upcoming maintenance and appointments  
• Update your health metrics for the week
• Check in on long-term goals

**Quick wins for this week:**
1. Log 3+ workouts for fitness momentum
2. Track all meals for nutrition awareness
3. Update your net worth calculation
4. Schedule any overdue maintenance

Need specific help with any of these? Just ask!`
    }

    // Spending/expense queries
    if (q.includes('spend') || q.includes('expense') || q.includes('cost')) {
      const financialData = (data.financial || []) as any[]
      const expenses = financialData.filter(item => item.type === 'expense')
      const total = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
      
      // Group by category if available
      const byCategory: Record<string, number> = {}
      expenses.forEach(item => {
        const cat = item.category || 'Uncategorized'
        byCategory[cat] = (byCategory[cat] || 0) + parseFloat(item.amount || 0)
      })
      
      const sortedCategories = Object.entries(byCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
      
      return `Let's analyze your spending! 💸

📊 **Expense Overview:**
- Total Tracked: $${total.toLocaleString()}
- Transaction Count: ${expenses.length}
- Average per transaction: $${(total / Math.max(expenses.length, 1)).toFixed(2)}

${sortedCategories.length > 0 
  ? `**Top Spending Categories:**\n${sortedCategories.map(([cat, amount]) => 
      `• ${cat}: $${amount.toLocaleString()} (${((amount / total) * 100).toFixed(1)}%)`
    ).join('\n')}`
  : ''}

💡 **Insights:**
${total > 2000 
  ? "Your spending is quite high. Review categories to find savings opportunities."
  : "Spending looks reasonable. Keep tracking to maintain control!"}

Would you like tips on reducing spending in any category?`
    }

    // Default response
    return `I'm here to help you understand your life data! 🤖

I can answer questions about:
• **Financial** - net worth, spending, savings rate
• **Health** - weight trends, fitness progress
• **Goals** - tracking status, recommendations
• **General** - what to focus on, patterns, insights

Try asking:
- "Show me my financial summary"
- "How is my health progress?"
- "What should I focus on this week?"
- "Am I on track with my goals?"

The more data you track, the smarter my insights become! 📊`
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
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
      // First try multi-entity extraction for data entry commands
      console.log('🧠 [AI-PAGE] Attempting multi-entity extraction...')
      const multiEntityResponse = await fetch('/api/ai-assistant/multi-entry', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          userContext: {
            recentEntries: Object.values(data).flat().slice(0, 50),
            preferences: {
              defaultPetName: (data.pets as any)?.[0]?.metadata?.petName || (data.pets as any)?.[0]?.title,
              defaultVehicle: (data.vehicles as any)?.[0]?.title,
              defaultHome: (data.home as any)?.[0]?.title
            }
          }
        })
      })

      if (multiEntityResponse.ok) {
        const multiResult = await multiEntityResponse.json()
        console.log('📊 [AI-PAGE] Multi-entity result:', multiResult)

        if (multiResult.success && multiResult.results && multiResult.results.length > 0) {
          // Trigger data reload
          if (typeof window !== 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 800))
            window.dispatchEvent(new CustomEvent('ai-assistant-saved'))
            console.log('✅ [AI-PAGE] Dispatched ai-assistant-saved event')
          }

          const aiMessage: AIMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: multiResult.message || 'Data logged successfully!',
            timestamp: new Date(),
            quickActions: [
              { label: 'View Details', action: 'details' }
            ]
          }
          setMessages(prev => [...prev, aiMessage])
          setIsTyping(false)
          return
        }
      }

      // Fallback: Use regular chat endpoint
      console.log('💬 [AI-PAGE] Using regular chat endpoint...')
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          userData: data,
          conversationHistory: messages.map(m => ({ type: m.type, content: m.content }))
        })
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ [AI-PAGE] Chat response:', result)

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: result.response || result.message || 'I processed your request.',
        timestamp: new Date(),
        quickActions: [
          { label: 'View Details', action: 'details' },
          { label: 'Export Report', action: 'export' }
        ]
      }
      setMessages(prev => [...prev, aiMessage])

      // Trigger reload if data was saved
      if (result.saved || result.triggerReload) {
        if (typeof window !== 'undefined') {
          await new Promise(resolve => setTimeout(resolve, 500))
          window.dispatchEvent(new CustomEvent('ai-assistant-saved'))
        }
      }
    } catch (error) {
      console.error('❌ [AI-PAGE] Error:', error)
      // Fallback to local response on error
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(currentInput),
        timestamp: new Date(),
        quickActions: [
          { label: 'View Details', action: 'details' }
        ]
      }
      setMessages(prev => [...prev, aiMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickCommand = (command: string) => {
    // Add user message directly
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: command,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // Call API directly
    fetch('/api/ai-assistant/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: command,
        userData: data,
        conversationHistory: messages.map(m => ({ type: m.type, content: m.content }))
      })
    })
      .then(res => res.json())
      .then(result => {
        const aiMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: result.response || result.message || 'I processed your request.',
          timestamp: new Date(),
          quickActions: [
            { label: 'View Details', action: 'details' }
          ]
        }
        setMessages(prev => [...prev, aiMessage])
      })
      .catch(error => {
        console.error('Quick command error:', error)
        const aiMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: generateAIResponse(command),
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
      })
      .finally(() => {
        setIsTyping(false)
      })
  }

  const dailyInsights = generateDailyInsights()

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
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Proactive Daily Insights */}
      {dailyInsights.length > 0 && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardHeader className="cursor-pointer" onClick={() => setShowInsights(!showInsights)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Today's Insights
                <Badge variant="secondary">{dailyInsights.length}</Badge>
              </CardTitle>
              {showInsights ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {showInsights && (
            <CardContent className="space-y-3">
              {dailyInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg ${
                    insight.type === 'warning' ? 'bg-orange-100 dark:bg-orange-950/30' :
                    insight.type === 'success' ? 'bg-green-100 dark:bg-green-950/30' :
                    'bg-blue-100 dark:bg-blue-950/30'
                  }`}
                >
                  <insight.icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    insight.type === 'warning' ? 'text-orange-600' :
                    insight.type === 'success' ? 'text-green-600' :
                    'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{insight.message}</p>
                    {insight.action && (
                      <Button variant="link" className="h-auto p-0 mt-1 text-xs">
                        {insight.action} <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

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
            Chat with Your AI Assistant
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
                  I'm here to help you understand your life data. Try asking a question or use one of the suggestions below.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
                  {SUGGESTED_QUESTIONS.slice(0, 4).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(question)
                        setTimeout(handleSendMessage, 100)
                      }}
                      className="text-xs"
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
                          <span className="text-xs font-semibold text-purple-600">AI Assistant</span>
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      {message.quickActions && message.quickActions.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {message.quickActions.map((action, index) => (
                            <Button key={index} size="sm" variant="outline" className="text-xs">
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
                        <Brain className="h-4 w-4 text-purple-600 animate-pulse" />
                        <span className="text-sm">AI is thinking...</span>
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
              <p className="text-sm font-medium mb-2 text-muted-foreground">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.slice(4).map((question, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setInput(question)
                      setTimeout(handleSendMessage, 100)
                    }}
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
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button size="icon" variant="outline">
              <Mic className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={handleSendMessage} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Recognition */}
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Patterns I've Noticed
          </CardTitle>
          <CardDescription>AI-discovered insights from your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-sm">Correlation Found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When you log workouts, you tend to spend 30% less on takeout food. 
                  Exercise might be helping your financial health too!
                </p>
                <Button variant="link" className="h-auto p-0 mt-2 text-xs">
                  See detailed analysis <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <p className="font-medium text-sm">Time Pattern</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You're most productive when you start your day before 8 AM. 
                  Consider scheduling important tasks for mornings.
                </p>
                <Button variant="link" className="h-auto p-0 mt-2 text-xs">
                  Optimize schedule <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-orange-600 mt-1" />
              <div>
                <p className="font-medium text-sm">Spending Pattern</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your grocery spending spikes 40% on Sundays. Shopping midweek could save ~$80/month.
                </p>
                <Button variant="link" className="h-auto p-0 mt-2 text-xs">
                  Get savings tips <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goal Coaching Example */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Goal: Save $10,000 for Emergency Fund
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <Badge variant="secondary">42.5% Complete</Badge>
            </div>
            <Progress value={42.5} className="h-2" />
            <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
              <span>$4,250</span>
              <span>$10,000</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-gray-900">
            <div className="flex items-start gap-2 mb-3">
              <Brain className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">AI Coach Says:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You're slightly behind pace. To get back on track, you need to save $720/month 
                  instead of your current $500/month.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">💡 3 Ways to Close the Gap:</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>Cancel unused subscriptions ($89/mo saved) - You haven't used: Gym membership, HBO Max</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>Reduce dining out to 2x/week ($130/mo saved) - Current avg: 4.5x/week</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>Sell unused items ($500 one-time boost) - I noticed you have collectibles not valued in 2+ years</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" className="flex-1">
                Implement Suggestions
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Adjust Goal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


