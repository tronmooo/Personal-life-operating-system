/**
 * User Learning System
 * Tracks user patterns, preferences, and behaviors to provide
 * increasingly personalized AI assistance over time
 */

import type { Domain } from '@/types/domains'

// ============================================
// USER PATTERN TRACKING
// ============================================

export interface UserPattern {
  // Command patterns
  commonCommands: CommandPattern[]
  commandShortcuts: Record<string, string>  // "log weight" -> "health"
  
  // Time patterns
  activeHours: number[]  // Hours of day user is most active (0-23)
  peakActivityDays: number[]  // Days of week (0=Sun, 6=Sat)
  
  // Domain engagement
  domainEngagement: Record<string, DomainEngagement>
  
  // Preferences learned from behavior
  inferredPreferences: InferredPreferences
  
  // Named entities the user mentions
  knownEntities: KnownEntity[]
  
  // Recent context for continuity
  recentMentions: RecentMention[]
}

export interface CommandPattern {
  pattern: string          // Normalized command pattern
  fullCommand: string      // Example of full command
  domain: string
  frequency: number        // How many times used
  lastUsed: string         // ISO timestamp
  avgSuccessRate: number   // 0-1 success rate
}

export interface DomainEngagement {
  domain: string
  totalEntries: number
  entriesThisWeek: number
  lastActivity: string
  averageEntriesPerWeek: number
  preferredFields: string[]    // Fields user most commonly fills
  preferredUnits?: Record<string, string>  // e.g., { weight: 'lbs', distance: 'miles' }
}

export interface InferredPreferences {
  preferredUnits: {
    weight: 'lbs' | 'kg'
    distance: 'miles' | 'km'
    currency: 'USD' | 'EUR' | 'GBP' | string
    temperature: 'F' | 'C'
  }
  timeFormat: '12h' | '24h'
  defaultMealTimes: {
    breakfast: string
    lunch: string
    dinner: string
  }
  workDays: number[]  // 0=Sun, 6=Sat
}

export interface KnownEntity {
  type: 'person' | 'vehicle' | 'pet' | 'location' | 'provider' | 'account'
  name: string
  aliases: string[]
  domain: string
  metadata: Record<string, any>
  lastMentioned: string
  mentionCount: number
}

export interface RecentMention {
  topic: string
  domain?: string
  timestamp: string
  context?: string
}

// ============================================
// DEFAULT PATTERNS
// ============================================

export const DEFAULT_USER_PATTERN: UserPattern = {
  commonCommands: [],
  commandShortcuts: {},
  activeHours: [],
  peakActivityDays: [],
  domainEngagement: {},
  inferredPreferences: {
    preferredUnits: {
      weight: 'lbs',
      distance: 'miles',
      currency: 'USD',
      temperature: 'F'
    },
    timeFormat: '12h',
    defaultMealTimes: {
      breakfast: '08:00',
      lunch: '12:00',
      dinner: '18:00'
    },
    workDays: [1, 2, 3, 4, 5]  // Mon-Fri
  },
  knownEntities: [],
  recentMentions: []
}

// ============================================
// LEARNING FUNCTIONS
// ============================================

/**
 * Learn from a successful command
 */
export function learnFromCommand(
  patterns: UserPattern,
  command: string,
  domain: string,
  success: boolean
): UserPattern {
  const normalizedCommand = normalizeCommand(command)
  
  // Update command patterns
  const existingPattern = patterns.commonCommands.find(p => p.pattern === normalizedCommand)
  
  if (existingPattern) {
    existingPattern.frequency++
    existingPattern.lastUsed = new Date().toISOString()
    existingPattern.avgSuccessRate = 
      (existingPattern.avgSuccessRate * (existingPattern.frequency - 1) + (success ? 1 : 0)) / 
      existingPattern.frequency
  } else {
    patterns.commonCommands.push({
      pattern: normalizedCommand,
      fullCommand: command,
      domain,
      frequency: 1,
      lastUsed: new Date().toISOString(),
      avgSuccessRate: success ? 1 : 0
    })
  }

  // Keep top 50 most used commands
  patterns.commonCommands = patterns.commonCommands
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 50)

  // Update active hours
  const currentHour = new Date().getHours()
  if (!patterns.activeHours.includes(currentHour)) {
    patterns.activeHours.push(currentHour)
  }

  // Update domain engagement
  if (!patterns.domainEngagement[domain]) {
    patterns.domainEngagement[domain] = {
      domain,
      totalEntries: 0,
      entriesThisWeek: 0,
      lastActivity: new Date().toISOString(),
      averageEntriesPerWeek: 0,
      preferredFields: []
    }
  }
  patterns.domainEngagement[domain].totalEntries++
  patterns.domainEngagement[domain].lastActivity = new Date().toISOString()

  return patterns
}

/**
 * Learn entities from user messages
 */
export function learnEntities(
  patterns: UserPattern,
  message: string,
  domain: string
): UserPattern {
  const entities = extractEntities(message)
  
  entities.forEach(entity => {
    const existing = patterns.knownEntities.find(
      e => e.name.toLowerCase() === entity.name.toLowerCase() && e.type === entity.type
    )
    
    if (existing) {
      existing.mentionCount++
      existing.lastMentioned = new Date().toISOString()
      // Add new aliases
      if (entity.name !== existing.name && !existing.aliases.includes(entity.name)) {
        existing.aliases.push(entity.name)
      }
    } else {
      patterns.knownEntities.push({
        ...entity,
        domain,
        aliases: [],
        lastMentioned: new Date().toISOString(),
        mentionCount: 1
      })
    }
  })

  // Keep recent mentions for context
  patterns.recentMentions = [
    { topic: message.slice(0, 100), domain, timestamp: new Date().toISOString() },
    ...patterns.recentMentions.slice(0, 19)  // Keep last 20
  ]

  return patterns
}

/**
 * Infer preferences from data patterns
 */
export function inferPreferences(
  patterns: UserPattern,
  recentData: Array<{ domain: string; metadata: any }>
): UserPattern {
  const preferences = patterns.inferredPreferences

  // Analyze weight entries for unit preference
  const weightEntries = recentData.filter(d => 
    d.domain === 'health' && (d.metadata?.weight || d.metadata?.logType === 'weight')
  )
  
  if (weightEntries.length >= 3) {
    const avgWeight = weightEntries.reduce((sum, e) => {
      const w = parseFloat(e.metadata?.weight || e.metadata?.value || 0)
      return sum + w
    }, 0) / weightEntries.length
    
    // If average > 100, likely lbs; if < 100, likely kg
    preferences.preferredUnits.weight = avgWeight > 100 ? 'lbs' : 'kg'
  }

  // Analyze meal times
  const mealEntries = recentData.filter(d => 
    d.domain === 'nutrition' && d.metadata?.type === 'meal'
  )
  
  if (mealEntries.length >= 10) {
    const mealsByType: Record<string, string[]> = {
      breakfast: [],
      lunch: [],
      dinner: []
    }
    
    mealEntries.forEach(e => {
      const mealType = e.metadata?.mealType?.toLowerCase()
      const time = e.metadata?.time
      if (mealType && time && mealsByType[mealType]) {
        mealsByType[mealType].push(time)
      }
    })

    // Calculate most common time for each meal
    Object.entries(mealsByType).forEach(([meal, times]) => {
      if (times.length >= 3) {
        const avgTime = calculateAverageTime(times)
        preferences.defaultMealTimes[meal as keyof typeof preferences.defaultMealTimes] = avgTime
      }
    })
  }

  return patterns
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function normalizeCommand(command: string): string {
  return command
    .toLowerCase()
    .replace(/\d+(\.\d+)?/g, '[NUM]')  // Replace numbers
    .replace(/\$\[NUM\]/g, '[AMOUNT]')  // Replace amounts
    .replace(/\b(today|yesterday|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '[DATE]')
    .replace(/\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi, '[TIME]')
    .trim()
}

function extractEntities(message: string): Partial<KnownEntity>[] {
  const entities: Partial<KnownEntity>[] = []
  
  // Extract potential pet names (common pattern: "Rex had...", "took Buddy to...")
  const petPatterns = [
    /\b(took|brought|fed|walked)\s+(\w+)\s+(to|for|some)/i,
    /\b(\w+)\s+(had|needs|went to)\s+(vet|grooming|checkup)/i,
    /\bmy\s+(dog|cat|pet)\s+(\w+)/i
  ]
  
  petPatterns.forEach(pattern => {
    const match = message.match(pattern)
    if (match) {
      const name = match[2] || match[1]
      if (name && name.length > 2 && name.length < 20) {
        entities.push({ type: 'pet', name, metadata: {} })
      }
    }
  })

  // Extract vehicle mentions
  const vehiclePatterns = [
    /\bmy\s+(car|truck|honda|toyota|ford|chevy|tesla|bmw|audi|mercedes)\b/i,
    /\b(car|vehicle|auto)\s+(\w+)\s+(service|maintenance|repair)/i
  ]
  
  vehiclePatterns.forEach(pattern => {
    const match = message.match(pattern)
    if (match) {
      const name = match[1]
      entities.push({ type: 'vehicle', name, metadata: {} })
    }
  })

  // Extract person names (patterns like "meeting with John", "call Sarah")
  const personPatterns = [
    /\b(meeting|call|lunch|dinner|with|from)\s+([A-Z][a-z]+)\b/,
    /\b([A-Z][a-z]+)'s\s+(birthday|appointment|event)/
  ]
  
  personPatterns.forEach(pattern => {
    const match = message.match(pattern)
    if (match) {
      const name = match[2] || match[1]
      if (name && !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(name)) {
        entities.push({ type: 'person', name, metadata: {} })
      }
    }
  })

  return entities
}

function calculateAverageTime(times: string[]): string {
  const minutes = times.map(t => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + (m || 0)
  })
  
  const avgMinutes = Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length)
  const hours = Math.floor(avgMinutes / 60)
  const mins = avgMinutes % 60
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// ============================================
// CONTEXT ENHANCEMENT
// ============================================

/**
 * Enhance AI prompt with learned user context
 */
export function buildLearningContext(patterns: UserPattern): string {
  let context = ''

  // Add known entities
  if (patterns.knownEntities.length > 0) {
    context += `\n**Known Entities:**\n`
    
    const entityGroups = patterns.knownEntities.reduce((acc, e) => {
      if (!acc[e.type]) acc[e.type] = []
      acc[e.type].push(e)
      return acc
    }, {} as Record<string, KnownEntity[]>)

    Object.entries(entityGroups).forEach(([type, entities]) => {
      const topEntities = entities
        .sort((a, b) => b.mentionCount - a.mentionCount)
        .slice(0, 5)
      
      context += `- ${type}s: ${topEntities.map(e => e.name).join(', ')}\n`
    })
  }

  // Add inferred preferences
  const prefs = patterns.inferredPreferences
  context += `\n**User Preferences:**\n`
  context += `- Units: weight in ${prefs.preferredUnits.weight}, distance in ${prefs.preferredUnits.distance}\n`
  context += `- Currency: ${prefs.preferredUnits.currency}\n`

  // Add top domains
  const topDomains = Object.values(patterns.domainEngagement)
    .sort((a, b) => b.totalEntries - a.totalEntries)
    .slice(0, 5)
  
  if (topDomains.length > 0) {
    context += `\n**Most Used Domains:**\n`
    topDomains.forEach(d => {
      context += `- ${d.domain}: ${d.totalEntries} entries\n`
    })
  }

  // Add recent mentions for continuity
  if (patterns.recentMentions.length > 0) {
    context += `\n**Recent Context:**\n`
    patterns.recentMentions.slice(0, 3).forEach(m => {
      context += `- ${m.topic}\n`
    })
  }

  return context
}

/**
 * Get smart suggestions based on patterns
 */
export function getSmartSuggestions(patterns: UserPattern): string[] {
  const suggestions: string[] = []
  const now = new Date()
  const currentHour = now.getHours()

  // Time-based suggestions
  const prefs = patterns.inferredPreferences
  
  if (currentHour >= 6 && currentHour <= 10) {
    suggestions.push('Log your morning weight?')
    if (prefs.defaultMealTimes.breakfast) {
      suggestions.push('Log breakfast?')
    }
  } else if (currentHour >= 11 && currentHour <= 14) {
    suggestions.push('Log lunch?')
  } else if (currentHour >= 17 && currentHour <= 21) {
    suggestions.push('Log dinner?')
    suggestions.push('How was your day? Add a journal entry')
  }

  // Domain-based suggestions
  const staledomains = Object.values(patterns.domainEngagement)
    .filter(d => {
      const daysSinceActivity = (now.getTime() - new Date(d.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
      return d.totalEntries > 5 && daysSinceActivity > 7
    })
  
  staledomains.slice(0, 2).forEach(d => {
    suggestions.push(`Update your ${d.domain} data? It's been a while.`)
  })

  // Entity-based suggestions
  const pets = patterns.knownEntities.filter(e => e.type === 'pet')
  if (pets.length > 0) {
    const stalePets = pets.filter(p => {
      const daysSince = (now.getTime() - new Date(p.lastMentioned).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince > 14
    })
    stalePets.forEach(p => {
      suggestions.push(`Any updates about ${p.name}?`)
    })
  }

  return suggestions.slice(0, 4)
}

// ============================================
// PATTERN STORAGE & RETRIEVAL
// ============================================

export interface UserLearningData {
  userId: string
  patterns: UserPattern
  lastUpdated: string
  version: number
}

export function createInitialLearningData(userId: string): UserLearningData {
  return {
    userId,
    patterns: { ...DEFAULT_USER_PATTERN },
    lastUpdated: new Date().toISOString(),
    version: 1
  }
}

/**
 * Merge patterns from multiple sources (useful for syncing)
 */
export function mergePatterns(local: UserPattern, remote: UserPattern): UserPattern {
  return {
    ...local,
    commonCommands: mergeCommandPatterns(local.commonCommands, remote.commonCommands),
    commandShortcuts: { ...remote.commandShortcuts, ...local.commandShortcuts },
    activeHours: [...new Set([...local.activeHours, ...remote.activeHours])],
    peakActivityDays: [...new Set([...local.peakActivityDays, ...remote.peakActivityDays])],
    domainEngagement: mergeDomainEngagement(local.domainEngagement, remote.domainEngagement),
    inferredPreferences: { ...remote.inferredPreferences, ...local.inferredPreferences },
    knownEntities: mergeKnownEntities(local.knownEntities, remote.knownEntities),
    recentMentions: [...local.recentMentions, ...remote.recentMentions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
  }
}

function mergeCommandPatterns(local: CommandPattern[], remote: CommandPattern[]): CommandPattern[] {
  const merged = new Map<string, CommandPattern>()
  
  ;[...remote, ...local].forEach(pattern => {
    const existing = merged.get(pattern.pattern)
    if (existing) {
      existing.frequency = Math.max(existing.frequency, pattern.frequency)
      existing.lastUsed = existing.lastUsed > pattern.lastUsed ? existing.lastUsed : pattern.lastUsed
    } else {
      merged.set(pattern.pattern, { ...pattern })
    }
  })

  return Array.from(merged.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 50)
}

function mergeDomainEngagement(
  local: Record<string, DomainEngagement>,
  remote: Record<string, DomainEngagement>
): Record<string, DomainEngagement> {
  const merged: Record<string, DomainEngagement> = { ...remote }
  
  Object.entries(local).forEach(([domain, engagement]) => {
    if (merged[domain]) {
      merged[domain] = {
        ...merged[domain],
        totalEntries: Math.max(merged[domain].totalEntries, engagement.totalEntries),
        lastActivity: merged[domain].lastActivity > engagement.lastActivity 
          ? merged[domain].lastActivity 
          : engagement.lastActivity
      }
    } else {
      merged[domain] = engagement
    }
  })

  return merged
}

function mergeKnownEntities(local: KnownEntity[], remote: KnownEntity[]): KnownEntity[] {
  const merged = new Map<string, KnownEntity>()
  
  ;[...remote, ...local].forEach(entity => {
    const key = `${entity.type}:${entity.name.toLowerCase()}`
    const existing = merged.get(key)
    
    if (existing) {
      existing.mentionCount = Math.max(existing.mentionCount, entity.mentionCount)
      existing.aliases = [...new Set([...existing.aliases, ...entity.aliases])]
      existing.lastMentioned = existing.lastMentioned > entity.lastMentioned 
        ? existing.lastMentioned 
        : entity.lastMentioned
    } else {
      merged.set(key, { ...entity })
    }
  })

  return Array.from(merged.values())
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 100)
}



