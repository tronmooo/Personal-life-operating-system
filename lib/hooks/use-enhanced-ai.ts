'use client'

/**
 * React hook for Enhanced AI features
 * Provides easy access to personality, learning, insights, and digest
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  type AIPersonality, 
  type FollowUpSuggestion, 
  type QuickAction 
} from '@/lib/ai/enhanced-ai-personality'
import { type UserLearningData, type UserPattern } from '@/lib/ai/user-learning-system'
import { type ProactiveInsight } from '@/lib/ai/proactive-insights-engine'
import { type WeeklyDigest } from '@/lib/ai/weekly-digest-generator'

// ============================================
// TYPES
// ============================================

interface PersonalityPreset {
  id: string
  name: string
  description: string
}

interface UseEnhancedAIReturn {
  // Personality
  personality: AIPersonality | null
  presets: PersonalityPreset[]
  updatePersonality: (updates: Partial<AIPersonality>) => Promise<void>
  applyPreset: (presetId: string) => Promise<void>
  
  // Learning
  learningData: UserLearningData | null
  recordCommand: (command: string, domain: string, success: boolean) => Promise<void>
  knownEntities: UserPattern['knownEntities']
  
  // Suggestions
  smartSuggestions: string[]
  followUps: FollowUpSuggestion[]
  quickActions: QuickAction[]
  getFollowUps: (action: string, domain: string) => Promise<FollowUpSuggestion[]>
  getQuickActions: (domain: string) => Promise<QuickAction[]>
  
  // Insights
  insights: ProactiveInsight[]
  highPriorityInsights: ProactiveInsight[]
  refreshInsights: () => Promise<void>
  
  // Digest
  digest: WeeklyDigest | null
  digestLoading: boolean
  generateDigest: () => Promise<WeeklyDigest | null>
  
  // State
  loading: boolean
  error: string | null
}

// ============================================
// HOOK
// ============================================

export function useEnhancedAI(): UseEnhancedAIReturn {
  // State
  const [personality, setPersonality] = useState<AIPersonality | null>(null)
  const [presets, setPresets] = useState<PersonalityPreset[]>([])
  const [learningData, setLearningData] = useState<UserLearningData | null>(null)
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([])
  const [followUps, setFollowUps] = useState<FollowUpSuggestion[]>([])
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [insights, setInsights] = useState<ProactiveInsight[]>([])
  const [digest, setDigest] = useState<WeeklyDigest | null>(null)
  const [digestLoading, setDigestLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch personality, presets, learning data, and suggestions in parallel
        const [
          personalityRes,
          presetsRes,
          learningRes,
          suggestionsRes,
          insightsRes
        ] = await Promise.all([
          fetch('/api/ai-assistant/enhanced?action=personality'),
          fetch('/api/ai-assistant/enhanced?action=presets'),
          fetch('/api/ai-assistant/enhanced?action=learning'),
          fetch('/api/ai-assistant/enhanced?action=suggestions'),
          fetch('/api/ai-assistant/enhanced?action=insights')
        ])

        if (personalityRes.ok) {
          const data = await personalityRes.json()
          setPersonality(data.personality)
        }

        if (presetsRes.ok) {
          const data = await presetsRes.json()
          setPresets(data.presets)
        }

        if (learningRes.ok) {
          const data = await learningRes.json()
          setLearningData(data.learningData)
        }

        if (suggestionsRes.ok) {
          const data = await suggestionsRes.json()
          setSmartSuggestions(data.suggestions)
        }

        if (insightsRes.ok) {
          const data = await insightsRes.json()
          setInsights(data.insights)
        }

        setError(null)
      } catch (err: any) {
        console.error('Error fetching enhanced AI data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // ============================================
  // PERSONALITY
  // ============================================

  const updatePersonality = useCallback(async (updates: Partial<AIPersonality>) => {
    try {
      const res = await fetch('/api/ai-assistant/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-personality',
          personality: updates
        })
      })

      if (res.ok) {
        const data = await res.json()
        setPersonality(data.personality)
      }
    } catch (err: any) {
      console.error('Error updating personality:', err)
      setError(err.message)
    }
  }, [])

  const applyPreset = useCallback(async (presetId: string) => {
    try {
      const res = await fetch('/api/ai-assistant/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply-preset',
          presetId
        })
      })

      if (res.ok) {
        const data = await res.json()
        setPersonality(data.personality)
      }
    } catch (err: any) {
      console.error('Error applying preset:', err)
      setError(err.message)
    }
  }, [])

  // ============================================
  // LEARNING
  // ============================================

  const recordCommand = useCallback(async (command: string, domain: string, success: boolean) => {
    try {
      await fetch('/api/ai-assistant/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'learn-command',
          command,
          domain,
          success
        })
      })
    } catch (err: any) {
      console.error('Error recording command:', err)
    }
  }, [])

  // ============================================
  // SUGGESTIONS
  // ============================================

  const getFollowUps = useCallback(async (action: string, domain: string): Promise<FollowUpSuggestion[]> => {
    try {
      const res = await fetch('/api/ai-assistant/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-follow-ups',
          action: action,
          domain
        })
      })

      if (res.ok) {
        const data = await res.json()
        setFollowUps(data.followUps)
        return data.followUps
      }
      return []
    } catch (err: any) {
      console.error('Error getting follow-ups:', err)
      return []
    }
  }, [])

  const getQuickActions = useCallback(async (domain: string): Promise<QuickAction[]> => {
    try {
      const res = await fetch('/api/ai-assistant/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-quick-actions',
          domain
        })
      })

      if (res.ok) {
        const data = await res.json()
        setQuickActions(data.quickActions)
        return data.quickActions
      }
      return []
    } catch (err: any) {
      console.error('Error getting quick actions:', err)
      return []
    }
  }, [])

  // ============================================
  // INSIGHTS
  // ============================================

  const refreshInsights = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-assistant/enhanced?action=insights')
      if (res.ok) {
        const data = await res.json()
        setInsights(data.insights)
      }
    } catch (err: any) {
      console.error('Error refreshing insights:', err)
    }
  }, [])

  // ============================================
  // DIGEST
  // ============================================

  const generateDigest = useCallback(async (): Promise<WeeklyDigest | null> => {
    try {
      setDigestLoading(true)
      const res = await fetch('/api/ai-assistant/enhanced?action=digest')
      
      if (res.ok) {
        const data = await res.json()
        setDigest(data)
        return data
      }
      return null
    } catch (err: any) {
      console.error('Error generating digest:', err)
      setError(err.message)
      return null
    } finally {
      setDigestLoading(false)
    }
  }, [])

  // ============================================
  // RETURN
  // ============================================

  return {
    // Personality
    personality,
    presets,
    updatePersonality,
    applyPreset,
    
    // Learning
    learningData,
    recordCommand,
    knownEntities: learningData?.patterns.knownEntities || [],
    
    // Suggestions
    smartSuggestions,
    followUps,
    quickActions,
    getFollowUps,
    getQuickActions,
    
    // Insights
    insights,
    highPriorityInsights: insights.filter(i => i.priority === 'high'),
    refreshInsights,
    
    // Digest
    digest,
    digestLoading,
    generateDigest,
    
    // State
    loading,
    error
  }
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook for just the personality features
 */
export function useAIPersonality() {
  const { 
    personality, 
    presets, 
    updatePersonality, 
    applyPreset, 
    loading 
  } = useEnhancedAI()

  return { personality, presets, updatePersonality, applyPreset, loading }
}

/**
 * Hook for just the insights
 */
export function useProactiveInsights() {
  const [insights, setInsights] = useState<ProactiveInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch_insights = async () => {
      try {
        const res = await fetch('/api/ai-assistant/enhanced?action=insights')
        if (res.ok) {
          const data = await res.json()
          setInsights(data.insights)
        }
      } catch (err) {
        console.error('Error fetching insights:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch_insights()
  }, [])

  return {
    insights,
    highPriority: insights.filter(i => i.priority === 'high'),
    celebrations: insights.filter(i => i.type === 'celebration'),
    suggestions: insights.filter(i => i.type === 'suggestion'),
    loading
  }
}

/**
 * Hook for the weekly digest
 */
export function useWeeklyDigest() {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-assistant/enhanced?action=digest')
      if (res.ok) {
        const data = await res.json()
        setDigest(data)
        return data
      }
    } catch (err) {
      console.error('Error generating digest:', err)
    } finally {
      setLoading(false)
    }
    return null
  }

  return { digest, loading, generate }
}



