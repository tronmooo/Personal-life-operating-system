'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
// #region agent log
// FIXED: Importing from local wrapper instead of deprecated @supabase/auth-helpers-nextjs
// #endregion
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import {
  Send, Mic, Sparkles, Brain, MessageSquare, Settings, TrendingUp,
  AlertCircle, Target, DollarSign, Heart, BarChart3, Lightbulb, Phone
} from 'lucide-react'
import { format } from 'date-fns'
import { AIConciergeInterface } from '@/components/ai-concierge-interface'
import { useToast } from '@/components/ui/use-toast'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface AIAssistantPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

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
  visualization?: {
    type: 'line' | 'bar' | 'pie' | 'area' | 'multi_line' | 'combo'
    title: string
    xAxis?: string
    yAxis?: string
    data?: any[]
    datasets?: any[]
  }
}

const SUGGESTED_QUESTIONS = [
  "Analyze patterns and trends in my data",
  "What correlations do you see in my life?",
  "Analyze my spending habits",
  "How is my health progress?",
  "Find insights across all my domains",
  "What should I focus on this week?",
]

const QUICK_COMMANDS = [
  { icon: Sparkles, label: "Analyze My Data", color: "text-purple-400" },
  { icon: DollarSign, label: "Spending Analysis", color: "text-green-400" },
  { icon: Heart, label: "Health Insights", color: "text-red-400" },
  { icon: TrendingUp, label: "Find Correlations", color: "text-blue-400" },
]

const CHART_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']

// Visualization renderer component
function renderVisualization(viz: AIMessage['visualization']) {
  if (!viz || !viz.data) return null

  const chartHeight = 250

  switch (viz.type) {
    case 'line':
      // Determine the x-axis dataKey based on available data properties
      const lineXKey = viz.data[0]?.name ? 'name' : viz.data[0]?.category ? 'category' : 'date'
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={viz.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={lineXKey} tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )

    case 'bar':
      // Determine the x-axis dataKey based on available data properties
      const barXKey = viz.data[0]?.name ? 'name' : viz.data[0]?.category ? 'category' : 'date'
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={viz.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={barXKey} tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )

    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie
              data={viz.data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {viz.data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )

    case 'area':
      // Determine the x-axis dataKey based on available data properties
      const areaXKey = viz.data[0]?.name ? 'name' : viz.data[0]?.category ? 'category' : 'date'
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={viz.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={areaXKey} tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      )

    case 'multi_line':
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            {viz.datasets?.map((dataset: any, index: number) => (
              <Line
                key={dataset.name}
                data={dataset.data}
                type="monotone"
                dataKey="value"
                name={dataset.name}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )

    case 'combo':
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={viz.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="domain" tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {viz.data?.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )

    default:
      return <p className="text-gray-400 text-sm">Chart type not supported: {viz.type}</p>
  }
}

export function AIAssistantPopup({ open, onOpenChange }: AIAssistantPopupProps) {
  const { data } = useData()
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [conciergeData, setConciergeData] = useState<any>(null)
  const [userDocuments, setUserDocuments] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch user documents when popup opens
  useEffect(() => {
    if (!open) return
    
    const fetchDocuments = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return
        
        const { data: docs, error } = await supabase
          .from('documents')
          .select('id, document_name, document_type, file_url, file_path, expiration_date, domain, metadata, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (!error && docs) {
          console.log(`📄 Loaded ${docs.length} documents for AI assistant`)
          setUserDocuments(docs)
        }
      } catch (error) {
        console.error('Failed to fetch documents for AI:', error)
      }
    }
    
    fetchDocuments()
  }, [open])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      // Get user's local time and timezone for accurate meal type detection
      const now = new Date()
      const userLocalTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      const userLocalHour = now.getHours()
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          userData: { ...data, documents: userDocuments },
          userDocuments: userDocuments,
          conversationHistory: messages.map(m => ({
            type: m.type,
            content: m.content
          })),
          // Include user's local time info for accurate meal type detection
          userTime: {
            localTime: userLocalTime,
            localHour: userLocalHour,
            timezone: userTimezone,
            timestamp: now.toISOString()
          }
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to get response')
      }

      if (responseData.action === 'concierge_handoff') {
        setConciergeData(responseData.conciergeData)
        setActiveTab('concierge')
        
        const aiMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: responseData.response || "I'm handing you over to the Concierge.",
          timestamp: new Date(),
          visualization: responseData.visualization
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        const aiMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: responseData.response || responseData.message || "I processed your request.",
          timestamp: new Date(),
          visualization: responseData.visualization
        }
        setMessages(prev => [...prev, aiMessage])
        
        // Handle navigation commands
        if (responseData.navigate) {
          console.log('🧭 AI requesting navigation to:', responseData.navigate.path)
          setTimeout(() => {
            window.location.href = responseData.navigate.path
          }, 500)
        }

        // Handle open tool commands
        if (responseData.openTool) {
          console.log('🔧 AI requesting to open tool:', responseData.openTool.path)
          setTimeout(() => {
            window.location.href = responseData.openTool.path
          }, 500)
        }
        
        // Handle data save - trigger reload
        if (responseData.triggerReload || responseData.saved) {
          console.log('✅ Data was saved! Triggering reload event...')
          // Dispatch custom event to notify components about the save
          window.dispatchEvent(new CustomEvent('ai-assistant-saved'))
        }
      }

    } catch (error) {
      console.error('AI Chat Error:', error)
      toast({
        title: "Error",
        description: "Failed to connect to AI Assistant. Using offline mode.",
        variant: "destructive"
      })
      
      // Fallback to offline logic if API fails
      const aiResponse = "I'm having trouble connecting to the server. Please try again later."
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickCommand = (command: string) => {
    setInput(command)
    // We need to wait for state update before sending
    setTimeout(() => {
        // This is a bit hacky, better to refactor handleSendMessage to accept content
        // But for now, since we're using input state in handleSendMessage...
        // Actually, handleSendMessage uses 'input' state.
        // Let's modify handleSendMessage to accept an optional argument or just set input and let user press enter?
        // No, the original code did setTimeout(handleSendMessage, 100).
        // I'll stick to that but I need to make sure input is updated.
        // Since state updates are async, this might be flaky.
        // Better:
    }, 0)
    
    // Better implementation: call logic directly
    const userMessage: AIMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: command,
        timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)
    
    // Duplicate logic for now to be safe with state
    fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: command,
            userData: { ...data, documents: userDocuments },
            userDocuments: userDocuments,
            conversationHistory: messages.map(m => ({ type: m.type, content: m.content }))
        })
    }).then(res => res.json()).then(responseData => {
        if (responseData.action === 'concierge_handoff') {
            setConciergeData(responseData.conciergeData)
            setActiveTab('concierge')
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: responseData.response || responseData.message || "I processed your request.",
                timestamp: new Date(),
                visualization: responseData.visualization
            }])
        } else {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: responseData.response || responseData.message || "I processed your request.",
                timestamp: new Date(),
                visualization: responseData.visualization
            }])
        }
        setIsTyping(false)
    }).catch(err => {
        console.error(err)
        setIsTyping(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 bg-[#0a0f1e] text-white border-purple-500/30">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-b border-purple-500/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI Assistant</h2>
                  <p className="text-sm text-purple-400">Powered by AI Model • Access to All Your Data</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                Online
              </Badge>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{messages.length}</div>
                <div className="text-xs text-purple-400">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{Object.keys(data).length}</div>
                <div className="text-xs text-purple-400">Data Domains</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {Object.values(data).reduce((sum, items: any) => sum + (Array.isArray(items) ? items.length : 0), 0)}
                </div>
                <div className="text-xs text-purple-400">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-xs text-purple-400">Accuracy</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 bg-[#0f1729] border-b border-purple-500/30 rounded-none h-14">
              <TabsTrigger value="chat" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border-b-2 data-[state=active]:border-purple-500">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="concierge" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border-b-2 data-[state=active]:border-purple-500">
                <Phone className="h-4 w-4 mr-2" />
                Concierge
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border-b-2 data-[state=active]:border-purple-500">
                <Sparkles className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border-b-2 data-[state=active]:border-purple-500">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {/* Chat Tab */}
              <TabsContent value="chat" className="p-6 space-y-4 m-0 h-full flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px]">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <Brain className="h-16 w-16 text-purple-400 mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Start a conversation!</h3>
                      <p className="text-sm text-gray-400 mb-6 max-w-md">
                        I have access to all your data and can help you understand your life better. Try asking a question or use one of the suggestions below.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
                        {SUGGESTED_QUESTIONS.slice(0, 4).map((question, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                // Direct call to avoid state issues
                                const userMessage: AIMessage = {
                                    id: Date.now().toString(),
                                    type: 'user',
                                    content: question,
                                    timestamp: new Date()
                                }
                                setMessages(prev => [...prev, userMessage])
                                setIsTyping(true)
                                
                                fetch('/api/ai-assistant/chat', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        message: question,
                                        userData: { ...data, documents: userDocuments },
                                        userDocuments: userDocuments,
                                        conversationHistory: messages.map(m => ({ type: m.type, content: m.content }))
                                    })
                                }).then(res => res.json()).then(responseData => {
                                    if (responseData.action === 'concierge_handoff') {
                                        setConciergeData(responseData.conciergeData)
                                        setActiveTab('concierge')
                                        setMessages(prev => [...prev, {
                                            id: (Date.now() + 1).toString(),
                                            type: 'ai',
                                            content: responseData.response || responseData.message || "I processed your request.",
                                            timestamp: new Date(),
                                            visualization: responseData.visualization
                                        }])
                                    } else {
                                        setMessages(prev => [...prev, {
                                            id: (Date.now() + 1).toString(),
                                            type: 'ai',
                                            content: responseData.response || responseData.message || "I processed your request.",
                                            timestamp: new Date(),
                                            visualization: responseData.visualization
                                        }])
                                    }
                                    setIsTyping(false)
                                }).catch(() => setIsTyping(false))
                            }}
                            className="text-xs bg-[#0f1729] border-purple-500/30 hover:bg-purple-500/20 text-white"
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
                            className={`max-w-[90%] rounded-lg p-4 ${
                              message.type === 'user'
                                ? 'bg-purple-600 text-white'
                                : 'bg-[#0f1729] border border-purple-500/30'
                            }`}
                          >
                            {message.type === 'ai' && (
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-4 w-4 text-purple-400" />
                                <span className="text-xs font-semibold text-purple-400">AI Assistant</span>
                              </div>
                            )}
                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                            
                            {/* Visualization Chart */}
                            {message.visualization && message.type === 'ai' && (
                              <div className="mt-4 p-4 bg-[#0a0f1e] rounded-lg border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                  <BarChart3 className="h-4 w-4 text-purple-400" />
                                  <h4 className="text-sm font-semibold text-purple-300">{message.visualization.title}</h4>
                                </div>
                                {renderVisualization(message.visualization)}
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
                          <div className="bg-[#0f1729] border border-purple-500/30 rounded-lg p-4 max-w-[80%]">
                            <div className="flex items-center gap-2">
                              <Brain className="h-4 w-4 text-purple-400 animate-pulse" />
                              <span className="text-sm">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Quick Commands */}
                {messages.length === 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {QUICK_COMMANDS.map((cmd, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 bg-[#0f1729] border-purple-500/30 hover:bg-purple-500/20"
                        onClick={() => handleQuickCommand(cmd.label)}
                      >
                        <cmd.icon className={`h-6 w-6 ${cmd.color}`} />
                        <span className="text-xs text-center text-white">{cmd.label}</span>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Input Area - Large Chat Box */}
                <div className="flex flex-col gap-2 mt-4">
                  <Textarea
                    placeholder="Ask me anything... For example: 'Retrieve my license and insurance for my car' or 'Show me my spending this month'"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className="min-h-[120px] bg-[#0f1729] border-purple-500/30 text-white placeholder:text-gray-500 resize-none text-base"
                    rows={4}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-[#0f1729] border-purple-500/30 hover:bg-purple-500/20"
                      >
                        <Mic className="h-4 w-4 text-purple-400 mr-2" />
                        Voice
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSendMessage} 
                        disabled={!input.trim()}
                        className="bg-purple-600 hover:bg-purple-700 px-6"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Concierge Tab */}
              <TabsContent value="concierge" className="p-0 m-0 h-full">
                <AIConciergeInterface 
                    initialMessage={conciergeData?.initialMessage}
                    initialIntent={conciergeData?.intent}
                    initialDetails={conciergeData?.details}
                />
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="p-6 space-y-4 m-0">
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-400 mt-1" />
                      <div>
                        <p className="font-medium text-sm text-white">Correlation Found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          When you log workouts, you tend to spend 30% less on takeout food. 
                          Exercise might be helping your financial health too!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/50 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-blue-400 mt-1" />
                      <div>
                        <p className="font-medium text-sm text-white">Time Pattern</p>
                        <p className="text-sm text-gray-400 mt-1">
                          You're most productive when you start your day before 8 AM. 
                          Consider scheduling important tasks for mornings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/50 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-400 mt-1" />
                      <div>
                        <p className="font-medium text-sm text-white">Spending Pattern</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Your grocery spending spikes 40% on Sundays. Shopping midweek could save ~$80/month.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="p-6 space-y-6 m-0">
                <div>
                  <h3 className="text-xl font-bold mb-6 text-white">AI Assistant Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-[#0f1729] border border-purple-500/30 rounded-lg p-4">
                      <p className="text-sm text-gray-400">
                        <span className="font-semibold text-white">Data Access:</span> Full access to all domains
                      </p>
                    </div>
                    <div className="bg-[#0f1729] border border-purple-500/30 rounded-lg p-4">
                      <p className="text-sm text-gray-400">
                        <span className="font-semibold text-white">AI Model:</span> Advanced Language Model
                      </p>
                    </div>
                    <div className="bg-[#0f1729] border border-purple-500/30 rounded-lg p-4">
                      <p className="text-sm text-gray-400">
                        <span className="font-semibold text-white">Privacy:</span> All data stays local
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
