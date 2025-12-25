'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { MessageSquare, Sparkles, Settings, Lightbulb, TrendingUp, Target, X, Mic, MicOff, Send, Camera, Image as ImageIcon, BarChart3 } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { format } from 'date-fns'
import { MultiDocumentViewer } from '@/components/documents/multi-document-viewer'
import { retrieveDocuments } from '@/lib/ai/document-retrieval-function'
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
  documents?: Array<{
    id: string
    name: string
    type: string
    category: string
    url: string
    expirationDate?: string
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

const CHART_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// Visualization renderer
function renderVisualization(viz: AIMessage['visualization']) {
  if (!viz || !viz.data || viz.data.length === 0) return null

  const chartHeight = 250

  // Determine the x-axis dataKey based on available data properties
  const xAxisKey = viz.data[0]?.name ? 'name' : viz.data[0]?.category ? 'category' : 'date'

  switch (viz.type) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={viz.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} name={viz.yAxis || 'Value'} />
          </LineChart>
        </ResponsiveContainer>
      )

    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={viz.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name={viz.yAxis || 'Value'} />
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
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )

    case 'area':
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={viz.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} name={viz.yAxis || 'Value'} />
          </AreaChart>
        </ResponsiveContainer>
      )

    case 'multi_line':
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xAxisKey} type="category" allowDuplicatedCategory={false} tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
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

export function AIAssistantPopupClean({ open, onOpenChange }: AIAssistantPopupProps) {
  const { data } = useData()
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI Assistant - I can do **EVERYTHING** in your app! 🚀\n\n✨ **Log multiple things at once:**\n• \"spent $45 on groceries, walked 30 minutes, drank 20 oz water\"\n• \"ran 5 miles, blood pressure 120/80, ate 450 calories\"\n\n✅ **Manage Tasks:**\n• \"add task buy groceries\"\n• \"mark buy milk as done\"\n• \"finished the project report\"\n\n🏃 **Track Habits:**\n• \"add habit exercise daily\"\n• \"did my meditation habit\"\n• \"completed workout today\"\n\n📔 **Write Journal Entries:**\n• \"journal: Today was amazing. I finally...\"\n• \"write in my journal about my progress\"\n\n💰 **Bills & Finance:**\n• \"add bill Netflix $15.99 monthly\"\n• \"spent $50 on dinner\"\n\n📅 **Calendar Events:**\n• \"add to google calendar meeting tomorrow at 3pm\"\n\n📊 **Visualizations:**\n• \"show me a chart of my expenses\"\n\n🧭 **Navigation:**\n• \"go to health page\"\n• \"open BMI calculator\"\n\nWhat can I help you with?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Voice Recognition
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  
  // Image Upload
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Document Viewer
  const [viewerDocuments, setViewerDocuments] = useState<any[] | null>(null)
  const [isSearchingDocuments, setIsSearchingDocuments] = useState(false)
  
  // Settings
  const [voiceInput, setVoiceInput] = useState(false)
  const [autoSuggestions, setAutoSuggestions] = useState(true)
  const [dataAnalysis, setDataAnalysis] = useState(true)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      console.log('Speech recognition not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript + ' '
        } else {
          interim += transcript
        }
      }

      if (final) {
        setInput(prev => (prev + ' ' + final).trim())
      }
      setInterimTranscript(interim)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      if (event.error !== 'network' && event.error !== 'aborted') {
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleVoiceInput = async () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setInterimTranscript('')
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (err) {
        console.error('Microphone permission denied', err)
        alert('Please allow microphone access to use voice input')
      }
    }
  }

  const handleInsightClick = async (type: 'quick' | 'trends' | 'recommendations') => {
    setActiveTab('chat')
    const prompts = {
      quick: 'Generate quick insights from my recent activities across all life domains',
      trends: 'Analyze patterns and trends in my data. What correlations do you see?',
      recommendations: 'Give me personalized recommendations for improving my life management based on my data'
    }
    setInput(prompts[type])
    setTimeout(() => handleSendMessage(), 100)
  }

  const generateAIResponse = async (question: string): Promise<{ message: string; visualization?: AIMessage['visualization'] }> => {
    try {
      // FIRST: Try multi-entity extraction for data entry commands
      console.log('🧠 [MULTI-ENTITY] Attempting multi-entity extraction...')
      try {
        const multiEntityResponse = await fetch('/api/ai-assistant/multi-entry', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: question,
            userContext: {
              recentEntries: Object.values(data).flat().slice(0, 50),
              preferences: {
                // Extract default names from recent data
                defaultPetName: data.pets?.[0]?.metadata?.petName || data.pets?.[0]?.title,
                defaultVehicle: data.vehicles?.[0]?.title,
                defaultHome: data.home?.[0]?.title
              }
            }
          })
        })

        if (multiEntityResponse.ok) {
          const multiResult = await multiEntityResponse.json()
          console.log('📥 [MULTI-ENTITY] Full response:', JSON.stringify(multiResult, null, 2))

          // If entities were extracted and saved, use multi-entity response
          if (multiResult.success && multiResult.results && multiResult.results.length > 0) {
            console.log(`✅ [MULTI-ENTITY] Saved ${multiResult.results.length} entities!`)
            console.log('📊 [MULTI-ENTITY] Results:', multiResult.results.map((r: any) => `${r.domain}: ${r.title}`).join(', '))
            
            // Trigger reload of DataProvider
            if (multiResult.triggerReload) {
              console.log('💾 [MULTI-ENTITY] Data was saved! Triggering reload...')
              if (typeof window !== 'undefined') {
                // ✅ FIXED: Wait for Supabase to commit BEFORE dispatching event
                await new Promise(resolve => setTimeout(resolve, 800))
                window.dispatchEvent(new CustomEvent('ai-assistant-saved'))
                console.log('✅ Dispatched ai-assistant-saved event')
                await new Promise(resolve => setTimeout(resolve, 300))
              }
            }

            return { message: multiResult.message || 'Data logged successfully!' }
          } else {
            console.log('💬 [MULTI-ENTITY] No entities extracted or save failed.')
            console.log('📊 [MULTI-ENTITY] Success:', multiResult.success, 'Results count:', multiResult.results?.length || 0)
            if (multiResult.error) {
              console.warn('⚠️ [MULTI-ENTITY] Error:', multiResult.error)
            }
            if (multiResult.extractionResult) {
              console.log('📊 [MULTI-ENTITY] Extraction result:', JSON.stringify(multiResult.extractionResult, null, 2))
            }
          }
        } else {
          const errorText = await multiEntityResponse.text()
          console.warn('⚠️ [MULTI-ENTITY] API returned non-OK status:', multiEntityResponse.status, errorText)
        }
      } catch (multiError) {
        console.warn('⚠️ [MULTI-ENTITY] Extraction failed, falling back to chat:', multiError)
      }
      
      // FALLBACK: Use regular chat endpoint
      console.log('💬 [FALLBACK] Using regular chat endpoint...')
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          userData: data,
          conversationHistory: messages
        })
      })

      if (!response.ok) {
        throw new Error('API call failed')
      }

      const result = await response.json()
      
      console.log('📥 AI API Response:', result)
      console.log('📊 Visualization data:', result.visualization ? 'present' : 'none')
      
      // If data was saved, trigger reload of DataProvider
      if (result.triggerReload || result.saved) {
        console.log('💾 Data was saved! Triggering reload...')
        console.log('📊 Action:', result.action)
        if (typeof window !== 'undefined') {
          // ✅ FIXED: Wait for Supabase to commit BEFORE dispatching event
          await new Promise(resolve => setTimeout(resolve, 800))
          window.dispatchEvent(new CustomEvent('ai-assistant-saved'))
          console.log('✅ Dispatched ai-assistant-saved event')
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
      
      // Handle navigation commands
      if (result.navigate) {
        console.log('🧭 AI requesting navigation to:', result.navigate.path)
        setTimeout(() => {
          window.location.href = result.navigate.path
        }, 500)
      }

      // Handle open tool commands
      if (result.openTool) {
        console.log('🔧 AI requesting to open tool:', result.openTool.path)
        setTimeout(() => {
          window.location.href = result.openTool.path
        }, 500)
      }
      
      return { 
        message: result.message || result.response || 'I received your message but had trouble generating a response. Please try again.',
        visualization: result.visualization
      }
    } catch (error: any) {
      console.error('AI API Error:', error)
      // Clear “offline mode” language and surface a clear auth/network hint
      const totalDomains = Object.keys(data).length
      const totalEntries = Object.values(data).reduce(
        (sum, items: any) => sum + (Array.isArray(items) ? items.length : 0),
        0
      )

      const errorHint = error?.message ? ` Details: ${error.message}` : ''
      return {
        message: `I couldn't reach the AI service while processing "${question}". I see ${totalDomains} domains with ${totalEntries} entries. Please make sure you're signed in and online, then try again.${errorHint}`
      }
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    
    // Check if this is a document retrieval request
    const lowerInput = currentInput.toLowerCase()
    const isDocumentRequest = 
      lowerInput.includes('pull up') ||
      lowerInput.includes('show me') ||
      lowerInput.includes('find') ||
      lowerInput.includes('open') ||
      lowerInput.includes('display') ||
      lowerInput.includes('retrieve') ||
      lowerInput.includes('fetch') ||
      lowerInput.includes('grab') ||
      lowerInput.includes('bring up') ||
      lowerInput.includes('look up') ||
      (lowerInput.includes('get') && (lowerInput.includes('document') || lowerInput.includes('file') || lowerInput.includes('license') || lowerInput.includes('insurance') || lowerInput.includes('registration') || lowerInput.includes('card')))
    
    if (isDocumentRequest && !lowerInput.includes('data') && !lowerInput.includes('info')) {
      // Handle document retrieval
      setIsSearchingDocuments(true)
      setIsTyping(true)
      
      try {
        // Extract search query (remove action words and conversational phrases)
        const query = currentInput
          .replace(/can you /gi, '')
          .replace(/could you /gi, '')
          .replace(/please /gi, '')
          .replace(/i need /gi, '')
          .replace(/i want /gi, '')
          .replace(/pull up/gi, '')
          .replace(/show me/gi, '')
          .replace(/find/gi, '')
          .replace(/open/gi, '')
          .replace(/display/gi, '')
          .replace(/retrieve/gi, '')
          .replace(/fetch/gi, '')
          .replace(/grab/gi, '')
          .replace(/bring up/gi, '')
          .replace(/look up/gi, '')
          .replace(/get/gi, '')
          .replace(/my /gi, '')
          .replace(/the /gi, '')
          .replace(/for /gi, '')
          .replace(/\s+and\s+/gi, ', ') // Convert "and" to commas for better search
          .replace(/\s{2,}/g, ' ') // Clean up multiple spaces
          .trim()
        
        console.log('🔍 Document search query:', query)
        
        const result = await retrieveDocuments({ query })
        
        const aiMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: result.message,
          timestamp: new Date(),
          documents: result.success && result.documents.length > 0 ? result.documents : undefined
        }
        setMessages(prev => [...prev, aiMessage])
        
        // Also open documents in new tabs if found
        if (result.success && result.documents.length > 0) {
          console.log(`📄 Opening ${result.documents.length} document(s)`)
          result.documents.forEach((doc: any, index: number) => {
            setTimeout(() => {
              window.open(doc.url, '_blank')
              console.log(`✅ Opened: ${doc.name || doc.document_name}`)
            }, index * 300) // Stagger by 300ms to avoid popup blockers
          })
        }
      } catch (error: any) {
        const errorMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Sorry, I encountered an error searching for documents: ${error.message}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsSearchingDocuments(false)
        setIsTyping(false)
      }
      return
    }
    
    // Regular AI conversation
    setIsTyping(true)

    try {
      const aiResponse = await generateAIResponse(currentInput)
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date(),
        visualization: aiResponse.visualization
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedImage(reader.result as string)
      // Automatically analyze the image
      analyzeImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzingImage(true)
    
    // Add user message showing the image
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: '📷 [Image uploaded for analysis]',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/ai-assistant/analyze-image', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        // Show AI response with extracted data
        const aiMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: result.message || `✅ ${result.data.description}\n\n${result.data.confirmationMessage}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error(result.error || 'Failed to analyze image')
      }
    } catch (error: any) {
      console.error('Image analysis error:', error)
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `❌ Sorry, I couldn't analyze the image: ${error.message}. Please try again or describe what's in the image.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAnalyzingImage(false)
      setUploadedImage(null)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerImageUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] sm:h-[85vh] p-0 bg-black text-white border-cyan-500/30 flex flex-col" aria-describedby="ai-assistant-description">
        <DialogHeader className="sr-only">
          <DialogTitle>AI Assistant</DialogTitle>
          <DialogDescription id="ai-assistant-description">
            Intelligent assistant for managing your life domains and tasks
          </DialogDescription>
        </DialogHeader>
        {/* Header */}
        <div className="flex-shrink-0 p-3 sm:p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 sm:h-7 sm:w-7 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">AI Assistant</h2>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMessages([{
                    id: '1',
                    type: 'ai',
                    content: "Hello! I'm your AI Assistant - I can do **EVERYTHING** in your app! 🚀\n\n✨ **Log multiple things at once:**\n• \"spent $45 on groceries, walked 30 minutes, drank 20 oz water\"\n• \"ran 5 miles, blood pressure 120/80, ate 450 calories\"\n\n✅ **Manage Tasks:**\n• \"add task buy groceries\"\n• \"mark buy milk as done\"\n• \"finished the project report\"\n\n🏃 **Track Habits:**\n• \"add habit exercise daily\"\n• \"did my meditation habit\"\n• \"completed workout today\"\n\n📔 **Write Journal Entries:**\n• \"journal: Today was amazing. I finally...\"\n• \"write in my journal about my progress\"\n\n💰 **Bills & Finance:**\n• \"add bill Netflix $15.99 monthly\"\n• \"spent $50 on dinner\"\n\n📅 **Calendar Events:**\n• \"add to google calendar meeting tomorrow at 3pm\"\n\n📊 **Visualizations:**\n• \"show me a chart of my expenses\"\n\n🧭 **Navigation:**\n• \"go to health page\"\n• \"open BMI calculator\"\n\nWhat can I help you with?",
                    timestamp: new Date()
                  }])
                  setInput('')
                }}
                className="text-xs hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all hidden sm:flex"
              >
                🗑️ Clear Chat
              </Button>
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50 px-2 sm:px-3 py-1">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-1 sm:mr-2" />
                <span className="text-xs">Online</span>
              </Badge>
            </div>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">
            Get intelligent insights and assistance for your life management journey
          </p>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 grid grid-cols-3 gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-4 border-b border-gray-800">
          <Button
            variant={activeTab === 'chat' ? 'default' : 'ghost'}
            className={`justify-center text-xs sm:text-sm ${activeTab === 'chat' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Chat</span>
          </Button>
          <Button
            variant={activeTab === 'insights' ? 'default' : 'ghost'}
            className={`justify-center text-xs sm:text-sm ${activeTab === 'insights' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('insights')}
          >
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Insights</span>
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            className={`justify-center text-xs sm:text-sm ${activeTab === 'settings' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 sm:p-4 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-cyan-500/10 border border-cyan-500/30 ml-4 sm:ml-12'
                          : 'bg-gray-900 border border-gray-800 mr-4 sm:mr-12'
                      }`}
                    >
                      <p className="text-sm text-gray-100 whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Visualization Chart */}
                      {message.visualization && message.type === 'ai' && (
                        <div className="mt-4 p-4 bg-gray-950 rounded-lg border border-cyan-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="h-4 w-4 text-cyan-400" />
                            <h4 className="text-sm font-semibold text-cyan-300">{message.visualization.title}</h4>
                          </div>
                          {renderVisualization(message.visualization)}
                        </div>
                      )}
                      
                      {/* Document Cards - LARGE SIZE */}
                      {message.documents && message.documents.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {message.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer group"
                              onClick={() => window.open(doc.url, '_blank')}
                            >
                              {/* Large Document Preview */}
                              <div className="relative w-full h-80 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center overflow-hidden">
                                {doc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <img 
                                    src={doc.url} 
                                    alt={doc.name}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="text-center">
                                    <svg className="w-20 h-20 text-cyan-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-gray-400 text-sm">PDF Document</p>
                                    <p className="text-gray-500 text-xs mt-1">Click to open</p>
                                  </div>
                                )}
                                
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-cyan-500 rounded-full p-4">
                                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Document Info Bar */}
                              <div className="p-4 bg-gray-800/80 backdrop-blur">
                                <h4 className="text-base font-semibold text-white mb-1">{doc.name}</h4>
                                <p className="text-sm text-gray-400 mb-3">{doc.type}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
                                    📁 {doc.category}
                                  </span>
                                  {doc.expirationDate && (
                                    <span className="text-sm px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                                      ⏰ Expires: {new Date(doc.expirationDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  <span className="text-sm px-3 py-1 bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
                                    👆 Click to open full size
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        {format(message.timestamp, 'h:mm:ss a')}
                      </p>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg mr-12">
                      <p className="text-sm text-gray-400">AI is typing...</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

              {/* Input Area - Fixed at Bottom */}
              <div className="flex-shrink-0 p-3 sm:p-6 border-t border-gray-800 bg-black">
                {/* Voice Transcript Display */}
                {(isListening || interimTranscript) && (
                  <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="text-xs text-blue-400 mb-1 flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" />
                      <span>Listening - Speak now...</span>
                    </div>
                    {interimTranscript && (
                      <div className="text-sm text-white font-medium">
                        {interimTranscript}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask me anything about your life data... (e.g., 'retrieve my license and insurance for my car')"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 min-h-[100px] sm:min-h-[140px] max-h-[180px] sm:max-h-[200px] bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 resize-none text-base"
                  />
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <Button
                      onClick={triggerImageUpload}
                      disabled={isAnalyzingImage}
                      className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg ${
                        isAnalyzingImage 
                          ? 'bg-purple-500 hover:bg-purple-600 animate-pulse text-white' 
                          : 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300'
                      }`}
                      title="Upload photo to scan"
                    >
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <Button
                      onClick={toggleVoiceInput}
                      className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg ${
                        isListening 
                          ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white' 
                          : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300'
                      }`}
                      title={isListening ? 'Stop listening' : 'Start voice input'}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isTyping}
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send message"
                    >
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </>
          )}

            {/* INSIGHTS TAB */}
            {activeTab === 'insights' && (
              <div className="p-3 sm:p-6 space-y-2 sm:space-y-3 overflow-y-auto h-full">
                {/* Quick Insights */}
                <div 
                  className="bg-gray-900 border border-gray-800 rounded-lg p-3 sm:p-4 hover:border-cyan-500/30 transition-colors cursor-pointer"
                  onClick={() => handleInsightClick('quick')}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold mb-1">Quick Insights</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">AI-generated summaries of your recent activities</p>
                    </div>
                  </div>
                </div>

                {/* Trends */}
                <div 
                  className="bg-gray-900 border border-gray-800 rounded-lg p-3 sm:p-4 hover:border-cyan-500/30 transition-colors cursor-pointer"
                  onClick={() => handleInsightClick('trends')}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold mb-1">Trends</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">Patterns and insights from your data</p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div 
                  className="bg-gray-900 border border-gray-800 rounded-lg p-3 sm:p-4 hover:border-cyan-500/30 transition-colors cursor-pointer"
                  onClick={() => handleInsightClick('recommendations')}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Target className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold mb-1">Recommendations</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">Personalized suggestions for improvement</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="p-3 sm:p-6 overflow-y-auto flex-1">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">AI Preferences</h3>
              
              <div className="space-y-4">
                {/* Voice Input */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-gray-200">Voice Input</span>
                  <Switch
                    checked={voiceInput}
                    onCheckedChange={setVoiceInput}
                  />
                </div>

                {/* Auto Suggestions */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-gray-200">Auto Suggestions</span>
                  <Switch
                    checked={autoSuggestions}
                    onCheckedChange={setAutoSuggestions}
                  />
                </div>

                {/* Data Analysis */}
                <div className="flex items-center justify-between py-4">
                  <span className="text-gray-200">Data Analysis</span>
                  <Switch
                    checked={dataAnalysis}
                    onCheckedChange={setDataAnalysis}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </DialogContent>
    </Dialog>
    
    {/* Multi-Document Viewer */}
    <MultiDocumentViewer
      documents={viewerDocuments}
      open={!!viewerDocuments}
      onClose={() => setViewerDocuments(null)}
    />
  </>
  )
}

