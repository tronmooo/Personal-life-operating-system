'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Sparkles, User, Bot, Mic, Loader2, X, BarChart3, TrendingUp } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  visualization?: {
    type: 'line' | 'bar' | 'pie' | 'area' | 'multi_line' | 'stacked_bar' | 'combo' | 'scatter' | 'radar' | 'heatmap' | 'gauge'
    title: string
    xAxis?: string
    yAxis?: string
    data?: Array<any>
    datasets?: Array<{
      name: string
      domain: string
      data: Array<any>
    }>
    config?: any
  }
  navigate?: {
    path: string
    destination: string
  }
  openTool?: {
    path: string
    name: string
  }
  data?: any
}

export function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your **All-Powerful AI Assistant**. Here's what I can do:

📊 **Create Charts**: "Create a pie chart of my expenses" or "Visualize my health data"
✅ **Add Tasks**: "Add task buy groceries tomorrow" 
🔄 **Add Habits**: "Add habit exercise daily 💪"
💳 **Add Bills**: "Add bill Netflix $15.99 monthly"
📅 **Add Events**: "Schedule meeting with doctor Friday at 2pm"
🗑️ **Delete Data**: "Delete my old tasks" (requires confirmation)
✏️ **Update Data**: "Update my weight to 175 lbs"
🧭 **Navigate**: "Go to health page" or "Take me to financial domain"
🔧 **Open Tools**: "Open BMI calculator" or "Use mortgage calculator"

What would you like me to do?`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { data, tasks, bills, events, habits } = useData()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    // Gather user context for the AI
    const userContext = {
        // Financial data
        finances: {
          expenses: data.financial?.filter((item: any) => 
            item.metadata?.type === 'expense' || item.data?.type === 'expense'
          ) || [],
          income: data.financial?.filter((item: any) => 
            item.metadata?.type === 'income' || item.data?.type === 'income'
          ) || [],
          totalExpenses: data.financial?.reduce((sum: number, item: any) => {
            const amount = parseFloat(item.metadata?.amount || item.data?.amount || 0)
            const type = item.metadata?.type || item.data?.type
            return type === 'expense' ? sum + amount : sum
          }, 0) || 0,
          totalIncome: data.financial?.reduce((sum: number, item: any) => {
            const amount = parseFloat(item.metadata?.amount || item.data?.amount || 0)
            const type = item.metadata?.type || item.data?.type
            return type === 'income' ? sum + amount : sum
          }, 0) || 0
        },
        
        // Health data
        health: {
          recentLogs: data.health?.slice(0, 10) || [],
          latestWeight: data.health?.find((item: any) => 
            item.metadata?.logType === 'weight' || item.data?.logType === 'weight'
          )
        },
        
        // Tasks & Habits
        tasks: {
          total: tasks.length,
          completed: tasks.filter((t: any) => t.completed).length,
          pending: tasks.filter((t: any) => !t.completed).length,
          upcoming: tasks.filter((t: any) => !t.completed).slice(0, 5)
        },
        
        habits: {
          total: habits.length,
          active: habits.filter((h: any) => h.active).length
        },
        
        // Bills
        bills: {
          total: bills.length,
          unpaid: bills.filter((b: any) => b.status !== 'paid').length,
          upcomingDue: bills.filter((b: any) => b.status !== 'paid').slice(0, 5)
        },
        
        // Events
        events: {
          total: events.length,
          upcoming: events.slice(0, 5)
        },
        
        // Vehicles
        vehicles: data.vehicles || [],
        
        // Properties
        properties: data.home || [],
        
        // Pets
        pets: data.pets || []
      }

    try {
      console.log('🤖 Sending message to AI Assistant API:', input)
      
      // Send to AI Assistant API (the one that actually saves data)
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          userData: data,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const aiData = await response.json()
      console.log('📥 AI Response:', aiData)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiData.response || aiData.message || "I'm sorry, I couldn't process that request. Please try again.",
        timestamp: new Date(),
        visualization: aiData.visualization || undefined,
        data: aiData.data || undefined
      }

      setMessages(prev => [...prev, aiMessage])
      
      // If data was saved, trigger reload
      if (aiData.triggerReload || aiData.saved) {
        console.log('✅ Data was saved! Triggering reload...')
        if (typeof window !== 'undefined') {
          // Give Supabase time to commit the data before reloading
          await new Promise(resolve => setTimeout(resolve, 800))
          window.dispatchEvent(new CustomEvent('ai-assistant-saved'))
          console.log('✅ Dispatched ai-assistant-saved event')
          // Give additional time for the reload to complete
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
      
      // If AI found documents, open them automatically
      if (aiData.openDocuments && aiData.documents && aiData.documents.length > 0) {
        console.log('📄 Opening', aiData.documents.length, 'documents')
        aiData.documents.forEach((doc: any, index: number) => {
          setTimeout(() => {
            window.open(doc.url, '_blank')
            console.log(`✅ Opened: ${doc.name}`)
          }, index * 300)
        })
      }

      // Handle navigation commands
      if (aiData.navigate) {
        console.log('🧭 AI requesting navigation to:', aiData.navigate.path)
        setTimeout(() => {
          window.location.href = aiData.navigate.path
        }, 500)
      }

      // Handle open tool commands
      if (aiData.openTool) {
        console.log('🔧 AI requesting to open tool:', aiData.openTool.path)
        setTimeout(() => {
          window.location.href = aiData.openTool.path
        }, 500)
      }
    } catch (error) {
      console.error('AI Chat error:', error)
      
      // Fallback: Generate a contextual response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateFallbackResponse(input, userContext),
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const generateFallbackResponse = (userInput: string, context: any): string => {
    const lower = userInput.toLowerCase()
    
    // Financial queries
    if (lower.includes('spend') || lower.includes('expense') || lower.includes('money')) {
      return `Based on your data, you have ${context.finances.expenses.length} expense transactions totaling $${context.finances.totalExpenses.toFixed(2)}. Your total income is $${context.finances.totalIncome.toFixed(2)}, giving you a net of $${(context.finances.totalIncome - context.finances.totalExpenses).toFixed(2)}.`
    }
    
    // Task queries
    if (lower.includes('task') || lower.includes('todo')) {
      return `You have ${context.tasks.total} tasks total. ${context.tasks.completed} are completed and ${context.tasks.pending} are still pending. ${context.tasks.upcoming.length > 0 ? `Your next tasks are: ${context.tasks.upcoming.map((t: any) => t.title).join(', ')}` : 'No upcoming tasks.'}`
    }
    
    // Bill queries
    if (lower.includes('bill') || lower.includes('payment')) {
      return `You have ${context.bills.total} bills tracked. ${context.bills.unpaid} bills are currently unpaid. ${context.bills.upcomingDue.length > 0 ? `Coming up: ${context.bills.upcomingDue.map((b: any) => `${b.name} ($${b.amount})`).join(', ')}` : ''}`
    }
    
    // Health queries
    if (lower.includes('health') || lower.includes('weight')) {
      const weight = context.health.latestWeight
      return `You have ${context.health.recentLogs.length} health logs. ${weight ? `Your latest weight is ${weight.metadata?.value || weight.data?.value} ${weight.metadata?.unit || weight.data?.unit || 'lbs'}.` : 'No weight data available yet.'}`
    }
    
    // Habit queries
    if (lower.includes('habit')) {
      return `You're tracking ${context.habits.total} habits, with ${context.habits.active} currently active.`
    }
    
    // Event queries
    if (lower.includes('event') || lower.includes('calendar')) {
      return `You have ${context.events.total} events scheduled. ${context.events.upcoming.length > 0 ? `Coming up: ${context.events.upcoming.map((e: any) => e.title).join(', ')}` : 'No upcoming events.'}`
    }
    
    // Default response
    return `I understand you're asking about "${userInput}". I have access to your financial data (${context.finances.expenses.length} transactions), ${context.tasks.total} tasks, ${context.bills.total} bills, ${context.health.recentLogs.length} health logs, and more. Could you be more specific about what you'd like to know?`
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your AI assistant. I have access to all your life data and can help you with questions about your finances, health, tasks, and more. What would you like to know?",
        timestamp: new Date()
      }
    ])
  }

  const quickPrompts = [
    // Data Commands
    "Add task buy groceries",
    "Add habit exercise daily 💪",
    "Add bill Netflix $15.99 monthly",
    // Visualization Commands
    "Create a pie chart of my spending by category",
    "Show my health data as a line chart",
    "Visualize all my data this month",
    // Navigation Commands
    "Go to health page",
    "Open BMI calculator",
    "Take me to financial domain",
    // Query Commands
    "What's my total spending this week?",
    "Show my weight trend",
    "Compare my income vs expenses"
  ]

  return (
    <Card className="w-full h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-green-500" />
            <div>
              <CardTitle>AI Chat Assistant</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Ask me anything about your life data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              GPT-4
            </Badge>
            <Button variant="outline" size="sm" onClick={clearChat}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-blue-500'
                    : 'bg-green-500'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-5 w-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex-1 max-w-[80%] ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {/* Visualization Chart */}
                {message.visualization && message.role === 'assistant' && (
                  <div className="mt-3 p-4 bg-white dark:bg-gray-900 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <h4 className="text-sm font-semibold">{message.visualization.title}</h4>
                    </div>
                    
                    {message.visualization.type === 'line' && (
                      <ResponsiveContainer width="100%" height={message.visualization.config?.height || 300}>
                        <LineChart data={message.visualization.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            label={{ value: message.visualization.xAxis, position: 'insideBottom', offset: -5 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            label={{ value: message.visualization.yAxis, angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    
                    {message.visualization.type === 'bar' && (
                      <ResponsiveContainer width="100%" height={message.visualization.config?.height || 300}>
                        <BarChart data={message.visualization.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            label={{ value: message.visualization.xAxis, position: 'insideBottom', offset: -5 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            label={{ value: message.visualization.yAxis, angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    
                    {message.visualization.type === 'area' && (
                      <ResponsiveContainer width="100%" height={message.visualization.config?.height || 300}>
                        <AreaChart data={message.visualization.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            label={{ value: message.visualization.xAxis, position: 'insideBottom', offset: -5 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            label={{ value: message.visualization.yAxis, angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#8b5cf6" 
                            fill="#8b5cf6" 
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                    
                    {message.visualization.type === 'multi_line' && message.visualization.datasets && (
                      <ResponsiveContainer width="100%" height={message.visualization.config?.height || 400}>
                        <LineChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            label={{ value: message.visualization.xAxis, position: 'insideBottom', offset: -5 }}
                            tick={{ fontSize: 12 }}
                            type="category"
                            allowDuplicatedCategory={false}
                          />
                          <YAxis 
                            label={{ value: message.visualization.yAxis, angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip />
                          <Legend />
                          {message.visualization.datasets.map((dataset, idx) => {
                            const colors = message.visualization?.config?.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
                            return (
                              <Line
                                key={dataset.name}
                                data={dataset.data}
                                type="monotone"
                                dataKey="value"
                                name={dataset.name}
                                stroke={colors[idx % colors.length]}
                                strokeWidth={2}
                                dot={{ fill: colors[idx % colors.length], r: 3 }}
                              />
                            )
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    
                    {message.visualization.type === 'combo' && message.visualization.data && (
                      <ResponsiveContainer width="100%" height={message.visualization.config?.height || 400}>
                        <BarChart data={message.visualization.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="domain" 
                            label={{ value: message.visualization.xAxis, position: 'insideBottom', offset: -5 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            label={{ value: message.visualization.yAxis, angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#8b5cf6">
                            {message.visualization.data.map((entry: any, index: number) => {
                              const colors = message.visualization?.config?.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    
                    {message.visualization.type === 'pie' && message.visualization.data && (
                      <ResponsiveContainer width="100%" height={message.visualization.config?.height || 300}>
                        <PieChart>
                          <Pie
                            data={message.visualization.data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={true}
                          >
                            {message.visualization.data.map((entry: any, index: number) => {
                              const colors = message.visualization?.config?.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            })}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    
                    {message.visualization.type === 'scatter' && message.visualization.data && (
                      <ResponsiveContainer width="100%" height={message.visualization.config?.height || 300}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="x" 
                            type="number"
                            label={{ value: message.visualization.xAxis, position: 'insideBottom', offset: -5 }}
                          />
                          <YAxis 
                            dataKey="y" 
                            type="number"
                            label={{ value: message.visualization.yAxis, angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Legend />
                          <Scatter 
                            name={message.visualization.title} 
                            data={message.visualization.data} 
                            fill="#8b5cf6" 
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                    
                    {message.visualization.type === 'radar' && message.visualization.data && (
                      <ResponsiveContainer width="100%" height={message.visualization.config?.height || 350}>
                        <RadarChart data={message.visualization.data}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar
                            name="Value"
                            dataKey="value"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.5}
                          />
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      📊 Interactive chart
                      {message.visualization.data && ` • ${message.visualization.data.length} data points`}
                      {message.visualization.datasets && ` • ${message.visualization.datasets.length} datasets`}
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isProcessing && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="inline-block px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="flex-shrink-0 px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setInput(prompt)
                    setTimeout(() => handleSubmit(), 100)
                  }}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 border-t p-4 bg-background">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything about your data..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleVoiceInput}
                disabled={isProcessing}
                className={isListening ? 'bg-red-100 dark:bg-red-900' : ''}
              >
                <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse text-red-500' : ''}`} />
              </Button>
              <Button type="submit" disabled={!input.trim() || isProcessing}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span>AI Assistant Ready • Has access to all your data</span>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}





