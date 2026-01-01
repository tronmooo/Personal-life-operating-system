'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { MessageSquare, Sparkles, Settings, Lightbulb, TrendingUp, Target, X, Mic, MicOff, Send, Camera, Image as ImageIcon, BarChart3, FileText, ScanLine } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { format } from 'date-fns'
import { MultiDocumentViewer } from '@/components/documents/multi-document-viewer'
import { retrieveDocuments } from '@/lib/ai/document-retrieval-function'
import { SmartScannerMenu } from '@/components/ai/smart-scanner-menu'
import { type ScanCategory, getScanOption } from '@/lib/ai/smart-document-classifier'
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
      content: "Hey! 👋 I'm your **personal AI assistant** with full access to your life data.\n\n**💬 Ask me anything:**\n• \"How am I doing this month?\"\n• \"What's my average spending?\"\n• \"Am I making progress on my health?\"\n• \"What should I focus on?\"\n\n**📷 Scan documents:**\nTap the camera to scan receipts, bills, IDs, or any document - I'll extract and save the data automatically!\n\n**🎯 Quick actions:**\n• \"I spent $45 on groceries\"\n• \"Add task: call dentist tomorrow\"\n• \"Show me my insurance card\"\n\nWhat's on your mind?",
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
  const [scanMode, setScanMode] = useState<ScanCategory>('general')
  const [showScannerMenu, setShowScannerMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
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
    // Each prompt is specifically worded to trigger different analysis types
    const prompts = {
      quick: '[QUICK_INSIGHTS] Give me a brief 3-bullet summary of my most important recent activities and any urgent items I should address today',
      trends: '[TREND_ANALYSIS] Analyze the trends in my data over the past month. Show me what metrics are increasing vs decreasing, and identify any correlations between different life domains',
      recommendations: '[RECOMMENDATIONS_ONLY] Based on my data patterns, give me 5 specific actionable recommendations to improve my life. Focus only on suggestions, not analysis'
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
      
      // Handle confirmation requests (smart CRUD)
      if (result.requiresConfirmation) {
        console.log('⚠️ AI requesting confirmation:', result.message)
        // Return the confirmation message with options
        // The UI will display this and let user choose
        return {
          message: result.message,
          requiresConfirmation: true,
          options: result.options,
          pendingAction: result.pendingAction
        }
      }
      
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
    
    const lowerInput = currentInput.toLowerCase()
    
    // Detect multiple intents - check for BOTH data logging AND document retrieval
    const documentKeywords = ['pull up', 'show me', 'open up', 'open my', 'display', 'retrieve', 'fetch', 'grab', 'bring up', 'look up']
    const hasDocumentRequest = documentKeywords.some(kw => lowerInput.includes(kw)) ||
      (lowerInput.includes('open') && (lowerInput.includes('card') || lowerInput.includes('license') || lowerInput.includes('insurance') || lowerInput.includes('document')))
    
    // Check for data logging patterns (eating, spending, exercise, etc.)
    const dataLoggingPatterns = [
      /i (ate|had|eaten|consumed|drank)/i,
      /i (spent|paid|bought|purchased)/i,
      /i (walked|ran|exercised|worked out|lifted)/i,
      /i (weigh|weight is|blood pressure|heart rate)/i,
      /(spent|paid) \$?\d+/i,
      /\d+ (calories|oz|ounces|cups|ml|liters|minutes|hours|miles|km|steps)/i,
    ]
    const hasDataLogging = dataLoggingPatterns.some(pattern => pattern.test(currentInput))
    
    // If message has BOTH intents, handle them separately
    if (hasDataLogging && hasDocumentRequest) {
      console.log('🔄 Multi-intent detected: Data logging + Document retrieval')
      setIsTyping(true)
      
      // Split the message at "and" to separate the intents
      // Find where the document request starts
      let dataLoggingPart = currentInput
      let documentPart = ''
      
      for (const kw of documentKeywords) {
        const kwIndex = lowerInput.indexOf(kw)
        if (kwIndex > 0) {
          // Look for "and" before the keyword
          const beforeKw = lowerInput.substring(0, kwIndex)
          const andIndex = beforeKw.lastIndexOf(' and ')
          if (andIndex > 0) {
            dataLoggingPart = currentInput.substring(0, andIndex).trim()
            documentPart = currentInput.substring(andIndex + 5).trim()
          } else {
            dataLoggingPart = currentInput.substring(0, kwIndex).trim()
            documentPart = currentInput.substring(kwIndex).trim()
          }
          break
        }
      }
      
      console.log('📝 Data logging part:', dataLoggingPart)
      console.log('📄 Document part:', documentPart)
      
      let combinedResponse = ''
      let documents: any[] = []
      
      // 1. First, handle data logging
      try {
        const dataResponse = await generateAIResponse(dataLoggingPart)
        combinedResponse += dataResponse.message
      } catch (error) {
        combinedResponse += '⚠️ Could not log the data. '
      }
      
      // 2. Then, handle document retrieval
      if (documentPart) {
        try {
          const docQuery = documentPart
            .replace(/can you /gi, '')
            .replace(/could you /gi, '')
            .replace(/please /gi, '')
            .replace(/pull up /gi, '')
            .replace(/open up /gi, '')
            .replace(/open /gi, '')
            .replace(/show me /gi, '')
            .replace(/bring up /gi, '')
            .replace(/\bmy\b/gi, '')
            .replace(/\bthe\b/gi, '')
            .replace(/\s{2,}/g, ' ')
            .trim()
          
          console.log('🔍 Document search query:', docQuery)
          const docResult = await retrieveDocuments({ query: docQuery })
          
          if (docResult.success && docResult.documents.length > 0) {
            combinedResponse += `\n\n${docResult.message}`
            documents = docResult.documents
            
            // Open documents
            docResult.documents.forEach((doc: any, index: number) => {
              setTimeout(() => {
                window.open(doc.url, '_blank')
              }, index * 300)
            })
          } else {
            combinedResponse += `\n\n${docResult.message}`
          }
        } catch (error) {
          combinedResponse += '\n\n⚠️ Could not retrieve the document.'
        }
      }
      
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: combinedResponse,
        timestamp: new Date(),
        documents: documents.length > 0 ? documents : undefined
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
      return
    }
    
    // Check if this is ONLY a document retrieval request
    if (hasDocumentRequest && !hasDataLogging) {
      // Handle document retrieval only
      setIsSearchingDocuments(true)
      setIsTyping(true)
      
      try {
        // Extract search query (remove action words and conversational phrases)
        const query = currentInput
          .replace(/can you /gi, '')
          .replace(/could you /gi, '')
          .replace(/would you /gi, '')
          .replace(/please /gi, '')
          .replace(/i need /gi, '')
          .replace(/i want /gi, '')
          .replace(/i'd like /gi, '')
          .replace(/pull up /gi, '')
          .replace(/open up /gi, '')
          .replace(/bring up /gi, '')
          .replace(/look up /gi, '')
          .replace(/show me /gi, '')
          .replace(/find me /gi, '')
          .replace(/get me /gi, '')
          .replace(/give me /gi, '')
          .replace(/show /gi, '')
          .replace(/find /gi, '')
          .replace(/open /gi, '')
          .replace(/display /gi, '')
          .replace(/retrieve /gi, '')
          .replace(/fetch /gi, '')
          .replace(/grab /gi, '')
          .replace(/get /gi, '')
          .replace(/^up /gi, '')
          .replace(/ up$/gi, '')
          .replace(/\bmy\b/gi, '')
          .replace(/\bthe\b/gi, '')
          .replace(/\bfor\b/gi, '')
          .replace(/\ba\b/gi, '')
          .replace(/\ban\b/gi, '')
          .replace(/\s+and\s+/gi, ', ')
          .replace(/\s{2,}/g, ' ')
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
        
        // Open documents in new tabs if found
        if (result.success && result.documents.length > 0) {
          console.log(`📄 Opening ${result.documents.length} document(s)`)
          result.documents.forEach((doc: any, index: number) => {
            setTimeout(() => {
              window.open(doc.url, '_blank')
              console.log(`✅ Opened: ${doc.name || doc.document_name}`)
            }, index * 300)
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
    
    // Regular AI conversation (data logging, questions, etc.)
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
    
    // Custom user message based on scan mode - use dynamic labels from classifier
    const scanOption = getScanOption(scanMode)
    const scanLabel = scanOption 
      ? `${scanOption.icon} [Scanning ${scanOption.label.toLowerCase()}]`
      : '📷 [Image uploaded for analysis]'
    
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: scanLabel,
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
        body: JSON.stringify({ 
          image: imageData,
          scanMode: scanMode  // Pass scan mode to API
        }),
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
      setScanMode('general')  // Reset scan mode
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerImageUpload = () => {
    fileInputRef.current?.click()
  }

  const triggerCameraCapture = () => {
    cameraInputRef.current?.click()
  }

  // Handle scan selection from the menu
  const handleScanSelect = (category: ScanCategory, method: 'camera' | 'upload') => {
    setScanMode(category)
    if (method === 'camera') {
      triggerCameraCapture()
    } else {
      triggerImageUpload()
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] h-[85vh] sm:h-[80vh] p-0 bg-gradient-to-b from-gray-950 to-gray-900 text-white border-0 rounded-3xl shadow-2xl shadow-cyan-500/10 flex flex-col overflow-hidden" aria-describedby="ai-assistant-description">
        <DialogHeader className="sr-only">
          <DialogTitle>AI Assistant</DialogTitle>
          <DialogDescription id="ai-assistant-description">
            Intelligent assistant for managing your life domains and tasks
          </DialogDescription>
        </DialogHeader>
        
        {/* Compact Header */}
        <div className="flex-shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-gray-950" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold tracking-tight">LifeHub AI</h2>
                <p className="text-xs text-gray-400">Always ready to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMessages([{
                    id: '1',
                    type: 'ai',
                    content: "Hey there! 👋 I'm your AI assistant. Just talk to me naturally - I can help you with pretty much anything!\n\nTry saying things like:\n• \"I spent $45 on groceries and walked 30 mins\"\n• \"Show me my insurance documents\"\n• \"Add a task to call mom tomorrow\"\n• \"How much did I spend this month?\"\n\nWhat's on your mind?",
                    timestamp: new Date()
                  }])
                  setInput('')
                }}
                className="h-8 px-3 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl"
              >
                Clear
              </Button>
              <button
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Pills - More compact */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-gray-900/50">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === 'chat' ? 'bg-cyan-500/20 text-cyan-300 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === 'insights' ? 'bg-purple-500/20 text-purple-300 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
            onClick={() => setActiveTab('insights')}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Insights
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === 'settings' ? 'bg-gray-500/20 text-gray-300 shadow-inner' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <>
              {/* Messages - Conversational Style */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2.5 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                            : 'bg-gradient-to-br from-cyan-400 to-emerald-400'
                        }`}>
                          {message.type === 'user' ? (
                            <span className="text-xs font-medium text-white">You</span>
                          ) : (
                            <Sparkles className="h-4 w-4 text-white" />
                          )}
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl ${
                            message.type === 'user'
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-tr-sm'
                              : 'bg-gray-800/80 text-gray-100 rounded-tl-sm border border-gray-700/50'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>
                          
                          {/* Visualization Chart */}
                          {message.visualization && message.type === 'ai' && (
                            <div className="mt-3 p-4 bg-gray-900/80 rounded-2xl border border-gray-700/50 w-full">
                              <div className="flex items-center gap-2 mb-3">
                                <BarChart3 className="h-4 w-4 text-cyan-400" />
                                <h4 className="text-sm font-medium text-cyan-300">{message.visualization.title}</h4>
                              </div>
                              {renderVisualization(message.visualization)}
                            </div>
                          )}
                          
                          {/* Document Cards - Compact Style */}
                          {message.documents && message.documents.length > 0 && (
                            <div className="mt-3 space-y-2 w-full">
                              {message.documents.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer group"
                                  onClick={() => window.open(doc.url, '_blank')}
                                >
                                  <div className="flex items-center gap-3 p-3">
                                    {/* Thumbnail */}
                                    <div className="flex-shrink-0 h-16 w-16 rounded-lg bg-gray-900 flex items-center justify-center overflow-hidden">
                                      {doc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <img 
                                          src={doc.url} 
                                          alt={doc.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <svg className="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      )}
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-white truncate">{doc.name}</h4>
                                      <p className="text-xs text-gray-400 mt-0.5">{doc.type}</p>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full">
                                          {doc.category}
                                        </span>
                                        {doc.expirationDate && (
                                          <span className="text-xs text-amber-400">
                                            Exp: {new Date(doc.expirationDate).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Open Icon */}
                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <p className="text-[10px] text-gray-500 mt-1 px-1">
                            {format(message.timestamp, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex gap-2.5">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-gray-800/80 border border-gray-700/50 px-4 py-3 rounded-2xl rounded-tl-sm">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

              {/* Input Area - Modern Floating Style */}
              <div className="flex-shrink-0 p-3 sm:p-4 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent">
                {/* Voice Transcript Display */}
                {(isListening || interimTranscript) && (
                  <div className="mb-3 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs text-red-300 font-medium">Listening...</span>
                      {interimTranscript && (
                        <span className="text-sm text-white ml-2">{interimTranscript}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-2">
                  {/* Action Buttons - Horizontal */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowScannerMenu(true)}
                      disabled={isAnalyzingImage}
                      className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all ${
                        isAnalyzingImage 
                          ? 'bg-purple-500 text-white animate-pulse' 
                          : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                      }`}
                      title="Scan document"
                    >
                      <ScanLine className="h-5 w-5" />
                    </button>
                    <button
                      onClick={toggleVoiceInput}
                      className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all ${
                        isListening 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                      }`}
                      title={isListening ? 'Stop listening' : 'Start voice input'}
                    >
                      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Text Input */}
                  <Textarea
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 min-h-[40px] max-h-[120px] bg-transparent border-0 text-white placeholder:text-gray-500 resize-none text-sm focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 py-2"
                    rows={1}
                  />
                  
                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all ${
                      input.trim() && !isTyping
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30'
                        : 'text-gray-500 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Quick Action Pills */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                  <button 
                    onClick={() => setInput('How am I doing this month?')}
                    className="text-[10px] px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                  >
                    Progress
                  </button>
                  <button 
                    onClick={() => setInput("What's my total spending this week?")}
                    className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    Spending
                  </button>
                </div>
                
                {/* Hidden file input for upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {/* Hidden file input for camera capture */}
                <input
                  ref={cameraInputRef}
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
              <div className="p-4 sm:p-5 space-y-3 overflow-y-auto h-full">
                {/* Quick Insights */}
                <button 
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-left group"
                  onClick={() => handleInsightClick('quick')}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold mb-0.5 group-hover:text-amber-300 transition-colors">Quick Insights</h3>
                      <p className="text-gray-400 text-xs">AI summaries of your recent activities</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Trends */}
                <button 
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left group"
                  onClick={() => handleInsightClick('trends')}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold mb-0.5 group-hover:text-blue-300 transition-colors">Trends & Patterns</h3>
                      <p className="text-gray-400 text-xs">Discover patterns in your data</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Recommendations */}
                <button 
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-left group"
                  onClick={() => handleInsightClick('recommendations')}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold mb-0.5 group-hover:text-purple-300 transition-colors">Recommendations</h3>
                      <p className="text-gray-400 text-xs">Personalized suggestions for you</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                
              </div>
            )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <h3 className="text-base font-semibold mb-4">Preferences</h3>
              
              <div className="space-y-1">
                {/* Voice Input */}
                <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-800/30 transition-colors">
                  <div>
                    <span className="text-sm text-gray-200">Voice Input</span>
                    <p className="text-xs text-gray-500">Use microphone for input</p>
                  </div>
                  <Switch
                    checked={voiceInput}
                    onCheckedChange={setVoiceInput}
                  />
                </div>

                {/* Auto Suggestions */}
                <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-800/30 transition-colors">
                  <div>
                    <span className="text-sm text-gray-200">Auto Suggestions</span>
                    <p className="text-xs text-gray-500">Show smart suggestions</p>
                  </div>
                  <Switch
                    checked={autoSuggestions}
                    onCheckedChange={setAutoSuggestions}
                  />
                </div>

                {/* Data Analysis */}
                <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-800/30 transition-colors">
                  <div>
                    <span className="text-sm text-gray-200">Data Analysis</span>
                    <p className="text-xs text-gray-500">AI analyzes your data</p>
                  </div>
                  <Switch
                    checked={dataAnalysis}
                    onCheckedChange={setDataAnalysis}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Multi-Document Viewer */}
    {/* Smart Scanner Menu */}
    <SmartScannerMenu
      open={showScannerMenu}
      onOpenChange={setShowScannerMenu}
      onScanSelect={handleScanSelect}
    />

    <MultiDocumentViewer
      documents={viewerDocuments}
      open={!!viewerDocuments}
      onClose={() => setViewerDocuments(null)}
    />
  </>
  )
}

