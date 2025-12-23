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
  DollarSign, Send, TrendingUp, TrendingDown, Wallet, PiggyBank,
  CreditCard, Receipt, Target, AlertCircle, CheckCircle, Loader2,
  ArrowLeft, MessageSquare, Mic, BarChart3, PieChart, ArrowUpRight,
  ArrowDownRight, Coins, Building, Calculator, Lightbulb, ShieldCheck,
  Calendar, RefreshCw
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface FinancialMetric {
  label: string
  value: number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon: React.ComponentType<any>
  color: string
}

interface SpendingCategory {
  category: string
  amount: number
  percentage: number
  color: string
}

interface FinancialGoal {
  id: string
  title: string
  target: number
  current: number
  deadline?: string
  type: 'savings' | 'debt' | 'investment' | 'emergency'
}

const QUICK_PROMPTS = [
  "How can I save more money?",
  "Analyze my spending habits",
  "Help me create a budget",
  "Should I pay off debt or invest?",
  "How much should I save for emergencies?",
  "Review my financial health"
]

const COACH_INTRO = `Hello! I'm Fortuna, your Financial Coach. 💰

I'm here to help you:
• **Master your budget** and control spending
• **Build savings** and emergency funds
• **Eliminate debt** strategically
• **Grow wealth** through smart investments
• **Plan for the future** with clear goals

What financial goal would you like to work on today?`

const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
]

export default function FinancialCoachPage() {
  const { data, bills } = useData()
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
  const [metrics, setMetrics] = useState<FinancialMetric[]>([])
  const [spending, setSpending] = useState<SpendingCategory[]>([])
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [financialScore, setFinancialScore] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Calculate financial metrics
  const calculateMetrics = useCallback(() => {
    const financialData = (data.financial || []) as any[]
    
    // Calculate totals
    let totalIncome = 0
    let totalExpenses = 0
    let totalSavings = 0
    const categoryTotals: Record<string, number> = {}

    financialData.forEach((item: any) => {
      const meta = item.metadata || item
      const amount = parseFloat(meta.amount || 0)
      const type = meta.type || 'expense'
      const category = meta.category || 'Other'

      if (type === 'income') {
        totalIncome += amount
      } else if (type === 'expense') {
        totalExpenses += amount
        categoryTotals[category] = (categoryTotals[category] || 0) + amount
      } else if (type === 'savings') {
        totalSavings += amount
      }
    })

    const netWorth = totalIncome - totalExpenses + totalSavings

    // Set metrics
    setMetrics([
      {
        label: 'Total Income',
        value: totalIncome,
        trend: 'up',
        icon: TrendingUp,
        color: 'text-emerald-500'
      },
      {
        label: 'Total Expenses',
        value: totalExpenses,
        trend: totalExpenses > totalIncome * 0.7 ? 'down' : 'stable',
        icon: Receipt,
        color: 'text-red-500'
      },
      {
        label: 'Savings',
        value: totalSavings,
        trend: totalSavings > 0 ? 'up' : 'stable',
        icon: PiggyBank,
        color: 'text-blue-500'
      },
      {
        label: 'Net Flow',
        value: totalIncome - totalExpenses,
        trend: totalIncome > totalExpenses ? 'up' : 'down',
        icon: Wallet,
        color: totalIncome > totalExpenses ? 'text-emerald-500' : 'text-red-500'
      }
    ])

    // Calculate spending by category
    const spendingCategories: SpendingCategory[] = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([category, amount], idx) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      }))
    
    setSpending(spendingCategories)

    // Calculate financial health score
    let score = 50
    if (totalIncome > totalExpenses) score += 20
    if (totalSavings > totalIncome * 0.1) score += 15
    if (totalExpenses < totalIncome * 0.7) score += 10
    if (financialData.length > 10) score += 5
    setFinancialScore(Math.min(100, score))

    // Generate sample goals based on data
    const generatedGoals: FinancialGoal[] = []
    
    if (totalSavings < totalIncome * 3) {
      generatedGoals.push({
        id: 'emergency',
        title: 'Emergency Fund',
        target: totalIncome * 3 || 10000,
        current: totalSavings,
        type: 'emergency'
      })
    }
    
    const upcomingBills = bills.filter((b: any) => b.status !== 'paid')
    if (upcomingBills.length > 0) {
      const billTotal = upcomingBills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0)
      generatedGoals.push({
        id: 'bills',
        title: 'Pay Upcoming Bills',
        target: billTotal,
        current: 0,
        deadline: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        type: 'debt'
      })
    }
    
    generatedGoals.push({
      id: 'savings',
      title: 'Monthly Savings Goal',
      target: totalIncome * 0.2 || 500,
      current: totalSavings,
      type: 'savings'
    })

    setGoals(generatedGoals)
    setIsLoadingMetrics(false)
  }, [data, bills])

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
      // Build financial context
      const financialContext = metrics.map(m => `${m.label}: $${m.value.toLocaleString()}`).join(', ')
      const topSpending = spending.slice(0, 3).map(s => `${s.category}: ${s.percentage}%`).join(', ')
      
      const response = await fetch('/api/ai-coaches/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachType: 'financial-coach',
          message: currentInput,
          context: `Financial Summary: ${financialContext}

Top Spending Categories: ${topSpending}

Financial Health Score: ${financialScore}/100

Unpaid Bills: ${bills.filter((b: any) => b.status !== 'paid').length}`,
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
        content: result.response || "Let me help you with your finances. Could you tell me more about your specific concern?",
        timestamp: new Date(),
        suggestions: generateFinancialSuggestions(currentInput)
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Let me give you a quick tip: Start by tracking every expense for one week - awareness is the first step to financial control!",
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const generateFinancialSuggestions = (userInput: string): string[] => {
    const lower = userInput.toLowerCase()
    
    if (lower.includes('budget') || lower.includes('spend')) {
      return ['Show my top spending categories', 'Help me reduce expenses', 'Create a monthly budget plan']
    }
    if (lower.includes('save') || lower.includes('savings')) {
      return ['What\'s the 50/30/20 rule?', 'How to automate savings', 'Emergency fund calculator']
    }
    if (lower.includes('invest') || lower.includes('wealth')) {
      return ['Investment options for beginners', 'Risk tolerance assessment', 'Compound interest explained']
    }
    if (lower.includes('debt') || lower.includes('pay off')) {
      return ['Debt avalanche vs snowball', 'Should I consolidate?', 'Create a payoff plan']
    }
    
    return ['Review my financial health', 'Tips for this month', 'Set a new financial goal']
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'savings': return PiggyBank
      case 'debt': return CreditCard
      case 'investment': return TrendingUp
      case 'emergency': return ShieldCheck
      default: return Target
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30">
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
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">FORTUNA</p>
                  <h1 className="text-2xl md:text-3xl font-bold">Financial Coach</h1>
                </div>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Online
          </Badge>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoadingMetrics ? (
            [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)
          ) : (
            metrics.map((metric, idx) => (
              <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                      <p className="text-2xl font-bold mt-1">{formatCurrency(metric.value)}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
                      <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    </div>
                  </div>
                  {metric.trend && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {metric.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : 
                       metric.trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
                      <span>{metric.trend === 'up' ? 'Positive' : metric.trend === 'down' ? 'Needs attention' : 'Stable'}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Financial Health & Goals */}
          <div className="lg:col-span-1 space-y-6">
            {/* Financial Health Score */}
            <Card className="border-2 border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  Financial Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative h-32 w-32">
                    <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-200 dark:text-gray-700" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="url(#finGradient)" strokeWidth="10" strokeDasharray={`${financialScore * 2.64} 264`} strokeLinecap="round" />
                      <defs>
                        <linearGradient id="finGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{financialScore}</span>
                      <span className="text-xs text-muted-foreground">Score</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {financialScore >= 70 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span>
                      {financialScore >= 80 ? 'Excellent financial health!' :
                       financialScore >= 60 ? 'Good progress - keep it up!' :
                       financialScore >= 40 ? 'Room for improvement' :
                       'Let\'s build your foundation'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spending Breakdown */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PieChart className="h-5 w-5 text-blue-500" />
                  Spending Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {spending.length > 0 ? (
                  spending.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-muted-foreground">{cat.percentage}%</span>
                      </div>
                      <Progress value={cat.percentage} className="h-2" style={{ '--progress-color': cat.color } as any} />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No spending data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Goals */}
            <Card className="border-2 border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-amber-500" />
                  Financial Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {goals.map(goal => {
                  const GoalIcon = getGoalIcon(goal.type)
                  const progress = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0
                  
                  return (
                    <div key={goal.id} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center">
                          <GoalIcon className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{goal.title}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                            <span>{formatCurrency(goal.current)} / {formatCurrency(goal.target)}</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5 mt-2" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] md:h-[700px] flex flex-col border-2 border-emerald-200 dark:border-emerald-800">
              <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-500" />
                  Chat with Fortuna
                </CardTitle>
                <CardDescription>Your personal financial coaching session</CardDescription>
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
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-emerald-600">Fortuna</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-emerald-600 text-white rounded-br-md'
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
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                          <span className="text-sm text-muted-foreground">Fortuna is analyzing...</span>
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
                    placeholder="Ask about budgeting, savings, investments..."
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
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Fortuna is here to help you achieve financial freedom • Press Enter to send
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Financial Tools */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-500" />
              Financial Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/tools/budget-calculator">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all cursor-pointer group">
                  <Coins className="h-8 w-8 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">Budget Calculator</p>
                  <p className="text-xs text-muted-foreground">Plan your budget</p>
                </div>
              </Link>
              <Link href="/tools/loan-calculator">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all cursor-pointer group">
                  <Building className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">Loan Calculator</p>
                  <p className="text-xs text-muted-foreground">Calculate payments</p>
                </div>
              </Link>
              <Link href="/tools/compound-interest">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all cursor-pointer group">
                  <TrendingUp className="h-8 w-8 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">Interest Calculator</p>
                  <p className="text-xs text-muted-foreground">See your growth</p>
                </div>
              </Link>
              <Link href="/domains/financial">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all cursor-pointer group">
                  <BarChart3 className="h-8 w-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm">Financial Dashboard</p>
                  <p className="text-xs text-muted-foreground">Full overview</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

