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
  Smile, Send, Heart, Moon, Sun, Cloud, Wind, Leaf,
  ArrowLeft, MessageSquare, Mic, Loader2, Sparkles,
  Play, Pause, Volume2, BookOpen, Feather, Eye
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface MoodEntry {
  mood: string
  emoji: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  "Guide me through a breathing exercise",
  "I'm feeling anxious - help me calm down",
  "Give me a mindfulness meditation",
  "How do I practice gratitude?",
  "I need help sleeping tonight",
  "Help me process my emotions"
]

const COACH_INTRO = `Hello, I'm Serenity, your Mindfulness Coach. 🧘‍♀️

I'm here to help you find peace and balance:
• **Meditation** - Guided sessions for any moment
• **Breathing** - Calming techniques for stress relief
• **Emotional Support** - Process feelings with compassion
• **Gratitude** - Cultivate appreciation and joy
• **Sleep** - Peaceful practices for rest

Take a deep breath... How can I support your wellbeing today?`

const MOOD_OPTIONS = [
  { mood: 'Great', emoji: '😊', color: 'bg-green-100 border-green-300 text-green-700' },
  { mood: 'Good', emoji: '🙂', color: 'bg-blue-100 border-blue-300 text-blue-700' },
  { mood: 'Okay', emoji: '😐', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { mood: 'Low', emoji: '😔', color: 'bg-orange-100 border-orange-300 text-orange-700' },
  { mood: 'Stressed', emoji: '😰', color: 'bg-red-100 border-red-300 text-red-700' }
]

const BREATHING_EXERCISES = [
  { name: '4-7-8 Breathing', inhale: 4, hold: 7, exhale: 8, description: 'For relaxation' },
  { name: 'Box Breathing', inhale: 4, hold: 4, exhale: 4, description: 'For focus' },
  { name: 'Calming Breath', inhale: 4, hold: 2, exhale: 6, description: 'For anxiety' }
]

export default function MindfulnessCoachPage() {
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
  const [currentMood, setCurrentMood] = useState<string | null>(null)
  const [mindfulnessStreak, setMindfulnessStreak] = useState(0)
  const [isBreathing, setIsBreathing] = useState(false)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [breathCount, setBreathCount] = useState(0)
  const [selectedExercise, setSelectedExercise] = useState(BREATHING_EXERCISES[0])
  const breathRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Calculate mindfulness data
  useEffect(() => {
    const mindfulnessData = (data.mindfulness || []) as any[]
    setMindfulnessStreak(mindfulnessData.length > 0 ? Math.min(mindfulnessData.length, 30) : 0)
  }, [data])

  // Breathing exercise logic
  useEffect(() => {
    if (isBreathing) {
      let phase: 'inhale' | 'hold' | 'exhale' = 'inhale'
      let time = 0
      
      const runBreathCycle = () => {
        if (phase === 'inhale' && time >= selectedExercise.inhale) {
          phase = 'hold'
          time = 0
        } else if (phase === 'hold' && time >= selectedExercise.hold) {
          phase = 'exhale'
          time = 0
        } else if (phase === 'exhale' && time >= selectedExercise.exhale) {
          phase = 'inhale'
          time = 0
          setBreathCount(prev => prev + 1)
        }
        
        setBreathPhase(phase)
        time++
      }

      breathRef.current = setInterval(runBreathCycle, 1000)

      return () => {
        if (breathRef.current) clearInterval(breathRef.current)
      }
    }
  }, [isBreathing, selectedExercise])

  // Log mood
  const logMood = (mood: string) => {
    setCurrentMood(mood)
    const moodMessage = `I'm feeling ${mood.toLowerCase()} right now.`
    setInput(moodMessage)
    setTimeout(() => handleSendMessage(), 100)
  }

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
      const response = await fetch('/api/ai-coaches/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachType: 'mindfulness-coach',
          message: currentInput,
          context: `Current mood logged: ${currentMood || 'Not logged yet'}
Mindfulness streak: ${mindfulnessStreak} days
Breathing sessions completed: ${breathCount}`,
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
        content: result.response || "Take a moment to breathe. I'm here whenever you're ready to share.",
        timestamp: new Date(),
        suggestions: generateMindfulnessSuggestions(currentInput)
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Let's take a calming moment together. Close your eyes, take three deep breaths - inhale peace, exhale tension. You're doing wonderfully. 🌸",
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const generateMindfulnessSuggestions = (userInput: string): string[] => {
    const lower = userInput.toLowerCase()
    
    if (lower.includes('anxi') || lower.includes('stress') || lower.includes('worry')) {
      return ['5-minute calming meditation', 'Grounding exercise', 'Body scan relaxation']
    }
    if (lower.includes('sleep') || lower.includes('tired') || lower.includes('rest')) {
      return ['Sleep meditation', 'Progressive relaxation', 'Bedtime gratitude practice']
    }
    if (lower.includes('sad') || lower.includes('down') || lower.includes('depress')) {
      return ['Self-compassion exercise', 'Loving-kindness meditation', 'Gratitude journaling']
    }
    if (lower.includes('angry') || lower.includes('frustrat')) {
      return ['Cooling breath technique', 'Mindful pause', 'Release tension meditation']
    }
    
    return ['Start a meditation', 'Practice gratitude', 'Mindful moment']
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

  const getBreathInstruction = () => {
    switch (breathPhase) {
      case 'inhale': return 'Breathe In...'
      case 'hold': return 'Hold...'
      case 'exhale': return 'Breathe Out...'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/30 dark:via-blue-950/30 dark:to-indigo-950/30">
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
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Smile className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-sky-600 dark:text-sky-400">SERENITY</p>
                  <h1 className="text-2xl md:text-3xl font-bold">Mindfulness Coach</h1>
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
            {/* Mood Check-in */}
            <Card className="border-2 border-sky-200 dark:border-sky-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-sky-500" />
                  How are you feeling?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {MOOD_OPTIONS.map(option => (
                    <Button
                      key={option.mood}
                      variant="outline"
                      className={`flex flex-col h-auto py-3 ${
                        currentMood === option.mood ? option.color : ''
                      }`}
                      onClick={() => logMood(option.mood)}
                    >
                      <span className="text-2xl mb-1">{option.emoji}</span>
                      <span className="text-xs">{option.mood}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Breathing Exercise */}
            <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wind className="h-5 w-5 text-indigo-500" />
                  Breathing Exercise
                </CardTitle>
                <CardDescription>{selectedExercise.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  {/* Animated breathing circle */}
                  <div className={`relative h-32 w-32 rounded-full border-4 border-indigo-300 flex items-center justify-center mb-4 transition-all duration-1000 ${
                    isBreathing 
                      ? breathPhase === 'inhale' 
                        ? 'scale-125 bg-indigo-100' 
                        : breathPhase === 'hold'
                        ? 'scale-125 bg-indigo-200'
                        : 'scale-100 bg-indigo-50'
                      : 'scale-100 bg-indigo-50'
                  }`}>
                    <span className={`text-indigo-600 font-medium transition-opacity ${isBreathing ? 'opacity-100' : 'opacity-50'}`}>
                      {isBreathing ? getBreathInstruction() : 'Start'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <Button
                      onClick={() => {
                        setIsBreathing(!isBreathing)
                        if (!isBreathing) setBreathCount(0)
                      }}
                      className={isBreathing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-500 hover:bg-indigo-600'}
                    >
                      {isBreathing ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                      {isBreathing ? 'Stop' : 'Start'}
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap justify-center">
                    {BREATHING_EXERCISES.map(exercise => (
                      <Badge
                        key={exercise.name}
                        variant={selectedExercise.name === exercise.name ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedExercise(exercise)
                          setIsBreathing(false)
                        }}
                      >
                        {exercise.name}
                      </Badge>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-3">
                    Breaths completed: {breathCount}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Mindfulness Stats */}
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Mindfulness Journey
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <p className="text-4xl font-bold text-purple-600">{mindfulnessStreak}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30">
                    <Sun className="h-6 w-6 text-sky-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Morning</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                    <Moon className="h-6 w-6 text-indigo-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Evening</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] md:h-[700px] flex flex-col border-2 border-sky-200 dark:border-sky-800">
              <CardHeader className="border-b bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/50 dark:to-indigo-950/50">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-sky-500" />
                  Chat with Serenity
                </CardTitle>
                <CardDescription>Your peaceful space for reflection and guidance</CardDescription>
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
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
                            <Smile className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-sky-600">Serenity</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-sky-600 text-white rounded-br-md'
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
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
                        <Smile className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                          <span className="text-sm text-muted-foreground">Serenity is reflecting...</span>
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
                    placeholder="Share your thoughts or ask for guidance..."
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
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Serenity is here to support your inner peace • Press Enter to send
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

