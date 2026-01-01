'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, Send, Sparkles, User, Bot, Mic, Loader2, X, 
  TrendingUp, AlertTriangle, Download, Trash2, Edit, RefreshCw,
  BarChart3, FileText, Zap
} from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useRouter } from 'next/navigation'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ZAxis
} from 'recharts'
import { HeatmapChart } from './ai-visualizations/heatmap-chart'
import { LifeBalanceRadar } from './ai-visualizations/radar-chart'
import { CorrelationScatter } from './ai-visualizations/scatter-chart'
import { GaugeChart, GoalProgressGauge } from './ai-visualizations/gauge-chart'
import { toast } from '@/lib/utils/toast'

// Extended Message interface with new capabilities
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  visualization?: {
    type: 'line' | 'bar' | 'pie' | 'area' | 'multi_line' | 'stacked_bar' | 'combo' | 'scatter' | 'heatmap' | 'radar' | 'gauge'
    title: string
    xAxis?: string
    yAxis?: string
    data?: any[]
    datasets?: any[]
    config?: any
    // New fields for advanced viz
    correlation?: number
    insight?: string
  }
  data?: any
  // New action-related fields
  pendingAction?: {
    type: 'delete' | 'update' | 'bulk_delete' | 'bulk_update' | 'archive'
    confirmationId: string
    preview?: any[]
    totalCount?: number
    params?: any
  }
  prediction?: {
    currentValue: number
    trend: string
    weeklyChange: number
    predictions: { date: string; value: number }[]
    targetValue?: number
    targetDate?: string | null
    confidence: number
  }
  report?: {
    title: string
    sections: { heading: string; content: string }[]
    generatedAt: string
  }
  exportData?: {
    data: string
    mimeType: string
    filename: string
    count: number
  }
  calculation?: {
    type: string
    result: any
  }
}

export function AIChatInterfaceEnhanced() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "🚀 Hi! I'm your **Ultimate AI Assistant**. I can now do much more:\n\n" +
        "📊 **Visualize** - Charts, heatmaps, radar charts, gauges\n" +
        "✏️ **Update** - Modify any of your data\n" +
        "🗑️ **Delete** - Remove entries (with confirmation)\n" +
        "📈 **Predict** - Forecast trends and goals\n" +
        "🔗 **Correlate** - Find patterns between domains\n" +
        "📄 **Export** - Download data as CSV/JSON\n" +
        "🧮 **Calculate** - Financial projections & more\n\n" +
        "What would you like to do?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { data, tasks, bills, events, habits } = useData()
  
  // Refresh data function
  const refreshData = useCallback(() => {
    router.refresh()
    window.dispatchEvent(new CustomEvent('ai-assistant-saved'))
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser')
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

  // Handle confirming a pending action
  const handleConfirmAction = async (messageId: string, confirmationId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message?.pendingAction) return

    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/ai-assistant/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: message.pendingAction.type,
          domain: message.pendingAction.params?.domain || 'all',
          parameters: message.pendingAction.params,
          confirmation: true,
          confirmationId
        })
      })

      const result = await response.json()

      // Update the message to show result
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return {
            ...m,
            content: result.message || '✅ Action completed',
            pendingAction: undefined
          }
        }
        return m
      }))

      // Trigger data refresh
      if (result.success) {
        refreshData()
        toast.success('Action Completed', result.message)
      }
    } catch (error: any) {
      toast.error('Action Failed', error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle canceling a pending action
  const handleCancelAction = (messageId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          content: '❌ Action cancelled',
          pendingAction: undefined
        }
      }
      return m
    }))
  }

  // Handle downloading export data
  const handleDownload = (exportData: Message['exportData']) => {
    if (!exportData) return

    const blob = new Blob([exportData.data], { type: exportData.mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportData.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Download Started', `Downloading ${exportData.filename}`)
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
    const userInput = input
    setInput('')
    setIsProcessing(true)

    try {
      console.log('🤖 Sending message to AI Assistant:', userInput)
      
      // Get user's local time and timezone for accurate meal type detection
      const now = new Date()
      const userTimeInfo = {
        localTime: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        localHour: now.getHours(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: now.toISOString()
      }
      
      // Send to AI Assistant API
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          userData: data,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          userTime: userTimeInfo
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
        content: aiData.response || aiData.message || "I processed your request.",
        timestamp: new Date(),
        visualization: aiData.visualization,
        data: aiData.data,
        pendingAction: aiData.requiresConfirmation ? {
          type: aiData.action,
          confirmationId: aiData.confirmationId,
          preview: aiData.preview,
          totalCount: aiData.totalCount,
          params: aiData.params
        } : undefined,
        prediction: aiData.prediction,
        report: aiData.report,
        exportData: aiData.exportData,
        calculation: aiData.calculation
      }

      setMessages(prev => [...prev, aiMessage])
      
      // Handle automatic actions
      if (aiData.triggerReload || aiData.saved) {
        refreshData()
      }
      
    } catch (error) {
      console.error('AI Chat error:', error)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "🚀 Chat cleared! I'm ready for new commands. What would you like to do?",
        timestamp: new Date()
      }
    ])
  }

  // Quick prompts organized by category
  const quickPrompts = {
    visualize: [
      "Show my weight trend this month",
      "Create a heatmap of my activity",
      "Show my life balance radar chart",
      "Compare my spending vs income"
    ],
    actions: [
      "Delete my duplicate entries",
      "Update my weight to 170 lbs",
      "Archive old completed tasks",
      "Export my financial data"
    ],
    insights: [
      "Predict when I'll reach my goal",
      "How does sleep affect my fitness?",
      "Generate a monthly report",
      "Calculate compound interest"
    ]
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  // Render visualization based on type
  const renderVisualization = (viz: Message['visualization']) => {
    if (!viz) return null

    const commonChartProps = {
      width: "100%",
      height: viz.config?.height || 300
    }

    switch (viz.type) {
      case 'heatmap':
        return (
          <HeatmapChart
            data={viz.data || []}
            title={viz.title}
            description={viz.insight}
          />
        )

      case 'radar':
        return (
          <LifeBalanceRadar
            data={viz.data || []}
            title={viz.title}
            description={viz.insight}
          />
        )

      case 'scatter':
        return (
          <CorrelationScatter
            data={viz.data || []}
            title={viz.title}
            xLabel={viz.xAxis || 'X'}
            yLabel={viz.yAxis || 'Y'}
            correlation={viz.correlation}
            insight={viz.insight}
          />
        )

      case 'gauge':
        const gaugeData = viz.data?.[0] || { value: 0, max: 100 }
        return (
          <GaugeChart
            value={gaugeData.value}
            maxValue={gaugeData.max}
            title={viz.title}
            unit={gaugeData.unit || ''}
          />
        )

      case 'line':
        return (
          <ResponsiveContainer {...commonChartProps}>
            <LineChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer {...commonChartProps}>
            <BarChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer {...commonChartProps}>
            <PieChart>
              <Pie
                data={viz.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {viz.data?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer {...commonChartProps}>
            <AreaChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
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
        )

      case 'multi_line':
        return (
          <ResponsiveContainer {...commonChartProps} height={400}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {viz.datasets?.map((dataset: any, index: number) => (
                <Line
                  key={dataset.name}
                  data={dataset.data}
                  type="monotone"
                  dataKey="value"
                  name={dataset.name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'combo':
        return (
          <ResponsiveContainer {...commonChartProps} height={400}>
            <BarChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="domain" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8b5cf6">
                {viz.data?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )

      default:
        return <p className="text-muted-foreground">Unsupported chart type: {viz.type}</p>
    }
  }

  // Render pending action confirmation UI
  const renderPendingAction = (action: Message['pendingAction'], messageId: string) => {
    if (!action) return null

    const actionLabels: Record<string, { label: string; icon: any; color: string }> = {
      delete: { label: 'Delete', icon: Trash2, color: 'text-red-600 bg-red-50' },
      bulk_delete: { label: 'Bulk Delete', icon: Trash2, color: 'text-red-600 bg-red-50' },
      update: { label: 'Update', icon: Edit, color: 'text-blue-600 bg-blue-50' },
      bulk_update: { label: 'Bulk Update', icon: Edit, color: 'text-blue-600 bg-blue-50' },
      archive: { label: 'Archive', icon: FileText, color: 'text-amber-600 bg-amber-50' }
    }

    const { label, icon: Icon, color } = actionLabels[action.type] || { label: action.type, icon: AlertTriangle, color: 'text-gray-600 bg-gray-50' }

    return (
      <div className={`mt-3 p-4 rounded-lg border ${color}`}>
        <div className="flex items-center gap-2 font-medium mb-2">
          <Icon className="h-5 w-5" />
          Confirm {label}
        </div>
        
        {action.preview && action.preview.length > 0 && (
          <div className="mb-3">
            <p className="text-sm mb-2">This will affect {action.totalCount || action.preview.length} item(s):</p>
            <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
              {action.preview.slice(0, 5).map((item: any, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {item.title || item.description || 'Untitled'}
                  {item.date && <span className="text-xs opacity-70">({new Date(item.date).toLocaleDateString()})</span>}
                </li>
              ))}
              {action.preview.length > 5 && (
                <li className="opacity-70">...and {action.preview.length - 5} more</li>
              )}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleConfirmAction(messageId, action.confirmationId)}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Yes, proceed
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCancelAction(messageId)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // Render prediction display
  const renderPrediction = (prediction: Message['prediction']) => {
    if (!prediction) return null

    return (
      <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg border">
        <div className="flex items-center gap-2 font-medium mb-3">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Prediction Analysis
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{prediction.currentValue}</div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${prediction.weeklyChange > 0 ? 'text-green-600' : prediction.weeklyChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {prediction.weeklyChange > 0 ? '+' : ''}{prediction.weeklyChange}
            </div>
            <div className="text-xs text-muted-foreground">Weekly Change</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{Math.round(prediction.confidence * 100)}%</div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>
        </div>

        {prediction.targetDate && (
          <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg mb-3">
            <p className="text-sm">
              🎯 You'll reach your goal of <span className="font-bold">{prediction.targetValue}</span> by{' '}
              <span className="font-bold">{new Date(prediction.targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </p>
          </div>
        )}

        {/* Mini prediction chart */}
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={prediction.predictions}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            {prediction.targetValue && (
              <Line type="monotone" dataKey={() => prediction.targetValue} stroke="#10b981" strokeDasharray="3 3" name="Target" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Render report display
  const renderReport = (report: Message['report']) => {
    if (!report) return null

    return (
      <div className="mt-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-medium">
            <FileText className="h-5 w-5 text-amber-600" />
            {report.title}
          </div>
          <Badge variant="outline" className="text-xs">
            {new Date(report.generatedAt).toLocaleDateString()}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {report.sections.map((section, index) => (
            <div key={index} className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <h4 className="font-medium text-sm mb-1">{section.heading}</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render export download UI
  const renderExport = (exportData: Message['exportData']) => {
    if (!exportData) return null

    return (
      <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 font-medium">
              <Download className="h-5 w-5 text-green-600" />
              Export Ready
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {exportData.count} entries • {exportData.filename}
            </p>
          </div>
          <Button onClick={() => handleDownload(exportData)} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    )
  }

  // Render calculation result
  const renderCalculation = (calculation: Message['calculation']) => {
    if (!calculation) return null

    return (
      <div className="mt-3 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 rounded-lg border">
        <div className="flex items-center gap-2 font-medium mb-3">
          <Zap className="h-5 w-5 text-cyan-600" />
          Calculation Result
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(calculation.result).map(([key, value]) => (
            <div key={key} className="p-2 bg-white/50 dark:bg-black/20 rounded">
              <div className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</div>
              <div className="font-medium">{typeof value === 'number' ? value.toLocaleString() : String(value)}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-500" />
            <div>
              <CardTitle className="flex items-center gap-2">
                Ultimate AI Assistant
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Enhanced
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Create • Read • Update • Delete • Visualize • Predict • Export
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearChat}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
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
                      : 'bg-gradient-to-br from-violet-500 to-purple-500'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Visualization */}
                  {message.visualization && message.role === 'assistant' && (
                    <div className="mt-3 p-4 bg-white dark:bg-gray-900 rounded-lg border">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                        <h4 className="text-sm font-semibold">{message.visualization.title}</h4>
                      </div>
                      {renderVisualization(message.visualization)}
                    </div>
                  )}

                  {/* Pending Action Confirmation */}
                  {message.pendingAction && renderPendingAction(message.pendingAction, message.id)}

                  {/* Prediction Display */}
                  {message.prediction && renderPrediction(message.prediction)}

                  {/* Report Display */}
                  {message.report && renderReport(message.report)}

                  {/* Export Download */}
                  {message.exportData && renderExport(message.exportData)}

                  {/* Calculation Result */}
                  {message.calculation && renderCalculation(message.calculation)}

                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="border-t p-3 bg-muted/30">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Object.entries(quickPrompts).map(([category, prompts]) => (
              prompts.slice(0, 2).map((prompt, index) => (
                <Button
                  key={`${category}-${index}`}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 text-xs"
                  onClick={() => setInput(prompt)}
                >
                  {prompt}
                </Button>
              ))
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleVoiceInput}
              disabled={isProcessing}
              className={isListening ? 'bg-red-100 border-red-300 animate-pulse' : ''}
            >
              <Mic className={`h-4 w-4 ${isListening ? 'text-red-500' : ''}`} />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything... (delete, update, visualize, predict, export)"
              disabled={isProcessing}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || isProcessing}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

