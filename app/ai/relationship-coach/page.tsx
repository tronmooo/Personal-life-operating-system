'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import {
  Users, Send, Heart, MessageCircle, UserPlus, Calendar,
  ArrowLeft, MessageSquare, Mic, Loader2, Sparkles,
  Gift, Phone, Mail, Star, Coffee, HandHeart
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface Relationship {
  id: string
  name: string
  type: 'family' | 'friend' | 'colleague' | 'partner' | 'other'
  lastContact?: string
  importance: 'high' | 'medium' | 'low'
}

const QUICK_PROMPTS = [
  "How do I improve communication?",
  "Help me reconnect with a friend",
  "Tips for resolving a conflict",
  "Plan a meaningful date night",
  "How to set healthy boundaries",
  "Strengthen my family relationships"
]

const COACH_INTRO = `Hello! I'm Harmony, your Relationship Coach. 💕

I'm here to help you nurture meaningful connections:
• **Communication** - Express yourself clearly and listen deeply
• **Conflict Resolution** - Navigate disagreements with grace
• **Connection** - Strengthen bonds with loved ones
• **Boundaries** - Create healthy relationship dynamics
• **Social Skills** - Build and maintain your network

Who would you like to focus on today, or what relationship challenge can I help with?`

const RELATIONSHIP_TIPS = [
  { icon: Phone, tip: "Schedule a call with someone you miss", category: "Connection" },
  { icon: Gift, tip: "Send a thoughtful message to brighten someone's day", category: "Appreciation" },
  { icon: Coffee, tip: "Plan a coffee date with a friend", category: "Quality Time" },
  { icon: MessageCircle, tip: "Practice active listening today", category: "Communication" }
]

export default function RelationshipCoachPage() {
  const { data } = useData()
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
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [connectionScore, setConnectionScore] = useState(0)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Calculate relationship data
  useEffect(() => {
    const relationshipsData = (data.relationships || []) as any[]
    
    const parsedRelationships: Relationship[] = relationshipsData.slice(0, 8).map((item: any, idx: number) => ({
      id: item.id || `rel-${idx}`,
      name: item.title || item.name || `Contact ${idx + 1}`,
      type: item.metadata?.type || item.type || 'friend',
      lastContact: item.metadata?.lastContact || item.lastContact,
      importance: item.metadata?.importance || 'medium'
    }))
    
    setRelationships(parsedRelationships)
    
    // Calculate connection score
    let score = 40
    if (parsedRelationships.length >= 10) score += 20
    else if (parsedRelationships.length >= 5) score += 10
    
    const recentContacts = parsedRelationships.filter(r => 
      r.lastContact && differenceInDays(new Date(), new Date(r.lastContact)) <= 7
    ).length
    if (recentContacts >= 3) score += 20
    else if (recentContacts >= 1) score += 10
    
    const highImportance = parsedRelationships.filter(r => r.importance === 'high').length
    if (highImportance >= 3) score += 10
    
    setConnectionScore(Math.min(100, score))
    setIsLoadingData(false)
  }, [data])

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
      const relationshipContext = relationships.length > 0 
        ? `Tracked relationships: ${relationships.map(r => `${r.name} (${r.type})`).join(', ')}`
        : 'No relationships tracked yet'
      
      const response = await fetch('/api/ai-coaches/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachType: 'relationship-coach',
          message: currentInput,
          context: `${relationshipContext}
Connection Score: ${connectionScore}/100`,
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
        content: result.response || "Relationships are at the heart of a fulfilling life. Tell me more about what's on your mind.",
        timestamp: new Date(),
        suggestions: generateRelationshipSuggestions(currentInput)
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Every relationship is unique and valuable. Here's a tip: Try sending a thoughtful message to someone you care about today - small gestures make a big difference! 💝",
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const generateRelationshipSuggestions = (userInput: string): string[] => {
    const lower = userInput.toLowerCase()
    
    if (lower.includes('conflict') || lower.includes('argument') || lower.includes('fight')) {
      return ['How to apologize sincerely', 'De-escalation techniques', 'When to take a break']
    }
    if (lower.includes('communicate') || lower.includes('talk') || lower.includes('listen')) {
      return ['Active listening tips', 'Express needs clearly', 'Non-violent communication']
    }
    if (lower.includes('partner') || lower.includes('spouse') || lower.includes('dating')) {
      return ['Quality time ideas', 'Love languages explained', 'Keeping the spark alive']
    }
    if (lower.includes('friend') || lower.includes('lonely') || lower.includes('connect')) {
      return ['Making new friends as an adult', 'Deepening friendships', 'Social activity ideas']
    }
    if (lower.includes('family') || lower.includes('parent') || lower.includes('sibling')) {
      return ['Family bonding activities', 'Generational communication', 'Setting family boundaries']
    }
    
    return ['Improve my social skills', 'Plan a gathering', 'Express appreciation']
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'family': return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'partner': return 'bg-pink-100 text-pink-700 border-pink-200'
      case 'friend': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'colleague': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-red-950/30">
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
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 flex items-center justify-center shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-pink-600 dark:text-pink-400">HARMONY</p>
                  <h1 className="text-2xl md:text-3xl font-bold">Relationship Coach</h1>
                </div>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Online
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Connection Score */}
            <Card className="border-2 border-pink-200 dark:border-pink-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Connection Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative h-28 w-28">
                    <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="url(#relGradient)" strokeWidth="8" strokeDasharray={`${connectionScore * 2.64} 264`} strokeLinecap="round" />
                      <defs>
                        <linearGradient id="relGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#f43f5e" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{connectionScore}</span>
                      <span className="text-xs text-muted-foreground">Score</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {connectionScore >= 70 ? '💕 Strong connections!' :
                   connectionScore >= 50 ? '🌱 Growing your circle' :
                   '🤝 Let\'s build connections'}
                </p>
              </CardContent>
            </Card>

            {/* People in Your Circle */}
            <Card className="border-2 border-rose-200 dark:border-rose-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5 text-rose-500" />
                  Your Circle
                </CardTitle>
                <CardDescription>People you're connected with</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoadingData ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : relationships.length > 0 ? (
                  relationships.slice(0, 5).map(rel => (
                    <div
                      key={rel.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-900 border"
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white font-medium">
                        {rel.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rel.name}</p>
                        <Badge variant="outline" className={`text-xs ${getTypeColor(rel.type)}`}>
                          {rel.type}
                        </Badge>
                      </div>
                      {rel.importance === 'high' && (
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start tracking your relationships</p>
                    <Link href="/domains/relationships">
                      <Button variant="link" size="sm">Add People</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Connection Tips */}
            <Card className="border-2 border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Connection Ideas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {RELATIONSHIP_TIPS.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                    <item.icon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{item.tip}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] md:h-[700px] flex flex-col border-2 border-pink-200 dark:border-pink-800">
              <CardHeader className="border-b bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-pink-500" />
                  Chat with Harmony
                </CardTitle>
                <CardDescription>Your relationship coaching session</CardDescription>
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
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-pink-600">Harmony</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-pink-600 text-white rounded-br-md'
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
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                          <span className="text-sm text-muted-foreground">Harmony is thinking...</span>
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
                    placeholder="Share about your relationships or ask for advice..."
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
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Harmony is here to help you nurture meaningful connections • Press Enter to send
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

