'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/lib/providers/data-provider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { BookOpen, MessageCircle, Dumbbell, Smile, Sparkles, Send, Save, History, ChevronDown, ChevronUp, RotateCcw, Lightbulb, Trash2, Loader2, Brain } from 'lucide-react'
import { BreathingExercises } from '@/components/mindfulness/breathing-exercises'
import { GuidedMeditations } from '@/components/mindfulness/guided-meditations'
import { DomainBackButton } from '@/components/ui/domain-back-button'
import { format } from 'date-fns'
import { toast } from 'sonner'

type Tab = 'journal' | 'chat' | 'exercise' | 'mood' | 'history'
type MoodLevel = 1 | 2 | 3 | 4 | 5

interface ChatMessage {
  role: 'ai' | 'user'
  text: string
}

interface JournalEntry {
  id: string
  timestamp: string
  journalEntry: string
  moodScore?: number
  aiInsight?: string
}

export function MindfulnessAppFull() {
  const router = useRouter()
  const { addData, getData, updateData, deleteData, reloadDomain } = useData()
  const [activeTab, setActiveTab] = useState<Tab>('journal')
  const [journalText, setJournalText] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: "Hello! I'm here to support you. How are you feeling today? Feel free to share what's on your mind." }
  ])
  const [chatInput, setChatInput] = useState('')
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)
  const [aiInsight, setAiInsight] = useState('')
  const [suggestedActions, setSuggestedActions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [moodHistory, setMoodHistory] = useState<any[]>([])
  const [journalHistory, setJournalHistory] = useState<JournalEntry[]>([])
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const [therapyThreadId, setTherapyThreadId] = useState<string | null>(null)
  const [journalPrompts, setJournalPrompts] = useState<string[]>([
    "What am I grateful for in this moment?",
    "What's one challenge I'm facing and how can I approach it?",
    "How am I feeling right now, and why?"
  ])
  const [loadingPrompts, setLoadingPrompts] = useState(false)
  const [quickReplyRotation, setQuickReplyRotation] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initial load with force reload to get fresh data
    loadMoodHistory()
    loadJournalHistory(true)
    
    // Listen for data updates (don't force reload on events - use cache)
    const handleDataUpdate = () => {
      console.log('📖 Data updated event fired, reloading...')
      loadMoodHistory()
      loadJournalHistory(false)
    }
    window.addEventListener('data-updated', handleDataUpdate)
    window.addEventListener('mindfulness-data-updated', handleDataUpdate)
    
    return () => {
      window.removeEventListener('data-updated', handleDataUpdate)
      window.removeEventListener('mindfulness-data-updated', handleDataUpdate)
    }
  }, [getData])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  const loadMoodHistory = async () => {
    try {
      // Load from DataProvider
      const mindfulnessData = getData('mindfulness') as any[]
      const moods = mindfulnessData.filter(item => 
        item.metadata?.type === 'mood' || 
        item.metadata?.logType === 'mood-checkin'
      )

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const recentMoods = moods.filter(m => 
        new Date(m.metadata?.date || m.createdAt) >= sevenDaysAgo
      )

      // Build history for last 7 days (starting from 6 days ago to today)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const history = []
      
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() - i)
        const dayOfWeek = targetDate.getDay() // 0-6, Sunday = 0
        const dayName = dayNames[dayOfWeek]
        const dateString = format(targetDate, 'yyyy-MM-dd')
        
        // Find mood data for this specific date
        const dayData = recentMoods.find(d => {
          const moodDate = d.metadata?.date || format(new Date(d.createdAt), 'yyyy-MM-dd')
          return moodDate === dateString
        })
        
        history.push({
          day: dayName,
          progress: dayData ? (Number(dayData.metadata?.moodScore || 0) / 10) * 100 : 0,
          mood: dayData ? getMoodEmoji(Number(dayData.metadata?.moodScore || 0)) : ''
        })
      }

      setMoodHistory(history)
      console.log('📊 Loaded mood history:', history)
    } catch (error) {
      console.error('Error loading mood history:', error)
    }
  }

  const loadJournalHistory = async (forceReload = false) => {
    try {
      console.log('📚 Loading journal history from DataProvider...')
      
      // Only force reload when explicitly requested (e.g., initial load)
      // For normal operations, use cached data for speed
      if (forceReload) {
        await reloadDomain('mindfulness')
      }
      
      // Load from DataProvider
      const mindfulnessData = getData('mindfulness')
      console.log('📦 Total mindfulness items:', mindfulnessData.length)
      
      if (!Array.isArray(mindfulnessData)) {
        console.warn('⚠️ mindfulnessData is not an array:', mindfulnessData)
        setJournalHistory([])
        return
      }

      // Filter for journal entries (exclude deleted ones)
      const journals = mindfulnessData
        .filter((item: any) => {
          if (!item || !item.metadata) return false
          
          // Exclude deleted entries
          if (item.metadata?.deleted) return false
          
          const isJournal = 
            item.metadata?.type === 'journal' || 
            item.metadata?.entryType === 'Journal' ||
            item.metadata?.logType === 'journal-entry'
          return isJournal
        })
        .map((item: any) => ({
          id: item.id,
          timestamp: item.metadata?.date || item.createdAt,
          journalEntry: item.metadata?.fullContent || item.description || '',
          moodScore: item.metadata?.moodValue || 5,
          aiInsight: item.metadata?.aiInsight || null
        }))
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50)
      
      console.log('📖 Journal entries loaded:', journals.length)
      
      setJournalHistory(journals)
    } catch (error) {
      console.error('❌ Error loading journal history:', error)
    }
  }

  const getMoodEmoji = (score: number) => {
    if (score <= 2) return '😢'
    if (score <= 4) return '😟'
    if (score <= 6) return '😐'
    if (score <= 8) return '🙂'
    return '😊'
  }

  const moodEmojis = [
    { level: 1, emoji: '😢', label: 'Very\nLow' },
    { level: 2, emoji: '😟', label: 'Low' },
    { level: 3, emoji: '😐', label: 'Neutral' },
    { level: 4, emoji: '🙂', label: 'Good' },
    { level: 5, emoji: '😊', label: 'Excellent' }
  ]

  const tabs = [
    { id: 'journal' as Tab, icon: BookOpen, label: 'Journal' },
    { id: 'chat' as Tab, icon: MessageCircle, label: 'Chat' },
    { id: 'exercise' as Tab, icon: Dumbbell, label: 'Exercise' },
    { id: 'mood' as Tab, icon: Smile, label: 'Mood' },
    { id: 'history' as Tab, icon: History, label: 'History' }
  ]

  // Save Journal - DIRECT TO DATABASE with optimistic updates
  const [isSavingJournal, setIsSavingJournal] = useState(false)
  
  const saveJournal = async () => {
    if (!journalText.trim()) {
      toast.error('Please write something first')
      return
    }

    if (isSavingJournal) return // Prevent double-click
    
    setIsSavingJournal(true)
    const savedText = journalText
    const savedInsight = aiInsight
    
    // OPTIMISTIC: Clear form immediately for instant feedback
    setJournalText('')
    setAiInsight('')
    setSuggestedActions([])
    toast.loading('Saving journal...', { id: 'save-journal' })
    
    // OPTIMISTIC: Add to local history immediately
    const optimisticEntry: JournalEntry = {
      id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      journalEntry: savedText,
      moodScore: 5,
      aiInsight: savedInsight || undefined
    }
    setJournalHistory(prev => [optimisticEntry, ...prev])

    try {
      console.log('💾 Saving journal entry...', {
        textLength: savedText.length,
        hasAiInsight: !!savedInsight
      })
      
      // Save to DataProvider (auto-syncs to Supabase)
      await addData('mindfulness', {
        title: `Journal Entry - ${new Date().toLocaleDateString()}`,
        description: savedText.substring(0, 200),
        metadata: {
          type: 'journal',
          entryType: 'Journal',
          logType: 'journal-entry',
          fullContent: savedText,
          wordCount: savedText.split(/\s+/).length,
          date: new Date().toISOString(),
          aiInsight: savedInsight || undefined
        }
      })

      console.log('✅ Journal saved to database')
      toast.success('Journal saved! ✨', { id: 'save-journal' })
      
      // Background reload - don't wait for it
      loadJournalHistory().catch(console.error)
    } catch (error) {
      console.error('❌ Error saving journal:', error)
      toast.error('Failed to save journal', { id: 'save-journal' })
      // Restore text on error
      setJournalText(savedText)
      setAiInsight(savedInsight)
      // Remove optimistic entry
      setJournalHistory(prev => prev.filter(e => e.id !== optimisticEntry.id))
    } finally {
      setIsSavingJournal(false)
    }
  }

  // AI Feedback for Journal - Using Journal Reflection Assistant
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const getAIFeedback = async () => {
    if (!journalText.trim()) {
      toast.error('Please write something first')
      return
    }

    if (isAnalyzing) return // Prevent double-click
    
    setIsAnalyzing(true)
    toast.loading('Analyzing your entry...', { id: 'ai-analysis' })
    
    try {
      console.log('🧠 Getting AI journal reflection insight...')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout
      
      const response = await fetch('/api/ai/journal-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: journalText }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const insight = data.insight || 'Thank you for sharing. Your feelings are valid.'
      const actions = data.suggestedActions || [
        '🧘 Try a 5-minute breathing exercise',
        '📖 Continue journaling',
        '🌱 Practice gratitude'
      ]
      console.log('✅ AI insight received:', insight)
      console.log('✅ Suggested actions:', actions)
      setAiInsight(insight)
      setSuggestedActions(actions)
      toast.success('Analysis complete! ✨', { id: 'ai-analysis' })
    } catch (error: any) {
      console.error('Error getting AI feedback:', error)
      
      // Provide helpful fallback insight
      const fallbackInsight = "I notice you're expressing important thoughts. Remember to be kind to yourself and take breaks when needed."
      const fallbackActions = [
        '🧘 Take a moment to breathe deeply',
        '💜 Be kind to yourself',
        '📝 Continue journaling when ready'
      ]
      
      setAiInsight(fallbackInsight)
      setSuggestedActions(fallbackActions)
      
      if (error.name === 'AbortError') {
        toast.error('Analysis timed out. Here are some general suggestions.', { id: 'ai-analysis' })
      } else {
        toast.error('AI unavailable. Here are some suggestions.', { id: 'ai-analysis' })
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Send Chat Message - Using AI Therapy Assistant
  const sendChatMessage = async (messageOverride?: string) => {
    const userMessage = messageOverride || chatInput.trim()
    if (!userMessage) return

    if (!messageOverride) setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setLoading(true)

    try {
      console.log('🧠 Sending message to AI therapy assistant...')
      console.log('🔑 Thread ID:', therapyThreadId)
      console.log('💬 User message:', userMessage)
      
      const response = await fetch('/api/ai/therapy-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          threadId: therapyThreadId
        })
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response status text:', response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📦 Response data:', data)
      
      // Check for error in response
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Store thread ID for conversation continuity
      if (data.threadId) {
        console.log('✅ Thread ID saved:', data.threadId)
        setTherapyThreadId(data.threadId)
      }
      
      console.log('✅ AI therapy response received:', data.response)
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.response || "I'm here to listen. Can you tell me more about how you're feeling?"
      }])

      // Scroll to bottom after new message
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (error: any) {
      console.error('❌ Error sending message:', error)
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        text: `I apologize, I'm having trouble connecting right now. Error: ${error.message}. Please try again in a moment or check the console for details.`
      }])
    } finally {
      setLoading(false)
    }
  }

  // Generate AI journal prompts (3 at a time)
  const generateJournalPrompts = async () => {
    setLoadingPrompts(true)
    
    // Set fallback prompts immediately in case AI fails
    const fallbackPrompts = [
      "What brought me joy or made me smile today?",
      "What's one challenge I'm facing and how can I approach it differently?",
      "What am I learning about myself right now?",
      "Who or what am I grateful for in this moment?",
      "What emotions am I experiencing and what are they telling me?",
      "What would make tomorrow better than today?"
    ]
    
    // Pick 3 random fallback prompts
    const randomFallbacks = fallbackPrompts
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    
    try {
      const response = await fetch('/api/ai/journal-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 3 })
      })
      
      if (!response.ok) {
        console.log('Using fallback prompts (AI unavailable)')
        setJournalPrompts(randomFallbacks)
        return
      }
      
      const data = await response.json()
      
      // Use AI prompts if available, otherwise use fallbacks
      if (data.prompts && data.prompts.length > 0) {
        setJournalPrompts(data.prompts)
        console.log('✅ AI prompts loaded successfully')
      } else {
        setJournalPrompts(randomFallbacks)
        console.log('Using fallback prompts (AI returned no prompts)')
      }
    } catch (error) {
      console.error('Error generating prompts:', error)
      setJournalPrompts(randomFallbacks)
    } finally {
      setLoadingPrompts(false)
    }
  }

  // Reset chat function
  const resetChat = () => {
    setChatMessages([
      { role: 'ai', text: "Hello! I'm here to support you. How are you feeling today? Feel free to share what's on your mind." }
    ])
    setTherapyThreadId(null)
    console.log('🔄 Chat reset')
  }

  // Enhanced context-aware quick replies based on LAST AI MESSAGE
  const getContextualQuickReplies = (): string[] => {
    const messageCount = chatMessages.filter(m => m.role === 'user').length
    const lastAIMessage = [...chatMessages].reverse().find(m => m.role === 'ai')?.text.toLowerCase() || ''
    const lastUserMessage = [...chatMessages].reverse().find(m => m.role === 'user')?.text.toLowerCase() || ''
    
    // Opening conversation (0 user messages)
    if (messageCount === 0) {
      return [
        "I'm feeling stressed lately",
        "I've been anxious and overwhelmed", 
        "I need someone to talk to"
      ]
    }
    
    // Check what the AI just asked or said
    if (lastAIMessage.includes('how are you feeling') || lastAIMessage.includes('how do you feel') || lastAIMessage.includes("what's going on")) {
      return [
        "I'm feeling overwhelmed with everything",
        "Honestly, I've been better",
        "It's been a really tough week"
      ]
    }
    
    // AI asking to elaborate or share more
    if (lastAIMessage.includes('tell me more') || lastAIMessage.includes('can you tell me') || lastAIMessage.includes('share more') || lastAIMessage.includes('would you like to share') || lastAIMessage.includes("what's weighing") || lastAIMessage.includes("what's beneath")) {
      return [
        "Yes, let me explain what happened",
        "It's about work and feeling undervalued",
        "It's personal relationship issues",
        "I'd rather not go into details right now"
      ]
    }
    
    if (lastAIMessage.includes('what helps') || lastAIMessage.includes('have you tried') || lastAIMessage.includes('strategies')) {
      return [
        "Nothing seems to be working for me",
        "I'm willing to try anything at this point",
        "I've tried a few things but need more ideas"
      ]
    }
    
    if (lastAIMessage.includes('why') || lastAIMessage.includes('when did') || lastAIMessage.includes('how long')) {
      return [
        "It started a few weeks ago",
        "I'm honestly not sure when it began",
        "It's been building up for a while"
      ]
    }
    
    if (lastAIMessage.includes('support') || lastAIMessage.includes('here for you') || lastAIMessage.includes('listen') || lastAIMessage.includes("i'm here")) {
      return [
        "That really helps, thank you for being here",
        "I appreciate you listening to me",
        "What do you think I should do next?"
      ]
    }
    
    // Context-aware based on user's last topic
    if (lastUserMessage.includes('stress') || lastUserMessage.includes('work') || lastUserMessage.includes('deadline')) {
      return [
        "The stress is keeping me up at night",
        "I feel like I'm constantly on edge",
        "I'm worried about burning out"
      ]
    }
    
    if (lastUserMessage.includes('anxious') || lastUserMessage.includes('anxiety') || lastUserMessage.includes('worried')) {
      return [
        "My mind races and I can't seem to stop it",
        "The anxiety makes it hard to focus on anything",
        "I worry about everything, even small things"
      ]
    }
    
    if (lastUserMessage.includes('sleep') || lastUserMessage.includes('tired') || lastUserMessage.includes('exhausted')) {
      return [
        "I lie awake for hours trying to fall asleep",
        "Even when I sleep, I wake up exhausted",
        "My sleep schedule is completely off track"
      ]
    }
    
    if (lastUserMessage.includes('relationship') || lastUserMessage.includes('friend') || lastUserMessage.includes('family') || lastUserMessage.includes('partner')) {
      return [
        "We're not communicating like we used to",
        "I feel like they don't understand me anymore",
        "I want to fix things but don't know how"
      ]
    }
    
    if (lastUserMessage.includes('sad') || lastUserMessage.includes('depress') || lastUserMessage.includes('down') || lastUserMessage.includes('lonely')) {
      return [
        "Nothing seems to bring me joy anymore",
        "I feel empty and disconnected from everything",
        "I've been isolating myself more lately"
      ]
    }
    
    // AI asking general questions - provide actual responses
    if (lastAIMessage.includes('?')) {
      // AI is asking a question, provide answers not more questions
      if (lastAIMessage.includes('angered') || lastAIMessage.includes('irritation') || lastAIMessage.includes('frustrated')) {
        return [
          "Yes, something at work really upset me",
          "It's about my relationships",
          "I'd rather not talk about it right now"
        ]
      }
      
      if (lastAIMessage.includes('beneath') || lastAIMessage.includes('deeper') || lastAIMessage.includes('really about')) {
        return [
          "I feel like I'm not being heard or valued",
          "It's fear that things won't get better",
          "Honestly, I'm not sure yet"
        ]
      }
      
      // General question responses
      return [
        "Let me think about that for a moment",
        "I'm not entirely sure how to answer that",
        "Can you help me explore this further?"
      ]
    }
    
    // General continuation prompts for early conversation
    if (messageCount <= 3) {
      return [
        "I'm struggling to cope with this",
        "This has been affecting my daily life",
        "I need help figuring this out"
      ]
    }
    
    // Deeper conversation prompts
    return [
      "This conversation is really helping me",
      "I'm starting to see things more clearly",
      "Thank you for helping me process this"
    ]
  }

  // Auto-rotate quick replies every time a new AI message is received
  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1]
    if (lastMessage?.role === 'ai') {
      setQuickReplyRotation(prev => prev + 1)
    }
  }, [chatMessages])

  const conversationStarters = [
    "Today I realized how impatient I get when progress stalls",
    "I'm worried about my future",
    "I feel stuck in my current situation",
    "I'm struggling with my relationships",
    "I don't know what I want anymore",
  ]

  // Delete journal entry with optimistic UI
  const deleteJournalEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry? This cannot be undone.')) {
      return
    }

    // Optimistic update - remove immediately from UI
    const previousEntries = [...journalHistory]
    setJournalHistory(prev => prev.filter(entry => entry.id !== entryId))

    try {
      console.log('🗑️ Deleting journal entry:', entryId)
      
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }
      
      // Delete from Supabase directly
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('domain_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      console.log('✅ Journal entry deleted successfully from Supabase')
      
      // Update DataProvider cache to keep everything in sync
      deleteData('mindfulness', entryId)
      
      // Reload journal history to ensure UI is fully synced
      await loadJournalHistory()
      
      console.log('✅ Journal entry deleted and history refreshed')
    } catch (error) {
      console.error('❌ Error deleting journal:', error)
      // Rollback - restore the previous entries
      setJournalHistory(previousEntries)
      alert('Failed to delete journal entry. Please try again.')
    }
  }

  // Save Mood - Optimized with instant feedback
  const [isSavingMood, setIsSavingMood] = useState(false)
  
  const saveMood = async () => {
    if (selectedMood === null) {
      toast.error('Please select a mood first')
      return
    }

    if (isSavingMood) return // Prevent double-click
    
    setIsSavingMood(true)
    const savedMood = selectedMood
    
    // Get current local date for accurate mood tracking
    const now = new Date()
    const localDateString = format(now, 'yyyy-MM-dd')
    
    // OPTIMISTIC: Update mood history immediately
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const todayDayName = dayNames[now.getDay()]
    setMoodHistory(prev => {
      const updated = [...prev]
      const todayIndex = updated.findIndex(d => d.day === todayDayName)
      if (todayIndex !== -1) {
        updated[todayIndex] = {
          ...updated[todayIndex],
          progress: (savedMood * 2 / 10) * 100,
          mood: getMoodEmoji(savedMood * 2)
        }
      }
      return updated
    })
    
    // Clear selection and show loading
    setSelectedMood(null)
    toast.loading('Saving mood...', { id: 'save-mood' })
    
    try {
      console.log('💾 Saving mood:', savedMood)
      
      // Check if there's already a mood entry for today (from current state)
      const mindfulnessData = getData('mindfulness')
      const todaysMood = mindfulnessData.find((item: any) => {
        const isMood = item.metadata?.type === 'mood' || item.metadata?.logType === 'mood-checkin'
        const moodDate = item.metadata?.date || format(new Date(item.createdAt), 'yyyy-MM-dd')
        return isMood && moodDate === localDateString
      })

      if (todaysMood) {
        // Update existing mood for today
        console.log('🔄 Updating existing mood for today:', todaysMood.id)
        await updateData('mindfulness', todaysMood.id, {
          metadata: {
            ...todaysMood.metadata,
            moodScore: savedMood * 2, // 1-5 → 2-10 scale
            moodValue: savedMood,
            timestamp: now.toISOString(),
          }
        })
      } else {
        // Create new mood entry for today
        console.log('➕ Creating new mood entry for today')
        await addData('mindfulness', {
          title: `Mood Check-in - ${new Date().toLocaleDateString()}`,
          description: `Mood: ${getMoodEmoji(savedMood * 2)} (${savedMood}/5)`,
          metadata: {
            type: 'mood',
            entryType: 'Mood',
            logType: 'mood-checkin',
            moodScore: savedMood * 2, // 1-5 → 2-10 scale
            moodValue: savedMood,
            date: localDateString, // yyyy-MM-dd format for correct day grouping
            timestamp: now.toISOString(),
            energyLevel: 3,
            stressLevel: 3,
          }
        })
      }
      
      toast.success('Mood saved! 🎉', { id: 'save-mood' })
      
      // Background reload - don't wait for it
      loadMoodHistory().catch(console.error)
    } catch (error) {
      console.error('❌ Error saving mood:', error)
      toast.error('Failed to save mood', { id: 'save-mood' })
      // Restore selection on error
      setSelectedMood(savedMood)
    } finally {
      setIsSavingMood(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Back Button */}
        <DomainBackButton />

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
            <Brain className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Mindfulness</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Journal, meditate, and track your mood</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-2 shadow-lg overflow-x-auto">
          <div className="grid grid-cols-5 gap-1 sm:gap-2 min-w-[320px]">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 md:gap-2 p-2 md:p-4 rounded-2xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-lg scale-105'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-[10px] sm:text-xs md:text-sm font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Journal Tab */}
        {activeTab === 'journal' && (
          <div className="space-y-6">
            {/* AI Journal Prompts - Show 3 at a time with refresh */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-3xl p-4 md:p-6 shadow-lg border-purple-200 dark:border-purple-800">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                      AI Journal Prompts
                    </h3>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      Click any prompt to start writing
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateJournalPrompts}
                  disabled={loadingPrompts}
                  className="rounded-full flex items-center gap-2"
                  title="Generate new prompts"
                >
                  {loadingPrompts ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* Display 3 AI-generated prompts */}
              <div className="grid grid-cols-1 gap-2">
                {loadingPrompts ? (
                  <div className="flex items-center justify-center py-8 text-purple-600 dark:text-purple-400">
                    <RotateCcw className="w-6 h-6 animate-spin mr-2" />
                    <span>Generating fresh prompts...</span>
                  </div>
                ) : (
                  journalPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setJournalText(prompt + '\n\n')}
                      className="text-left text-xs md:text-sm p-3 bg-white/80 dark:bg-gray-800/80 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800"
                    >
                      {prompt}
                    </button>
                  ))
                )}
              </div>
            </Card>

            <Card className="bg-white dark:bg-gray-800 rounded-3xl p-4 md:p-8 shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Daily Journal</h2>
              <Textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="I've been feeling stressed about my work deadlines this week. There's a lot on my plate and I'm worried about..."
                className="min-h-[150px] md:min-h-[200px] mb-4 md:mb-6 resize-none border-none bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 text-gray-600 dark:text-gray-300"
              />
              <div className="flex flex-col md:flex-row gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl py-4 md:py-6"
                  onClick={saveJournal}
                  disabled={isSavingJournal || !journalText.trim()}
                >
                  {isSavingJournal ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  {isSavingJournal ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 rounded-xl py-4 md:py-6"
                  onClick={getAIFeedback}
                  disabled={isAnalyzing || !journalText.trim()}
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'AI Feedback'}
                </Button>
              </div>
            </Card>

            {aiInsight && (
              <Card className="bg-purple-50 dark:bg-purple-950 rounded-3xl p-4 md:p-8 shadow-lg border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-purple-900 dark:text-purple-100 mb-3">AI Insights</h3>
                    <p className="text-sm md:text-base text-purple-900 dark:text-purple-200 mb-4 whitespace-pre-wrap">
                      {aiInsight}
                    </p>
                    {suggestedActions.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                        <h4 className="font-semibold mb-2 text-sm md:text-base">Suggested Actions:</h4>
                        <ul className="space-y-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                          {suggestedActions.map((action, idx) => (
                            <li key={idx}>• {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <Card className="bg-white dark:bg-gray-800 rounded-3xl p-4 md:p-8 shadow-lg">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold">AI Therapist Chat</h2>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetChat}
                  className="rounded-xl gap-2"
                  title="Reset conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden md:inline">Reset</span>
                </Button>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </div>
              </div>
            </div>

            {/* Welcome message and conversation starters */}
            {chatMessages.length === 0 && (
              <div className="mb-6 space-y-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl">
                  <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                    Hello! I'm here to support you. How are you feeling today? Feel free to share what's on your mind.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Need help getting started? Try one of these:</p>
                  <div className="flex flex-wrap gap-2">
                    {conversationStarters.map((starter, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendChatMessage(starter)}
                        disabled={loading}
                        className="text-xs md:text-sm px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-lg transition-colors text-left disabled:opacity-50"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6 max-h-[400px] md:max-h-[500px] overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-600 flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                      <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] p-3 md:p-4 rounded-2xl text-sm md:text-base ${
                      msg.role === 'ai'
                        ? 'bg-purple-100 dark:bg-purple-900 text-gray-800 dark:text-gray-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-600 flex items-center justify-center mr-2 md:mr-3">
                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 md:p-4 rounded-2xl">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Context-aware quick replies */}
            {chatMessages.length > 1 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Quick replies:
                </p>
                <div className="flex flex-wrap gap-2">
                  {getContextualQuickReplies().map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendChatMessage(reply)}
                      disabled={loading}
                      className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-full transition-colors disabled:opacity-50"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && sendChatMessage()}
                placeholder="Type your message..."
                className="flex-1 rounded-xl py-4 md:py-6 px-4"
                disabled={loading}
              />
              <Button 
                className="bg-purple-600 hover:bg-purple-700 rounded-xl px-4 md:px-6"
                onClick={() => sendChatMessage()}
                disabled={loading}
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Exercise Tab */}
        {activeTab === 'exercise' && (
          <div className="space-y-6">
            {/* Breathing Exercises Section */}
            <BreathingExercises />
            
            {/* Guided Meditations Section */}
            <GuidedMeditations />
          </div>
        )}

        {/* Mood Tab */}
        {activeTab === 'mood' && (
          <div className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 rounded-3xl p-4 md:p-8 shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">How are you feeling?</h2>
              
              <div className="flex justify-between mb-6 md:mb-8 gap-2">
                {moodEmojis.map((mood) => (
                  <button
                    key={mood.level}
                    onClick={() => setSelectedMood(mood.level as MoodLevel)}
                    className={`flex flex-col items-center gap-2 p-2 md:p-4 rounded-2xl transition-all ${
                      selectedMood === mood.level
                        ? 'bg-purple-100 dark:bg-purple-900 scale-110'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-3xl md:text-5xl">{mood.emoji}</span>
                    <span className="text-xs text-center text-gray-600 dark:text-gray-400 whitespace-pre-line">
                      {mood.label}
                    </span>
                  </button>
                ))}
              </div>

              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl py-4 md:py-6 text-base md:text-lg"
                onClick={saveMood}
                disabled={isSavingMood || selectedMood === null}
              >
                {isSavingMood ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Today's Mood"
                )}
              </Button>
            </Card>

            <Card className="bg-white dark:bg-gray-800 rounded-3xl p-4 md:p-8 shadow-lg">
              <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">7-Day History</h3>
              <div className="space-y-4">
                {(moodHistory.length > 0 ? moodHistory : [
                  { day: 'Mon', progress: 0, mood: '' },
                  { day: 'Tue', progress: 0, mood: '' },
                  { day: 'Wed', progress: 0, mood: '' },
                  { day: 'Thu', progress: 0, mood: '' },
                  { day: 'Fri', progress: 0, mood: '' },
                  { day: 'Sat', progress: 0, mood: '' },
                  { day: 'Sun', progress: 0, mood: '' }
                ]).map((day, idx, array) => {
                  const isToday = moodHistory.length > 0 && idx === array.length - 1
                  return (
                    <div key={idx} className="flex items-center gap-2 md:gap-4">
                      <span className={`w-8 md:w-12 text-sm md:text-base font-medium ${isToday ? 'text-purple-700 dark:text-purple-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>{day.day}</span>
                      <div className={`flex-1 rounded-full h-10 md:h-12 overflow-hidden ${isToday ? 'bg-purple-200 dark:bg-purple-900 ring-2 ring-purple-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <div
                          className="bg-purple-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${day.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-2xl md:text-3xl w-8 md:w-12 text-center">{day.mood}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 rounded-3xl p-4 md:p-8 shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Journal History</h2>
              {journalHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No journal entries yet. Start writing in the Journal tab!
                </p>
              ) : (
                <div className="space-y-4">
                  {journalHistory.map((entry) => {
                    const isExpanded = expandedEntryId === entry.id
                    const date = new Date(entry.timestamp)
                    const formattedDate = date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                    const formattedTime = date.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })

                    return (
                      <Card key={entry.id} className="bg-gray-50 dark:bg-gray-900">
                        <div 
                          className="p-4 md:p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{formattedDate}</h3>
                                {entry.moodScore && (
                                  <span className="text-2xl">{getMoodEmoji(entry.moodScore)}</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{formattedTime}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteJournalEntry(entry.id)
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                title="Delete entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                          </div>

                          {!isExpanded && entry.journalEntry && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-3">
                              {entry.journalEntry.substring(0, 150)}
                              {entry.journalEntry.length > 150 && '...'}
                            </p>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="px-4 md:px-6 pb-4 md:pb-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4">
                              <h4 className="font-semibold mb-2 text-purple-600 dark:text-purple-400">Journal Entry</h4>
                              <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {entry.journalEntry}
                              </p>
                            </div>

                            {entry.aiInsight && (
                              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-2xl p-4 border border-purple-200 dark:border-purple-900">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">AI Insight</h4>
                                    <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap">
                                      {entry.aiInsight}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

