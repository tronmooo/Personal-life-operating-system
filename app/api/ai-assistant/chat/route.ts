import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'
import { COMMAND_CATALOG_PROMPT, AI_ASSISTANT_ACTIONS } from '@/lib/ai/command-catalog'
import { 
  performIntelligentAnalysis, 
  detectAnalysisType,
  fetchUserDataForAnalysis,
  analyzeDataWithAI
} from '@/lib/ai/intelligent-analysis'

// ============================================
// AI SETTINGS INTERFACE AND HELPER
// ============================================
interface AISettings {
  aiName: string
  responseStyle: 'concise' | 'detailed' | 'conversational'
  proactiveInsights: boolean
  learningMode: boolean
  tone: 'professional' | 'friendly' | 'casual'
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced'
  modelVersion: 'gpt-4' | 'gpt-3.5' | 'claude-3'
  maxTokens: number
  temperature: number
  contextWindow: number
  focusAreas: string[]
  priorityDomains: string[]
}

const DEFAULT_AI_SETTINGS: AISettings = {
  aiName: 'AI Assistant',
  responseStyle: 'conversational',
  proactiveInsights: true,
  learningMode: true,
  tone: 'friendly',
  expertiseLevel: 'intermediate',
  modelVersion: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.7,
  contextWindow: 8000,
  focusAreas: ['Financial Health', 'Physical Health', 'Productivity'],
  priorityDomains: ['financial', 'health', 'career']
}

async function getUserAISettings(supabase: any, userId: string): Promise<AISettings> {
  try {
    const { data } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .maybeSingle()

    if (data?.settings) {
      // Merge with defaults to ensure all fields exist
      return { ...DEFAULT_AI_SETTINGS, ...data.settings }
    }
  } catch (error) {
    console.error('Error fetching AI settings:', error)
  }
  return DEFAULT_AI_SETTINGS
}

function buildSystemPromptWithSettings(basePrompt: string, settings: AISettings): string {
  const toneInstructions = {
    professional: 'Maintain a formal, precise, and business-like tone. Use proper terminology and structured responses.',
    friendly: 'Be warm, approachable, and conversational. Use encouraging language while remaining helpful and informative.',
    casual: 'Be relaxed and informal, like chatting with a friend. Use natural language and occasional humor where appropriate.'
  }

  const expertiseInstructions = {
    beginner: 'Explain concepts simply without jargon. Provide step-by-step guidance and define any technical terms you use.',
    intermediate: 'Use balanced explanations with some technical detail when relevant. Assume basic familiarity with concepts.',
    advanced: 'You can use technical language freely. Provide in-depth analysis and assume familiarity with advanced concepts.'
  }

  const styleInstructions = {
    concise: 'Keep responses brief and to the point. Use bullet points for lists. Focus on the essential information.',
    detailed: 'Provide comprehensive explanations with context, examples, and thorough analysis.',
    conversational: 'Engage naturally in dialogue. Ask clarifying questions when needed and reference previous context.'
  }

  const enhancedPrompt = `Your name is ${settings.aiName}. ${basePrompt}

COMMUNICATION STYLE:
${toneInstructions[settings.tone]}
${expertiseInstructions[settings.expertiseLevel]}
${styleInstructions[settings.responseStyle]}

FOCUS AREAS: ${settings.focusAreas.join(', ')}
PRIORITY DOMAINS: ${settings.priorityDomains.join(', ')}

When providing insights, prioritize information related to the user's focus areas and priority domains.
${settings.proactiveInsights ? 'Proactively offer relevant insights and suggestions based on the data you observe.' : 'Only provide insights when explicitly asked.'}`

  return enhancedPrompt
}

function getOpenAIModel(modelVersion: string): string {
  switch (modelVersion) {
    case 'gpt-4':
      return 'gpt-4o-mini' // Using gpt-4o-mini as the default GPT-4 variant
    case 'gpt-3.5':
      return 'gpt-3.5-turbo'
    case 'claude-3':
      return 'gpt-4o-mini' // Fallback to GPT-4 since we're using OpenAI
    default:
      return 'gpt-4o-mini'
  }
}

function isCommandCatalogRequest(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('list all commands') ||
    m.includes('list commands') ||
    m.includes('all commands') ||
    m.includes('what can you do') ||
    m.includes('what are your capabilities') ||
    m.includes('capabilities') ||
    m.includes('supported commands')
  )
}

function formatCommandCatalogForUser(): string {
  const aiActions = AI_ASSISTANT_ACTIONS.join(', ')
  return [
    `Here’s everything I can do in LifeHub via the AI assistant (authoritative):`,
    ``,
    `**AI actions (I can execute these):**`,
    aiActions,
    ``,
    `**Voice commands:** log, add, update, query, schedule, navigate`,
    ``,
    `**Examples you can say/type:**`,
    `- "Add task call dentist"`,
    `- "Create a habit: drink water daily"`,
    `- "Create bill: Internet $80 due 2025-01-05 recurring monthly"`,
    `- "Delete my last 3 grocery expenses" (I will ask for confirmation)`,
    `- "Export my health data as CSV"`,
    `- "Add 'Dentist appointment' to Google Calendar tomorrow at 2pm"`,
    ``,
    `If you tell me what you want done (and any missing details like dates/amounts), I can execute it.`,
  ].join('\n')
}

// ============================================
// MULTI-INTENT DETECTION HELPER
// ============================================

/**
 * Intent types that can be mixed in a single message
 */
type IntentType = 'retrieval' | 'data_log' | 'query' | 'action' | 'unknown'

interface DetectedIntent {
  type: IntentType
  segment: string
  domain?: string
}

/**
 * Detects if a message contains MULTIPLE intents of ANY type.
 * This now handles MIXED intent types like:
 * - "pull up my driver's license and I weigh 120 pounds" → retrieval + data_log
 * - "ran 5 miles, blood pressure 123/80" → data_log + data_log
 * 
 * Returns: { isMulti: boolean, intents: DetectedIntent[] }
 */
function detectMixedIntents(message: string): { isMulti: boolean; intents: DetectedIntent[] } {
  const lowerMessage = message.toLowerCase()
  const intents: DetectedIntent[] = []
  
  // Pattern matchers for different intent types
  const retrievalPatterns = [
    /\b(pull\s*up|show\s*me|get\s*my|retrieve|find|display|open)\b.*\b(license|registration|insurance|id|card|document|passport|certificate|record)\b/gi,
    /\b(pull\s*up|show\s*me|get|retrieve)\b.*\b(my|the)\b/gi,
  ]
  
  const dataLogPatterns = [
    // Health - weight specifically (must have "weigh" or "weight" with a number)
    { pattern: /\b(i\s+weigh|weigh|weight\s+is|my\s+weight)\s*\d+\s*(lbs?|pounds?|kg|kilos?)?\b/gi, domain: 'health' },
    { pattern: /(?:blood\s*pressure|bp)\s*\d+[\/\-]\d+/gi, domain: 'health' },
    { pattern: /\bheart\s*rate\s*\d+/gi, domain: 'health' },
    // Fitness
    { pattern: /\b(ran|walked|cycled|swam|worked out|exercised|jogged|hiked|biked)\b.*\d+\s*(miles?|km|min|minutes?|hours?)/gi, domain: 'fitness' },
    { pattern: /\b\d+\s*(steps?|reps?|sets?)\b/gi, domain: 'fitness' },
    // Nutrition
    { pattern: /\b(ate|had|eaten|eat)\b.*\d+\s*(calories?|cal)/gi, domain: 'nutrition' },
    { pattern: /\b(drank|drink|had)\b.*\d+\s*(oz|ounces?)\b.*\b(water|coffee|tea)/gi, domain: 'nutrition' },
    // Financial
    { pattern: /\b(spent|paid|bought|purchased|earned|received)\b.*\$?\d+/gi, domain: 'financial' },
  ]
  
  // Check for retrieval intents
  for (const pattern of retrievalPatterns) {
    const matches = lowerMessage.match(pattern)
    if (matches) {
      for (const match of matches) {
        intents.push({ type: 'retrieval', segment: match.trim() })
      }
    }
  }
  
  // Check for data logging intents
  for (const { pattern, domain } of dataLogPatterns) {
    const matches = lowerMessage.match(pattern)
    if (matches) {
      for (const match of matches) {
        // Avoid duplicates
        if (!intents.some(i => i.segment.includes(match.trim()) || match.includes(i.segment))) {
          intents.push({ type: 'data_log', segment: match.trim(), domain })
        }
      }
    }
  }
  
  console.log(`🔍 Mixed intent detection found ${intents.length} intents:`, intents.map(i => `${i.type}:"${i.segment}"`).join(', '))
  
  return {
    isMulti: intents.length >= 2,
    intents
  }
}

/**
 * Detects if a message contains multiple data logging intents.
 * Examples:
 * - "ran 5 miles, blood pressure 123/80, ate chicken sandwich 450 calories" → TRUE (3 intents)
 * - "walked 30 minutes and drank 20oz water" → TRUE (2 intents)
 * - "spent $50 at grocery store" → FALSE (1 intent)
 * - "what's my net worth?" → FALSE (query, not data entry)
 */
function detectMultiIntentMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  
  // FIRST: Check for MIXED intent types (retrieval + data logging)
  // This handles cases like "pull up my driver's license and I weigh 120 pounds"
  const mixedResult = detectMixedIntents(message)
  if (mixedResult.isMulti) {
    console.log('🎯 Detected MIXED intents (e.g., retrieval + data logging)')
    return true
  }
  
  // Skip if it's clearly a PURE query (starts with question words AND has no data logging)
  const queryStarters = ['what', 'how', 'when', 'where', 'why']
  const hasQueryStart = queryStarters.some(q => lowerMessage.startsWith(q))
  const hasDataPattern = /\b(weigh|weight|blood\s*pressure|bp|spent|paid|ran|walked|ate|drank)\b.*\d+/i.test(lowerMessage)
  
  if (hasQueryStart && !hasDataPattern) {
    return false
  }
  
  // Skip if it's a single-intent action command (no "and" with data logging)
  const singleActionPrefixes = ['go to', 'open', 'navigate', 'create chart', 'add to calendar', 'schedule', 'delete', 'remove', 'update']
  if (singleActionPrefixes.some(p => lowerMessage.startsWith(p)) && !/ and /i.test(lowerMessage)) {
    return false
  }
  
  // Count matches for different domains
  let matchCount = 0
  const matchedDomains = new Set<string>()
  
  // Check fitness activities
  if (/\b(ran|walked|cycled|swam|worked out|exercised|jogged|hiked|biked)\b/i.test(lowerMessage)) {
    matchCount++
    matchedDomains.add('fitness')
  }
  
  // Check health vitals - blood pressure (supports "BP 120/80" and "blood pressure 120/80")
  if (/(?:blood\s*pressure|bp)\s*\d+[\/\-]\d+/i.test(lowerMessage)) {
    matchCount++
    matchedDomains.add('health_bp')
  }
  if (/\b(weigh|weight|i\s+weigh)\s*\d+/i.test(lowerMessage)) {
    matchCount++
    matchedDomains.add('health_weight')
  }
  
  // Check nutrition
  if (/\b(ate|had|eaten|eat)\b.*\d+\s*(calories?|cal)/i.test(lowerMessage) || 
      /\b(breakfast|lunch|dinner|snack|meal)\b.*\d+\s*(calories?|cal)/i.test(lowerMessage) ||
      /\b(chicken|beef|fish|salad|pizza|sandwich|burger|pasta|rice|soup|steak|eggs?)\b.*\d+\s*(cal|calories?)/i.test(lowerMessage)) {
    matchCount++
    matchedDomains.add('nutrition_meal')
  }
  if (/\b(drank|drink)\b.*\d+\s*(oz|ounces?)/i.test(lowerMessage) ||
      /\b\d+\s*(oz|ounces?)\s*(of\s*)?(water)/i.test(lowerMessage)) {
    matchCount++
    matchedDomains.add('nutrition_water')
  }
  
  // Check financial
  if (/\b(spent|paid|bought|purchased)\b.*\$?\d+/i.test(lowerMessage)) {
    matchCount++
    matchedDomains.add('financial')
  }
  
  // Check for separators that indicate multiple items
  const separators = [',', ' and ', ';', ' also ', ' plus ']
  const hasSeparators = separators.some(sep => lowerMessage.includes(sep))
  
  // Multi-intent if:
  // 1. Has 2+ different domain matches, OR
  // 2. Has separators AND at least one data pattern match
  console.log(`🔍 Multi-intent detection: ${matchCount} patterns matched across ${matchedDomains.size} domains, hasSeparators: ${hasSeparators}`)
  
  return matchedDomains.size >= 2 || (hasSeparators && matchCount >= 2)
}

// ============================================
// GOOGLE CALENDAR HELPER
// ============================================
async function createGoogleCalendarEvent(
  supabase: any,
  eventDetails: {
    title: string
    description?: string
    date?: string  // YYYY-MM-DD
    time?: string  // HH:MM format or "2pm" format
    duration?: number  // minutes, default 60
    location?: string
    type?: string // interview, meeting, plan, appointment
  }
): Promise<{ success: boolean; message: string; eventId?: string; htmlLink?: string }> {
  try {
    // Get the user's session to get their OAuth token
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return {
        success: false,
        message: '❌ Not signed in. Please sign in to add events to Google Calendar.'
      }
    }

    const token = session.provider_token
    if (!token) {
      return {
        success: false,
        message: '📅 Google Calendar not connected. Please sign out and sign back in with Google to enable calendar access.'
      }
    }

    // Parse the date
    let eventDate = new Date()
    if (eventDetails.date) {
      eventDate = new Date(eventDetails.date)
    }

    // Parse the time
    let hours = 9  // Default 9 AM
    let minutes = 0
    
    if (eventDetails.time) {
      // Handle formats like "2pm", "2:30pm", "14:00", "9:00 am"
      const timeStr = eventDetails.time.toLowerCase().trim()
      const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
      
      if (timeMatch) {
        hours = parseInt(timeMatch[1])
        minutes = parseInt(timeMatch[2] || '0')
        
        if (timeMatch[3]) {
          if (timeMatch[3].toLowerCase() === 'pm' && hours !== 12) {
            hours += 12
          } else if (timeMatch[3].toLowerCase() === 'am' && hours === 12) {
            hours = 0
          }
        }
      }
    }

    eventDate.setHours(hours, minutes, 0, 0)

    // Calculate end time
    const duration = eventDetails.duration || 60 // Default 60 minutes
    const endDate = new Date(eventDate.getTime() + duration * 60 * 1000)

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Build the calendar event
    const calendarEvent = {
      summary: eventDetails.title,
      description: eventDetails.description || `Created via LifeHub AI Assistant${eventDetails.type ? ` - ${eventDetails.type}` : ''}`,
      location: eventDetails.location,
      start: {
        dateTime: eventDate.toISOString(),
        timeZone: timezone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: timezone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 10 }
        ]
      }
    }

    console.log('📅 Creating Google Calendar event:', calendarEvent)

    // Create the event using Google Calendar API
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(calendarEvent)
      }
    )

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json()
      console.error('❌ Google Calendar API error:', errorData)
      
      // Check if token expired
      if (calendarResponse.status === 401) {
        return {
          success: false,
          message: '📅 Google Calendar token expired. Please sign out and sign back in to reconnect.'
        }
      }
      
      return {
        success: false,
        message: `❌ Failed to create calendar event: ${errorData.error?.message || 'Unknown error'}`
      }
    }

    const createdEvent = await calendarResponse.json()
    console.log('✅ Google Calendar event created:', createdEvent.id)

    return {
      success: true,
      message: `✅ Added "${eventDetails.title}" to Google Calendar`,
      eventId: createdEvent.id,
      htmlLink: createdEvent.htmlLink
    }
  } catch (error: any) {
    console.error('❌ Error creating calendar event:', error)
    return {
      success: false,
      message: `❌ Error creating calendar event: ${error.message}`
    }
  }
}

// ============================================
// FULL NUTRITION ESTIMATION HELPER (calories + macros)
// ============================================
async function estimateFullNutrition(mealName: string): Promise<{
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
}> {
  const openAIKey = process.env.OPENAI_API_KEY
  
  if (!openAIKey) {
    // Fallback: estimate 400 cal for an average meal
    return { calories: 400, protein: 25, carbs: 40, fats: 15, fiber: 5 }
  }

  try {
    console.log(`🥗 [NUTRITION-AI] Estimating full nutrition for: ${mealName}`)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert. Estimate calories and macronutrients for meals.
Return ONLY a JSON object: {"calories": <number>, "protein": <g>, "carbs": <g>, "fats": <g>, "fiber": <g>}
Use typical restaurant portion sizes. Be accurate based on the food description.
Return ONLY valid JSON, no explanations.`
          },
          { role: 'user', content: `Estimate nutrition for: ${mealName}` }
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    })

    if (!response.ok) throw new Error('API failed')

    const data = await response.json()
    const nutrition = JSON.parse(data.choices[0]?.message?.content?.trim() || '{}')
    console.log(`✅ [NUTRITION-AI] Estimated:`, nutrition)
    
    return {
      calories: Math.round(Number(nutrition.calories) || 400),
      protein: Math.round(Number(nutrition.protein) || 25),
      carbs: Math.round(Number(nutrition.carbs) || 40),
      fats: Math.round(Number(nutrition.fats) || 15),
      fiber: Math.round(Number(nutrition.fiber) || 5)
    }
  } catch (error) {
    console.error('❌ [NUTRITION-AI] Failed:', error)
    return { calories: 400, protein: 25, carbs: 40, fats: 15, fiber: 5 }
  }
}

// MACRO ESTIMATION HELPER (when calories are known)
// ============================================
async function estimateMealMacros(mealName: string, calories: number): Promise<{
  protein: number
  carbs: number
  fats: number
  fiber: number
}> {
  const openAIKey = process.env.OPENAI_API_KEY
  
  if (!openAIKey || calories <= 0) {
    // Fallback estimation based on calories
    const protein = Math.round(calories * 0.2 / 4)
    const carbs = Math.round(calories * 0.45 / 4)
    const fats = Math.round(calories * 0.35 / 9)
    const fiber = Math.round(carbs * 0.1)
    return { protein, carbs, fats, fiber }
  }

  try {
    console.log(`🥗 [MACRO-AI] Estimating macros for: ${mealName} (${calories} cal)`)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert. Estimate macronutrients for a meal.
Return ONLY a JSON object: {"protein": <g>, "carbs": <g>, "fats": <g>, "fiber": <g>}
Base on typical nutritional values. Protein/Carbs=4cal/g, Fat=9cal/g.
Return ONLY valid JSON.`
          },
          { role: 'user', content: `Meal: ${mealName}\nCalories: ${calories}` }
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    })

    if (!response.ok) throw new Error('API failed')

    const data = await response.json()
    const macros = JSON.parse(data.choices[0]?.message?.content?.trim() || '{}')
    console.log(`✅ [MACRO-AI] Estimated:`, macros)
    
    return {
      protein: Math.round(Number(macros.protein) || 0),
      carbs: Math.round(Number(macros.carbs) || 0),
      fats: Math.round(Number(macros.fats) || 0),
      fiber: Math.round(Number(macros.fiber) || 0)
    }
  } catch (error) {
    console.error('❌ [MACRO-AI] Failed:', error)
    const protein = Math.round(calories * 0.2 / 4)
    const carbs = Math.round(calories * 0.45 / 4)
    const fats = Math.round(calories * 0.35 / 9)
    const fiber = Math.round(carbs * 0.1)
    return { protein, carbs, fats, fiber }
  }
}

// ============================================
// SEND HANDLER - Share documents/data via email or SMS
// ============================================
async function intelligentSendHandler(
  message: string,
  userId: string,
  supabase: any,
  baseUrl: string,
  cookieHeader: string
) {
  const openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey) return { isSend: false }

  // Quick check for send-related keywords
  const sendKeywords = /\b(send|share|email|text|sms|forward|deliver)\b/i
  if (!sendKeywords.test(message)) {
    return { isSend: false }
  }

  console.log('📤 Checking if message is a SEND command...')

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a SEND/SHARE COMMAND DETECTOR for a life management app.

DETECT if user wants to SEND or SHARE documents, data, or information to someone else.

SEND commands include:
- "Send my medical records to Dr. Smith"
- "Email the car registration to my brother"
- "Text my insurance card to my wife"
- "Share my expense report with my accountant"
- "Forward my vaccination records to the school"
- "Send last month's health data to my doctor"
- "Email a summary of my finances to John"
- "Text my vehicle info to Mike"

If it's a SEND command, respond with JSON:
{
  "isSend": true,
  "recipient_name": "Name of the person (if mentioned)",
  "recipient_type": "Relationship type like doctor, brother, accountant, wife, etc. (if mentioned)",
  "document_type": "What document/data type to send (e.g., 'medical records', 'car registration', 'expenses')",
  "domain": "The domain if clear (health, vehicles, financial, insurance, pets, etc.) or null",
  "send_method": "email or sms or both (based on keywords like 'text', 'email', 'message')",
  "include_charts": true/false (if user mentions charts, graphs, visualizations),
  "generate_summary": true/false (if user wants a summary),
  "date_range": "this_week|last_week|this_month|last_month|this_year|all (if time period mentioned)",
  "custom_message": "Any custom message the user wants to include (or null)"
}

If NOT a send command, respond:
{ "isSend": false }

EXAMPLES:

"Send my medical records to Dr. Smith"
{ "isSend": true, "recipient_name": "Dr. Smith", "recipient_type": "doctor", "document_type": "medical records", "domain": "health", "send_method": "email", "include_charts": false, "generate_summary": false }

"Text my car registration to my brother"
{ "isSend": true, "recipient_name": null, "recipient_type": "brother", "document_type": "car registration", "domain": "vehicles", "send_method": "sms", "include_charts": false, "generate_summary": false }

"Email a summary of my expenses this month to my accountant with charts"
{ "isSend": true, "recipient_name": null, "recipient_type": "accountant", "document_type": "expenses", "domain": "financial", "send_method": "email", "include_charts": true, "generate_summary": true, "date_range": "this_month" }

"Share my pet's vaccination records with the vet"
{ "isSend": true, "recipient_name": null, "recipient_type": "vet", "document_type": "vaccination records", "domain": "pets", "send_method": "email", "include_charts": false, "generate_summary": false }

"Send my weight progress report to my doctor"
{ "isSend": true, "recipient_name": null, "recipient_type": "doctor", "document_type": "weight progress report", "domain": "health", "send_method": "email", "include_charts": true, "generate_summary": true }

"What's my weight?" (this is a QUERY, not a send)
{ "isSend": false }

"Delete my expense" (this is a DELETE action, not send)
{ "isSend": false }

Only respond with valid JSON.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      console.error('❌ OpenAI API error:', response.statusText)
      return { isSend: false }
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content?.trim()
    
    console.log('🤖 Send analyzer response:', content)
    
    const parsed = JSON.parse(content)
    
    if (!parsed.isSend) {
      return { isSend: false }
    }

    console.log('✅ Detected SEND command to:', parsed.recipient_name || parsed.recipient_type)

    // Execute the send via the send API (forward cookies so auth works server-side)
    const sendResponse = await fetch(new URL('/api/ai-assistant/send', baseUrl), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {})
      },
      body: JSON.stringify({
        action: 'send',
        recipient_name: parsed.recipient_name,
        recipient_type: parsed.recipient_type,
        document_type: parsed.document_type,
        domain: parsed.domain,
        send_method: parsed.send_method,
        include_charts: parsed.include_charts,
        generate_summary: parsed.generate_summary,
        date_range: parsed.date_range,
        custom_message: parsed.custom_message
      })
    })

    const sendResult = await sendResponse.json()
    console.log('📥 Send result:', sendResult)

    return {
      isSend: true,
      ...sendResult
    }

  } catch (error: any) {
    console.error('❌ Send handler error:', error)
    return { isSend: false }
  }
}

// ============================================
// ACTION HANDLER - Delete, Update, Predict, Export
// ============================================
async function intelligentActionHandler(
  message: string,
  userId: string,
  supabase: any,
  baseUrl: string,
  cookieHeader: string
) {
  const openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey) return { isAction: false }

  console.log('🎯 Checking if message is an ACTION (delete/update/predict/export)...')

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an ACTION DETECTOR for a life management app.

DETECT if user wants to perform one of these ACTIONS:
- DELETE: Remove data (e.g., "delete", "remove", "erase", "cancel")
- UPDATE: Modify data (e.g., "change", "update", "edit", "rename", "set", "mark as")
- PREDICT: Forecast/project (e.g., "predict", "forecast", "when will I", "project")
- EXPORT: Download data (e.g., "export", "download", "save as CSV", "get my data")
- ANALYZE: Deep analysis (e.g., "analyze", "find patterns", "find duplicates")
- CORRELATE: Cross-domain patterns (e.g., "correlation", "how does X affect Y", "relationship between")
- CALCULATE: Financial math (e.g., "calculate", "compute", "compound interest", "mortgage payment")
- REPORT: Generate reports (e.g., "generate report", "create summary", "monthly report")
- ARCHIVE: Archive old data (e.g., "archive", "move to archive")
- BULK: Bulk operations (e.g., "delete all", "mark all", "update all")

If it's an ACTION, respond with JSON:
{
  "isAction": true,
  "actionType": "delete|update|predict|export|analyze|correlate|calculate|report|archive|bulk_delete|bulk_update",
  "domain": "domain_name or all",
  "params": {
    "description": "what to find/match",
    "dateRange": "today|yesterday|this_week|last_week|this_month|last_month|this_year|all",
    "match": { field: value },
    "updates": { field: newValue },
    "targetValue": number,
    "metric": "field name",
    "domain1": "first domain for correlation",
    "domain2": "second domain for correlation",
    "calculation": "compound_interest|monthly_payment|savings_goal|bmi|calorie_deficit",
    "inputs": { calculation inputs },
    "format": "csv|json",
    "olderThan": days_number
  }
}

If NOT an action, respond:
{ "isAction": false }

EXAMPLES:

"Delete my expense from yesterday"
{ "isAction": true, "actionType": "delete", "domain": "financial", "params": { "dateRange": "yesterday", "match": { "type": "expense" } } }

"Delete all completed tasks older than 30 days"
{ "isAction": true, "actionType": "bulk_delete", "domain": "tasks", "params": { "match": { "status": "completed" }, "olderThan": 30 } }

"Update my weight to 170 lbs"
{ "isAction": true, "actionType": "update", "domain": "health", "params": { "dateRange": "today", "updates": { "weight": 170, "unit": "lbs" } } }

"Change the grocery expense to $45"
{ "isAction": true, "actionType": "update", "domain": "financial", "params": { "description": "grocery", "updates": { "amount": 45 } } }

"Predict when I'll reach my weight goal of 165"
{ "isAction": true, "actionType": "predict", "domain": "health", "params": { "metric": "weight", "targetValue": 165 } }

"Export my financial data as CSV"
{ "isAction": true, "actionType": "export", "domain": "financial", "params": { "format": "csv" } }

"How does sleep affect my fitness?"
{ "isAction": true, "actionType": "correlate", "domain": "multiple", "params": { "domain1": "health", "metric1": "sleep", "domain2": "fitness", "metric2": "workout" } }

"Calculate compound interest on $10000 at 7% for 10 years"
{ "isAction": true, "actionType": "calculate", "domain": "financial", "params": { "calculation": "compound_interest", "inputs": { "principal": 10000, "rate": 7, "years": 10 } } }

"Generate a monthly financial report"
{ "isAction": true, "actionType": "report", "domain": "financial", "params": { "dateRange": "this_month", "reportType": "monthly" } }

"Archive all expenses from 2023"
{ "isAction": true, "actionType": "archive", "domain": "financial", "params": { "dateRange": "last_year" } }

"Show my expenses" (this is a QUERY, not an action)
{ "isAction": false }

"Spent $50 on groceries" (this is a CREATE command, not an action)
{ "isAction": false }

Only respond with valid JSON.`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      console.error('❌ OpenAI API error:', response.statusText)
      return { isAction: false }
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content?.trim()
    
    console.log('🤖 Action analyzer response:', content)
    
    const parsed = JSON.parse(content)
    
    if (!parsed.isAction) {
      return { isAction: false }
    }

    console.log('✅ Detected ACTION:', parsed.actionType, 'for domain:', parsed.domain)

    // Execute the action via the actions API (forward cookies so auth works server-side)
    const actionResponse = await fetch(new URL('/api/ai-assistant/actions', baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {})
      },
      body: JSON.stringify({
        action: parsed.actionType,
        domain: parsed.domain,
        parameters: parsed.params
      })
    })

    const actionResult = await actionResponse.json()
    console.log('📥 Action result:', actionResult)

    return {
      isAction: true,
      actionType: parsed.actionType,
      ...actionResult
    }

  } catch (error: any) {
    console.error('❌ Action handler error:', error)
    return { isAction: false }
  }
}

// User time info from client for accurate meal type detection
interface UserTimeInfo {
  localTime?: string
  localHour?: number
  timezone?: string
  timestamp?: string
}

// Intelligent AI-powered command parser
async function intelligentCommandParser(
  message: string,
  userId: string,
  supabase: any,
  baseUrl: string,
  cookieHeader: string,
  userTime?: UserTimeInfo
) {
  const openAIKey = process.env.OPENAI_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  
  if (!openAIKey && !geminiKey) {
    console.error('❌ No AI API keys configured (OpenAI or Gemini)')
    return { isCommand: false }
  }

  console.log('🧠 Calling AI to parse command...')
  
  // ============================================
  // FETCH USER'S EXISTING ITEMS FOR CONTEXT
  // ============================================
  console.log('📦 Fetching user inventory for smart CRUD...')
  
  // Fetch vehicles
  const { data: vehicles } = await supabase
    .from('domain_entries')
    .select('id, title, metadata')
    .eq('user_id', userId)
    .eq('domain', 'vehicles')
    .order('created_at', { ascending: false })
    .limit(10)
  
  // Fetch pets
  const { data: pets } = await supabase
    .from('domain_entries')
    .select('id, title, metadata')
    .eq('user_id', userId)
    .eq('domain', 'pets')
    .order('created_at', { ascending: false })
    .limit(10)
  
  // Fetch appliances
  const { data: appliances } = await supabase
    .from('domain_entries')
    .select('id, title, metadata')
    .eq('user_id', userId)
    .eq('domain', 'appliances')
    .order('created_at', { ascending: false })
    .limit(10)
  
  // Build user inventory context
  const userInventory = {
    vehicles: (vehicles || []).map((v: any) => ({
      id: v.id,
      name: v.title,
      make: v.metadata?.make,
      model: v.metadata?.model,
      year: v.metadata?.year,
      mileage: v.metadata?.mileage || v.metadata?.currentMileage
    })),
    pets: (pets || []).map((p: any) => ({
      id: p.id,
      name: p.title || p.metadata?.petName || p.metadata?.name,
      type: p.metadata?.type || p.metadata?.species
    })),
    appliances: (appliances || []).map((a: any) => ({
      id: a.id,
      name: a.title,
      brand: a.metadata?.brand,
      model: a.metadata?.model
    }))
  }
  
  console.log('📦 User inventory:', JSON.stringify(userInventory, null, 2))
  
  // Build inventory context string for AI
  const inventoryContext = `
🚗 USER'S EXISTING VEHICLES:
${userInventory.vehicles.length > 0 ? userInventory.vehicles.map((v: any) => `- "${v.name}" (${v.make || ''} ${v.model || ''} ${v.year || ''}) - Mileage: ${v.mileage || 'unknown'} [ID: ${v.id}]`).join('\n') : '- No vehicles registered'}

🐾 USER'S PETS:
${userInventory.pets.length > 0 ? userInventory.pets.map((p: any) => `- "${p.name}" (${p.type || 'pet'}) [ID: ${p.id}]`).join('\n') : '- No pets registered'}

🏠 USER'S APPLIANCES:
${userInventory.appliances.length > 0 ? userInventory.appliances.map((a: any) => `- "${a.name}" (${a.brand || ''} ${a.model || ''}) [ID: ${a.id}]`).join('\n') : '- No appliances registered'}
`
  
  const systemPromptContent = `You are an INTELLIGENT ACTION-ORIENTED ASSISTANT for a life management app with 21 domains:
health, fitness, nutrition, financial, tasks, habits, goals, mindfulness, relationships, 
career, education, legal, insurance, travel, vehicles, property, home, appliances, pets, 
hobbies, collectibles, digital-life.

${inventoryContext}

🚨🚨🚨 CRITICAL: SMART UPDATE vs CREATE RULES 🚨🚨🚨

BEFORE creating ANY new entry for vehicles, pets, or appliances, CHECK THE USER'S INVENTORY ABOVE!

**UPDATE EXISTING ITEMS (when item already exists):**
- User says "update my Honda to 50000 miles" → Honda EXISTS in inventory → UPDATE action
- User says "Buddy went to the vet" → Buddy EXISTS in pets → UPDATE/LOG to existing pet
- User says "my car has 75000 miles now" → If ONE car exists → UPDATE that car

**CREATE NEW ITEMS (when item doesn't exist):**
- User says "add my new Tesla Model 3" → Tesla NOT in inventory → CREATE new vehicle
- User says "I got a new puppy named Max" → Max NOT in pets → CREATE new pet

**AMBIGUOUS CASES - ASK FOR CONFIRMATION:**
- User mentions an item that MIGHT match existing → requiresConfirmation: true
- User says "Honda Accord 50000 miles" but inventory has "Honda Civic" → ASK: "Did you mean to update your Honda Civic, or add a new Honda Accord?"

For UPDATE operations, include:
{
  "action": "update_entry",
  "existingItemId": "[ID from inventory]",
  "existingItemName": "[name from inventory]",
  "updates": { ...fields to update... }
}

For operations where you're NOT SURE, include:
{
  "requiresConfirmation": true,
  "confirmationQuestion": "I found [item] in your [domain]. Did you want to update it, or add a new entry?",
  "options": ["Update existing", "Create new"]
}

YOUR PRIMARY JOB: DETECT and EXECUTE data-logging commands. Be smart about detecting when users want to LOG DATA vs ASK QUESTIONS.

🎯 THESE ARE COMMANDS (statements/declarations):
- "interview at Amazon tomorrow" → CAREER command (stating a fact)
- "spent $35 on groceries" → FINANCIAL command (stating action)
- "walked 45 minutes" → FITNESS command (stating action)
- "drank 16 ounces water" → NUTRITION command (stating action)
- "weigh 175 pounds" → HEALTH command (stating measurement)
- "add task buy milk" → TASKS command (explicit add)
- "create task to call doctor" → TASKS command
- "remind me to pay bills" → TASKS command
- "make a note about the meeting" → MINDFULNESS/notes command
- "add note that project deadline is next week" → MINDFULNESS/notes command
- "goal to launch product" → GOALS command (stating goal)
- "trip to Paris next month" → TRAVEL command (stating plan)

❌ THESE ARE NOT COMMANDS (questions/requests):
- "how much did I spend?" → Question (starts with how/what/when/why)
- "show me my fitness data" → Request (starts with show/tell/give)
- "what's my weight trend?" → Analysis request (asking for insight)
- "can you help with..." → Question (starts with can/could/would)

🚨 CRITICAL INTERVIEW/APPOINTMENT RULES:
- "interview at [company] [when]" = ALWAYS a command
- "meeting with [person/company]" = ALWAYS a command  
- "appointment at [time/place]" = ALWAYS a command
- Extract company, date, time automatically

🎯 TASK CREATION RULES:
- "add task [description]" → TASKS domain, extract title and priority
- "create task [description]" → TASKS domain
- "remind me to [action]" → TASKS domain, set due date if mentioned
- "todo: [description]" → TASKS domain
- Extract: title (required), description, priority (low/medium/high), due_date (if mentioned)

🏃 HABIT CREATION RULES:
- "add habit [name]" → action: "create_habit"
- "create habit [name]" → action: "create_habit"
- "new habit [name]" → action: "create_habit"
- "track [habit name] daily/weekly" → action: "create_habit"
- Extract: name, icon (emoji if mentioned), frequency (daily/weekly/monthly)

🥗 NUTRITION/MEAL RULES:
- "I ate/eat [food]" → NUTRITION domain with type: "meal" (calories optional - will be estimated)
- "had [food] for [calories] calories" → NUTRITION domain with type: "meal"
- "ate a cheese burrito" → NUTRITION domain, { "type": "meal", "name": "cheese burrito" } (we estimate nutrition!)
- "ate a chicken sandwich 360 cal" → NUTRITION domain with type: "meal"
- MUST include in data: { "type": "meal", "name": "[food name]" }
- Calories are OPTIONAL - system will auto-estimate if not provided!
- Extract: name (the food - REQUIRED), calories (if mentioned), protein/carbs/fats if mentioned
- If user just says what they ate without numbers, still log it as a meal with the food name!

💳 BILL CREATION RULES:
- "add bill [name] $[amount]" → action: "create_bill"
- "create bill [name]" → action: "create_bill"
- "new bill [name] due [date]" → action: "create_bill"
- Extract: name, amount, dueDate, recurring (true/false), category

📅 EVENT CREATION RULES:
- "schedule [event] on [date]" → action: "create_event"
- "add event [title]" → action: "create_event"
- "meeting on [date] at [time]" → action: "create_event"
- Extract: title, date, time, location, description

📅 GOOGLE CALENDAR COMMANDS (action: "add_to_google_calendar"):
- "add to google calendar [event]" → add_to_google_calendar
- "add to my calendar [event]" → add_to_google_calendar
- "put [event] on my google calendar" → add_to_google_calendar
- "schedule on google calendar [event]" → add_to_google_calendar
- "create google calendar event [event]" → add_to_google_calendar
- "add [event] to calendar" → add_to_google_calendar
- "put [event] on calendar" → add_to_google_calendar
- "calendar event: [event]" → add_to_google_calendar
- "gcal: [event]" → add_to_google_calendar
- Extract: title/summary, date, time, duration (minutes), location, description, allDay (boolean)
- Use natural language parsing for dates/times: "tomorrow at 3pm", "next Tuesday", "Dec 15 at 2:30pm"
- Default duration is 60 minutes if not specified

🧭 NAVIGATION COMMANDS (action: "navigate"):
- "go to [page/domain]" → navigate
- "open [page/domain]" → navigate
- "show me [page/domain]" → navigate
- "take me to [page/domain]" → navigate

🔧 TOOL COMMANDS (action: "open_tool"):
- "open [tool name]" → open_tool
- "use [tool name] calculator" → open_tool
- "start [tool name]" → open_tool
- Tools: BMI, calorie, mortgage, compound interest, retirement, loan, tip calculator, receipt scanner, document scanner, etc.

📊 CHART/VISUALIZATION COMMANDS (action: "custom_chart"):
- "create a chart of [data]" → custom_chart
- "show me a [chart type] of [domain]" → custom_chart
- "visualize my [domain] data" → custom_chart
- "graph my [metric] over [time period]" → custom_chart
- "plot [metric] for [domain]" → custom_chart
- Chart types: line, bar, pie, area, multi_line, scatter, heatmap, radar
- Extract: domain(s), chartType, dateRange, metric, groupBy

📝 NOTE CREATION RULES:
- "make a note [content]" → MINDFULNESS domain (type: note)
- "add note [content]" → MINDFULNESS domain (type: note)
- "note: [content]" → MINDFULNESS domain (type: note)
- "remember that [content]" → MINDFULNESS domain (type: note)
- Extract: title (first sentence or summary), content (full text)

📔 JOURNAL ENTRY RULES (action: "create_journal"):
- "journal: [content]" → create_journal
- "write in my journal [content]" → create_journal
- "journal entry [content]" → create_journal  
- "add journal entry [content]" → create_journal
- "create journal entry [content]" → create_journal
- "dear diary [content]" → create_journal
- "today I [content] (long personal reflection)" → create_journal
- Extract: title (optional, first sentence or date), content (full journal text), mood (if mentioned)
- Journal entries are longer personal reflections, notes are quick thoughts

✅ TASK COMPLETION RULES (action: "complete_task"):
- "mark [task name] as done" → complete_task
- "complete task [task name]" → complete_task
- "finished [task name]" → complete_task
- "done with [task name]" → complete_task
- "[task name] is complete" → complete_task
- "check off [task name]" → complete_task
- "completed [task name]" → complete_task
- Extract: taskName (the task to complete - can be partial match)

✅ HABIT COMPLETION RULES (action: "complete_habit"):
- "mark [habit name] as done" → complete_habit (if it's a habit)
- "did my [habit name] habit" → complete_habit
- "completed [habit name] habit" → complete_habit
- "logged [habit name]" → complete_habit
- "checked off [habit name] habit" → complete_habit
- "did [habit name] today" → complete_habit
- Extract: habitName (the habit to mark complete)

If it's a COMMAND (default to YES if unsure), respond with JSON:
{
  "isCommand": true,
  "domain": "domain_name",
  "data": { extracted structured data with ALL fields },
  "confirmationMessage": "✅ Logged [what] to [domain]"
}

For ACTION commands (create_habit, create_bill, create_event, add_to_google_calendar, navigate, open_tool, custom_chart, create_journal, complete_task, complete_habit):
{
  "isCommand": true,
  "action": "action_type",
  "domain": "domain_name (if applicable)",
  "data": { action-specific parameters },
  "confirmationMessage": "✅ Description of action"
}

Examples of ACTION commands:
- "add habit exercise daily" → { "isCommand": true, "action": "create_habit", "data": { "name": "Exercise", "frequency": "daily", "icon": "💪" }, "confirmationMessage": "✅ Created habit: Exercise 💪 (daily)" }
- "add bill Netflix $15.99 monthly" → { "isCommand": true, "action": "create_bill", "data": { "name": "Netflix", "amount": 15.99, "recurring": true, "recurrencePeriod": "monthly" }, "confirmationMessage": "✅ Created bill: Netflix $15.99/month" }
- "go to health page" → { "isCommand": true, "action": "navigate", "data": { "destination": "health" }, "confirmationMessage": "🧭 Opening Health page" }
- "open BMI calculator" → { "isCommand": true, "action": "open_tool", "data": { "tool": "bmi_calculator" }, "confirmationMessage": "🔧 Opening BMI Calculator" }
- "create a pie chart of my expenses" → { "isCommand": true, "action": "custom_chart", "data": { "domain": "financial", "chartType": "pie", "dateRange": "this_month", "metric": "expenses", "groupBy": "category" }, "confirmationMessage": "📊 Creating pie chart of expenses" }
- "visualize my health data over the past year" → { "isCommand": true, "action": "custom_chart", "data": { "domain": "health", "chartType": "line", "dateRange": "this_year", "groupBy": "date" }, "confirmationMessage": "📊 Creating health data visualization" }
- "add to google calendar meeting with John tomorrow at 3pm" → { "isCommand": true, "action": "add_to_google_calendar", "data": { "title": "Meeting with John", "date": "tomorrow", "time": "15:00", "duration": 60 }, "confirmationMessage": "📅 Adding to Google Calendar: Meeting with John" }
- "put dentist appointment Dec 20 at 10am on my calendar" → { "isCommand": true, "action": "add_to_google_calendar", "data": { "title": "Dentist appointment", "date": "2024-12-20", "time": "10:00", "duration": 60 }, "confirmationMessage": "📅 Adding to Google Calendar: Dentist appointment" }
- "gcal: team standup Monday at 9:30am for 30 minutes" → { "isCommand": true, "action": "add_to_google_calendar", "data": { "title": "Team standup", "date": "Monday", "time": "09:30", "duration": 30 }, "confirmationMessage": "📅 Adding to Google Calendar: Team standup" }
- "add birthday party to calendar on Saturday all day" → { "isCommand": true, "action": "add_to_google_calendar", "data": { "title": "Birthday party", "date": "Saturday", "allDay": true }, "confirmationMessage": "📅 Adding to Google Calendar: Birthday party (all day)" }
- "journal: Today was a great day. I finished my project and felt really accomplished." → { "isCommand": true, "action": "create_journal", "data": { "title": "Great day", "content": "Today was a great day. I finished my project and felt really accomplished.", "mood": "happy" }, "confirmationMessage": "📔 Journal entry saved" }
- "write in my journal about the meeting" → { "isCommand": true, "action": "create_journal", "data": { "title": "Meeting reflection", "content": "about the meeting" }, "confirmationMessage": "📔 Journal entry saved" }
- "mark buy groceries as done" → { "isCommand": true, "action": "complete_task", "data": { "taskName": "buy groceries" }, "confirmationMessage": "✅ Task completed: buy groceries" }
- "finished the project report" → { "isCommand": true, "action": "complete_task", "data": { "taskName": "project report" }, "confirmationMessage": "✅ Task completed: project report" }
- "did my exercise habit" → { "isCommand": true, "action": "complete_habit", "data": { "habitName": "exercise" }, "confirmationMessage": "✅ Habit logged: exercise" }
- "completed meditation today" → { "isCommand": true, "action": "complete_habit", "data": { "habitName": "meditation" }, "confirmationMessage": "✅ Habit logged: meditation" }

If it's clearly NOT a command (rare), respond with:
{
  "isCommand": false
}

IMPORTANT RULES:
1. If message is a STATEMENT/DECLARATION → it's a COMMAND
2. If message is a QUESTION (how/what/when/why/show/tell) → NOT a command
3. Extract ALL data fields (company, date, time, amount, duration, etc.)
4. Water ALWAYS goes to "nutrition" domain
5. Interviews/meetings ALWAYS go to "career" domain
6. Tasks go to "tasks" domain - these are NOT mindfulness entries
7. Notes/quick thoughts go to "mindfulness" domain with type="note"
8. Pet expenses (vet visits, grooming, pet supplies, pet food) go to "pets" domain with type="vet_appointment" and include amount
9. Housing expenses (rent, mortgage, utilities, home repairs, HOA fees, property tax) go to "home" or "property" domain with type="expense"
10. Money goes to "financial" domain EXCEPT:
   - Pet expenses → "pets" domain with type="vet_appointment", amount, description
   - Housing expenses → "home" domain with type="expense", amount, description, category (rent/mortgage/utilities/repair/tax)
   - Vehicle expenses → "vehicles" domain
   For pet expenses, emit domain="pets" and structure: { "type": "vet_appointment", "amount": <number>, "date": "YYYY-MM-DD", "description": "vet visit|grooming|supplies" }
   For housing, emit domain="home" and structure: { "type": "expense", "amount": <number>, "date": "YYYY-MM-DD", "category": "rent|mortgage|utilities|repair|tax", "description": "..." }
11. Vehicle-related spending (oil change, maintenance/service, repairs, fuel/gas, registration/DMV fees, insurance premiums) MUST go to the "vehicles" domain. For these, emit domain="vehicles" and structure data accordingly:
   - maintenance/service → { "type": "maintenance", "serviceName": "oil change|brakes|tires|...", "amount": <number>, "cost": <number>, "date": "YYYY-MM-DD" }
   - fuel/gas → { "type": "cost", "costType": "fuel", "amount": <number>, "date": "YYYY-MM-DD", "description": "gas|fuel" }
   - repairs → { "type": "cost", "costType": "repair", "amount": <number>, "date": "YYYY-MM-DD", "description": "..." }
   - registration/DMV → { "type": "cost", "costType": "registration", "amount": <number>, "date": "YYYY-MM-DD" }
   - insurance premiums → { "type": "cost", "costType": "insurance", "amount": <number>, "date": "YYYY-MM-DD" }
   If the text mentions car/vehicle/auto, mileage, oil, gas/fuel, tires, brakes, service, or maintenance → prefer the "vehicles" domain.

🚗 VEHICLE MILEAGE UPDATE RULES (action: "update_vehicle_mileage"):
- "update my [vehicle name]'s mileage to [number]" → update_vehicle_mileage
- "set [vehicle name] mileage to [number]" → update_vehicle_mileage
- "change my [vehicle name]'s odometer to [number]" → update_vehicle_mileage
- "[vehicle name] is at [number] miles" → update_vehicle_mileage
- "my [vehicle name] has [number] miles now" → update_vehicle_mileage
- Extract: vehicleName (the vehicle to update), mileage (the new mileage number), unit (miles/km)
- IMPORTANT: These should UPDATE an existing vehicle entry, NOT create a new one!
- Example: "update my honda's mileage to 50000" → { "isCommand": true, "action": "update_vehicle_mileage", "domain": "vehicles", "data": { "vehicleName": "honda", "mileage": 50000, "unit": "miles" }, "confirmationMessage": "✅ Updated Honda's mileage to 50,000 miles" }

12. Exercises ALWAYS go to "fitness" domain

🐾 PET EXPENSE RULES:
- "[Pet name] had vet appointment $X" → PETS domain with type="vet_appointment", amount=X
- "Spent $X on [pet name]'s vet visit" → PETS domain with type="vet_appointment"
- "Bought dog food $X" → PETS domain with type="vet_appointment", description="dog food"
- Extract pet name from message if mentioned
- Include amount and description

🏠 HOUSING EXPENSE RULES:
- "Paid rent $X" → HOME domain with type="expense", category="rent"
- "Mortgage payment $X" → HOME/PROPERTY domain with type="expense", category="mortgage"
- "Electric bill $X" / "Water bill $X" → HOME domain with type="expense", category="utilities"
- "Fixed the sink $X" / "Plumber $X" → HOME domain with type="expense", category="repair"
- "Property tax $X" / "HOA fee $X" → PROPERTY domain with type="expense", category="tax"
- If message mentions: rent, mortgage, utilities, electric, water, gas (home), plumber, electrician, HVAC, repair (home), property tax, HOA → use HOME or PROPERTY domain

DECISION LOGIC:
- Starts with "how/what/when/where/why/show/tell/can/could/would"? → NOT a command
- States a fact, measurement, or action? → IS a command
- Contains "interview at/with", "spent $", "walked", "weigh"? → IS a command

Examples:
User: "interview at Amazon tomorrow"
{
  "isCommand": true,
  "domain": "career",
  "data": {
    "type": "interview",
    "company": "Amazon",
    "date": "tomorrow",
    "time": "",
    "interviewType": "scheduled"
  },
  "confirmationMessage": "✅ Logged interview with Amazon scheduled for tomorrow"
}

User: "walked 45 minutes"
{
  "isCommand": true,
  "domain": "fitness",
  "data": {
    "type": "workout",
    "exercise": "walking",
    "duration": 45
  },
  "confirmationMessage": "✅ Logged 45-minute walking workout"
}

User: "spent $35 on groceries"
{
  "isCommand": true,
  "domain": "financial",
  "data": {
    "type": "expense",
    "amount": 35,
    "description": "groceries"
  },
  "confirmationMessage": "✅ Logged expense: $35 for groceries"
}

User: "oil change $120 today"
{
  "isCommand": true,
  "domain": "vehicles",
  "data": {
    "type": "maintenance",
    "serviceName": "oil change",
    "amount": 120,
    "date": "today"
  },
  "confirmationMessage": "✅ Logged oil change ($120) in Vehicles"
}

User: "how much did I walk this week?"
{
  "isCommand": false
}

User: "what's my schedule?"
{
  "isCommand": false
}

User: "tell me about my finances"
{
  "isCommand": false
}

User: "rex had vet appointment $150, need new dog food make a note in my command center in the tasks for this"
OUTPUT 3 SEPARATE COMMANDS:
1. { "isCommand": true, "domain": "pets", "data": { "type": "vet_appointment", "petName": "rex", "amount": 150, "date": "today", "description": "vet appointment" }, "confirmationMessage": "✅ Logged $150 vet visit for Rex" }
2. { "isCommand": true, "domain": "tasks", "data": { "title": "Buy new dog food", "priority": "medium" }, "confirmationMessage": "✅ Task created: Buy new dog food" }

BUT return ONLY THE FIRST ONE. Process one command at a time.

ONLY respond with valid JSON, nothing else.`

  let aiResponse: string | null = null
  
  console.log('🔑 [COMMAND-PARSER] API keys status:', {
    openai: openAIKey ? 'configured' : 'missing',
    gemini: geminiKey ? 'configured' : 'missing'
  })
  
  // Try Gemini FIRST if available (more reliable when OpenAI has quota issues)
  if (geminiKey) {
    try {
      console.log('🧠 [COMMAND-PARSER] Trying Gemini first...')
      const geminiPrompt = `${systemPromptContent}

User message: ${message}

Return ONLY valid JSON, no markdown or code blocks.`
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: geminiPrompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500,
            }
          })
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (content) {
          // Clean up Gemini response - sometimes wraps in markdown
          aiResponse = content
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim()
          console.log('✅ [COMMAND-PARSER] Gemini response received')
        }
      } else {
        const error = await response.text()
        console.warn(`⚠️ [COMMAND-PARSER] Gemini failed (${response.status}):`, error.substring(0, 200))
      }
    } catch (geminiError: any) {
      console.warn('⚠️ [COMMAND-PARSER] Gemini error:', geminiError.message)
    }
  }
  
  // Fallback to OpenAI if Gemini failed
  if (!aiResponse && openAIKey) {
    try {
      console.log('🧠 [COMMAND-PARSER] Trying OpenAI as fallback...')
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPromptContent },
            { role: 'user', content: message }
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        aiResponse = data.choices[0]?.message?.content
        console.log('✅ [COMMAND-PARSER] OpenAI response received')
      } else {
        const error = await response.text()
        console.warn(`⚠️ [COMMAND-PARSER] OpenAI failed (${response.status}):`, error.substring(0, 200))
        if (response.status === 429 || error.includes('quota')) {
          console.error('❌ [COMMAND-PARSER] OpenAI quota exceeded! Using Gemini is recommended.')
        }
      }
    } catch (openaiError: any) {
      console.warn('⚠️ [COMMAND-PARSER] OpenAI error:', openaiError.message)
    }
  }
  
  if (!aiResponse) {
    console.error('❌ [COMMAND-PARSER] Both Gemini and OpenAI failed - falling back to regex parser')
    console.log('🔧 [COMMAND-PARSER] Attempting regex fallback for message:', message)
    // Return isCommand: false to let the main handler try the regex fallback
    return { isCommand: false, fallbackReason: 'ai_apis_failed' }
  }

  console.log('🤖 [COMMAND-PARSER] AI response received:', aiResponse.substring(0, 200))

  // Parse the AI response
  try {
    const parsed = JSON.parse(aiResponse)
    
    if (!parsed.isCommand) {
      return { isCommand: false }
    }
    
    // ============================================
    // SMART CRUD: Handle confirmation requests
    // ============================================
    if (parsed.requiresConfirmation) {
      console.log('⚠️ AI requesting confirmation:', parsed.confirmationQuestion)
      return {
        isCommand: true,
        action: 'requires_confirmation',
        requiresConfirmation: true,
        message: `🤔 **Quick question:**\n\n${parsed.confirmationQuestion}`,
        options: parsed.options || ['Yes', 'No'],
        pendingAction: parsed.pendingAction || parsed,
        existingItemId: parsed.existingItemId,
        existingItemName: parsed.existingItemName
      }
    }
    
    // ============================================
    // SMART CRUD: Handle update_entry action
    // ============================================
    if (parsed.action === 'update_entry' && parsed.existingItemId) {
      console.log(`🔄 Updating existing item: ${parsed.existingItemName} (${parsed.existingItemId})`)
      
      const { error } = await supabase
        .from('domain_entries')
        .update({
          metadata: parsed.updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', parsed.existingItemId)
        .eq('user_id', userId)
      
      if (error) {
        console.error('❌ Update failed:', error)
        return {
          isCommand: true,
          action: 'update_entry',
          message: `❌ Failed to update ${parsed.existingItemName}: ${error.message}`
        }
      }
      
      return {
        isCommand: true,
        action: 'update_entry',
        message: parsed.confirmationMessage || `✅ Updated ${parsed.existingItemName}`,
        saved: true
      }
    }

    // Check if this is a SPECIAL ACTION (habit, bill, event, google calendar, navigate, tool, chart, journal, task/habit completion, vehicle mileage update)
    const actionType = parsed.action
    if (actionType && ['create_habit', 'create_bill', 'create_event', 'add_to_google_calendar', 'navigate', 'open_tool', 'custom_chart', 'create_journal', 'complete_task', 'complete_habit', 'update_vehicle_mileage'].includes(actionType)) {
      console.log(`🚀 Special ACTION detected: ${actionType}`)
      
      // Route to actions API
      const actionParams = parsed.data || {}
      
      // Handle navigation - return immediately with navigation instructions
      if (actionType === 'navigate') {
        const navMap: Record<string, string> = {
          'dashboard': '/', 'home': '/', 'health': '/domains/health',
          'fitness': '/domains/fitness', 'nutrition': '/domains/nutrition',
          'financial': '/domains/financial', 'finance': '/domains/financial',
          'vehicles': '/domains/vehicles', 'pets': '/domains/pets',
          'insurance': '/domains/insurance', 'travel': '/domains/travel',
          'education': '/domains/education', 'career': '/domains/career',
          'relationships': '/domains/relationships', 'mindfulness': '/domains/mindfulness',
          'tools': '/ai-tools-calculators', 'calculators': '/ai-tools-calculators',
          'ai': '/ai', 'calendar': '/calendar', 'settings': '/settings',
          'domains': '/domains', 'documents': '/documents'
        }
        const dest = actionParams.destination?.toLowerCase() || 'dashboard'
        const path = actionParams.path || navMap[dest] || '/'
        return {
          isCommand: true,
          action: 'navigate',
          message: parsed.confirmationMessage || `🧭 Opening ${dest}`,
          navigate: { path, destination: dest }
        }
      }

      // Handle open_tool
      if (actionType === 'open_tool') {
        const toolMap: Record<string, { path: string; name: string }> = {
          'bmi': { path: '/ai-tools-calculators?tab=calculators&tool=bmi', name: 'BMI Calculator' },
          'calorie': { path: '/ai-tools-calculators?tab=calculators&tool=calorie', name: 'Calorie Calculator' },
          'mortgage': { path: '/ai-tools-calculators?tab=calculators&tool=mortgage', name: 'Mortgage Calculator' },
          'retirement': { path: '/ai-tools-calculators?tab=calculators&tool=retirement', name: 'Retirement Calculator' },
          'loan': { path: '/ai-tools-calculators?tab=calculators&tool=loan', name: 'Loan Calculator' },
          'receipt': { path: '/ai-tools-calculators?tab=ai-tools&tool=receipt', name: 'Receipt Scanner' },
          'document': { path: '/ai-tools-calculators?tab=ai-tools&tool=document', name: 'Document Scanner' },
          'currency': { path: '/ai-tools-calculators?tab=utility&tool=currency', name: 'Currency Converter' }
        }
        const toolKey = (actionParams.tool || '').toLowerCase().replace(/[_\s]+/g, '')
        const toolInfo = Object.entries(toolMap).find(([k]) => toolKey.includes(k))?.[1] || 
                        { path: '/ai-tools-calculators', name: 'Tools' }
        return {
          isCommand: true,
          action: 'open_tool',
          message: parsed.confirmationMessage || `🔧 Opening ${toolInfo.name}`,
          openTool: { path: toolInfo.path, name: toolInfo.name }
        }
      }

      // Handle create_habit
      if (actionType === 'create_habit') {
        const { name, icon = '⭐', frequency = 'daily', description } = actionParams
        if (!name) return { isCommand: false }
        
        console.log('🏃 Creating habit:', { name, icon, frequency, description })
        
        const habitId = randomUUID()
        const { error } = await supabase.from('habits').insert({
          id: habitId, 
          user_id: userId, 
          name, 
          icon, 
          frequency,
          streak: 0, 
          completion_history: [],
          metadata: { description, source: 'ai_assistant' },
          created_at: new Date().toISOString()
        })
        
        if (error) {
          console.error('❌ Habit creation error:', error)
          return { isCommand: false }
        }
        
        console.log('✅ Habit created successfully:', habitId)
        
        return {
          isCommand: true, 
          action: 'create_habit',
          message: parsed.confirmationMessage || `✅ Habit created: "${name}" ${icon} (${frequency})`,
          triggerReload: true
        }
      }

      // Handle create_bill
      if (actionType === 'create_bill') {
        const { name, amount, dueDate, category, recurring = false, recurrencePeriod } = actionParams
        if (!name || amount === undefined) return { isCommand: false }
        
        const billId = randomUUID()
        const { error } = await supabase.from('bills').insert({
          id: billId, 
          user_id: userId, 
          title: name, // bills table uses 'title' not 'name'
          amount: parseFloat(amount),
          due_date: dueDate || new Date().toISOString(),
          status: 'pending', // bills table uses 'status' not 'paid'
          recurring, 
          recurrence_period: recurrencePeriod || null,
          category: category || 'other',
          metadata: { source: 'ai_assistant' }, 
          created_at: new Date().toISOString()
        })
        
        if (error) {
          console.error('❌ Bill creation error:', error)
          return { isCommand: false }
        }
        
        return {
          isCommand: true, action: 'create_bill',
          message: parsed.confirmationMessage || `✅ Bill created: "${name}" - $${amount}`,
          triggerReload: true
        }
      }

      // Handle create_event
      if (actionType === 'create_event') {
        const { title, date, time, location, description, allDay = false } = actionParams
        if (!title) return { isCommand: false }
        
        // Build the event_date timestamp
        let eventDate = new Date()
        if (date) {
          eventDate = new Date(date)
        }
        if (time) {
          const [hours, minutes] = time.split(':').map(Number)
          eventDate.setHours(hours || 9, minutes || 0, 0, 0)
        }
        
        const eventId = randomUUID()
        const { error } = await supabase.from('events').insert({
          id: eventId, 
          user_id: userId, 
          title,
          event_date: eventDate.toISOString(), // events table uses 'event_date' not 'start_date'
          location: location || null,
          description: description || null,
          metadata: { source: 'ai_assistant', allDay, time: time || null }, 
          created_at: new Date().toISOString()
        })
        
        if (error) {
          console.error('❌ Event creation error:', error)
          return { isCommand: false }
        }
        
        return {
          isCommand: true, action: 'create_event',
          message: parsed.confirmationMessage || `✅ Event created: "${title}"${date ? ` on ${date}` : ''}`,
          triggerReload: true
        }
      }

      // Handle add_to_google_calendar
      if (actionType === 'add_to_google_calendar') {
        const { title, summary, date, time, duration, location, description, allDay } = actionParams
        const eventTitle = title || summary
        
        if (!eventTitle) {
          return { isCommand: false }
        }
        
        console.log(`📅 Adding to Google Calendar: ${eventTitle}`)
        
        try {
          // Call the actions API to handle Google Calendar creation
          const actionResponse = await fetch(
            new URL('/api/ai-assistant/actions', baseUrl),
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(cookieHeader ? { Cookie: cookieHeader } : {})
              },
              body: JSON.stringify({
                action: 'add_to_google_calendar',
                domain: 'calendar',
                parameters: {
                  title: eventTitle,
                  date: date,
                  time: time,
                  duration: duration || 60,
                  location: location,
                  description: description,
                  allDay: allDay || false
                }
              })
            }
          )
          
          const result = await actionResponse.json()
          
          if (result.success) {
            return {
              isCommand: true,
              action: 'add_to_google_calendar',
              message: result.message || `📅 Added to Google Calendar: "${eventTitle}"`,
              event: result.event,
              triggerReload: true
            }
          } else {
            return {
              isCommand: true,
              action: 'add_to_google_calendar',
              message: result.message || `❌ Failed to add to Google Calendar`,
              requiresAuth: result.requiresAuth
            }
          }
        } catch (error: any) {
          console.error('❌ Google Calendar error:', error)
          return {
            isCommand: true,
            action: 'add_to_google_calendar',
            message: `❌ Failed to add to Google Calendar: ${error.message || 'Unknown error'}`
          }
        }
      }

      // Handle custom_chart - fetch data and build visualization
      if (actionType === 'custom_chart') {
        const { domain = 'all', domains, chartType = 'line', dateRange = 'this_month', 
                metric, groupBy = 'date', aggregation = 'sum', title } = actionParams
        
        // Get date range
        const now = new Date()
        let startDate: Date
        const endDate = now
        
        switch (dateRange) {
          case 'today': startDate = new Date(now.setHours(0,0,0,0)); break
          case 'this_week': startDate = new Date(now.setDate(now.getDate() - now.getDay())); break
          case 'this_month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break
          case 'this_year': startDate = new Date(now.getFullYear(), 0, 1); break
          case 'last_30_days': startDate = new Date(Date.now() - 30*24*60*60*1000); break
          case 'last_90_days': startDate = new Date(Date.now() - 90*24*60*60*1000); break
          default: startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        }
        
        // Fetch data
        let query = supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', new Date().toISOString())
          .order('created_at', { ascending: true })
        
        if (domains && domains.length > 0) {
          query = query.in('domain', domains)
        } else if (domain && domain !== 'all') {
          query = query.eq('domain', domain)
        }
        
        const { data: entries, error: fetchError } = await query
        
        if (fetchError || !entries || entries.length === 0) {
          return {
            isCommand: true, action: 'custom_chart',
            message: '📊 No data found for that time period. Try a different range or domain.'
          }
        }
        
        // Process data for chart
        let chartData: any[] = []
        
        if (groupBy === 'domain') {
          const grouped: Record<string, number> = {}
          entries.forEach((e: any) => {
            grouped[e.domain] = (grouped[e.domain] || 0) + 1
          })
          chartData = Object.entries(grouped).map(([name, value]) => ({ name, domain: name, value }))
        } else if (groupBy === 'date') {
          const byDate: Record<string, number> = {}
          entries.forEach((e: any) => {
            const date = new Date(e.created_at).toLocaleDateString()
            const val = parseFloat(e.metadata?.amount || e.metadata?.value || 1)
            byDate[date] = (byDate[date] || 0) + (aggregation === 'count' ? 1 : val)
          })
          chartData = Object.entries(byDate).map(([date, value]) => ({ date, value, label: date }))
        } else if (groupBy === 'category' || groupBy === 'type') {
          const byType: Record<string, number> = {}
          entries.forEach((e: any) => {
            const cat = e.metadata?.type || e.metadata?.category || e.domain
            byType[cat] = (byType[cat] || 0) + 1
          })
          chartData = Object.entries(byType).map(([name, value]) => ({ name, category: name, value }))
        }
        
        return {
          isCommand: true, action: 'custom_chart',
          message: parsed.confirmationMessage || `📊 Here's your ${domain} data visualization`,
          visualization: {
            type: chartType,
            title: title || `${domain} Data - ${dateRange.replace('_', ' ')}`,
            xAxis: groupBy === 'date' ? 'Date' : 'Category',
            yAxis: metric || 'Value',
            data: chartData,
            config: { height: 400, showGrid: true, showLegend: true }
          }
        }
      }

      // Handle create_journal - save journal entry to mindfulness domain
      if (actionType === 'create_journal') {
        const { title, content, mood } = actionParams
        if (!content) return { isCommand: false }
        
        const journalId = randomUUID()
        const journalTitle = title || `Journal Entry - ${new Date().toLocaleDateString()}`
        
        const { error } = await supabase.from('domain_entries').insert({
          id: journalId,
          user_id: userId,
          domain: 'mindfulness',
          title: journalTitle,
          description: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          metadata: {
            type: 'journal',
            logType: 'journal-entry',
            content: content,
            mood: mood || null,
            wordCount: content.split(/\s+/).length,
            source: 'ai_assistant'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        if (error) {
          console.error('❌ Journal creation error:', error)
          return { isCommand: false }
        }
        
        return {
          isCommand: true,
          action: 'create_journal',
          message: parsed.confirmationMessage || `📔 Journal entry saved: "${journalTitle}"`,
          triggerReload: true
        }
      }

      // Handle complete_task - mark a task as complete
      if (actionType === 'complete_task') {
        const { taskName } = actionParams
        if (!taskName) return { isCommand: false }
        
        console.log(`✅ Attempting to complete task: "${taskName}"`)
        
        // Find the task by name (fuzzy match)
        const { data: tasks, error: findError } = await supabase
          .from('tasks')
          .select('id, title, completed')
          .eq('user_id', userId)
          .eq('completed', false)
          .ilike('title', `%${taskName}%`)
          .limit(1)
        
        if (findError || !tasks || tasks.length === 0) {
          // Try a broader search
          const { data: allTasks } = await supabase
            .from('tasks')
            .select('id, title, completed')
            .eq('user_id', userId)
            .eq('completed', false)
          
          // Find best match
          const taskLower = taskName.toLowerCase()
          const match = allTasks?.find((t: any) => 
            t.title.toLowerCase().includes(taskLower) ||
            taskLower.includes(t.title.toLowerCase())
          )
          
          if (!match) {
            return {
              isCommand: true,
              action: 'complete_task',
              message: `❌ Couldn't find an open task matching "${taskName}". Try being more specific or check your task list.`
            }
          }
          
          // Complete the matched task
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ 
              completed: true, 
              updated_at: new Date().toISOString()
            })
            .eq('id', match.id)
          
          if (updateError) {
            console.error('❌ Task completion error:', updateError)
            return { isCommand: false }
          }
          
          return {
            isCommand: true,
            action: 'complete_task',
            message: parsed.confirmationMessage || `✅ Task completed: "${match.title}"`,
            triggerReload: true
          }
        }
        
        // Complete the found task
        const task = tasks[0]
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ 
            completed: true, 
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id)
        
        if (updateError) {
          console.error('❌ Task completion error:', updateError)
          return { isCommand: false }
        }
        
        return {
          isCommand: true,
          action: 'complete_task',
          message: parsed.confirmationMessage || `✅ Task completed: "${task.title}"`,
          triggerReload: true
        }
      }

      // Handle complete_habit - mark a habit as complete for today
      if (actionType === 'complete_habit') {
        const { habitName } = actionParams
        if (!habitName) return { isCommand: false }
        
        console.log(`✅ Attempting to complete habit: "${habitName}"`)
        
        // Find the habit by name (fuzzy match)
        const { data: habits, error: findError } = await supabase
          .from('habits')
          .select('id, name, streak, completion_history')
          .eq('user_id', userId)
          .ilike('name', `%${habitName}%`)
          .limit(1)
        
        if (findError || !habits || habits.length === 0) {
          // Try a broader search
          const { data: allHabits } = await supabase
            .from('habits')
            .select('id, name, streak, completion_history')
            .eq('user_id', userId)
          
          // Find best match
          const habitLower = habitName.toLowerCase()
          const match = allHabits?.find((h: any) => 
            h.name.toLowerCase().includes(habitLower) ||
            habitLower.includes(h.name.toLowerCase())
          )
          
          if (!match) {
            return {
              isCommand: true,
              action: 'complete_habit',
              message: `❌ Couldn't find a habit matching "${habitName}". Try being more specific or check your habits list.`
            }
          }
          
          // Complete the matched habit
          const today = new Date().toISOString().split('T')[0]
          const history = Array.isArray(match.completion_history) ? match.completion_history : []
          
          // Check if already completed today
          if (history.includes(today)) {
            return {
              isCommand: true,
              action: 'complete_habit',
              message: `ℹ️ You've already logged "${match.name}" for today!`
            }
          }
          
          const newHistory = [...history, today]
          const newStreak = (match.streak || 0) + 1
          
          const { error: updateError } = await supabase
            .from('habits')
            .update({ 
              streak: newStreak,
              completion_history: newHistory,
              last_completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', match.id)
          
          if (updateError) {
            console.error('❌ Habit completion error:', updateError)
            return { isCommand: false }
          }
          
          return {
            isCommand: true,
            action: 'complete_habit',
            message: parsed.confirmationMessage || `✅ Habit logged: "${match.name}" 🔥 ${newStreak} day streak!`,
            triggerReload: true
          }
        }
        
        // Complete the found habit
        const habit = habits[0]
        const today = new Date().toISOString().split('T')[0]
        const history = Array.isArray(habit.completion_history) ? habit.completion_history : []
        
        // Check if already completed today
        if (history.includes(today)) {
          return {
            isCommand: true,
            action: 'complete_habit',
            message: `ℹ️ You've already logged "${habit.name}" for today!`
          }
        }
        
        const newHistory = [...history, today]
        const newStreak = (habit.streak || 0) + 1
        
        const { error: updateError } = await supabase
          .from('habits')
          .update({ 
            streak: newStreak,
            completion_history: newHistory,
            last_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', habit.id)
        
        if (updateError) {
          console.error('❌ Habit completion error:', updateError)
          return { isCommand: false }
        }
        
        return {
          isCommand: true,
          action: 'complete_habit',
          message: parsed.confirmationMessage || `✅ Habit logged: "${habit.name}" 🔥 ${newStreak} day streak!`,
          triggerReload: true
        }
      }

      // Handle update_vehicle_mileage - update an existing vehicle's mileage
      if (actionType === 'update_vehicle_mileage') {
        const { vehicleName, mileage, unit = 'miles' } = actionParams
        if (!vehicleName || !mileage) {
          return { 
            isCommand: false,
            message: '❌ Missing vehicle name or mileage value'
          }
        }
        
        console.log(`🚗 AI Parser: Updating vehicle "${vehicleName}" mileage to ${mileage}`)
        
        // Find existing vehicle by name/title
        const { data: existingVehicles, error: findError } = await supabase
          .from('domain_entries')
          .select('id, title, metadata')
          .eq('user_id', userId)
          .eq('domain', 'vehicles')
          .or(`title.ilike.%${vehicleName}%,metadata->>vehicleName.ilike.%${vehicleName}%,metadata->>make.ilike.%${vehicleName}%,metadata->>model.ilike.%${vehicleName}%`)
          .order('created_at', { ascending: false })
        
        if (findError) {
          console.error('❌ Error finding vehicle:', findError)
          return {
            isCommand: true,
            action: 'update_vehicle_mileage',
            message: `❌ Error searching for vehicle: ${findError.message}`
          }
        }
        
        if (existingVehicles && existingVehicles.length > 0) {
          const vehicle = existingVehicles[0]
          const existingMetadata = vehicle.metadata || {}
          
          console.log(`✅ Found vehicle "${vehicle.title}" - updating mileage to ${mileage}`)
          
          const { error: updateError } = await supabase
            .from('domain_entries')
            .update({
              metadata: {
                ...existingMetadata,
                currentMileage: mileage,
                mileage: mileage,
                lastMileageUpdate: new Date().toISOString(),
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', vehicle.id)
            .eq('user_id', userId)
          
          if (updateError) {
            console.error('❌ Error updating vehicle mileage:', updateError)
            return {
              isCommand: true,
              action: 'update_vehicle_mileage',
              message: `❌ Failed to update mileage for ${vehicle.title}`
            }
          }
          
          return {
            isCommand: true,
            action: 'update_vehicle_mileage',
            message: parsed.confirmationMessage || `✅ Updated ${vehicle.title}'s mileage to ${Number(mileage).toLocaleString()} ${unit}`,
            triggerReload: true
          }
        } else {
          // No existing vehicle found
          return {
            isCommand: true,
            action: 'update_vehicle_mileage',
            message: `❌ No vehicle found matching "${vehicleName}". Please add the vehicle first or check the name.`
          }
        }
      }
    }

    // AI detected a command! Now save it to the appropriate domain
    let { domain, data: commandData, confirmationMessage } = parsed

    // Safety routing: if message is vehicle-related but was classified as financial, route to vehicles
    const msgLower = (message || '').toLowerCase()
    const looksVehicle = /(oil change|tire|tires|brake|brakes|alignment|service|maintenance|mileage|odometer|gas|fuel|dmv|registration|car|vehicle|auto)/i.test(msgLower)
    if (domain === 'financial' && looksVehicle) {
      domain = 'vehicles'
      // Normalize structure to vehicles shapes
      const amount = Number(commandData?.amount || commandData?.cost || 0) || 0
      const date = commandData?.date || new Date().toISOString().split('T')[0]
      const desc = (commandData?.description || '').toLowerCase()
      if (/oil/.test(msgLower)) {
        commandData = { type: 'maintenance', serviceName: 'oil change', amount, cost: amount, date }
      } else if (/gas|fuel/.test(msgLower)) {
        commandData = { type: 'cost', costType: 'fuel', amount, date, description: 'fuel' }
      } else if (/dmv|registration/.test(msgLower)) {
        commandData = { type: 'cost', costType: 'registration', amount, date }
      } else if (/insurance/.test(msgLower)) {
        commandData = { type: 'cost', costType: 'insurance', amount, date }
      } else if (/repair|brake|tire|alignment/.test(msgLower)) {
        commandData = { type: 'cost', costType: 'repair', amount, date, description: commandData?.description || 'repair' }
      } else {
        commandData = { type: 'cost', costType: 'maintenance', amount, date, description: commandData?.description || 'vehicle expense' }
      }
      confirmationMessage = confirmationMessage || '✅ Logged vehicle expense'
    }
    
    console.log(`✅ AI detected command for domain: ${domain}`)
    console.log(`📝 Data to save:`, JSON.stringify(commandData, null, 2))

    // Special handling for PET EXPENSES - save to pet_costs table
    if (domain === 'pets' && (commandData.type === 'vet_appointment' || commandData.type === 'expense') && commandData.amount) {
      console.log('🐾 Attempting to save pet expense:', commandData)
      
      // Extract pet name from the message or commandData
      let petName = commandData.petName || commandData.pet_name || null
      
      if (!petName) {
        // Try to extract from message - look for common pet names or any capitalized word
        const namePatterns = [
          /(?:^|\s)([A-Z][a-z]+)(?:\s+had|\s+went|\s+got|\s+vet|\s+grooming|'s)/i,  // "Rex had", "Rex's"
          /(?:for|on)\s+([A-Z][a-z]+)(?:'s|\s+vet|\s+grooming)/i,  // "for Rex's", "on Rex vet"
          /\b([A-Z][a-z]{2,})\b/  // Any capitalized word with 3+ letters
        ]
        
        for (const pattern of namePatterns) {
          const match = message.match(pattern)
          if (match && match[1]) {
            petName = match[1]
            console.log(`🐾 Extracted pet name: ${petName}`)
            break
          }
        }
      }
      
      if (!petName) {
        console.log('⚠️ No pet name found, checking if user has only one pet...')
        // If no name found, check if user has only one pet
        const { data: allPets } = await supabase
          .from('pets')
          .select('id, name')
          .eq('user_id', userId)
        
        if (allPets && allPets.length === 1) {
          petName = allPets[0].name
          console.log(`🐾 Using single pet: ${petName}`)
        }
      }
      
      if (petName) {
        console.log(`🐾 Looking up pet: ${petName}`)
        
        // Find the pet by name (case-insensitive)
        const { data: pets, error: petError } = await supabase
          .from('pets')
          .select('id, name')
          .eq('user_id', userId)
          .ilike('name', `%${petName}%`)
          .limit(1)
        
        console.log(`🐾 Pet query result:`, { pets, petError })
        
        if (!petError && pets && pets.length > 0) {
          const pet = pets[0]
          console.log(`🐾 Found pet: ${pet.name} (${pet.id})`)
          
          // Save to pet_costs table
          const costData = {
            id: randomUUID(),
            user_id: userId,
            pet_id: pet.id,
            cost_type: 'vet',
            amount: commandData.amount,
            date: commandData.date || new Date().toISOString().split('T')[0],
            description: commandData.description || 'Vet appointment',
            vendor: null
          }
          
          console.log(`🐾 Inserting pet cost:`, costData)
          
          const { error: costError } = await supabase
            .from('pet_costs')
            .insert(costData)
          
          if (costError) {
            console.error('❌ Failed to save pet cost:', costError)
          } else {
            console.log(`✅ SUCCESS! Saved $${commandData.amount} vet cost for ${pet.name}`)
            
            return {
              isCommand: true,
              action: 'save_pet_cost',
              message: `✅ Logged $${commandData.amount} vet cost for ${pet.name}`
            }
          }
        } else {
          console.error(`❌ Pet '${petName}' not found in database`)
        }
      } else {
        console.error('❌ Could not extract pet name from message')
      }
    }

    // Special handling for TASKS domain - use dedicated tasks table
    if (domain === 'tasks') {
      const taskTitle = commandData.title || commandData.description || message
      const taskPriority = commandData.priority || 'medium'
      const taskDueDate = commandData.due_date || commandData.dueDate || null
      const taskDescription = commandData.description || null
      
      console.log('📋 Creating task:', { taskTitle, taskPriority, taskDueDate })
      
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          id: randomUUID(),
          user_id: userId,
          title: taskTitle,
          description: taskDescription,
          completed: false,
          priority: taskPriority,
          due_date: taskDueDate,
          metadata: { source: 'ai_assistant' },
        })

      if (taskError) {
        console.error('❌ Failed to create task:', taskError)
        throw taskError
      }

      console.log('✅ Task created successfully')

      return {
        isCommand: true,
        action: 'create_task',
        message: confirmationMessage || `✅ Task created: "${taskTitle}"`,
        triggerReload: true
      }
    }

    // Special handling for NOTES (mindfulness domain with type=note)
    if (domain === 'mindfulness' && commandData.type === 'note') {
      const noteTitle = commandData.title || message.substring(0, 50)
      const noteContent = commandData.content || commandData.description || message
      
      await saveToSupabase(supabase, userId, 'mindfulness', {
        id: randomUUID(),
        title: noteTitle,
        description: noteContent,
        type: 'note',
        logType: 'note',
        fullContent: noteContent,
        timestamp: new Date().toISOString(),
        source: 'ai_assistant'
      })

      return {
        isCommand: true,
        action: 'create_note',
        message: confirmationMessage || `✅ Note saved: "${noteTitle}"`
      }
    }

    // 🔧 FIX: Check for WATER FIRST before meals to prevent water from being misclassified
    const isWaterCommand = domain === 'nutrition' && (
      commandData.type === 'water' ||
      commandData.logType === 'water' ||
      commandData.itemType === 'water'
    )
    
    // Skip meal handling if this is a water entry - let it fall through to generic save
    // Special handling for NUTRITION MEALS - ensure proper structure for UI
    // Also trigger for meal descriptions without explicit calories
    const isMealEntry = !isWaterCommand && domain === 'nutrition' && (
      commandData.type === 'meal' || 
      commandData.logType === 'meal' ||
      commandData.mealName || 
      commandData.name ||  // Food name provided
      commandData.calories ||
      commandData.food ||
      (commandData.description && !commandData.itemType) // Meal with description only
    )
    
    console.log(`🍽️ [CHAT] Meal entry check: domain=${domain}, type=${commandData.type}, name=${commandData.name}, food=${commandData.food}, desc=${commandData.description}, isMeal=${isMealEntry}`)
    
    if (isMealEntry) {
      // Use USER's local time for accurate meal type detection (if provided)
      // Falls back to server time if client doesn't send timezone info
      const userHour = userTime?.localHour ?? new Date().getHours()
      const userLocalTime = userTime?.localTime || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      
      console.log(`🕐 [CHAT] Using hour: ${userHour} (user timezone: ${userTime?.timezone || 'server default'}, localTime: ${userLocalTime})`)
      
      let mealType = commandData.mealType || 'Other'
      if (!commandData.mealType) {
        // Use USER's local hour for meal type detection
        if (userHour >= 5 && userHour < 11) mealType = 'Breakfast'
        else if (userHour >= 11 && userHour < 15) mealType = 'Lunch'
        else if (userHour >= 15 && userHour < 22) mealType = 'Dinner'
        else mealType = 'Snack'
        console.log(`🍽️ [CHAT] Auto-detected meal type: ${mealType} (based on user hour ${userHour})`)
      }
      
      const mealName = commandData.name || commandData.mealName || commandData.description || commandData.food || 'Meal'
      console.log(`🍽️ [CHAT] Meal name extracted: "${mealName}"`)
      let calories = Number(commandData.calories) || 0
      
      // Check if macros were provided
      const hasMacros = (Number(commandData.protein) > 0 || 
                        Number(commandData.carbs) > 0 || 
                        Number(commandData.fats) > 0)
      
      let protein = Number(commandData.protein) || 0
      let carbs = Number(commandData.carbs) || 0
      let fats = Number(commandData.fats) || 0
      let fiber = Number(commandData.fiber) || 0
      
      // 🔧 FIX: If no calories AND no macros provided, estimate FULL nutrition from description
      if (calories === 0 && !hasMacros && mealName !== 'Meal') {
        console.log(`🧠 [CHAT] No nutrition provided, estimating full nutrition for "${mealName}"...`)
        const estimated = await estimateFullNutrition(mealName)
        calories = estimated.calories
        protein = estimated.protein
        carbs = estimated.carbs
        fats = estimated.fats
        fiber = estimated.fiber
        console.log(`✅ [CHAT] Estimated: ${calories} cal, ${protein}g P, ${carbs}g C, ${fats}g F`)
      } 
      // If calories provided but no macros, estimate macros
      else if (!hasMacros && calories > 0) {
        console.log(`🧠 [CHAT] Estimating macros for ${mealName}...`)
        const estimated = await estimateMealMacros(mealName, calories)
        protein = estimated.protein
        carbs = estimated.carbs
        fats = estimated.fats
        fiber = estimated.fiber
      }
      
      await saveToSupabase(supabase, userId, 'nutrition', {
        id: randomUUID(),
        type: 'meal',
        logType: 'meal',
        name: mealName,
        description: mealName,
        mealType,
        calories,
        protein,
        carbs,
        fats,
        fiber,
        // Use user's local time if provided, otherwise fall back to server time
        time: userLocalTime,
        timestamp: userTime?.timestamp || new Date().toISOString(),
        source: 'ai_assistant'
      })

      return {
        isCommand: true,
        action: 'save_meal',
        message: confirmationMessage || `✅ Logged meal: "${mealName}" (${calories} cal, ${protein}g protein, ${carbs}g carbs, ${fats}g fat) in Nutrition domain`
      }
    }

    // Save to Supabase using the existing saveToSupabase function
    await saveToSupabase(supabase, userId, domain, {
      id: randomUUID(),
      ...commandData,
      timestamp: new Date().toISOString(),
      source: 'ai_assistant'
    })

    return {
      isCommand: true,
      action: `save_${commandData.type || 'data'}`,
      message: confirmationMessage || `✅ Data logged to ${domain} domain`
    }

  } catch (parseError) {
    console.error('❌ Failed to parse AI response:', parseError)
    console.error('❌ AI response was:', aiResponse)
    return { isCommand: false }
  }
}

// Fetch recent mindfulness journal entries for AI context
async function fetchMindfulnessContext(supabase: any, userId: string): Promise<{
  hasJournals: boolean
  journalCount: number
  summary: string
}> {
  try {
    // Fetch recent mindfulness journal entries (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: entries, error } = await supabase
      .from('domain_entries')
      .select('title, description, metadata, created_at')
      .eq('user_id', userId)
      .eq('domain', 'mindfulness')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('❌ Error fetching mindfulness entries:', error)
      return { hasJournals: false, journalCount: 0, summary: '' }
    }
    
    if (!entries || entries.length === 0) {
      return { hasJournals: false, journalCount: 0, summary: '' }
    }
    
    // Filter for journal entries only
    const journalEntries = entries.filter((entry: any) => 
      entry.metadata?.type === 'journal' || 
      entry.metadata?.logType === 'journal-entry' ||
      entry.metadata?.entryType === 'Journal'
    )
    
    if (journalEntries.length === 0) {
      return { hasJournals: false, journalCount: 0, summary: '' }
    }
    
    // Build summary from recent journals
    let summary = `Recent journal entries (last ${journalEntries.length}):\n`
    
    journalEntries.forEach((entry: any, index: number) => {
      const date = new Date(entry.created_at).toLocaleDateString()
      const content = entry.metadata?.fullContent || entry.description || ''
      const aiInsight = entry.metadata?.aiInsight || ''
      
      // Truncate content for context efficiency
      const truncatedContent = content.substring(0, 200)
      
      summary += `\n${index + 1}. [${date}]: "${truncatedContent}${content.length > 200 ? '...' : ''}"`
      
      if (aiInsight) {
        const truncatedInsight = aiInsight.substring(0, 150)
        summary += `\n   AI Insight: "${truncatedInsight}${aiInsight.length > 150 ? '...' : ''}"`
      }
    })
    
    return {
      hasJournals: true,
      journalCount: journalEntries.length,
      summary
    }
  } catch (error) {
    console.error('❌ Error in fetchMindfulnessContext:', error)
    return { hasJournals: false, journalCount: 0, summary: '' }
  }
}

// ============================================
// INTELLIGENT QUERY HANDLER - READ OPERATIONS
// ============================================
async function intelligentQueryHandler(message: string, userId: string, supabase: any) {
  const openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey) return { isQuery: false }

  // ============================================
  // PRE-PROCESSOR: Direct routing for insight tags
  // ============================================
  const insightTagMatch = message.match(/^\[(QUICK_INSIGHTS|TREND_ANALYSIS|RECOMMENDATIONS_ONLY)\]/)
  if (insightTagMatch) {
    const insightType = insightTagMatch[1]
    const cleanMessage = message.replace(insightTagMatch[0], '').trim()
    
    console.log(`🎯 [INSIGHT-TAG] Detected insight type: ${insightType}`)
    
    // Map tags to specific analysis handlers
    let analysisType: 'quick' | 'trends' | 'recommendations' = 'quick'
    let dateRange: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month'
    
    if (insightType === 'QUICK_INSIGHTS') {
      analysisType = 'quick'
      dateRange = 'week' // Quick insights focus on recent data
    } else if (insightType === 'TREND_ANALYSIS') {
      analysisType = 'trends'
      dateRange = 'month'
    } else if (insightType === 'RECOMMENDATIONS_ONLY') {
      analysisType = 'recommendations'
      dateRange = 'month'
    }
    
    // Execute specialized insight analysis
    const insightResult = await executeInsightAnalysis(supabase, userId, cleanMessage, analysisType, dateRange)
    
    return {
      isQuery: true,
      data: insightResult.data,
      message: insightResult.message,
      visualization: insightResult.visualization,
      queryType: `insight_${analysisType}`
    }
  }

  console.log('🔍 Analyzing if message is a QUERY...')

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a CONVERSATIONAL QUERY ANALYZER for a life management app with 21 domains.

**YOUR JOB:** Detect if user wants to RETRIEVE/VIEW/ANALYZE data (not create). Be SMART about understanding CONVERSATIONAL language - users don't always speak formally!

**🗣️ CONVERSATIONAL QUERY PATTERNS (understand natural speech!):**
- "can I get..." / "can you get..." / "can you show..." / "could you pull up..."
- "I need..." / "I want..." / "give me..." / "get me..."  
- "pull up..." / "bring up..." / "let me see..." / "open..."
- "where is..." / "where's..." / "do I have..." / "what about..."
- "show me..." / "what is..." / "how much..." / "when did..."
- "list my..." / "find..." / "search..." / "display..."
- "what's my..." / "how many..." / "total..." / "average..."
- "analyze..." / "compare..." / "trend..." / "visualize..."

**🎯 DOMAIN ALIASES (understand casual terms!):**
- "auto insurance" / "car insurance" / "vehicle insurance" → domain: "insurance", filters.category: "auto"
- "auto" / "car" / "vehicle" / "cars" → domain: "vehicles"
- "health insurance" / "medical insurance" → domain: "insurance", filters.category: "health"  
- "home insurance" / "house insurance" / "homeowners" → domain: "insurance", filters.category: "home"
- "life insurance" → domain: "insurance", filters.category: "life"
- "money" / "finances" / "spending" / "budget" → domain: "financial"
- "gym" / "exercise" / "workouts" → domain: "fitness"
- "food" / "diet" / "eating" / "meals" → domain: "nutrition"
- "doctor" / "medical" / "meds" / "medication" → domain: "health"
- "dog" / "cat" / "pet" → domain: "pets"
- "house" / "apartment" / "property" / "mortgage" → domain: "home" or "property"
- "subscription" / "subscriptions" → domain: "digital"
- "documents" / "docs" / "papers" / "paperwork" → queryType: "retrieve"

**QUERY TYPES:**
1. **retrieve** - Get specific documents/items (e.g., "can I get my auto insurance", "pull up my ID")
2. **list** - Show individual entries
3. **aggregate** - Calculate totals, averages, counts
4. **trend** - Show changes over time
5. **compare** - Compare periods or categories
6. **visualization** - Generate charts/graphs
7. **multi_domain** - Combine data from multiple domains
8. **custom_visualization** - AI creates best chart for the data
9. **analyze** - Deep AI analysis of patterns, correlations, and insights (e.g., "analyze my data", "find patterns", "what correlations do you see")
10. **analyze_financial** - Specific spending/financial analysis (e.g., "analyze my spending", "where does my money go")
11. **analyze_health** - Health and fitness analysis (e.g., "analyze my health progress", "how is my fitness")

**MULTI-DOMAIN SUPPORT:**
- User can request data across ALL domains
- AI intelligently combines relevant data
- Creates composite visualizations

**RESPONSE FORMAT:**
{
  "isQuery": true,
  "domain": "financial|health|fitness|insurance|vehicles|all|multiple",
  "domains": ["financial", "health"],  // For multi-domain queries
  "queryType": "retrieve|list|aggregate|trend|compare|visualization|multi_domain|custom_visualization",
  "searchTerms": ["auto", "insurance"],  // For retrieve queries - keywords to search
  "filters": {
    "dateRange": "today|this_week|last_week|this_month|last_month|this_year|all",
    "metricType": "weight|expense|income|workout|etc",
    "category": "auto|health|home|life|specific category if mentioned"
  },
  "visualization": {
    "type": "line|bar|pie|area|multi_line|stacked_bar|combo|scatter",
    "title": "Chart title",
    "xAxis": "Time/Category",
    "yAxis": "Value/Metric",
    "datasets": [
      {
        "name": "Dataset 1",
        "domain": "health",
        "metric": "weight"
      }
    ]
  }
}

**🗣️ CONVERSATIONAL EXAMPLES:**

"can I get my auto insurance"
{
  "isQuery": true,
  "domain": "insurance",
  "queryType": "retrieve",
  "searchTerms": ["auto", "insurance", "car", "vehicle"],
  "filters": { "category": "auto" }
}

"pull up my car insurance please"
{
  "isQuery": true,
  "domain": "insurance",
  "queryType": "retrieve",
  "searchTerms": ["car", "insurance", "auto", "vehicle"],
  "filters": { "category": "auto" }
}

"I need my health insurance card"
{
  "isQuery": true,
  "domain": "insurance",
  "queryType": "retrieve",
  "searchTerms": ["health", "insurance", "card", "medical"],
  "filters": { "category": "health" }
}

"where's my vehicle registration"
{
  "isQuery": true,
  "domain": "vehicles",
  "queryType": "retrieve",
  "searchTerms": ["registration", "vehicle", "car", "dmv"]
}

"can you show me my ID"
{
  "isQuery": true,
  "domain": "all",
  "queryType": "retrieve",
  "searchTerms": ["ID", "identification", "license", "card"]
}

"give me my pet's vet records"
{
  "isQuery": true,
  "domain": "pets",
  "queryType": "retrieve",
  "searchTerms": ["vet", "records", "pet", "veterinary"]
}

"I want to see my finances"
{
  "isQuery": true,
  "domain": "financial",
  "queryType": "list",
  "filters": { "dateRange": "this_month" }
}

"show me my expenses from last month"
{
  "isQuery": true,
  "domain": "financial",
  "queryType": "list",
  "filters": { "dateRange": "last_month", "metricType": "expense" }
}

"what's my total spending this week?"
{
  "isQuery": true,
  "domain": "financial",
  "queryType": "aggregate",
  "filters": { "dateRange": "this_week", "metricType": "expense" }
}

"show my weight trend this month"
{
  "isQuery": true,
  "domain": "health",
  "queryType": "visualization",
  "filters": { "dateRange": "this_month", "metricType": "weight" },
  "visualization": { "type": "line", "title": "Weight Trend", "xAxis": "Date", "yAxis": "Weight (lbs)" }
}

"how many workouts did I do this week?"
{
  "isQuery": true,
  "domain": "fitness",
  "queryType": "aggregate",
  "filters": { "dateRange": "this_week", "metricType": "workout" }
}

"what about my car stuff"
{
  "isQuery": true,
  "domain": "vehicles",
  "queryType": "list",
  "filters": { "dateRange": "all" }
}

"do I have any insurance documents"
{
  "isQuery": true,
  "domain": "insurance",
  "queryType": "retrieve",
  "searchTerms": ["insurance", "policy", "documents"]
}

"retrieve my license and insurance for my car"
{
  "isQuery": true,
  "domain": "all",
  "queryType": "retrieve",
  "searchTerms": ["license", "insurance", "car", "vehicle", "auto", "registration", "policy", "driver"]
}

"can you get my license and insurance"
{
  "isQuery": true,
  "domain": "all",
  "queryType": "retrieve",
  "searchTerms": ["license", "insurance", "driver", "vehicle", "policy", "id", "card"]
}

"compare my spending vs my income"
{
  "isQuery": true,
  "domain": "financial",
  "queryType": "custom_visualization",
  "visualization": {
    "type": "multi_line",
    "title": "Income vs Expenses",
    "datasets": [
      { "name": "Income", "metric": "income" },
      { "name": "Expenses", "metric": "expense" }
    ]
  }
}

"analyze patterns and trends in my data" / "what correlations do you see" / "find patterns"
{
  "isQuery": true,
  "domain": "all",
  "queryType": "analyze",
  "filters": { "dateRange": "this_month" }
}

"analyze my spending" / "where does my money go" / "spending patterns"
{
  "isQuery": true,
  "domain": "financial",
  "queryType": "analyze_financial",
  "filters": { "dateRange": "this_month" }
}

"analyze my health progress" / "how is my fitness doing" / "health insights"
{
  "isQuery": true,
  "domain": "health",
  "queryType": "analyze_health",
  "filters": { "dateRange": "this_month" }
}

**🚨 CRITICAL RULES:**
1. CONVERSATIONAL requests ARE queries! "can I get", "I need", "pull up", "retrieve", "find" = QUERY, not command
2. Map casual domain names to correct domains (auto → vehicles, car insurance → insurance)
3. For retrieve queries, always include searchTerms array with relevant keywords
4. If unsure between retrieve and list, prefer retrieve for specific item requests
5. Only return isQuery: false for CREATE/ADD/LOG commands (e.g., "add task", "log expense")
6. **IMPORTANT**: When user asks for MULTIPLE document types (e.g., "license AND insurance"), use domain: "all" to search everywhere
7. For "license and insurance for my car" → domain: "all", searchTerms: ["license", "insurance", "car", "vehicle", "auto", "registration", "policy"]

If NOT a query (it's a command to CREATE data like "add task" or "log expense"), respond:
{
  "isQuery": false
}

Only respond with valid JSON, nothing else.`
          },
          { role: 'user', content: message }
        ]
      })
    })

    if (!response.ok) {
      console.error('❌ OpenAI API error:', response.statusText)
      return { isQuery: false }
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    console.log('🤖 Query analyzer response:', content)
    
    const parsed = JSON.parse(content)
    
    if (!parsed.isQuery) {
      console.log('❌ Not a query')
      return { isQuery: false }
    }

    console.log('✅ Detected QUERY:', parsed)

    // Execute the query - pass original message for AI analysis
    const queryResult = await executeQuery(parsed, userId, supabase, message)
    
    return {
      isQuery: true,
      data: queryResult.data,
      message: queryResult.message,
      visualization: queryResult.visualization,
      queryType: parsed.queryType
    }
  } catch (error: any) {
    console.error('❌ Query handler error:', error)
    return { isQuery: false }
  }
}

// ============================================
// INSIGHT ANALYSIS - Specialized handlers for different insight types
// ============================================
async function executeInsightAnalysis(
  supabase: any,
  userId: string,
  message: string,
  analysisType: 'quick' | 'trends' | 'recommendations',
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'all'
): Promise<{ message: string; data: any; visualization: any }> {
  console.log(`💡 [INSIGHT] Executing ${analysisType} analysis for dateRange: ${dateRange}`)
  
  const openAIKey = process.env.OPENAI_API_KEY
  
  // Fetch user data
  const { fetchUserDataForAnalysis } = await import('@/lib/ai/intelligent-analysis')
  const domainData = await fetchUserDataForAnalysis(supabase, userId, dateRange)
  
  console.log(`📦 [INSIGHT] Found ${domainData.length} domains with data`)
  
  if (domainData.length === 0 || domainData.every((d: any) => d.entries.length === 0)) {
    return {
      message: `📊 **No Recent Data**\n\nI don't have enough data to generate ${analysisType} insights. Start by adding some entries to your life domains!`,
      data: null,
      visualization: null
    }
  }
  
  // Calculate basic stats for context
  const totalEntries = domainData.reduce((sum: number, d: any) => sum + d.entries.length, 0)
  const domainSummary = domainData.map((d: any) => ({
    domain: d.domain,
    count: d.entries.length,
    metrics: Object.keys(d.metrics),
    latestEntry: d.entries[d.entries.length - 1]?.title || 'N/A'
  }))
  
  // Generate specialized prompt based on analysis type
  let systemPrompt = ''
  
  if (analysisType === 'quick') {
    systemPrompt = `You are a life assistant providing QUICK, ACTIONABLE insights.
    
Generate a BRIEF summary (3-5 bullet points max) of the user's most important recent activities.

Focus on:
- What they've been actively tracking
- Any urgent items needing attention today
- Quick wins they can celebrate

Keep it SHORT and SCANNABLE. Use emojis for visual appeal.
Format as a friendly, quick update - not a full analysis.`
  } else if (analysisType === 'trends') {
    systemPrompt = `You are a data analyst identifying TRENDS and PATTERNS.

Analyze the user's data and provide:
1. **Trending Up 📈**: Metrics that are increasing
2. **Trending Down 📉**: Metrics that are decreasing  
3. **Correlations 🔗**: Interesting connections between different domains
4. **Patterns 🔄**: Recurring behaviors or cycles

Be SPECIFIC with percentages and numbers from the data.
Show a visualization if trends are clear.`
  } else if (analysisType === 'recommendations') {
    systemPrompt = `You are a life coach providing ACTIONABLE RECOMMENDATIONS.

Based on the user's data patterns, provide exactly 5 SPECIFIC, ACTIONABLE recommendations.

Each recommendation should:
- Be based on actual patterns in their data
- Include a specific action they can take TODAY
- Explain WHY this will help

Format each as:
**[Number]. [Action Title]**
[Specific recommendation with data backing]

Focus ONLY on recommendations - no analysis or data summaries.`
  }
  
  // Call OpenAI for specialized insights
  if (openAIKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `
User's Data Summary:
- Total entries: ${totalEntries}
- Active domains: ${domainSummary.map((d: any) => `${d.domain} (${d.count} entries)`).join(', ')}

Domain Details:
${JSON.stringify(domainSummary, null, 2)}

Recent Metrics by Domain:
${domainData.map((d: any) => `${d.domain}: ${JSON.stringify(d.metrics)}`).join('\n')}

User Message: ${message}

Generate ${analysisType === 'quick' ? 'quick insights' : analysisType === 'trends' ? 'trend analysis' : 'recommendations'} based on this data.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0].message.content
        
        console.log(`✅ [INSIGHT] Generated ${analysisType} response`)
        
        // Generate visualization for trends
        let visualization = null
        if (analysisType === 'trends') {
          // Find the domain with most numeric metrics for visualization
          const domainWithMetrics = domainData.find((d: any) => Object.keys(d.metrics).length > 0)
          if (domainWithMetrics && Object.keys(domainWithMetrics.metrics).length > 0) {
            const metricName = Object.keys(domainWithMetrics.metrics)[0]
            const metricValues = domainWithMetrics.metrics[metricName]
            if (metricValues.length > 2) {
              visualization = {
                type: 'line',
                title: `${metricName} Trend (${domainWithMetrics.domain})`,
                data: metricValues.slice(-10).map((v: number, i: number) => ({
                  name: `Day ${i + 1}`,
                  value: v
                }))
              }
            }
          }
        }
        
        return {
          message: content,
          data: { analysisType, domainSummary },
          visualization
        }
      }
    } catch (error) {
      console.error(`❌ [INSIGHT] OpenAI error:`, error)
    }
  }
  
  // Fallback if OpenAI fails
  return {
    message: `📊 **${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Summary**\n\nAnalyzed ${totalEntries} entries across ${domainData.length} domains.\n\n${domainSummary.map((d: any) => `• **${d.domain}**: ${d.count} entries`).join('\n')}`,
    data: { domainSummary },
    visualization: null
  }
}

// ============================================
// QUERY EXECUTOR - Fetch and format data
// ============================================
async function executeQuery(querySpec: any, userId: string, supabase: any, originalMessage?: string) {
  const { domain, domains, queryType, filters, visualization, customVisualization, searchTerms } = querySpec
  
  console.log('📊 Executing query:', { domain, domains, queryType, filters, searchTerms })
  
  try {
    // IMPORTANT: Handle analysis queries FIRST before multi-domain routing
    // This ensures "analyze my spending" goes to AI analysis, not generic multi-domain
    const analysisTypes = [
      'analyze', 'analyze_financial', 'analyze_health',
      'correlation', 'trend_analysis', 'goal_tracking', 
      'spending_patterns', 'anomaly_detection', 'patterns'
    ]
    
    if (analysisTypes.includes(queryType)) {
      console.log('🧠 Routing to intelligent analysis system...')
      
      // Map date range
      let dateRange: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month'
      if (filters?.dateRange === 'this_week' || filters?.dateRange === 'last_week') {
        dateRange = 'week'
      } else if (filters?.dateRange === 'this_month' || filters?.dateRange === 'last_month') {
        dateRange = 'month'
      } else if (filters?.dateRange === 'this_year') {
        dateRange = 'year'
      } else if (filters?.dateRange === 'all') {
        dateRange = 'all'
      }
      
      // Determine analysis type based on queryType
      let analysisType: 'general' | 'financial' | 'health' | 'correlations' | 'trends' = 'general'
      if (queryType === 'analyze_financial' || queryType === 'spending_patterns') {
        analysisType = 'financial'
      } else if (queryType === 'analyze_health') {
        analysisType = 'health'
      } else if (queryType === 'correlation' || queryType === 'patterns') {
        analysisType = 'correlations'
      } else if (queryType === 'trend_analysis') {
        analysisType = 'trends'
      }
      
      console.log(`🎯 Analysis type: ${analysisType}, Date range: ${dateRange}`)
      
      const analysisResult = await performIntelligentAnalysis(
        supabase,
        userId,
        originalMessage || 'Analyze my data',
        analysisType,
        dateRange
      )
      
      console.log(`📊 Analysis Result:`, {
        hasData: !!analysisResult.data,
        responseLength: analysisResult.response?.length,
        responsePreview: analysisResult.response?.substring(0, 200),
        hasVisualization: !!analysisResult.visualization,
        analysisType: analysisResult.analysisType
      })
      
      return {
        data: analysisResult.data,
        message: analysisResult.response,
        visualization: analysisResult.visualization
      }
    }
    
    // Handle multi-domain queries (AFTER analysis check)
    if (queryType === 'multi_domain' || domain === 'all' || domain === 'multiple') {
      return await executeMultiDomainQuery(querySpec, userId, supabase)
    }
    
    // Handle custom visualizations
    if (queryType === 'custom_visualization') {
      return await executeCustomVisualization(querySpec, userId, supabase)
    }
    
    // Handle retrieve queries - search documents AND domain entries
    if (queryType === 'retrieve') {
      return await executeRetrieveQuery(querySpec, userId, supabase)
    }
    
    // Build Supabase query for single domain
    let query = supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
    
    // Filter by domain if specified
    if (domain && domain !== 'all') {
      query = query.eq('domain', domain)
    }
    
    // Apply date range filter
    if (filters?.dateRange) {
      const dateFilter = getDateRange(filters.dateRange)
      query = query.gte('created_at', dateFilter.start)
                   .lte('created_at', dateFilter.end)
    }
    
    // Apply metadata filters
    if (filters?.metricType) {
      // Filter by metadata type
      query = query.contains('metadata', { type: filters.metricType })
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Query error:', error)
      throw error
    }
    
    console.log(`📊 Query returned ${data.length} results`)
    
    // Format response based on query type
    if (queryType === 'aggregate') {
      return formatAggregateResponse(data, filters, domain)
    }
    
    if (queryType === 'list') {
      return formatListResponse(data, filters, domain)
    }
    
    if (queryType === 'trend' || queryType === 'visualization') {
      return formatVisualizationResponse(data, filters, domain, visualization)
    }
    
    if (queryType === 'compare') {
      return formatCompareResponse(data, filters, domain)
    }
    
    return { 
      data, 
      message: `Found ${data.length} ${domain} entries`,
      visualization: null
    }
  } catch (error: any) {
    console.error('❌ Execute query error:', error)
    throw error
  }
}

// ============================================
// RETRIEVE QUERY EXECUTOR - Search documents and entries
// ============================================
async function executeRetrieveQuery(querySpec: any, userId: string, supabase: any) {
  const { domain, searchTerms, filters } = querySpec
  
  console.log('🔍 Executing retrieve query:', { domain, searchTerms, filters })
  
  // Determine if we should search across all domains
  // If search terms include multiple document types (license + insurance), search everywhere
  const searchTermsLower = (searchTerms || []).map((t: string) => t.toLowerCase())
  const hasMultipleDocTypes = 
    (searchTermsLower.some((t: string) => ['license', 'registration', 'id', 'identification'].includes(t)) &&
     searchTermsLower.some((t: string) => ['insurance', 'policy', 'card'].includes(t))) ||
    searchTermsLower.includes('documents') ||
    searchTermsLower.includes('all')
  
  // If query involves multiple document types, search all domains
  const shouldSearchAllDomains = domain === 'all' || hasMultipleDocTypes
  
  console.log('🔍 Search strategy:', { shouldSearchAllDomains, hasMultipleDocTypes, searchTermsLower })
  
  try {
    const results: any[] = []
    let documentsFound: any[] = []
    let entriesFound: any[] = []
    
    // Search documents table - ALWAYS search all documents first, then filter by search terms
    try {
      const docQuery = supabase
        .from('documents')
        .select('id, document_name, document_type, file_url, file_path, expiration_date, domain, metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)  // Get more docs to filter from
      
      const { data: docs, error: docError } = await docQuery
      
      console.log('📄 Documents query result:', { count: docs?.length, error: docError?.message })
      
      if (!docError && docs) {
        // Filter by search terms using fuzzy matching
        if (searchTerms && searchTerms.length > 0) {
          documentsFound = docs.filter((doc: any) => {
            const searchableText = [
              doc.document_name || '',
              doc.document_type || '',
              doc.domain || '',
              JSON.stringify(doc.metadata || {})
            ].join(' ').toLowerCase()
            
            // Match if ANY search term is found
            const matches = searchTerms.some((term: string) => 
              searchableText.includes(term.toLowerCase())
            )
            
            // Also filter by domain if specified (but not if shouldSearchAllDomains)
            if (!shouldSearchAllDomains && domain && domain !== 'all') {
              return matches && doc.domain === domain
            }
            
            return matches
          })
        } else if (!shouldSearchAllDomains && domain && domain !== 'all') {
          // Only filter by domain if no search terms
          documentsFound = docs.filter((doc: any) => doc.domain === domain)
        } else {
          documentsFound = docs
        }
        
        console.log('📄 Documents filtered:', { found: documentsFound.length })
      }
    } catch (docErr) {
      console.log('📄 Document search error:', docErr)
    }
    
    // Search domain_entries table
    try {
      let entryQuery = supabase
        .from('domain_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      
      // Only filter by domain if not searching all
      if (!shouldSearchAllDomains && domain && domain !== 'all') {
        entryQuery = entryQuery.eq('domain', domain)
      }
      
      // Apply category filter if present
      if (filters?.category) {
        entryQuery = entryQuery.contains('metadata', { category: filters.category })
      }
      
      const { data: entries, error: entryError } = await entryQuery
      
      console.log('📋 Entries query result:', { count: entries?.length, error: entryError?.message })
      
      if (!entryError && entries) {
        // Filter by search terms using fuzzy matching
        if (searchTerms && searchTerms.length > 0) {
          entriesFound = entries.filter((entry: any) => {
            const searchableText = [
              entry.title || '',
              entry.description || '',
              entry.domain || '',
              JSON.stringify(entry.metadata || {})
            ].join(' ').toLowerCase()
            
            // Match if ANY search term is found
            return searchTerms.some((term: string) => 
              searchableText.includes(term.toLowerCase())
            )
          })
        } else {
          entriesFound = entries
        }
        
        console.log('📋 Entries filtered:', { found: entriesFound.length })
      }
    } catch (entryErr) {
      console.log('📋 Entry search error:', entryErr)
    }
    
    // Combine and format results
    const totalFound = documentsFound.length + entriesFound.length
    
    let message = ''
    
    if (totalFound === 0) {
      message = `🔍 I couldn't find any matching items for "${searchTerms?.join(', ') || domain}".\n\n`
      message += `**Tips:**\n`
      message += `• Try different keywords\n`
      message += `• Check if the document/item has been uploaded\n`
      message += `• Use the Documents page to browse all your files`
    } else {
      message = `📋 **Found ${totalFound} matching item${totalFound !== 1 ? 's' : ''}**\n\n`
      
      // Show documents first
      if (documentsFound.length > 0) {
        message += `📄 **Documents (${documentsFound.length})**\n`
        documentsFound.slice(0, 5).forEach((doc: any, i: number) => {
          message += `${i + 1}. **${doc.document_name || 'Untitled'}**\n`
          if (doc.document_type) message += `   Type: ${doc.document_type}\n`
          if (doc.domain) message += `   Domain: ${doc.domain}\n`
          if (doc.file_url) message += `   📎 [View Document](${doc.file_url})\n`
          message += '\n'
        })
        if (documentsFound.length > 5) {
          message += `   _...and ${documentsFound.length - 5} more documents_\n\n`
        }
      }
      
      // Show domain entries
      if (entriesFound.length > 0) {
        message += `📝 **Entries (${entriesFound.length})**\n`
        entriesFound.slice(0, 5).forEach((entry: any, i: number) => {
          message += `${i + 1}. **${entry.title || 'Untitled'}**\n`
          if (entry.domain) message += `   Domain: ${entry.domain}\n`
          if (entry.metadata?.amount) message += `   💰 $${entry.metadata.amount}\n`
          if (entry.metadata?.type) message += `   Type: ${entry.metadata.type}\n`
          const date = new Date(entry.created_at).toLocaleDateString()
          message += `   📅 ${date}\n`
          message += '\n'
        })
        if (entriesFound.length > 5) {
          message += `   _...and ${entriesFound.length - 5} more entries_\n`
        }
      }
    }
    
    return {
      data: {
        documents: documentsFound,
        entries: entriesFound,
        totalCount: totalFound
      },
      message,
      visualization: null
    }
  } catch (error: any) {
    console.error('❌ Retrieve query error:', error)
    throw error
  }
}

// ============================================
// MULTI-DOMAIN QUERY EXECUTOR
// ============================================
async function executeMultiDomainQuery(querySpec: any, userId: string, supabase: any) {
  const { domains, filters } = querySpec
  
  console.log('🌐 Executing multi-domain query:', domains)
  
  try {
    // Build query for all requested domains or all domains
    let query = supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
    
    // Filter by specific domains if provided
    if (domains && domains.length > 0) {
      query = query.in('domain', domains)
    }
    
    // Apply date range filter
    if (filters?.dateRange) {
      const dateFilter = getDateRange(filters.dateRange)
      query = query.gte('created_at', dateFilter.start)
                   .lte('created_at', dateFilter.end)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    
    console.log(`🌐 Multi-domain query returned ${data.length} results`)
    
    // Group data by domain
    const groupedByDomain: Record<string, any[]> = {}
    data.forEach((entry: { domain: string; [key: string]: any }) => {
      if (!groupedByDomain[entry.domain]) {
        groupedByDomain[entry.domain] = []
      }
      groupedByDomain[entry.domain].push(entry)
    })
    
    // Create summary
    let message = `📊 **Multi-Domain Overview**\n\n`
    message += `Total entries: ${data.length}\n`
    message += `Active domains: ${Object.keys(groupedByDomain).length}\n\n`
    
    Object.entries(groupedByDomain).forEach(([domain, entries]) => {
      message += `• **${domain.toUpperCase()}**: ${entries.length} entries\n`
    })
    
    // Create multi-domain visualization
    const visualization = {
      type: 'combo',
      title: 'Multi-Domain Activity Overview',
      xAxis: 'Domain',
      yAxis: 'Entry Count',
      data: Object.entries(groupedByDomain).map(([domain, entries]) => ({
        domain: domain.toUpperCase(),
        value: entries.length,
        label: domain
      })),
      config: {
        height: 400,
        showGrid: true,
        showLegend: true,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
      }
    }
    
    return {
      data: groupedByDomain,
      message,
      visualization
    }
  } catch (error: any) {
    console.error('❌ Multi-domain query error:', error)
    throw error
  }
}

// ============================================
// CUSTOM VISUALIZATION EXECUTOR
// ============================================
async function executeCustomVisualization(querySpec: any, userId: string, supabase: any) {
  const { domains, filters, visualization, customVisualization } = querySpec
  
  console.log('🎨 Creating custom visualization:', visualization)
  
  try {
    // Fetch data for all requested datasets
    const datasets: any[] = []
    
    if (visualization?.datasets) {
      for (const dataset of visualization.datasets) {
        let query = supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', userId)
        
        // Filter by domain if specified
        if (dataset.domain) {
          query = query.eq('domain', dataset.domain)
        }
        
        // Filter by metric type
        if (dataset.metric) {
          query = query.contains('metadata', { type: dataset.metric })
        }
        
        // Apply date range
        if (filters?.dateRange) {
          const dateFilter = getDateRange(filters.dateRange)
          query = query.gte('created_at', dateFilter.start)
                       .lte('created_at', dateFilter.end)
        }
        
        const { data, error } = await query.order('created_at', { ascending: true })
        
        if (!error && data) {
          datasets.push({
            name: dataset.name || dataset.metric,
            domain: dataset.domain,
            data: data.map((entry: { created_at: string; metadata?: any; title: string }) => ({
              date: new Date(entry.created_at).toLocaleDateString(),
              timestamp: entry.created_at,
              value: entry.metadata?.value || entry.metadata?.amount || 0,
              label: entry.title
            }))
          })
        }
      }
    } else if (domains) {
      // Fetch all data from specified domains
      for (const domain of domains) {
        let query = supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', userId)
          .eq('domain', domain)
        
        if (filters?.dateRange) {
          const dateFilter = getDateRange(filters.dateRange)
          query = query.gte('created_at', dateFilter.start)
                       .lte('created_at', dateFilter.end)
        }
        
        const { data, error } = await query.order('created_at', { ascending: true })
        
        if (!error && data) {
          datasets.push({
            name: domain.toUpperCase(),
            domain,
            data: data.map((entry: { created_at: string; metadata?: any; title: string }) => ({
              date: new Date(entry.created_at).toLocaleDateString(),
              timestamp: entry.created_at,
              value: entry.metadata?.value || entry.metadata?.amount || 1,
              label: entry.title
            }))
          })
        }
      }
    }
    
    console.log(`🎨 Created ${datasets.length} datasets for visualization`)
    
    // Create custom visualization
    const customViz = {
      type: visualization?.type || 'multi_line',
      title: visualization?.title || customVisualization?.description || 'Custom Visualization',
      xAxis: visualization?.xAxis || 'Date',
      yAxis: visualization?.yAxis || 'Value',
      datasets: datasets,
      config: {
        height: 400,
        showGrid: true,
        showLegend: true,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
      }
    }
    
    let message = `📊 **${customViz.title}**\n\n`
    message += `Datasets: ${datasets.length}\n`
    datasets.forEach(ds => {
      message += `• ${ds.name}: ${ds.data.length} data points\n`
    })
    message += `\n📈 **Interactive chart generated below**`
    
    return {
      data: datasets,
      message,
      visualization: customViz
    }
  } catch (error: any) {
    console.error('❌ Custom visualization error:', error)
    throw error
  }
}

// ============================================
// DATE RANGE HELPER
// ============================================
function getDateRange(range: string) {
  const now = new Date()
  const start = new Date()
  
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      break
    case 'this_week':
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
      break
    case 'last_week':
      start.setDate(now.getDate() - now.getDay() - 7)
      start.setHours(0, 0, 0, 0)
      break
    case 'this_month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    case 'last_month':
      start.setMonth(now.getMonth() - 1)
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    case 'this_year':
      start.setMonth(0)
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    default:
      start.setFullYear(now.getFullYear() - 1)
  }
  
  return { 
    start: start.toISOString(), 
    end: now.toISOString() 
  }
}

// ============================================
// RESPONSE FORMATTERS
// ============================================
function formatAggregateResponse(data: any[], filters: any, domain: string) {
  const metricType = filters?.metricType
  
  // Count entries
  const count = data.length
  
  // Calculate sum for numeric metrics
  let total = 0
  let average = 0
  
  data.forEach(entry => {
    const metadata = entry.metadata || {}
    
    // Sum amounts (expenses, income, etc)
    if (metadata.amount) {
      total += metadata.amount
    }
    
    // Sum values (weight, steps, etc)
    if (metadata.value) {
      total += metadata.value
    }
    
    // Sum costs
    if (metadata.cost) {
      total += metadata.cost
    }
  })
  
  if (count > 0) {
    average = total / count
  }
  
  let message = `📊 **${domain?.toUpperCase() || 'ALL'} Summary**\n\n`
  message += `• Total entries: ${count}\n`
  
  if (total > 0) {
    if (domain === 'financial' || metricType === 'expense' || metricType === 'income') {
      message += `• Total amount: $${total.toFixed(2)}\n`
      message += `• Average: $${average.toFixed(2)}\n`
    } else if (domain === 'health' && metricType === 'weight') {
      message += `• Average weight: ${average.toFixed(1)} lbs\n`
    } else if (domain === 'fitness') {
      message += `• Total value: ${total.toFixed(0)}\n`
    } else {
      message += `• Total: ${total.toFixed(2)}\n`
      message += `• Average: ${average.toFixed(2)}\n`
    }
  }
  
  return {
    data: { count, total, average, entries: data.slice(0, 10) },
    message,
    visualization: null
  }
}

function formatListResponse(data: any[], filters: any, domain: string) {
  const maxDisplay = 10
  const displayData = data.slice(0, maxDisplay)
  
  let message = `📋 **${domain?.toUpperCase() || 'ALL'} Entries** (${data.length} total)\n\n`
  
  displayData.forEach((entry, index) => {
    const metadata = entry.metadata || {}
    message += `${index + 1}. **${entry.title}**\n`
    
    if (metadata.amount) {
      message += `   💰 $${metadata.amount}\n`
    }
    if (metadata.value) {
      message += `   📊 ${metadata.value}\n`
    }
    if (entry.created_at) {
      const date = new Date(entry.created_at)
      message += `   📅 ${date.toLocaleDateString()}\n`
    }
    message += '\n'
  })
  
  if (data.length > maxDisplay) {
    message += `\n_...and ${data.length - maxDisplay} more entries_`
  }
  
  return {
    data: displayData,
    message,
    visualization: null
  }
}

function formatVisualizationResponse(data: any[], filters: any, domain: string, visSpec: any) {
  // Prepare data for chart
  const chartData = data.map(entry => {
    const metadata = entry.metadata || {}
    return {
      date: new Date(entry.created_at).toLocaleDateString(),
      timestamp: entry.created_at,
      value: metadata.value || metadata.amount || metadata.cost || 0,
      label: entry.title
    }
  }).reverse() // Chronological order
  
  const visualization = {
    type: visSpec?.type || 'line',
    title: visSpec?.title || `${domain} Trend`,
    xAxis: visSpec?.xAxis || 'Date',
    yAxis: visSpec?.yAxis || 'Value',
    data: chartData,
    config: {
      height: 300,
      showGrid: true,
      showLegend: true,
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    }
  }
  
  let message = `📈 **${visualization.title}**\n\n`
  message += `Found ${data.length} data points\n`
  
  if (chartData.length > 0) {
    const values = chartData.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    
    message += `• Min: ${min.toFixed(2)}\n`
    message += `• Max: ${max.toFixed(2)}\n`
    message += `• Avg: ${avg.toFixed(2)}\n`
  }
  
  message += `\n📊 **Chart generated below**`
  
  return {
    data: chartData,
    message,
    visualization
  }
}

function formatCompareResponse(data: any[], filters: any, domain: string) {
  // Split data into two periods for comparison
  const midpoint = Math.floor(data.length / 2)
  const period1 = data.slice(0, midpoint)
  const period2 = data.slice(midpoint)
  
  const sum1 = period1.reduce((sum, e) => sum + (e.metadata?.amount || e.metadata?.value || 0), 0)
  const sum2 = period2.reduce((sum, e) => sum + (e.metadata?.amount || e.metadata?.value || 0), 0)
  
  const change = sum2 - sum1
  const percentChange = sum1 > 0 ? ((change / sum1) * 100) : 0
  
  let message = `📊 **Comparison Results**\n\n`
  message += `Earlier Period: $${sum1.toFixed(2)} (${period1.length} entries)\n`
  message += `Later Period: $${sum2.toFixed(2)} (${period2.length} entries)\n`
  message += `\n`
  message += `Change: ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${percentChange.toFixed(1)}%)\n`
  
  return {
    data: { period1: sum1, period2: sum2, change, percentChange },
    message,
    visualization: null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, userData, conversationHistory, userTime } = await request.json()

    console.log('🤖 AI Assistant received message:', message)
    console.log('🕐 User time info:', userTime)
    
    // Initialize Supabase client
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Base URL + cookies for any server-to-server calls made during this request.
    // Using request origin keeps production working even if NEXT_PUBLIC_APP_URL is misconfigured.
    const baseUrl = request.nextUrl.origin
    const cookieHeader = request.headers.get('cookie') || ''

    // Fast-path: "what can you do / list commands"
    if (typeof message === 'string' && isCommandCatalogRequest(message)) {
      return NextResponse.json({
        response: formatCommandCatalogForUser(),
        action: 'capabilities',
        saved: false,
        triggerReload: false
      })
    }

    // STEP 0.5: Check for MIXED INTENT messages (e.g., "pull up my driver docs and log 20oz water")
    // This handles compound requests that contain BOTH retrieval AND data logging
    console.log('🧠 Step 0.5: Checking for MIXED INTENT message...')
    const mixedResult = detectMixedIntents(message)
    if (mixedResult.isMulti) {
      console.log('🎯 Detected MIXED INTENTS - handling compound request')
      console.log('🎯 Intent types found:', mixedResult.intents.map(i => `${i.type}:"${i.segment}"`).join(', '))
      
      try {
        const multiResult = await handleMultipleVoiceCommands(message, user.id, supabase)
        
        if (multiResult.isCommand) {
          console.log(`✅ Mixed intent processed! Action: ${multiResult.action}`)
          return NextResponse.json({
            response: multiResult.message,
            action: multiResult.action,
            multiResults: multiResult.results,
            queryResults: multiResult.queryResults,
            saved: multiResult.results && multiResult.results.length > 0,
            triggerReload: multiResult.results && multiResult.results.length > 0
          })
        }
        console.log('⚠️ Mixed intent handler did not match, continuing to individual handlers...')
      } catch (mixedError: any) {
        console.error('❌ Mixed intent handler error:', mixedError.message)
        // Continue to individual handlers
      }
    }

    // STEP 1: Check if it's a QUERY (read operation)
    console.log('🧠 Step 1: Checking if message is a QUERY...')
    console.log('👤 User ID:', user.id)
    console.log('📧 User email:', user.email)
    
    try {
      const queryResult = await intelligentQueryHandler(message, user.id, supabase)
      
      if (queryResult.isQuery) {
        console.log('✅ AI detected QUERY and executed!')
        return NextResponse.json({
          response: queryResult.message,
          data: queryResult.data,
          visualization: queryResult.visualization,
          action: 'query',
          queryType: queryResult.queryType,
          saved: false
        })
      }
      
      console.log('💬 Not a query, checking if it\'s a SEND command...')
    } catch (queryError: any) {
      console.error('❌ Query handler error:', queryError)
      // Continue to send checking
    }

    // STEP 1.25: Check if it's a SEND command (share documents/data)
    console.log('🧠 Step 1.25: Checking if message is a SEND command...')
    
    try {
      const sendResult = await intelligentSendHandler(message, user.id, supabase, baseUrl, cookieHeader)
      
      if (sendResult.isSend) {
        console.log('✅ AI detected SEND command!')
        
        return NextResponse.json({
          response: sendResult.message,
          action: 'send',
          success: sendResult.success,
          details: sendResult.details,
          suggestion: sendResult.suggestion,
          contact: sendResult.contact,
          saved: false,
          triggerReload: false
        })
      }
      
      console.log('💬 Not a send command, checking if it\'s an ACTION...')
    } catch (sendError: any) {
      console.error('❌ Send handler error:', sendError)
      // Continue to action checking
    }

    // STEP 1.5: Check if it's an ACTION (delete, update, predict, export, etc.)
    console.log('🧠 Step 1.5: Checking if message is an ACTION...')
    
    try {
      const actionResult = await intelligentActionHandler(message, user.id, supabase, baseUrl, cookieHeader)
      
      if (actionResult.isAction) {
        console.log('✅ AI detected ACTION:', actionResult.actionType)
        
        // If action requires confirmation, return preview
        if (actionResult.requiresConfirmation) {
          return NextResponse.json({
            response: actionResult.message,
            requiresConfirmation: true,
            action: actionResult.actionType,
            confirmationId: actionResult.confirmationId,
            preview: actionResult.preview,
            totalCount: actionResult.totalCount,
            params: actionResult.params
          })
        }
        
        // Return completed action result
        return NextResponse.json({
          response: actionResult.message,
          action: actionResult.actionType,
          data: actionResult.data,
          prediction: actionResult.prediction,
          correlation: actionResult.correlation,
          report: actionResult.report,
          exportData: actionResult.exportData ? {
            data: actionResult.data,
            mimeType: actionResult.mimeType,
            filename: actionResult.filename,
            count: actionResult.count
          } : undefined,
          calculation: actionResult.result ? {
            type: actionResult.actionType,
            result: actionResult.result
          } : undefined,
          analysis: actionResult.analysis,
          duplicates: actionResult.duplicates,
          saved: actionResult.success,
          triggerReload: actionResult.success
        })
      }
      
      console.log('💬 Not an action, checking if it\'s a MULTI-ENTRY command...')
    } catch (actionError: any) {
      console.error('❌ Action handler error:', actionError)
      // Continue to command checking
    }
    
    // STEP 1.75: Check if it's a MULTI-INTENT message (multiple data points)
    // This handles cases like "ran 5 miles, blood pressure 123/80, ate chicken sandwich 450 calories"
    console.log('🧠 Step 1.75: Checking if message contains MULTIPLE data points...')
    
    try {
      const isMultiIntent = detectMultiIntentMessage(message)
      
      if (isMultiIntent) {
        console.log('✅ Detected MULTI-INTENT message, routing to multi-entry endpoint...')
        
        // Call the multi-entry endpoint which uses extractMultipleEntities
        const multiEntryResponse = await fetch(`${baseUrl}/api/ai-assistant/multi-entry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieHeader,
          },
          body: JSON.stringify({ message, userTime })
        })
        
        if (multiEntryResponse.ok) {
          const multiEntryResult = await multiEntryResponse.json()
          
          if (multiEntryResult.success && multiEntryResult.results?.length > 0) {
            console.log(`✅ Multi-entry processed ${multiEntryResult.results.length} entries successfully!`)
            return NextResponse.json({
              response: multiEntryResult.message,
              action: 'multi_entry',
              multiResults: multiEntryResult.results,
              saved: true,
              triggerReload: true
            })
          } else if (multiEntryResult.results?.length === 0 && multiEntryResult.errors?.length > 0) {
            console.log('⚠️ Multi-entry had errors, falling back to single command parser')
            // Fall through to single command parser
          } else if (!multiEntryResult.success) {
            console.log('⚠️ Multi-entry returned no results, falling back to single command parser')
            // Fall through to single command parser
          }
        } else {
          console.error('❌ Multi-entry endpoint failed:', multiEntryResponse.status)
          // Fall through to single command parser
        }
      } else {
        console.log('💬 Not a multi-intent message, checking if it\'s a single COMMAND...')
      }
    } catch (multiEntryError: any) {
      console.error('❌ Multi-entry handler error:', multiEntryError)
      // Continue to single command checking
    }
    
    // STEP 2: Check if it's a COMMAND (create operation)
    console.log('🧠 Step 2: Checking if message is a COMMAND...')
    
    try {
      const commandResult = await intelligentCommandParser(message, user.id, supabase, baseUrl, cookieHeader, userTime)
      
      if (commandResult.isCommand) {
        console.log('✅ AI detected command and executed:', commandResult.action)
        console.log('✅ Returning success response:', commandResult.message)
        console.log('📊 Visualization data:', commandResult.visualization ? 'present' : 'none')
        return NextResponse.json({
          response: commandResult.message,
          action: commandResult.action,
          visualization: commandResult.visualization,  // Include chart data!
          data: 'data' in commandResult ? commandResult.data : undefined,
          saved: commandResult.action !== 'custom_chart',  // Charts don't save data
          triggerReload: commandResult.action !== 'custom_chart'  // Don't reload for chart views
        })
      }
      
      console.log('💬 AI said not a command, trying regex fallback with multi-command support...')
      console.log('🔧 [FALLBACK] Original message for regex parsing:', message)
      // ALWAYS try regex fallback even if AI says it's not a command
      // Use handleMultipleVoiceCommands to process multiple commands separated by commas/and
      try {
        const fallbackResult = await handleMultipleVoiceCommands(message, user.id, supabase)
        console.log('🔧 [FALLBACK] Regex result:', { isCommand: fallbackResult.isCommand, action: fallbackResult.action })
        if (fallbackResult.isCommand) {
          console.log('✅ Regex fallback caught command! Action:', fallbackResult.action)
          console.log('✅ Regex fallback message:', fallbackResult.message)
          return NextResponse.json({
            response: fallbackResult.message,
            action: fallbackResult.action,
            multiResults: fallbackResult.results,
            saved: true,
            triggerReload: true
          })
        } else {
          console.log('⚠️ Regex fallback did NOT match any pattern')
        }
      } catch (fallbackError) {
        console.error('❌ Regex fallback threw error:', fallbackError)
      }
      
      console.log('💬 Not a command either, proceeding to conversational AI...')
    } catch (commandError: any) {
      console.error('❌ Error in intelligent command parser:', commandError)
      console.error('❌ Details:', commandError?.message)
      // Try fallback regex parser on error too - with multi-command support
      try {
        const fallbackResult = await handleMultipleVoiceCommands(message, user.id, supabase)
        if (fallbackResult.isCommand) {
          return NextResponse.json({
            response: fallbackResult.message,
            action: fallbackResult.action,
            multiResults: fallbackResult.results,
            saved: true,
            triggerReload: true
          })
        }
      } catch (fallbackError) {
        console.error('❌ Fallback parser also failed:', fallbackError)
      }
    }

    // Otherwise, use OpenAI API
    const openAIKey = process.env.OPENAI_API_KEY

    if (!openAIKey) {
      // Fallback response without AI
      return NextResponse.json({
        response: generateFallbackResponse(message, userData)
      })
    }

    // Fetch user's AI settings
    console.log('⚙️ Fetching user AI settings...')
    const aiSettings = await getUserAISettings(supabase, user.id)
    console.log(`✅ AI Settings loaded: ${aiSettings.aiName}, tone: ${aiSettings.tone}, model: ${aiSettings.modelVersion}`)

    // Fetch recent mindfulness journal entries for context
    console.log('📖 Fetching recent mindfulness journal entries...')
    const mindfulnessContext = await fetchMindfulnessContext(supabase, user.id)
    console.log(`✅ Found ${mindfulnessContext.journalCount} journal entries`)

    // Fetch comprehensive user data for personalized responses
    console.log('📊 Fetching user data for personalized AI response...')
    const { fetchUserDataForAnalysis } = await import('@/lib/ai/intelligent-analysis')
    const userDomainData = await fetchUserDataForAnalysis(supabase, user.id, 'month')
    
    // Build rich user context
    const userDataContext = userDomainData.length > 0 ? `
**📊 USER'S ACTUAL DATA (use this to answer personal questions!):**
${userDomainData.map((d: any) => `
- **${d.domain.toUpperCase()}**: ${d.entries.length} entries
  ${Object.entries(d.metrics).map(([k, v]: [string, any]) => `  • ${k}: latest=${v[v.length-1] || 'N/A'}, avg=${(v.reduce((a: number, b: number) => a+b, 0)/v.length).toFixed(1)}`).join('\n  ')}
  Recent: ${d.entries.slice(-3).map((e: any) => e.title).join(', ')}
`).join('')}

**IMPORTANT**: When the user asks personal questions like:
- "How am I doing with X?" → Reference their actual data above
- "What's my average Y?" → Calculate from the metrics above
- "Am I making progress?" → Compare recent vs older entries
- "What should I focus on?" → Analyze patterns and give specific advice
- "Tell me about my health/finances/etc" → Summarize their actual entries

Always use SPECIFIC NUMBERS from their data, not generic advice!
` : ''

    // Build base system prompt
    const basePrompt = `You are LifeHub AI - a highly intelligent, personalized AI assistant with FULL ACCESS to the user's life data. You have deep knowledge of their patterns across 21 life domains.

${userDataContext}

Your capabilities:
1. **Answer ANY question about their data** - Use the actual numbers and entries above
2. **Provide personalized insights** - Connect patterns across domains
3. **Give specific recommendations** - Based on their actual behavior
4. **Be conversational** - You're their smart life assistant, not a generic chatbot

When answering:
- Always reference SPECIFIC data points (amounts, dates, metrics)
- Connect insights across domains when relevant
- Be proactive about suggesting improvements
- Ask clarifying questions if needed`

    // Apply user's AI settings to the system prompt
    let systemPrompt = buildSystemPromptWithSettings(basePrompt, aiSettings)

    if (mindfulnessContext.hasJournals) {
      systemPrompt += `\n\n🧠 MINDFULNESS CONTEXT:
The user has been journaling recently. Here's their recent emotional state and reflections:
${mindfulnessContext.summary}

When relevant, you can:
- Reference their emotional state with empathy
- Connect their questions to recent journal insights
- Offer support based on their mindfulness journey
- Be gentle and validating when discussing emotional topics

Don't force mindfulness references, but use this context when it adds value.`
    }

    // Get model based on user preference
    const selectedModel = getOpenAIModel(aiSettings.modelVersion)

    // Call OpenAI API with function calling for document retrieval
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content:
              systemPrompt +
              COMMAND_CATALOG_PROMPT +
              `\n\nDOCUMENT RETRIEVAL:\nYou can search user's documents. When asked about documents (e.g., "show my insurance", "find my license", "pull up my auto insurance"), use the search_documents function.\n\nACTION EXECUTION:\nWhen the user asks you to DO something (create/update/delete/export/analyze/etc.), call execute_ai_action with an allowed action and parameters. For destructive actions (delete/bulk_delete/archive/bulk_update), the API may return requiresConfirmation + confirmationId; present that to the user and wait for confirmation.`
          },
          ...conversationHistory.slice(-10).map((msg: any) => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'user',
            content: `User question: ${message}\n\nUser data summary: ${JSON.stringify(userData).substring(0, 2000)}`
          }
        ],
        temperature: aiSettings.temperature,
        max_tokens: Math.min(aiSettings.maxTokens, 4000),
        functions: [
          {
            name: 'search_documents',
            description: 'Search and retrieve user documents by keywords or category. Use this when user asks to see, find, show, or pull up documents.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search keywords (e.g., "insurance", "license", "auto")'
                },
                category: {
                  type: 'string',
                  enum: ['insurance', 'health', 'vehicles', 'financial', 'legal', 'all'],
                  description: 'Document category to filter by'
                }
              },
              required: []
            }
          },
          {
            name: 'execute_ai_action',
            description:
              'Execute an allowed LifeHub action (create tasks/habits/bills/events, create/update/delete entries, export/analyze/predict/correlate/generate_report, open tools, navigate, add to Google Calendar). Use this when the user asks you to perform an action. The API may require confirmation for destructive actions.',
            parameters: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: AI_ASSISTANT_ACTIONS as unknown as string[],
                  description: 'The action to execute'
                },
                domain: {
                  type: 'string',
                  description:
                    "Target domain (e.g., 'financial', 'health', 'vehicles') or 'all' for cross-domain actions when supported"
                },
                parameters: {
                  type: 'object',
                  description: 'Action-specific parameters'
                },
                confirmation: {
                  type: 'boolean',
                  description: 'Set true to confirm a previously previewed destructive action'
                },
                confirmationId: {
                  type: 'string',
                  description: 'Confirmation id returned by a previous requiresConfirmation response'
                }
              },
              required: ['action', 'parameters']
            }
          },
          {
            name: 'use_concierge',
            description: 'Delegate to the AI Concierge for calling businesses, getting quotes, booking appointments, or making reservations.',
            parameters: {
              type: 'object',
              properties: {
                intent: {
                  type: 'string',
                  description: 'The user intent (e.g., "book_table", "get_quote", "order_food")'
                },
                details: {
                  type: 'string',
                  description: 'Summary of what the user wants'
                }
              },
              required: ['intent']
            }
          }
        ],
        function_call: 'auto'
      }),
    })

    if (!response.ok) {
      throw new Error('OpenAI API failed')
    }

    const data = await response.json()
    const aiMessage = data.choices[0]?.message
    
    // Check if AI wants to call a function
    if (aiMessage?.function_call) {
      const functionName = aiMessage.function_call.name
      const functionArgs = JSON.parse(aiMessage.function_call.arguments || '{}')
      
      console.log('🔧 AI calling function:', functionName, functionArgs)

      if (functionName === 'execute_ai_action') {
        try {
          const actionPayload = {
            action: functionArgs.action,
            domain: functionArgs.domain || '',
            parameters: functionArgs.parameters || {},
            confirmation: !!functionArgs.confirmation,
            confirmationId: functionArgs.confirmationId
          }

          const actionRes = await fetch(new URL('/api/ai-assistant/actions', baseUrl), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(cookieHeader ? { Cookie: cookieHeader } : {})
            },
            body: JSON.stringify(actionPayload)
          })

          const actionJson = await actionRes.json()

          // Pass through confirmation requests so the frontend can render them
          if (actionJson?.requiresConfirmation) {
            return NextResponse.json({
              response: actionJson.message || 'This action requires confirmation.',
              requiresConfirmation: true,
              confirmationId: actionJson.confirmationId,
              action: actionJson.action || functionArgs.action,
              preview: actionJson.preview,
              totalCount: actionJson.totalCount,
              params: functionArgs.parameters
            })
          }

          return NextResponse.json({
            response: actionJson.message || '✅ Action executed.',
            action: functionArgs.action,
            ...actionJson
          })
        } catch (e: any) {
          console.error('❌ execute_ai_action failed:', e)
          return NextResponse.json(
            { response: '❌ Failed to execute action. Please try again.' },
            { status: 500 }
          )
        }
      }
      
      if (functionName === 'use_concierge') {
        return NextResponse.json({
          response: `I'll hand you over to the Concierge to help with ${functionArgs.details || 'that'}.`,
          action: 'concierge_handoff',
          conciergeData: {
            intent: functionArgs.intent,
            details: functionArgs.details,
            initialMessage: message
          }
        })
      }

      if (functionName === 'search_documents') {
        // Search documents
        let searchQuery = supabase
          .from('documents')
          .select('id, document_name, document_type, file_url, file_path, expiration_date, domain, metadata')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (functionArgs.category && functionArgs.category !== 'all') {
          searchQuery = searchQuery.eq('domain', functionArgs.category)
        }
        
        const { data: docs, error: docError } = await searchQuery.limit(20)
        
        if (docError) {
          console.error('❌ Document search error:', docError)
          return NextResponse.json({
            response: `I had trouble searching your documents. Please try again.`,
          })
        }
        
        if (!docs || docs.length === 0) {
          console.log('📭 No documents found')
          return NextResponse.json({
            response: `I couldn't find any documents matching "${functionArgs.query || 'your request'}". You can upload documents in the Documents section or any domain page.`,
          })
        }
        
        // Filter by text if query provided
        let filteredDocs = docs
        if (functionArgs.query) {
          const queryLower = functionArgs.query.toLowerCase()
          filteredDocs = docs.filter(doc =>
            doc.document_name?.toLowerCase().includes(queryLower) ||
            doc.document_type?.toLowerCase().includes(queryLower) ||
            doc.domain?.toLowerCase().includes(queryLower)
          )
        }
        
        if (filteredDocs.length === 0) {
          console.log(`📭 No documents matched query: ${functionArgs.query}`)
          return NextResponse.json({
            response: `I found ${docs.length} document(s) but none matched "${functionArgs.query}". Try a different search term or browse your documents directly.`,
          })
        }
        
        const docList = filteredDocs.map(doc => ({
          id: doc.id,
          name: doc.document_name || 'Untitled',
          type: doc.document_type,
          category: doc.metadata?.category || doc.domain,
          expirationDate: doc.expiration_date,
          url: doc.file_url || doc.file_path
        }))
        
        console.log(`✅ Found ${docList.length} documents`)
        
        return NextResponse.json({
          response: `I found ${docList.length} document(s). Opening them now...`,
          documents: docList,
          openDocuments: true // Signal to frontend to open PDFs
        })
      }
    }
    
    const aiResponse = aiMessage?.content

    return NextResponse.json({
      response: aiResponse || 'I received your message but had trouble generating a response.',
      aiName: aiSettings.aiName
    })

  } catch (error) {
    console.error('AI Assistant API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

// Handle voice commands that save data
async function handleVoiceCommand(message: string, userId: string, supabase: any) {
  const lowerMessage = message.toLowerCase()
  
  console.log(`🔍 Checking command: "${lowerMessage}"`)
  
  // ============================================
  // SIMPLE CATCH-ALL PATTERNS (Check these FIRST)
  // ============================================
  
  // ============================================
  // CALENDAR EVENTS - Interview, Plan, Meeting, Appointment
  // These go to Google Calendar instead of domains
  // ============================================
  
  // Interview - catches "interview at [company] [when]"
  if (lowerMessage.includes('interview')) {
    const interviewMatch = lowerMessage.match(/interview\s+(?:at|with|for)\s+([a-z0-9\s&]+?)(?:\s+(?:tomorrow|today|next\s+week|on|at|this|$))/i)
    if (interviewMatch) {
      const company = interviewMatch[1].trim()
      
      // Extract date/time info
      let date = ''
      let time = ''
      if (lowerMessage.includes('tomorrow')) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        date = tomorrow.toISOString().split('T')[0]
      } else if (lowerMessage.includes('today')) {
        date = new Date().toISOString().split('T')[0]
      } else if (lowerMessage.includes('next week')) {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        date = nextWeek.toISOString().split('T')[0]
      }
      
      // Extract time if mentioned
      const timeMatch = lowerMessage.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
      if (timeMatch) {
        time = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3]}`
      }
      
      console.log(`✅ INTERVIEW → GOOGLE CALENDAR: ${company}${date ? ' on ' + date : ''}${time ? ' at ' + time : ''}`)
      
      // Create Google Calendar event
      const calendarResult = await createGoogleCalendarEvent(supabase, {
        title: `Interview with ${company}`,
        description: `Job interview at ${company}`,
        date: date || new Date().toISOString().split('T')[0],
        time: time || '10:00 am',
        duration: 60,
        type: 'interview'
      })
      
      if (calendarResult.success) {
        return {
          isCommand: true,
          action: 'add_to_calendar',
          message: `📅 ${calendarResult.message}${date ? (lowerMessage.includes('tomorrow') ? ' for tomorrow' : '') : ''}${time ? ' at ' + time : ''}`,
          calendarLink: calendarResult.htmlLink
        }
      } else {
        // Fallback: Save to career domain if calendar fails
        await saveToSupabase(supabase, userId, 'career', {
          id: randomUUID(),
          type: 'interview',
          company,
          date,
          time,
          interviewType: 'scheduled',
          position: '',
          timestamp: new Date().toISOString(),
          source: 'voice_ai'
        })
        
        return {
          isCommand: true,
          action: 'add_interview',
          message: `${calendarResult.message}\n\n✅ Saved interview to Career domain as backup.`
        }
      }
    }
  }
  
  // Plan - catches "plan [activity] [when]" or "I have a plan for..."
  if (lowerMessage.match(/\b(?:plan|planning|scheduled?)\b/) && !lowerMessage.includes('meal plan')) {
    const planMatch = lowerMessage.match(/(?:plan|planning|scheduled?)\s+(?:to\s+)?(?:a\s+)?(.+?)(?:\s+(?:for|on|at|tomorrow|today|next|this)\s+(.+))?$/i)
    if (planMatch) {
      const activity = planMatch[1]?.trim().replace(/\s+(?:for|on|at)$/, '') || 'planned activity'
      const whenPart = planMatch[2]?.trim() || ''
      
      // Parse date
      let date = new Date().toISOString().split('T')[0]
      let time = ''
      
      if (lowerMessage.includes('tomorrow')) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        date = tomorrow.toISOString().split('T')[0]
      } else if (lowerMessage.includes('next week')) {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        date = nextWeek.toISOString().split('T')[0]
      }
      
      // Extract time
      const timeMatch = lowerMessage.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
      if (timeMatch) {
        time = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3]}`
      }
      
      console.log(`✅ PLAN → GOOGLE CALENDAR: ${activity}${date ? ' on ' + date : ''}${time ? ' at ' + time : ''}`)
      
      const calendarResult = await createGoogleCalendarEvent(supabase, {
        title: activity.charAt(0).toUpperCase() + activity.slice(1),
        description: `Planned: ${activity}`,
        date,
        time: time || '12:00 pm',
        duration: 60,
        type: 'plan'
      })
      
      if (calendarResult.success) {
        return {
          isCommand: true,
          action: 'add_to_calendar',
          message: `📅 ${calendarResult.message}`,
          calendarLink: calendarResult.htmlLink
        }
      }
    }
  }
  
  // Meeting - catches "meeting with [person/company] [when]"
  if (lowerMessage.includes('meeting')) {
    const meetingMatch = lowerMessage.match(/meeting\s+(?:with\s+)?([a-z0-9\s&]+?)(?:\s+(?:tomorrow|today|next\s+week|on|at|this|about|$))/i)
    if (meetingMatch) {
      const withWhom = meetingMatch[1].trim()
      
      let date = new Date().toISOString().split('T')[0]
      let time = ''
      
      if (lowerMessage.includes('tomorrow')) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        date = tomorrow.toISOString().split('T')[0]
      } else if (lowerMessage.includes('next week')) {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        date = nextWeek.toISOString().split('T')[0]
      }
      
      const timeMatch = lowerMessage.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
      if (timeMatch) {
        time = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3]}`
      }
      
      console.log(`✅ MEETING → GOOGLE CALENDAR: with ${withWhom}${date ? ' on ' + date : ''}${time ? ' at ' + time : ''}`)
      
      const calendarResult = await createGoogleCalendarEvent(supabase, {
        title: `Meeting with ${withWhom}`,
        description: `Meeting scheduled with ${withWhom}`,
        date,
        time: time || '10:00 am',
        duration: 60,
        type: 'meeting'
      })
      
      if (calendarResult.success) {
        return {
          isCommand: true,
          action: 'add_to_calendar',
          message: `📅 ${calendarResult.message}${lowerMessage.includes('tomorrow') ? ' for tomorrow' : ''}${time ? ' at ' + time : ''}`,
          calendarLink: calendarResult.htmlLink
        }
      }
    }
  }
  
  // Appointment - catches "appointment with [person] [when]" or "doctor appointment"
  if (lowerMessage.includes('appointment')) {
    const appointmentMatch = lowerMessage.match(/(?:(\w+)\s+)?appointment(?:\s+with\s+([a-z0-9\s&]+))?(?:\s+(?:tomorrow|today|next\s+week|on|at|this|$))?/i)
    if (appointmentMatch) {
      const appointmentType = appointmentMatch[1]?.trim() || ''
      const withWhom = appointmentMatch[2]?.trim() || ''
      
      let title = 'Appointment'
      if (appointmentType) {
        title = `${appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1)} Appointment`
      }
      if (withWhom) {
        title += ` with ${withWhom}`
      }
      
      let date = new Date().toISOString().split('T')[0]
      let time = ''
      
      if (lowerMessage.includes('tomorrow')) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        date = tomorrow.toISOString().split('T')[0]
      } else if (lowerMessage.includes('next week')) {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        date = nextWeek.toISOString().split('T')[0]
      }
      
      const timeMatch = lowerMessage.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
      if (timeMatch) {
        time = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3]}`
      }
      
      console.log(`✅ APPOINTMENT → GOOGLE CALENDAR: ${title}${date ? ' on ' + date : ''}${time ? ' at ' + time : ''}`)
      
      const calendarResult = await createGoogleCalendarEvent(supabase, {
        title,
        description: `Scheduled appointment`,
        date,
        time: time || '10:00 am',
        duration: 60,
        type: 'appointment'
      })
      
      if (calendarResult.success) {
        return {
          isCommand: true,
          action: 'add_to_calendar',
          message: `📅 ${calendarResult.message}${lowerMessage.includes('tomorrow') ? ' for tomorrow' : ''}${time ? ' at ' + time : ''}`,
          calendarLink: calendarResult.htmlLink
        }
      }
    }
  }
  
  // Event - catches "event [name] [when]" or "create event"
  if (lowerMessage.match(/\b(?:event|reminder)\b/) && lowerMessage.match(/\b(?:add|create|schedule|set|new)\b/)) {
    const eventMatch = lowerMessage.match(/(?:add|create|schedule|set|new)\s+(?:an?\s+)?(?:event|reminder)\s+(?:for\s+)?(.+?)(?:\s+(?:tomorrow|today|next\s+week|on|at|$))/i)
    if (eventMatch) {
      const eventName = eventMatch[1]?.trim() || 'New Event'
      
      let date = new Date().toISOString().split('T')[0]
      let time = ''
      
      if (lowerMessage.includes('tomorrow')) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        date = tomorrow.toISOString().split('T')[0]
      } else if (lowerMessage.includes('next week')) {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        date = nextWeek.toISOString().split('T')[0]
      }
      
      const timeMatch = lowerMessage.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
      if (timeMatch) {
        time = `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3]}`
      }
      
      console.log(`✅ EVENT → GOOGLE CALENDAR: ${eventName}${date ? ' on ' + date : ''}${time ? ' at ' + time : ''}`)
      
      const calendarResult = await createGoogleCalendarEvent(supabase, {
        title: eventName.charAt(0).toUpperCase() + eventName.slice(1),
        description: `Event: ${eventName}`,
        date,
        time: time || '12:00 pm',
        duration: 60,
        type: 'event'
      })
      
      if (calendarResult.success) {
        return {
          isCommand: true,
          action: 'add_to_calendar',
          message: `📅 ${calendarResult.message}`,
          calendarLink: calendarResult.htmlLink
        }
      }
    }
  }
  
  // Simple expense: "spent $X [anything]"
  // FIX: Stop at comma or common separators to not capture multiple commands in description
  if (lowerMessage.match(/(?:spent|paid|bought)\s+\$?\d+/)) {
    const simpleExpenseMatch = lowerMessage.match(/(?:spent|paid|bought)\s+\$?(\d+(?:\.\d+)?)\s*([^,;]*?)(?:,|;|\s+and\s+|\s+also\s+|\s+plus\s+|$)/)
    if (simpleExpenseMatch) {
      const amount = parseFloat(simpleExpenseMatch[1])
      let description = simpleExpenseMatch[2].trim() || 'expense'
      description = description.replace(/^(on|for|at|dollars?|bucks?)\s+/i, '').trim() || 'expense'
      
      console.log(`✅ SIMPLE EXPENSE: $${amount} for ${description}`)
      
      await saveToSupabase(supabase, userId, 'financial', {
        id: randomUUID(),
        type: 'expense',
        amount,
        description,
        timestamp: new Date().toISOString(),
        source: 'voice_ai'
      })
      
      return {
        isCommand: true,
        action: 'save_expense',
        message: `✅ Logged expense: $${amount} for ${description} in Financial domain`
      }
    }
  }
  
  // Simple workout: "did X minute [exercise]"
  if (lowerMessage.match(/did\s+\d+\s*(?:minute|min|hour|hr)/)) {
    const simpleWorkoutMatch = lowerMessage.match(/did\s+(\d+)\s*(?:minute|min|hour|hr)s?\s+(.+)/)
    if (simpleWorkoutMatch) {
      const duration = parseInt(simpleWorkoutMatch[1])
      const exercise = simpleWorkoutMatch[2].trim().replace(/workout|exercise|session/gi, '').trim() || 'workout'
      const capitalizedExercise = exercise.charAt(0).toUpperCase() + exercise.slice(1)
      
      console.log(`✅ SIMPLE WORKOUT: ${duration} min ${exercise}`)
      
      await saveToSupabase(supabase, userId, 'fitness', {
        id: randomUUID(),
        type: 'workout',
        itemType: 'activity',        // For fitness dashboard filter
        activityType: capitalizedExercise,  // Required by fitness dashboard!
        exercise,
        duration,
        calories: Math.round(duration * 8), // Rough estimate
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        source: 'voice_ai'
      })
      
      return {
        isCommand: true,
        action: 'save_workout',
        message: `✅ Logged ${duration} min ${exercise} workout in Fitness domain`
      }
    }
  }
  
  // Activity verbs (running, walking, etc): "ran X minutes", "I cycled 20 min", etc.
  // Enhanced pattern to catch more variations
  if (lowerMessage.match(/\b(?:ran|run|running|jogged|jog|jogging|walked|walk|walking|cycled|cycle|cycling|biked|bike|biking|swam|swim|swimming|hiked|hike|hiking)\b/)) {
    // Multiple patterns to catch duration - try each one
    const patterns = [
      // "ran for 32 minutes" or "ran 32 minutes"
      /(?:ran|run|running|jogged|jog|jogging|walked|walk|walking|cycled|cycle|cycling|biked|bike|biking|swam|swim|swimming|hiked|hike|hiking)\s+(?:for\s+)?(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i,
      // "32 minutes of running" or "32 min run"
      /(\d+)\s*(?:minutes?|mins?|hours?|hrs?)\s+(?:of\s+)?(?:running|jogging|walking|cycling|biking|swimming|hiking|run|jog|walk|cycle|bike|swim|hike)/i,
      // "did 32 minutes running" or "completed 32 min jog"
      /(?:did|completed|finished)\s+(\d+)\s*(?:minutes?|mins?|hours?|hrs?)\s+(?:of\s+)?(?:running|jogging|walking|cycling|biking|swimming|hiking)/i,
      // Just "ran 32" or "walked 45" when followed by minutes-like context
      /\b(?:ran|run|jogged|walked|cycled|biked|swam|hiked)\b.*?(\d+)\s*(?:minutes?|mins?)/i,
    ]
    
    let duration = 0
    for (const pattern of patterns) {
      const match = lowerMessage.match(pattern)
      if (match) {
        duration = parseInt(match[1])
        break
      }
    }
    
    if (duration > 0) {
      const isHours = lowerMessage.includes('hour')
      const durationInMinutes = isHours ? duration * 60 : duration
      
      // Detect activity type
      let activity = 'cardio'
      if (lowerMessage.match(/\b(?:ran|run|running|jog|jogging)\b/i)) activity = 'running'
      else if (lowerMessage.match(/\b(?:walk|walking)\b/i)) activity = 'walking'
      else if (lowerMessage.match(/\b(?:cycl|bik|cycling|biking)\b/i)) activity = 'cycling'
      else if (lowerMessage.match(/\b(?:swim|swimming)\b/i)) activity = 'swimming'
      else if (lowerMessage.match(/\b(?:hik|hiking)\b/i)) activity = 'hiking'
      
      const capitalizedActivity = activity.charAt(0).toUpperCase() + activity.slice(1)
      
      console.log(`✅ SIMPLE ACTIVITY: ${activity} for ${durationInMinutes} min (from: "${lowerMessage}")`)
      
      await saveToSupabase(supabase, userId, 'fitness', {
        id: randomUUID(),
        type: 'workout',
        itemType: 'activity',        // For fitness dashboard filter
        activityType: capitalizedActivity,  // Required by fitness dashboard!
        exercise: activity,
        duration: durationInMinutes,
        calories: Math.round(durationInMinutes * 8), // Rough estimate
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        source: 'voice_ai'
      })
      
      return {
        isCommand: true,
        action: 'save_workout',
        message: `✅ Logged ${durationInMinutes}-minute ${activity} workout in Fitness domain`
      }
    }
  }
  
  // ============================================
  // WATER - NUTRITION ONLY
  // ============================================
  const waterMatch = lowerMessage.match(/(?:drank|drink|log|add|had)?\s*(\d+(?:\.\d+)?)\s*(?:ounces?|oz|ml|liters?|l)(?:\s+of)?\s*water/)
  if (waterMatch) {
    const amount = parseFloat(waterMatch[1])
    const unit = lowerMessage.includes('ml') || lowerMessage.includes('liter') ? 'ml' : 'oz'
    
    console.log(`✅ Water: ${amount} ${unit} → nutrition domain`)
    
    await saveToSupabase(supabase, userId, 'nutrition', {
      id: randomUUID(),
      type: 'water',
      value: amount,
      unit,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_water',
      message: `✅ Logged ${amount} ${unit} of water in Nutrition domain`
    }
  }
  
  // ============================================
  // HEALTH DOMAIN
  // ============================================
  
  // Weight
  const weightMatch = lowerMessage.match(/(?:i\s+)?(?:weigh|weight)(?:\s+is|\s+was|\s+about|\s+around)?\s+(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?|lb|kg)?/)
  if (weightMatch) {
    const weight = parseFloat(weightMatch[1])
    const unit = lowerMessage.includes('kg') ? 'kg' : 'lbs'
    console.log(`✅ Weight: ${weight} ${unit}`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'weight',
      value: weight,
      unit,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_weight',
      message: `✅ Logged weight: ${weight} ${unit} in Health domain`
    }
  }
  
  // Height
  const heightMatch = lowerMessage.match(/(?:height|tall)(?:\s+is|\s+was)?\s+(\d+)\s*(?:feet|ft|foot)?\s*(\d+)?\s*(?:inches|in)?/)
  if (heightMatch) {
    const feet = parseInt(heightMatch[1])
    const inches = heightMatch[2] ? parseInt(heightMatch[2]) : 0
    console.log(`✅ Height: ${feet}'${inches}"`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'height',
      feet,
      inches,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_height',
      message: `✅ Logged height: ${feet}' ${inches}" in Health domain`
    }
  }
  
  // Sleep
  const sleepMatch = lowerMessage.match(/(?:slept|sleep)(?:\s+for)?\s+(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/)
  if (sleepMatch) {
    const hours = parseFloat(sleepMatch[1])
    console.log(`✅ Sleep: ${hours} hours`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'sleep',
      hours,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_sleep',
      message: `✅ Logged ${hours} hours of sleep in Health domain`
    }
  }
  
  // Heart Rate
  const heartRateMatch = lowerMessage.match(/(?:heart\s+rate|pulse)(?:\s+is|\s+was)?\s+(\d+)\s*(?:bpm)?/)
  if (heartRateMatch) {
    const bpm = parseInt(heartRateMatch[1])
    console.log(`✅ Heart Rate: ${bpm} bpm`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'heart_rate',
      value: bpm,
      unit: 'bpm',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_heart_rate',
      message: `✅ Logged heart rate: ${bpm} bpm in Health domain`
    }
  }
  
  // Temperature
  const tempMatch = lowerMessage.match(/(?:temperature|temp)(?:\s+is|\s+was)?\s+(\d+(?:\.\d+)?)\s*(?:degrees?|°)?/)
  if (tempMatch) {
    const temp = parseFloat(tempMatch[1])
    console.log(`✅ Temperature: ${temp}°`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'temperature',
      value: temp,
      unit: 'fahrenheit',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_temperature',
      message: `✅ Logged temperature: ${temp}° in Health domain`
    }
  }
  
  // Mood
  const moodMatch = lowerMessage.match(/(?:feeling|feel|mood)(?:\s+is|\s+was)?\s+(great|good|okay|fine|bad|terrible|happy|sad|stressed|anxious|calm|energetic|tired|angry)/)
  if (moodMatch) {
    const mood = moodMatch[1]
    const moodValues: any = {
      'terrible': 1, 'bad': 2, 'sad': 2, 'stressed': 2, 'anxious': 2, 'angry': 2,
      'okay': 3, 'fine': 3, 'tired': 3,
      'good': 4, 'calm': 4,
      'great': 5, 'happy': 5, 'energetic': 5
    }
    const moodValue = moodValues[mood] || 3
    console.log(`✅ Mood: ${mood} (${moodValue}/5)`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'mood',
      mood,
      value: moodValue,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_mood',
      message: `✅ Logged mood: ${mood} in Health domain`
    }
  }
  
  // Steps command
  const stepsMatch = lowerMessage.match(/(?:log|walked|did|took)?\s*(\d+(?:,\d+)?)\s*steps?/)
  if (stepsMatch) {
    const steps = parseInt(stepsMatch[1].replace(/,/g, ''))
    
    console.log(`✅ Steps command detected: ${steps} steps`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'steps',
      value: steps,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_steps',
      message: `✅ Logged ${steps.toLocaleString()} steps in Health domain`
    }
  }
  
  // Blood pressure command - supports "BP 120/80", "blood pressure 120/80", "BP 120 over 80"
  const bpMatch = lowerMessage.match(/(?:blood\s+pressure|bp)\s+(\d+)\s*(?:over|\/|-)\s*(\d+)/)
  if (bpMatch) {
    const systolic = parseInt(bpMatch[1])
    const diastolic = parseInt(bpMatch[2])
    console.log(`✅ Blood Pressure: ${systolic}/${diastolic} (from regex fallback)`)
    
    await saveToSupabase(supabase, userId, 'health', {
      id: randomUUID(),
      type: 'blood_pressure',
      systolic,
      diastolic,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_bp',
      message: `✅ Logged blood pressure: ${systolic}/${diastolic} in Health domain`
    }
  }
  
  // ============================================
  // FITNESS DOMAIN
  // ============================================
  
  // Workout - MORE FLEXIBLE (optional "workout" keyword)
  const workoutMatch = lowerMessage.match(/(?:did|finished|completed)?\s*(?:a\s+)?(\d+)\s*(?:minute|min|hour|hr)\s+(.+?)(?:\s+(?:workout|exercise|session))?$/)
  if (workoutMatch && (lowerMessage.includes('cardio') || lowerMessage.includes('workout') || 
                        lowerMessage.includes('exercise') || lowerMessage.includes('training') ||
                        lowerMessage.includes('yoga') || lowerMessage.includes('hiit') ||
                        lowerMessage.includes('running') || lowerMessage.includes('cycling') ||
                        lowerMessage.match(/did\s+\d+\s*(?:minute|min)/))) {
    const duration = parseInt(workoutMatch[1])
    let exercise = workoutMatch[2].trim()
    
    // Remove trailing "workout", "exercise", "session" if present
    exercise = exercise.replace(/\s+(workout|exercise|session)$/i, '')
    const capitalizedExercise = exercise.charAt(0).toUpperCase() + exercise.slice(1)
    
    console.log(`✅ Workout: ${exercise} for ${duration} min`)
    
    await saveToSupabase(supabase, userId, 'fitness', {
      id: randomUUID(),
      type: 'workout',
      itemType: 'activity',        // For fitness dashboard filter
      activityType: capitalizedExercise,  // Required by fitness dashboard!
      exercise,
      duration,
      calories: Math.round(duration * 8), // Rough estimate
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_workout',
      message: `✅ Logged ${duration} min ${exercise} workout in Fitness domain`
    }
  }
  
  // Exercise with reps
  const repsMatch = lowerMessage.match(/(?:did)?\s*(\d+)\s+(.+?)\s+(\d+)\s+(?:reps?|repetitions?)/)
  if (repsMatch) {
    const sets = parseInt(repsMatch[1])
    const exercise = repsMatch[2].trim()
    const reps = parseInt(repsMatch[3])
    const capitalizedExercise = exercise.charAt(0).toUpperCase() + exercise.slice(1)
    console.log(`✅ Exercise: ${exercise} ${sets} sets x ${reps} reps`)
    
    await saveToSupabase(supabase, userId, 'fitness', {
      id: randomUUID(),
      type: 'strength',
      itemType: 'activity',        // For fitness dashboard filter
      activityType: capitalizedExercise,  // Required by fitness dashboard!
      exercise,
      sets,
      reps,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_exercise',
      message: `✅ Logged ${exercise}: ${sets} sets x ${reps} reps in Fitness domain`
    }
  }
  
  // Calories burned
  const caloriesBurnedMatch = lowerMessage.match(/burned\s+(\d+)\s*(?:cal|calories)/)
  if (caloriesBurnedMatch) {
    const calories = parseInt(caloriesBurnedMatch[1])
    console.log(`✅ Burned: ${calories} calories`)
    
    await saveToSupabase(supabase, userId, 'fitness', {
      id: randomUUID(),
      type: 'calories_burned',
      itemType: 'activity',        // For fitness dashboard filter
      activityType: 'Workout',     // Generic activity type
      calories: calories,
      caloriesBurned: calories,
      value: calories,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_calories_burned',
      message: `✅ Logged ${calories} calories burned in Fitness domain`
    }
  }
  
  // ============================================
  // NUTRITION DOMAIN
  // ============================================
  
  // Meal with calories
  const mealMatch = lowerMessage.match(/(?:ate|eat|had|log|consumed|eating)\s+(?:a\s+)?(.+?)\s+(?:for\s+)?(?:today\s+)?(\d+)\s*(?:cal|calories)/)
  if (mealMatch) {
    const description = mealMatch[1].trim()
    const calories = parseInt(mealMatch[2])
    console.log(`✅ Meal: ${description} - ${calories} cal`)
    
    // Determine meal type based on time of day
    const hour = new Date().getHours()
    let mealType = 'Other'
    if (hour >= 5 && hour < 11) mealType = 'Breakfast'
    else if (hour >= 11 && hour < 15) mealType = 'Lunch'
    else if (hour >= 15 && hour < 22) mealType = 'Dinner'
    else mealType = 'Snack'
    
    // Estimate macros using AI
    console.log(`🧠 [VOICE] Estimating macros for ${description}...`)
    const macros = await estimateMealMacros(description, calories)
    
    await saveToSupabase(supabase, userId, 'nutrition', {
      id: randomUUID(),
      type: 'meal',
      logType: 'meal',
      name: description,  // ← UI displays this field
      description,
      mealType,
      calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fats: macros.fats,
      fiber: macros.fiber,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_meal',
      message: `✅ Logged meal: "${description}" (${calories} cal, ${macros.protein}g protein, ${macros.carbs}g carbs, ${macros.fats}g fat) in Nutrition domain`
    }
  }
  
  // 🍽️ Meal WITHOUT calories - AI estimates full nutrition (calories, protein, carbs, fats, fiber)
  // Matches: "log a chicken sandwich", "ate pizza", "had a burger", "I ate spaghetti for dinner"
  const mealNoCalMatch = lowerMessage.match(/(?:ate|eat|had|log|consumed|eating|i\s+ate|i\s+had|i\s+just\s+ate|i\s+just\s+had)\s+(?:a\s+|an\s+|some\s+)?(.+?)(?:\s+for\s+(?:breakfast|lunch|dinner|snack|brunch))?$/i)
  if (mealNoCalMatch && !mealMatch) {
    let description = mealNoCalMatch[1].trim()
    
    // Clean up the description - remove trailing punctuation, filler words
    description = description.replace(/[.!?]+$/, '').trim()
    description = description.replace(/^(just|only|quickly)\s+/i, '').trim()
    
    // Skip if description looks like it's not food (too short or generic)
    if (description.length < 2 || /^(it|that|this|something|nothing)$/i.test(description)) {
      // Don't match, let it fall through to other handlers
    } else {
      console.log(`🍽️ [VOICE] Meal without calories: "${description}" - estimating full nutrition...`)
      
      // Determine meal type based on time of day OR from the message
      const hour = new Date().getHours()
      let mealType = 'Other'
      if (lowerMessage.includes('breakfast') || lowerMessage.includes('brunch')) {
        mealType = 'Breakfast'
      } else if (lowerMessage.includes('lunch')) {
        mealType = 'Lunch'
      } else if (lowerMessage.includes('dinner') || lowerMessage.includes('supper')) {
        mealType = 'Dinner'
      } else if (lowerMessage.includes('snack')) {
        mealType = 'Snack'
      } else {
        // Auto-detect from time
        if (hour >= 5 && hour < 11) mealType = 'Breakfast'
        else if (hour >= 11 && hour < 15) mealType = 'Lunch'
        else if (hour >= 15 && hour < 22) mealType = 'Dinner'
        else mealType = 'Snack'
      }
      
      // Use AI to estimate FULL nutrition (calories + all macros)
      const estimated = await estimateFullNutrition(description)
      console.log(`✅ [VOICE] AI Estimated: ${estimated.calories} cal, ${estimated.protein}g P, ${estimated.carbs}g C, ${estimated.fats}g F, ${estimated.fiber}g fiber`)
      
      await saveToSupabase(supabase, userId, 'nutrition', {
        id: randomUUID(),
        type: 'meal',
        logType: 'meal',
        name: description,
        description,
        mealType,
        calories: estimated.calories,
        protein: estimated.protein,
        carbs: estimated.carbs,
        fats: estimated.fats,
        fiber: estimated.fiber,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        source: 'voice_ai',
        aiEstimated: true  // Mark as AI-estimated
      })
      
      return {
        isCommand: true,
        action: 'save_meal',
        message: `✅ Logged meal: "${description}" (estimated ~${estimated.calories} cal, ~${estimated.protein}g protein, ~${estimated.carbs}g carbs, ~${estimated.fats}g fat, ~${estimated.fiber}g fiber) in Nutrition domain`
      }
    }
  }
  
  // Protein intake
  const proteinMatch = lowerMessage.match(/(?:ate|had|consumed)\s+(\d+)\s*(?:g|grams?)\s+(?:of\s+)?protein/)
  if (proteinMatch) {
    const protein = parseInt(proteinMatch[1])
    console.log(`✅ Protein: ${protein}g`)
    
    await saveToSupabase(supabase, userId, 'nutrition', {
      id: randomUUID(),
      type: 'macros',
      protein,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_protein',
      message: `✅ Logged ${protein}g protein in Nutrition domain`
    }
  }
  
  // ============================================
  // FINANCIAL DOMAIN
  // ============================================
  
  // Expense - MORE FLEXIBLE
  const expenseMatch = lowerMessage.match(/(?:spent|paid|expense|bought)\s+(?:\$)?(\d+(?:\.\d+)?)\s*(?:dollars?|bucks?)?\s*(?:on|for|at)?\s*(.+)/)
  if (expenseMatch && (lowerMessage.includes('spent') || lowerMessage.includes('paid') || lowerMessage.includes('bought'))) {
    const amount = parseFloat(expenseMatch[1])
    let description = expenseMatch[2].trim()
    
    // Remove common filler words
    description = description.replace(/^(on|for|at)\s+/, '')
    
    console.log(`✅ Expense: $${amount} for ${description}`)
    
    await saveToSupabase(supabase, userId, 'financial', {
      id: randomUUID(),
      type: 'expense',
      amount,
      description,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_expense',
      message: `✅ Logged expense: $${amount} for ${description} in Financial domain`
    }
  }
  
  // Income
  const incomeMatch = lowerMessage.match(/(?:earned|received|income|got\s+paid)\s+(?:\$)?(\d+(?:\.\d+)?)\s*(?:dollars?)?(?:\s+for\s+(.+))?/)
  if (incomeMatch) {
    const amount = parseFloat(incomeMatch[1])
    const description = incomeMatch[2] ? incomeMatch[2].trim() : 'income'
    console.log(`✅ Income: $${amount} - ${description}`)
    
    await saveToSupabase(supabase, userId, 'financial', {
      id: randomUUID(),
      type: 'income',
      amount,
      description,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_income',
      message: `✅ Logged income: $${amount} for ${description} in Financial domain`
    }
  }
  
  // ============================================
  // VEHICLES DOMAIN
  // ============================================
  
  // Gas fillup
  const gasMatch = lowerMessage.match(/(?:filled\s+up|got\s+gas|filled\s+gas)\s+(?:for\s+)?(?:\$)?(\d+(?:\.\d+)?)\s*(?:dollars?)?/)
  if (gasMatch) {
    const amount = parseFloat(gasMatch[1])
    console.log(`✅ Gas: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'gas',
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_gas',
      message: `✅ Logged gas fillup: $${amount} in Vehicles domain`
    }
  }
  
  // ============================================
  // PETS DOMAIN
  // ============================================
  
  // Fed pet
  const fedPetMatch = lowerMessage.match(/fed\s+(?:the\s+)?(?:dog|cat|pet)(?:\s+(.+))?/)
  if (fedPetMatch) {
    const note = fedPetMatch[1] || ''
    console.log(`✅ Fed pet ${note}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'feeding',
      note,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_pet_feeding',
      message: `✅ Logged pet feeding in Pets domain`
    }
  }
  
  // Walked pet
  const walkedPetMatch = lowerMessage.match(/walked\s+(?:the\s+)?(?:dog|pet)\s+(?:for\s+)?(\d+)\s*(?:min|minutes?)/)
  if (walkedPetMatch) {
    const duration = parseInt(walkedPetMatch[1])
    console.log(`✅ Walked pet: ${duration} min`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'walk',
      duration,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_pet_walk',
      message: `✅ Logged ${duration} min dog walk in Pets domain`
    }
  }
  
  // ============================================
  // MINDFULNESS DOMAIN
  // ============================================
  
  // ============================================
  // HABITS DOMAIN
  // ============================================
  
  // Completed habit
  const habitMatch = lowerMessage.match(/(?:completed|did|finished)\s+(?:my\s+)?(.+?)\s+habit/)
  if (habitMatch) {
    const habit = habitMatch[1].trim()
    console.log(`✅ Habit: ${habit}`)
    
    await saveToSupabase(supabase, userId, 'habits', {
      id: randomUUID(),
      type: 'completion',
      habit,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_habit',
      message: `✅ Logged habit completion: "${habit}" in Habits domain`
    }
  }
  
  // ============================================
  // GOALS DOMAIN
  // ============================================
  
  // Goal progress
  const goalProgressMatch = lowerMessage.match(/(?:goal|progress)\s+(.+?)\s+(?:is\s+)?(\d+)%/)
  if (goalProgressMatch) {
    const goal = goalProgressMatch[1].trim()
    const progress = parseInt(goalProgressMatch[2])
    console.log(`✅ Goal: ${goal} - ${progress}%`)
    
    await saveToSupabase(supabase, userId, 'goals', {
      id: randomUUID(),
      type: 'progress',
      goal,
      progress,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_goal_progress',
      message: `✅ Logged goal progress: "${goal}" at ${progress}% in Goals domain`
    }
  }
  
  // ============================================
  // TASKS DOMAIN
  // ============================================
  
  // Task command
  const taskMatch = lowerMessage.match(/(?:add|create)\s+(?:a\s+)?task\s+(.+)/)
  if (taskMatch) {
    const taskTitle = taskMatch[1].trim()
    console.log(`✅ Task: ${taskTitle}`)
    
    // Save to tasks table
    await supabase.from('tasks').insert({
      user_id: userId,
      title: taskTitle,
      completed: false,
      created_at: new Date().toISOString()
    })
    
    return {
      isCommand: true,
      action: 'add_task',
      message: `✅ Task added: "${taskTitle}" in Tasks domain`
    }
  }
  
  // ============================================
  // PROPERTY DOMAIN
  // ============================================
  
  // Property value
  const propertyValueMatch = lowerMessage.match(/(?:property|house|home)\s+(?:value|worth)\s+(?:\$)?(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:dollars?)?/)
  if (propertyValueMatch) {
    const value = parseFloat(propertyValueMatch[1].replace(/,/g, ''))
    console.log(`✅ Property value: $${value}`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'valuation',
      value,
      description: 'Property valuation',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_property_value',
      message: `✅ Logged property value: $${value.toLocaleString()} in Property domain`
    }
  }
  
  // ============================================
  // EDUCATION DOMAIN
  // ============================================
  
  // Study session
  const studyMatch = lowerMessage.match(/(?:studied|study|studying)\s+(?:for\s+)?(\d+)\s*(?:minutes?|mins?|hours?|hrs?)(?:\s+(.+))?/)
  if (studyMatch) {
    const duration = parseInt(studyMatch[1])
    const subject = studyMatch[2] ? studyMatch[2].trim() : 'general study'
    const isHours = lowerMessage.includes('hour')
    console.log(`✅ Study session: ${duration} ${isHours ? 'hours' : 'minutes'} - ${subject}`)
    
    await saveToSupabase(supabase, userId, 'education', {
      id: randomUUID(),
      type: 'study_session',
      duration,
      unit: isHours ? 'hours' : 'minutes',
      subject,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_study_session',
      message: `✅ Logged study session: ${duration} ${isHours ? 'hours' : 'minutes'} on ${subject} in Education domain`
    }
  }
  
  // Course/class
  const courseMatch = lowerMessage.match(/(?:enrolled|taking|started)\s+(?:a\s+)?(?:course|class)\s+(.+)/)
  if (courseMatch) {
    const courseName = courseMatch[1].trim()
    console.log(`✅ Course: ${courseName}`)
    
    await saveToSupabase(supabase, userId, 'education', {
      id: randomUUID(),
      type: 'course',
      name: courseName,
      status: 'enrolled',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'add_course',
      message: `✅ Added course: "${courseName}" in Education domain`
    }
  }
  
  // ============================================
  // CAREER DOMAIN
  // ============================================
  
  // (Interview pattern moved to top of file for higher priority)
  
  // ============================================
  // RELATIONSHIPS DOMAIN
  // ============================================
  
  // Contact/interaction
  const contactMatch = lowerMessage.match(/(?:called|texted|met\s+with|talked\s+to|messaged)\s+(.+)/)
  if (contactMatch) {
    const person = contactMatch[1].trim()
    const method = lowerMessage.includes('called') ? 'call' :
                   lowerMessage.includes('texted') ? 'text' :
                   lowerMessage.includes('met') ? 'meeting' : 'message'
    console.log(`✅ Contact: ${method} with ${person}`)
    
    await saveToSupabase(supabase, userId, 'relationships', {
      id: randomUUID(),
      type: 'interaction',
      person,
      method,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'log_interaction',
      message: `✅ Logged ${method} with ${person} in Relationships domain`
    }
  }
  
  // ============================================
  // TRAVEL DOMAIN
  // ============================================
  
  // Trip/vacation
  const tripMatch = lowerMessage.match(/(?:planning|booked|going\s+to)\s+(?:a\s+)?(?:trip|vacation)\s+to\s+(.+)/)
  if (tripMatch) {
    const destination = tripMatch[1].trim()
    console.log(`✅ Trip: ${destination}`)
    
    await saveToSupabase(supabase, userId, 'travel', {
      id: randomUUID(),
      type: 'trip',
      destination,
      status: lowerMessage.includes('booked') ? 'booked' : 'planning',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'add_trip',
      message: `✅ Added trip to ${destination} in Travel domain`
    }
  }
  
  // Flight
  const flightMatch = lowerMessage.match(/(?:booked|booking)\s+(?:a\s+)?flight\s+to\s+(.+)/)
  if (flightMatch) {
    const destination = flightMatch[1].trim()
    console.log(`✅ Flight: ${destination}`)
    
    await saveToSupabase(supabase, userId, 'travel', {
      id: randomUUID(),
      type: 'flight',
      destination,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'book_flight',
      message: `✅ Logged flight to ${destination} in Travel domain`
    }
  }
  
  // ============================================
  // HOBBIES DOMAIN
  // ============================================
  
  // Hobby activity
  const hobbyMatch = lowerMessage.match(/(?:played|practiced|did)\s+(.+?)\s+(?:for\s+)?(\d+)\s*(?:minutes?|hours?)/)
  if (hobbyMatch && (lowerMessage.includes('guitar') || lowerMessage.includes('piano') || 
                      lowerMessage.includes('painting') || lowerMessage.includes('reading') ||
                      lowerMessage.includes('gaming') || lowerMessage.includes('photography'))) {
    const activity = hobbyMatch[1].trim()
    const duration = parseInt(hobbyMatch[2])
    const isHours = lowerMessage.includes('hour')
    console.log(`✅ Hobby: ${activity} for ${duration} ${isHours ? 'hours' : 'minutes'}`)
    
    await saveToSupabase(supabase, userId, 'hobbies', {
      id: randomUUID(),
      type: 'activity',
      activity,
      duration,
      unit: isHours ? 'hours' : 'minutes',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'log_hobby',
      message: `✅ Logged ${activity}: ${duration} ${isHours ? 'hours' : 'minutes'} in Hobbies domain`
    }
  }
  
  // ============================================
  // INSURANCE DOMAIN
  // ============================================
  
  // Insurance payment
  const insuranceMatch = lowerMessage.match(/(?:paid|pay)\s+(?:\$)?(\d+(?:\.\d+)?)\s*(?:for\s+)?(?:insurance|premium)/)
  if (insuranceMatch && lowerMessage.includes('insurance')) {
    const amount = parseFloat(insuranceMatch[1])
    const type = lowerMessage.includes('health') ? 'health' :
                 lowerMessage.includes('car') || lowerMessage.includes('auto') ? 'auto' :
                 lowerMessage.includes('home') ? 'home' :
                 lowerMessage.includes('life') ? 'life' : 'other'
    console.log(`✅ Insurance: $${amount} (${type})`)
    
    await saveToSupabase(supabase, userId, 'insurance', {
      id: randomUUID(),
      type: 'premium_payment',
      insuranceType: type,
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'pay_insurance',
      message: `✅ Logged ${type} insurance payment: $${amount} in Insurance domain`
    }
  }
  
  // ============================================
  // LEGAL DOMAIN
  // ============================================
  
  // Document signing
  const legalDocMatch = lowerMessage.match(/(?:signed|signing)\s+(?:a\s+)?(.+?)\s+(?:document|contract|agreement)/)
  if (legalDocMatch) {
    const documentType = legalDocMatch[1].trim()
    console.log(`✅ Legal doc: ${documentType}`)
    
    await saveToSupabase(supabase, userId, 'legal', {
      id: randomUUID(),
      type: 'document',
      documentType,
      action: 'signed',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'sign_legal_doc',
      message: `✅ Logged signing of ${documentType} document in Legal domain`
    }
  }
  
  // ============================================
  // APPLIANCES DOMAIN
  // ============================================
  
  // Appliance maintenance
  const applianceMatch = lowerMessage.match(/(?:serviced|repaired|fixed|maintained)\s+(?:the\s+)?(.+?)(?:\s+for\s+\$)?(\d+)?/)
  if (applianceMatch && (lowerMessage.includes('washer') || lowerMessage.includes('dryer') || 
                          lowerMessage.includes('fridge') || lowerMessage.includes('refrigerator') ||
                          lowerMessage.includes('oven') || lowerMessage.includes('dishwasher') ||
                          lowerMessage.includes('ac') || lowerMessage.includes('air conditioner'))) {
    const appliance = applianceMatch[1].trim()
    const cost = applianceMatch[2] ? parseFloat(applianceMatch[2]) : null
    console.log(`✅ Appliance: ${appliance}${cost ? ` - $${cost}` : ''}`)
    
    await saveToSupabase(supabase, userId, 'appliances', {
      id: randomUUID(),
      type: 'maintenance',
      appliance,
      action: lowerMessage.includes('repaired') ? 'repair' : 
              lowerMessage.includes('fixed') ? 'repair' : 'maintenance',
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'log_appliance',
      message: `✅ Logged ${appliance} maintenance${cost ? ` ($${cost})` : ''} in Appliances domain`
    }
  }
  
  // ============================================
  // DIGITAL LIFE DOMAIN
  // ============================================
  
  // Subscription
  const subscriptionMatch = lowerMessage.match(/(?:subscribed|subscribing|signed\s+up)\s+(?:to|for)\s+(.+?)(?:\s+for\s+\$)?(\d+(?:\.\d+)?)?(?:\s+per\s+month)?/)
  if (subscriptionMatch && (lowerMessage.includes('subscription') || lowerMessage.includes('subscribed'))) {
    const service = subscriptionMatch[1].trim()
    const cost = subscriptionMatch[2] ? parseFloat(subscriptionMatch[2]) : null
    console.log(`✅ Subscription: ${service}${cost ? ` - $${cost}/mo` : ''}`)
    
    await saveToSupabase(supabase, userId, 'digital', {
      id: randomUUID(),
      type: 'subscription',
      service,
      cost,
      frequency: 'monthly',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'add_subscription',
      message: `✅ Added subscription: ${service}${cost ? ` ($${cost}/mo)` : ''} in Digital-Life domain`
    }
  }
  
  // ============================================
  // HOME/UTILITIES DOMAIN
  // ============================================
  
  // Utility bill
  const utilityMatch = lowerMessage.match(/(?:paid|pay)\s+(?:\$)?(\d+(?:\.\d+)?)\s*(?:for\s+)?(?:electric|electricity|gas|water|internet|utility)/)
  if (utilityMatch && (lowerMessage.includes('bill') || lowerMessage.includes('utility'))) {
    const amount = parseFloat(utilityMatch[1])
    const utilityType = lowerMessage.includes('electric') ? 'electricity' :
                        lowerMessage.includes('gas') ? 'gas' :
                        lowerMessage.includes('water') ? 'water' :
                        lowerMessage.includes('internet') ? 'internet' : 'utility'
    console.log(`✅ Utility: $${amount} (${utilityType})`)
    
    await saveToSupabase(supabase, userId, 'home', {
      id: randomUUID(),
      type: 'utility_payment',
      itemType: 'bill',
      category: 'utilities',
      utilityType,
      utilityName: utilityType,
      serviceName: utilityType,
      amount,
      monthlyCost: amount,
      cost: amount,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'pay_utility',
      message: `✅ Logged ${utilityType} bill: $${amount} in Home domain`
    }
  }
  
  // ============================================
  // VEHICLES DOMAIN
  // ============================================
  
  // UPDATE EXISTING VEHICLE MILEAGE (e.g., "update my honda's mileage to 50000")
  // This pattern detects update commands for specific vehicles and updates the existing entry
  const updateMileageMatch = lowerMessage.match(/(?:update|set|change)\s+(?:my\s+)?(.+?)(?:'s|s)?\s+(?:car(?:'s)?|vehicle(?:'s)?)?\s*(?:mileage|miles|odometer)\s+(?:to|at|is)?\s*(\d{1,6})(?:,\d{3})?(?:\s*(?:thousand|k))?\s*(?:miles?|mi|km|kilometers?)?/i)
  if (updateMileageMatch || (lowerMessage.includes('update') && lowerMessage.includes('mileage'))) {
    // Extract vehicle name and mileage from the message
    let vehicleName = ''
    let mileage = 0
    
    if (updateMileageMatch) {
      vehicleName = updateMileageMatch[1].trim().toLowerCase()
      mileage = parseInt(updateMileageMatch[2].replace(',', ''))
    } else {
      // Fallback pattern for variations like "update my hondas car's mileage to 50000"
      const altMatch = lowerMessage.match(/update\s+(?:my\s+)?(\w+).*?(?:mileage|miles).*?(\d{1,6})/i)
      if (altMatch) {
        vehicleName = altMatch[1].trim().toLowerCase()
        mileage = parseInt(altMatch[2])
      }
    }
    
    if (lowerMessage.includes('thousand') || lowerMessage.includes('k')) {
      mileage = mileage * 1000
    }
    const unit = lowerMessage.includes('km') || lowerMessage.includes('kilometer') ? 'km' : 'miles'
    
    if (vehicleName && mileage > 0) {
      console.log(`🚗 Looking for vehicle "${vehicleName}" to update mileage to ${mileage}...`)
      
      // Find existing vehicle by name/title in domain_entries
      const { data: existingVehicles, error: findError } = await supabase
        .from('domain_entries')
        .select('id, title, metadata')
        .eq('user_id', userId)
        .eq('domain', 'vehicles')
        .or(`title.ilike.%${vehicleName}%,metadata->>vehicleName.ilike.%${vehicleName}%,metadata->>make.ilike.%${vehicleName}%,metadata->>model.ilike.%${vehicleName}%`)
        .order('created_at', { ascending: false })
      
      if (findError) {
        console.error('❌ Error finding vehicle:', findError)
      }
      
      if (existingVehicles && existingVehicles.length > 0) {
        // Found existing vehicle - UPDATE it
        const vehicle = existingVehicles[0]
        const existingMetadata = vehicle.metadata || {}
        
        console.log(`✅ Found vehicle "${vehicle.title}" (id: ${vehicle.id}) - updating mileage to ${mileage}`)
        
        const { error: updateError } = await supabase
          .from('domain_entries')
          .update({
            metadata: {
              ...existingMetadata,
              currentMileage: mileage,
              mileage: mileage,
              lastMileageUpdate: new Date().toISOString(),
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', vehicle.id)
          .eq('user_id', userId)
        
        if (updateError) {
          console.error('❌ Error updating vehicle mileage:', updateError)
          return {
            isCommand: true,
            action: 'update_mileage_error',
            message: `❌ Failed to update mileage for ${vehicle.title}`
          }
        }
        
        return {
          isCommand: true,
          action: 'update_vehicle_mileage',
          message: `✅ Updated ${vehicle.title}'s mileage to ${mileage.toLocaleString()} ${unit}`,
          triggerReload: true
        }
      } else {
        console.log(`⚠️ No vehicle found matching "${vehicleName}" - creating new mileage log entry`)
        // No existing vehicle found - create a new mileage log entry
        await saveToSupabase(supabase, userId, 'vehicles', {
          id: randomUUID(),
          type: 'mileage_update',
          vehicleName: vehicleName,
          currentMileage: mileage,
          unit,
          timestamp: new Date().toISOString(),
          source: 'voice_ai'
        })
        
        return {
          isCommand: true,
          action: 'save_mileage',
          message: `✅ Logged mileage update: ${mileage.toLocaleString()} ${unit} (no vehicle named "${vehicleName}" found - created new entry)`
        }
      }
    }
  }
  
  // Mileage Update (general - when no specific vehicle is mentioned)
  const mileageMatch = lowerMessage.match(/(?:car|vehicle|honda|toyota|ford|chevrolet|chevy|bmw|mercedes|audi|lexus|nissan|mazda|subaru|volkswagen|vw|jeep|dodge|ram|tesla)?\s*(?:has|at|is|reached|hit)?\s*(\d{1,6})(?:,\d{3})?\s*(?:thousand|k|miles?|mi|km|kilometers?)/)
  if (mileageMatch && (lowerMessage.includes('mile') || lowerMessage.includes('km') || lowerMessage.includes('odometer')) && !lowerMessage.includes('update')) {
    let mileage = parseInt(mileageMatch[1].replace(',', ''))
    if (lowerMessage.includes('thousand') || lowerMessage.includes('k')) {
      mileage = mileage * 1000
    }
    const unit = lowerMessage.includes('km') || lowerMessage.includes('kilometer') ? 'km' : 'miles'
    
    console.log(`✅ Mileage: ${mileage} ${unit}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'mileage_update',
      currentMileage: mileage,
      unit,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_mileage',
      message: `✅ Updated vehicle mileage: ${mileage.toLocaleString()} ${unit} in Vehicles domain`
    }
  }
  
  // Fuel/Gas Fill-up
  const fuelMatch = lowerMessage.match(/(?:filled|fill|got|bought|pumped)?\s*(?:up|tank|gas)?\s*(\d+(?:\.\d+)?)\s*(?:gallons?|gal|liters?|l)(?:\s+(?:for|at|cost))?\s*\$?(\d+(?:\.\d+)?)/)
  if (fuelMatch && (lowerMessage.includes('gas') || lowerMessage.includes('fuel') || lowerMessage.includes('fill'))) {
    const gallons = parseFloat(fuelMatch[1])
    const cost = parseFloat(fuelMatch[2])
    const unit = lowerMessage.includes('liter') ? 'liters' : 'gallons'
    
    console.log(`✅ Fuel: ${gallons} ${unit} for $${cost}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'fuel_purchase',
      gallons,
      cost,
      unit,
      pricePerUnit: cost / gallons,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_fuel',
      message: `✅ Logged fuel purchase: ${gallons} ${unit} for $${cost} in Vehicles domain`
    }
  }
  
  // Oil Change
  const oilChangeMatch = lowerMessage.match(/oil\s*change(?:\s+(?:at|done|completed|finished))?\s*(?:at)?\s*(\d{1,6})(?:k|,000)?\s*miles?|oil\s*change.*?\$(\d+)/)
  if (oilChangeMatch) {
    const mileage = oilChangeMatch[1] ? parseInt(oilChangeMatch[1].replace('k', '000').replace(',', '')) : null
    const cost = oilChangeMatch[2] ? parseFloat(oilChangeMatch[2]) : null
    
    // Try to extract cost if not found
    const costMatch = lowerMessage.match(/\$(\d+(?:\.\d+)?)/)
    const finalCost = cost || (costMatch ? parseFloat(costMatch[1]) : null)
    
    console.log(`✅ Oil change at ${mileage || 'unknown'} miles, cost: $${finalCost || 'unknown'}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'maintenance',
      serviceType: 'oil_change',
      mileage,
      cost: finalCost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_maintenance',
      message: `✅ Logged oil change${mileage ? ` at ${mileage.toLocaleString()} miles` : ''}${finalCost ? ` for $${finalCost}` : ''} in Vehicles domain`
    }
  }
  
  // Tire Rotation
  const tireMatch = lowerMessage.match(/tire\s*(?:rotation|rotated|service).*?\$?(\d+)/)
  if (tireMatch) {
    const cost = parseFloat(tireMatch[1])
    
    console.log(`✅ Tire rotation: $${cost}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'maintenance',
      serviceType: 'tire_rotation',
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_maintenance',
      message: `✅ Logged tire rotation: $${cost} in Vehicles domain`
    }
  }
  
  // General Vehicle Maintenance/Repair
  const vehicleServiceMatch = lowerMessage.match(/(?:brake|transmission|alignment|battery|alternator|starter|radiator|suspension|exhaust|muffler|catalytic|tune.?up|inspection|smog)\s*(?:service|repair|replacement|check|maintenance|done|completed|fixed)?.*?\$?(\d+)/)
  if (vehicleServiceMatch) {
    const cost = parseFloat(vehicleServiceMatch[1])
    const serviceType = vehicleServiceMatch[0].split('$')[0].trim()
    
    console.log(`✅ Vehicle service: ${serviceType} - $${cost}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'maintenance',
      serviceType,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_maintenance',
      message: `✅ Logged ${serviceType}: $${cost} in Vehicles domain`
    }
  }
  
  // Vehicle Registration
  const registrationMatch = lowerMessage.match(/(?:registration|reg|dmv)(?:\s+(?:expires|renewed|due|paid))?\s*(?:in)?\s*([a-z]+)?\s*(\d{4})/)
  if (registrationMatch && (lowerMessage.includes('registration') || lowerMessage.includes('dmv'))) {
    const month = registrationMatch[1] || null
    const year = registrationMatch[2] ? parseInt(registrationMatch[2]) : null
    const costMatch = lowerMessage.match(/\$(\d+)/)
    const cost = costMatch ? parseFloat(costMatch[1]) : null
    
    console.log(`✅ Registration ${month ? month + ' ' : ''}${year || ''} ${cost ? '$' + cost : ''}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'registration',
      expiryMonth: month,
      expiryYear: year,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_registration',
      message: `✅ Logged vehicle registration${year ? ' expires ' + (month || '') + ' ' + year : ''}${cost ? ' - $' + cost : ''} in Vehicles domain`
    }
  }
  
  // Car Wash/Detailing
  const carWashMatch = lowerMessage.match(/(?:car\s*wash|detail|detailing|cleaned\s*car).*?\$?(\d+)/)
  if (carWashMatch) {
    const cost = parseFloat(carWashMatch[1])
    const isDetailing = lowerMessage.includes('detail')
    
    console.log(`✅ Car ${isDetailing ? 'detailing' : 'wash'}: $${cost}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'car_wash',
      serviceType: isDetailing ? 'detailing' : 'wash',
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_car_wash',
      message: `✅ Logged car ${isDetailing ? 'detailing' : 'wash'}: $${cost} in Vehicles domain`
    }
  }
  
  // Vehicle Purchase
  const vehiclePurchaseMatch = lowerMessage.match(/(?:bought|purchased|got|acquired)\s+(?:a\s+)?(?:(\d{4})\s+)?([a-z]+\s+[a-z]+)(?:\s+for)?\s+\$?(\d+(?:,\d{3})*(?:k|thousand)?)/)
  if (vehiclePurchaseMatch && (lowerMessage.includes('car') || lowerMessage.includes('vehicle') || lowerMessage.includes('truck') || lowerMessage.includes('suv'))) {
    const year = vehiclePurchaseMatch[1] ? parseInt(vehiclePurchaseMatch[1]) : null
    const makeModel = vehiclePurchaseMatch[2]
    const priceStr = vehiclePurchaseMatch[3].replace(/,/g, '')
    let price: string
    if (priceStr.includes('k') || priceStr.includes('thousand')) {
      price = (parseInt(priceStr) * 1000).toString()
    } else {
      price = parseFloat(priceStr).toString()
    }
    
    console.log(`✅ Vehicle purchase: ${year || ''} ${makeModel} for $${price}`)
    
    await saveToSupabase(supabase, userId, 'vehicles', {
      id: randomUUID(),
      type: 'vehicle_purchase',
      year,
      makeModel,
      purchasePrice: price,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_vehicle_purchase',
      message: `✅ Logged vehicle purchase: ${year || ''} ${makeModel} for $${price.toLocaleString()} in Vehicles domain`
    }
  }
  
  // ============================================
  // PROPERTY DOMAIN
  // ============================================
  
  // Home Value
  const homeValueMatch = lowerMessage.match(/(?:house|home|property)(?:\s+is)?(?:\s+worth|valued|appraised|value)?\s+\$?(\d+(?:,\d{3})*(?:k|thousand)?)/)
  if (homeValueMatch && !lowerMessage.includes('insurance')) {
    const tempValue = homeValueMatch[1].replace(/,/g, '')
    let value: string
    if (tempValue.includes('k') || tempValue.includes('thousand')) {
      value = (parseInt(tempValue) * 1000).toString()
    } else {
      value = parseFloat(tempValue).toString()
    }

    console.log(`✅ Home value: $${value}`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'home_value',
      value,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_home_value',
      message: `✅ Logged home value: $${value.toLocaleString()} in Property domain`
    }
  }
  
  // Mortgage Payment
  const mortgageMatch = lowerMessage.match(/(?:mortgage|home\s*loan)(?:\s+payment)?\s+\$?(\d+(?:,\d{3})*)/)
  if (mortgageMatch) {
    const amount = parseFloat(mortgageMatch[1].replace(/,/g, ''))
    
    console.log(`✅ Mortgage payment: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'mortgage_payment',
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_mortgage',
      message: `✅ Logged mortgage payment: $${amount.toLocaleString()} in Property domain`
    }
  }
  
  // Property Tax
  const propertyTaxMatch = lowerMessage.match(/property\s*tax(?:es)?(?:\s+bill)?\s+\$?(\d+(?:,\d{3})*)(?:\s+(annually|yearly|quarterly|monthly))?/)
  if (propertyTaxMatch) {
    const amount = parseFloat(propertyTaxMatch[1].replace(/,/g, ''))
    const frequency = propertyTaxMatch[2] || 'annually'
    
    console.log(`✅ Property tax: $${amount} ${frequency}`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'property_tax',
      amount,
      frequency,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_property_tax',
      message: `✅ Logged property tax: $${amount.toLocaleString()} ${frequency} in Property domain`
    }
  }
  
  // Square Footage
  const squareFootageMatch = lowerMessage.match(/(?:house|home)(?:\s+is)?\s+(\d+(?:,\d{3})?)\s*(?:square|sq)\s*(?:feet|ft)/)
  if (squareFootageMatch) {
    const sqft = parseInt(squareFootageMatch[1].replace(/,/g, ''))
    
    console.log(`✅ Square footage: ${sqft} sq ft`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'property_info',
      squareFootage: sqft,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_square_footage',
      message: `✅ Logged square footage: ${sqft.toLocaleString()} sq ft in Property domain`
    }
  }
  
  // HOA Fees
  const hoaMatch = lowerMessage.match(/(?:hoa|homeowners\s*association)(?:\s+fee)?\s+\$?(\d+)(?:\s*\/?\s*(month|monthly|year|annually))?/)
  if (hoaMatch) {
    const amount = parseFloat(hoaMatch[1])
    const frequency = hoaMatch[2] || 'monthly'
    
    console.log(`✅ HOA fee: $${amount}/${frequency}`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'hoa_fee',
      amount,
      frequency,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_hoa',
      message: `✅ Logged HOA fee: $${amount}/${frequency} in Property domain`
    }
  }
  
  // Home Purchase
  const homePurchaseMatch = lowerMessage.match(/(?:bought|purchased)\s+(?:house|home)(?:\s+in)?\s+(\d{4})(?:\s+for)?\s+\$?(\d+(?:,\d{3})*(?:k)?)/)
  if (homePurchaseMatch) {
    const year = parseInt(homePurchaseMatch[1])
    const tempPrice = homePurchaseMatch[2].replace(/,/g, '')
    let price: string
    if (tempPrice.includes('k')) {
      price = (parseInt(tempPrice) * 1000).toString()
    } else {
      price = parseFloat(tempPrice).toString()
    }

    console.log(`✅ Home purchase: ${year} for $${price}`)
    
    await saveToSupabase(supabase, userId, 'property', {
      id: randomUUID(),
      type: 'home_purchase',
      purchaseYear: year,
      purchasePrice: price,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_home_purchase',
      message: `✅ Logged home purchase in ${year} for $${price.toLocaleString()} in Property domain`
    }
  }
  
  // ============================================
  // PETS DOMAIN
  // ============================================
  
  // Pet Feeding
  const petFeedingMatch = lowerMessage.match(/(?:fed|feed|gave\s+food)\s+([a-z]+)/)
  if (petFeedingMatch && (lowerMessage.includes('dog') || lowerMessage.includes('cat') || lowerMessage.includes('pet'))) {
    const petName = petFeedingMatch[1]
    const timeMatch = lowerMessage.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
    const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3] || ''}` : new Date().toLocaleTimeString()
    
    console.log(`✅ Fed ${petName} at ${time}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'feeding',
      petName,
      time,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_pet_feeding',
      message: `✅ Logged feeding for ${petName} in Pets domain`
    }
  }
  
  // Pet Vet Expense with Dollar Amount (NEW - More specific pattern)
  const petVetCostMatch = lowerMessage.match(/([a-z]+)\s+(?:had|went to|got|has)\s+(?:a\s+)?vet(?:\s+appointment|\s+visit)?(?:\s+for)?\s+\$(\d+)/)
  if (petVetCostMatch) {
    const petName = petVetCostMatch[1]
    const amount = parseFloat(petVetCostMatch[2])
    
    console.log(`✅ [REGEX FALLBACK] Pet vet expense: ${petName} - $${amount}`)
    
    // Find the pet in database
    const { data: pets } = await supabase
      .from('pets')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', petName)
      .limit(1)
    
    if (pets && pets.length > 0) {
      const pet = pets[0]
      console.log(`✅ [REGEX] Found pet: ${pet.name}`)
      
      // Save directly to pet_costs table
      const { error: costError } = await supabase
        .from('pet_costs')
        .insert({
          id: randomUUID(),
          user_id: userId,
          pet_id: pet.id,
          cost_type: 'vet',
          amount,
          date: new Date().toISOString().split('T')[0],
          description: 'Vet visit',
          vendor: null
        })
      
      if (!costError) {
        console.log(`✅ [REGEX] Saved $${amount} to pet_costs for ${pet.name}`)
        
        return {
          isCommand: true,
          action: 'save_pet_cost',
          message: `✅ Logged $${amount} vet cost for ${pet.name}`
        }
      } else {
        console.error('❌ [REGEX] Failed to save to pet_costs:', costError)
      }
    } else {
      console.log(`⚠️ [REGEX] Pet '${petName}' not found`)
    }
  }
  
  // Vet Appointment with Time (OLD pattern - keep for time-based appointments)
  const vetMatch = lowerMessage.match(/vet(?:\s+appointment)?(?:\s+(?:tomorrow|today|on|for))?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (vetMatch) {
    const time = `${vetMatch[1]}:${vetMatch[2] || '00'} ${vetMatch[3] || ''}`
    const costMatch = lowerMessage.match(/\$(\d+)/)
    const cost = costMatch ? parseFloat(costMatch[1]) : null
    
    console.log(`✅ Vet appointment at ${time}${cost ? ' - $' + cost : ''}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'vet_appointment',
      time,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_vet_appointment',
      message: `✅ Logged vet appointment at ${time}${cost ? ' for $' + cost : ''} in Pets domain`
    }
  }
  
  // Pet Vaccination
  const vaccinationMatch = lowerMessage.match(/(?:rabies|vaccine|vaccination|shot)(?:\s+(?:expires|due))?\s*(\d{4})/)
  if (vaccinationMatch && (lowerMessage.includes('pet') || lowerMessage.includes('dog') || lowerMessage.includes('cat'))) {
    const year = parseInt(vaccinationMatch[1])
    const vaccineType = lowerMessage.includes('rabies') ? 'rabies' : 'general'
    
    console.log(`✅ ${vaccineType} vaccination expires ${year}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'vaccination',
      vaccineType,
      expiryYear: year,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_vaccination',
      message: `✅ Logged ${vaccineType} vaccination (expires ${year}) in Pets domain`
    }
  }
  
  // Pet Medication
  const petMedicationMatch = lowerMessage.match(/(?:flea|heartworm|pain|antibiotic)\s*(?:medication|medicine|treatment|prevention)(?:\s+monthly)?\s*\$?(\d+)?/)
  if (petMedicationMatch && (lowerMessage.includes('pet') || lowerMessage.includes('dog') || lowerMessage.includes('cat'))) {
    const medicationType = petMedicationMatch[0].split(/\s/)[0]
    const cost = petMedicationMatch[1] ? parseFloat(petMedicationMatch[1]) : null
    const isMonthly = lowerMessage.includes('monthly')
    
    console.log(`✅ Pet medication: ${medicationType}${cost ? ' $' + cost : ''}${isMonthly ? ' monthly' : ''}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'medication',
      medicationType,
      cost,
      frequency: isMonthly ? 'monthly' : 'as_needed',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_pet_medication',
      message: `✅ Logged ${medicationType} medication${cost ? ' $' + cost : ''}${isMonthly ? ' monthly' : ''} in Pets domain`
    }
  }
  
  // Pet Weight
  const petWeightMatch = lowerMessage.match(/([a-z]+)?\s*(?:weighs?|weight)?\s+(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)/)
  if (petWeightMatch && (lowerMessage.includes('dog') || lowerMessage.includes('cat') || lowerMessage.includes('pet'))) {
    const petName = petWeightMatch[1] || 'pet'
    const weight = parseFloat(petWeightMatch[2])
    
    console.log(`✅ Pet weight: ${petName} - ${weight} lbs`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'weight',
      petName,
      weight,
      unit: 'lbs',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_pet_weight',
      message: `✅ Logged ${petName} weight: ${weight} lbs in Pets domain`
    }
  }
  
  // Pet Grooming
  const groomingMatch = lowerMessage.match(/(?:grooming|groomed|bath|haircut).*?\$?(\d+)/)
  if (groomingMatch && (lowerMessage.includes('dog') || lowerMessage.includes('cat') || lowerMessage.includes('pet'))) {
    const cost = parseFloat(groomingMatch[1])
    const serviceType = lowerMessage.includes('haircut') ? 'haircut' : lowerMessage.includes('bath') ? 'bath' : 'grooming'
    
    console.log(`✅ Pet ${serviceType}: $${cost}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'grooming',
      serviceType,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_grooming',
      message: `✅ Logged pet ${serviceType}: $${cost} in Pets domain`
    }
  }
  
  // Pet Supplies Purchase
  const petSuppliesMatch = lowerMessage.match(/(?:bought|purchased)\s+(?:dog|cat|pet)\s+(?:food|toy|collar|leash|bed|bowl|treats?).*?\$?(\d+)/)
  if (petSuppliesMatch) {
    const cost = parseFloat(petSuppliesMatch[1])
    const itemType = petSuppliesMatch[0].match(/(food|toy|collar|leash|bed|bowl|treat)/)?.[1] || 'supplies'
    
    console.log(`✅ Pet ${itemType}: $${cost}`)
    
    await saveToSupabase(supabase, userId, 'pets', {
      id: randomUUID(),
      type: 'supplies',
      itemType,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_pet_supplies',
      message: `✅ Logged pet ${itemType} purchase: $${cost} in Pets domain`
    }
  }
  
  // ============================================
  // MINDFULNESS DOMAIN
  // ============================================
  
  // Meditation
  const meditationMatch = lowerMessage.match(/(?:meditated|meditation|meditate)(?:\s+for)?\s+(\d+)\s*(?:minutes?|min|hours?|hr)/)
  if (meditationMatch) {
    let duration = parseInt(meditationMatch[1])
    if (lowerMessage.includes('hour')) {
      duration = duration * 60
    }
    const meditationType = lowerMessage.includes('guided') ? 'guided' : lowerMessage.includes('breathing') ? 'breathing' : 'general'
    
    console.log(`✅ Meditation: ${duration} min (${meditationType})`)
    
    await saveToSupabase(supabase, userId, 'mindfulness', {
      id: randomUUID(),
      type: 'meditation',
      duration,
      meditationType,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_meditation',
      message: `✅ Logged ${meditationType} meditation: ${duration} minutes in Mindfulness domain`
    }
  }
  
  // Breathing Exercise
  const breathingMatch = lowerMessage.match(/breathing\s*(?:exercise|practice)?\s*(\d+)?\s*(?:minutes?|min)?/)
  if (breathingMatch && lowerMessage.includes('breathing')) {
    const duration = breathingMatch[1] ? parseInt(breathingMatch[1]) : 5
    const breathingType = lowerMessage.includes('box') ? 'box breathing' : lowerMessage.includes('deep') ? 'deep breathing' : 'breathing exercise'
    
    console.log(`✅ ${breathingType}: ${duration} min`)
    
    await saveToSupabase(supabase, userId, 'mindfulness', {
      id: randomUUID(),
      type: 'breathing',
      breathingType,
      duration,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_breathing',
      message: `✅ Logged ${breathingType}: ${duration} minutes in Mindfulness domain`
    }
  }
  
  // Mood Check-in
  const moodCheckMatch = lowerMessage.match(/(?:feeling|mood|emotional\s*state)(?:\s+is)?(?:\s+)?(calm|peaceful|anxious|stressed|content|happy|sad|angry|worried|excited|grateful|tired|energized)/)
  if (moodCheckMatch && (lowerMessage.includes('feeling') || lowerMessage.includes('mood'))) {
    const mood = moodCheckMatch[1]
    
    console.log(`✅ Mood check-in: ${mood}`)
    
    await saveToSupabase(supabase, userId, 'mindfulness', {
      id: randomUUID(),
      type: 'mood_checkin',
      mood,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_mood_checkin',
      message: `✅ Logged mood: ${mood} in Mindfulness domain`
    }
  }
  
  // Journaling
  const journalingMatch = lowerMessage.match(/(?:journaled|journaling|wrote\s*journal)(?:\s+for)?\s*(\d+)?\s*(?:minutes?|min)?/)
  if (journalingMatch) {
    const duration = journalingMatch[1] ? parseInt(journalingMatch[1]) : null
    const journalType = lowerMessage.includes('gratitude') ? 'gratitude' : 'general'
    
    console.log(`✅ Journaling: ${journalType}${duration ? ' ' + duration + ' min' : ''}`)
    
    await saveToSupabase(supabase, userId, 'mindfulness', {
      id: randomUUID(),
      type: 'journaling',
      journalType,
      duration,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_journaling',
      message: `✅ Logged ${journalType} journaling${duration ? ': ' + duration + ' minutes' : ''} in Mindfulness domain`
    }
  }
  
  // Gratitude Practice
  const gratitudeMatch = lowerMessage.match(/grateful\s*(?:for|about)?/)
  if (gratitudeMatch && lowerMessage.includes('grateful')) {
    const gratitudeNote = lowerMessage.replace(/grateful\s*(?:for|about)?\s*/i, '').trim()
    
    console.log(`✅ Gratitude practice`)
    
    await saveToSupabase(supabase, userId, 'mindfulness', {
      id: randomUUID(),
      type: 'gratitude',
      note: gratitudeNote,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_gratitude',
      message: `✅ Logged gratitude practice in Mindfulness domain`
    }
  }
  
  // Stress Level
  const stressMatch = lowerMessage.match(/stress(?:\s+level)?(?:\s+is)?(?:\s+)?(\d+)(?:\s*\/\s*10)?/)
  if (stressMatch) {
    const stressLevel = parseInt(stressMatch[1])
    
    console.log(`✅ Stress level: ${stressLevel}/10`)
    
    await saveToSupabase(supabase, userId, 'mindfulness', {
      id: randomUUID(),
      type: 'stress_level',
      level: stressLevel,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_stress_level',
      message: `✅ Logged stress level: ${stressLevel}/10 in Mindfulness domain`
    }
  }
  
  // ============================================
  // RELATIONSHIPS DOMAIN
  // ============================================
  
  // Birthday/Important Date
  const birthdayMatch = lowerMessage.match(/([a-z]+)(?:'s)?\s+birthday\s+(?:is\s+)?([a-z]+)\s+(\d{1,2})/)
  if (birthdayMatch) {
    const personName = birthdayMatch[1]
    const month = birthdayMatch[2]
    const day = parseInt(birthdayMatch[3])
    
    console.log(`✅ Birthday: ${personName} - ${month} ${day}`)
    
    await saveToSupabase(supabase, userId, 'relationships', {
      id: randomUUID(),
      type: 'birthday',
      personName,
      month,
      day,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_birthday',
      message: `✅ Logged ${personName}'s birthday: ${month} ${day} in Relationships domain`
    }
  }
  
  // Anniversary
  const anniversaryMatch = lowerMessage.match(/anniversary\s+(?:is\s+)?([a-z]+)\s+(\d{1,2})/)
  if (anniversaryMatch) {
    const month = anniversaryMatch[1]
    const day = parseInt(anniversaryMatch[2])
    
    console.log(`✅ Anniversary: ${month} ${day}`)
    
    await saveToSupabase(supabase, userId, 'relationships', {
      id: randomUUID(),
      type: 'anniversary',
      month,
      day,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_anniversary',
      message: `✅ Logged anniversary: ${month} ${day} in Relationships domain`
    }
  }
  
  // Gift Purchase
  const giftMatch = lowerMessage.match(/(?:bought|purchased)\s+gift\s+(?:for\s+)?([a-z]+).*?\$?(\d+)/)
  if (giftMatch) {
    const personName = giftMatch[1]
    const amount = parseFloat(giftMatch[2])
    
    console.log(`✅ Gift for ${personName}: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'relationships', {
      id: randomUUID(),
      type: 'gift',
      personName,
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_gift',
      message: `✅ Logged gift for ${personName}: $${amount} in Relationships domain`
    }
  }
  
  // ============================================
  // CAREER DOMAIN
  // ============================================
  
  // Salary/Income
  const salaryMatch = lowerMessage.match(/(?:salary|annual\s*income|hourly\s*rate)(?:\s+is)?(?:\s+)?\$?(\d+(?:,\d{3})*(?:k)?)(?:\s*\/?\s*(year|annually|hour|hourly))?/)
  if (salaryMatch && !lowerMessage.includes('bonus')) {
    const tempAmount = salaryMatch[1].replace(/,/g, '')
    let amount: string
    if (tempAmount.includes('k')) {
      amount = (parseInt(tempAmount) * 1000).toString()
    } else {
      amount = parseFloat(tempAmount).toString()
    }
    const frequency = salaryMatch[2] || 'year'
    const isHourly = frequency.includes('hour')
    
    console.log(`✅ ${isHourly ? 'Hourly rate' : 'Salary'}: $${amount}/${frequency}`)
    
    await saveToSupabase(supabase, userId, 'career', {
      id: randomUUID(),
      type: isHourly ? 'hourly_rate' : 'salary',
      amount,
      frequency,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_salary',
      message: `✅ Logged ${isHourly ? 'hourly rate' : 'salary'}: $${amount.toLocaleString()}/${frequency} in Career domain`
    }
  }
  
  // Promotion/Raise
  const promotionMatch = lowerMessage.match(/(?:promoted|promotion)(?:\s+to)?\s+([a-z\s]+?)(?:\s+|$)|(?:got|received)\s+raise(?:\s+to)?\s+\$?(\d+(?:,\d{3})*k?)/)
  if (promotionMatch) {
    const newTitle = promotionMatch[1] ? promotionMatch[1].trim() : null
    const newSalary = promotionMatch[2] ? parseFloat(promotionMatch[2].replace(/,|k/g, '')) * (promotionMatch[2].includes('k') ? 1000 : 1) : null
    
    console.log(`✅ Promotion${newTitle ? ': ' + newTitle : ''}${newSalary ? ' - $' + newSalary : ''}`)
    
    await saveToSupabase(supabase, userId, 'career', {
      id: randomUUID(),
      type: 'promotion',
      newTitle,
      newSalary,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_promotion',
      message: `✅ Logged promotion${newTitle ? ': ' + newTitle : ''}${newSalary ? ' - $' + newSalary.toLocaleString() : ''} in Career domain`
    }
  }
  
  // Work Hours
  const workHoursMatch = lowerMessage.match(/worked\s+(\d+)\s*hours?(?:\s+(?:this\s+week|today|yesterday))?/)
  if (workHoursMatch) {
    const hours = parseInt(workHoursMatch[1])
    const period = lowerMessage.includes('week') ? 'week' : lowerMessage.includes('yesterday') ? 'yesterday' : 'today'
    
    console.log(`✅ Work hours: ${hours} hours (${period})`)
    
    await saveToSupabase(supabase, userId, 'career', {
      id: randomUUID(),
      type: 'work_hours',
      hours,
      period,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_work_hours',
      message: `✅ Logged ${hours} work hours (${period}) in Career domain`
    }
  }
  
  // Bonus
  const bonusMatch = lowerMessage.match(/(?:received|got)\s+bonus\s+\$?(\d+(?:,\d{3})*(?:k)?)/)
  if (bonusMatch) {
    const tempAmount = bonusMatch[1].replace(/,/g, '')
    let amount: string
    if (tempAmount.includes('k')) {
      amount = (parseInt(tempAmount) * 1000).toString()
    } else {
      amount = parseFloat(tempAmount).toString()
    }

    console.log(`✅ Bonus: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'career', {
      id: randomUUID(),
      type: 'bonus',
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_bonus',
      message: `✅ Logged bonus: $${amount.toLocaleString()} in Career domain`
    }
  }
  
  // Certification/Skill
  const certificationMatch = lowerMessage.match(/(?:learned|completed|earned|got)\s+([a-z0-9\s\+]+?)\s*(?:certification|cert|training|course)/)
  if (certificationMatch && !lowerMessage.includes('dog') && !lowerMessage.includes('pet')) {
    const certName = certificationMatch[1].trim()
    
    console.log(`✅ Certification: ${certName}`)
    
    await saveToSupabase(supabase, userId, 'career', {
      id: randomUUID(),
      type: 'certification',
      name: certName,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_certification',
      message: `✅ Logged ${certName} certification in Career domain`
    }
  }
  
  // ============================================
  // EDUCATION DOMAIN
  // ============================================
  
  // Grades
  const gradeMatch = lowerMessage.match(/(?:got|received|earned)\s+([a-f][\+\-]?|\d+%)\s+(?:in|on|for)?/)
  if (gradeMatch && (lowerMessage.includes('class') || lowerMessage.includes('exam') || lowerMessage.includes('test'))) {
    const grade = gradeMatch[1].toUpperCase()
    
    console.log(`✅ Grade: ${grade}`)
    
    await saveToSupabase(supabase, userId, 'education', {
      id: randomUUID(),
      type: 'grade',
      grade,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_grade',
      message: `✅ Logged grade: ${grade} in Education domain`
    }
  }
  
  // Tuition Payment
  const tuitionMatch = lowerMessage.match(/(?:paid|tuition|semester\s*fees?)\s+\$?(\d+(?:,\d{3})*)/)
  if (tuitionMatch && (lowerMessage.includes('tuition') || lowerMessage.includes('semester') || lowerMessage.includes('fees'))) {
    const amount = parseFloat(tuitionMatch[1].replace(/,/g, ''))
    
    console.log(`✅ Tuition: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'education', {
      id: randomUUID(),
      type: 'tuition',
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_tuition',
      message: `✅ Logged tuition payment: $${amount.toLocaleString()} in Education domain`
    }
  }
  
  // Credits Completed
  const creditsMatch = lowerMessage.match(/completed\s+(\d+)\s*credits?/)
  if (creditsMatch) {
    const credits = parseInt(creditsMatch[1])
    
    console.log(`✅ Credits: ${credits}`)
    
    await saveToSupabase(supabase, userId, 'education', {
      id: randomUUID(),
      type: 'credits',
      credits,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_credits',
      message: `✅ Logged ${credits} credits completed in Education domain`
    }
  }
  
  // ============================================
  // LEGAL DOMAIN
  // ============================================
  
  // Document Signing
  const signedDocMatch = lowerMessage.match(/signed\s+(lease|contract|agreement|will|trust|power\s*of\s*attorney)/)
  if (signedDocMatch) {
    const docType = signedDocMatch[1]
    
    console.log(`✅ Signed ${docType}`)
    
    await saveToSupabase(supabase, userId, 'legal', {
      id: randomUUID(),
      type: 'document',
      documentType: docType,
      action: 'signed',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_legal_document',
      message: `✅ Logged signed ${docType} in Legal domain`
    }
  }
  
  // Legal Fees
  const legalFeeMatch = lowerMessage.match(/(?:attorney|lawyer|legal)(?:\s+fee|\s+consultation)?\s+\$?(\d+(?:,\d{3})*)/)
  if (legalFeeMatch) {
    const amount = parseFloat(legalFeeMatch[1].replace(/,/g, ''))
    const serviceType = lowerMessage.includes('consultation') ? 'consultation' : 'legal service'
    
    console.log(`✅ Legal fee: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'legal', {
      id: randomUUID(),
      type: 'legal_fee',
      serviceType,
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_legal_fee',
      message: `✅ Logged legal fee: $${amount} in Legal domain`
    }
  }
  
  // License Expiration
  const licenseMatch = lowerMessage.match(/(?:drivers?|professional)\s*license\s*(?:expires|renewed)?\s*(\d{4})/)
  if (licenseMatch) {
    const year = parseInt(licenseMatch[1])
    const licenseType = lowerMessage.includes('professional') ? 'professional' : 'drivers'
    
    console.log(`✅ ${licenseType} license expires ${year}`)
    
    await saveToSupabase(supabase, userId, 'legal', {
      id: randomUUID(),
      type: 'license',
      licenseType,
      expiryYear: year,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_license',
      message: `✅ Logged ${licenseType} license (expires ${year}) in Legal domain`
    }
  }
  
  // ============================================
  // INSURANCE DOMAIN
  // ============================================
  
  // Insurance Premium
  const insurancePremiumMatch = lowerMessage.match(/(?:(health|car|auto|life|dental|vision|home|homeowners|disability)\s+)?insurance(?:\s+premium)?\s+\$?(\d+(?:,\d{3})*)(?:\s*\/?\s*(month|monthly|year|annually))?/)
  if (insurancePremiumMatch && !lowerMessage.includes('claim')) {
    const insuranceType = insurancePremiumMatch[1] || 'general'
    const amount = parseFloat(insurancePremiumMatch[2].replace(/,/g, ''))
    const frequency = insurancePremiumMatch[3] || 'monthly'
    
    console.log(`✅ ${insuranceType} insurance: $${amount}/${frequency}`)
    
    await saveToSupabase(supabase, userId, 'insurance', {
      id: randomUUID(),
      type: 'premium',
      insuranceType,
      amount,
      frequency,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_insurance_premium',
      message: `✅ Logged ${insuranceType} insurance premium: $${amount}/${frequency} in Insurance domain`
    }
  }
  
  // Insurance Claim
  const claimMatch = lowerMessage.match(/filed\s+claim\s+(?:for\s+)?\$?(\d+(?:,\d{3})*)/)
  if (claimMatch) {
    const amount = parseFloat(claimMatch[1].replace(/,/g, ''))
    
    console.log(`✅ Insurance claim: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'insurance', {
      id: randomUUID(),
      type: 'claim',
      amount,
      status: 'filed',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_insurance_claim',
      message: `✅ Logged insurance claim: $${amount} in Insurance domain`
    }
  }
  
  // Insurance Coverage/Deductible
  const coverageMatch = lowerMessage.match(/(?:deductible|out.?of.?pocket\s+max|coverage\s+limit)\s+\$?(\d+(?:,\d{3})*)/)
  if (coverageMatch) {
    const amount = parseFloat(coverageMatch[1].replace(/,/g, ''))
    const coverageType = lowerMessage.includes('deductible') ? 'deductible' : lowerMessage.includes('out') ? 'out_of_pocket_max' : 'coverage_limit'
    
    console.log(`✅ Insurance ${coverageType}: $${amount}`)
    
    await saveToSupabase(supabase, userId, 'insurance', {
      id: randomUUID(),
      type: 'coverage',
      coverageType,
      amount,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_insurance_coverage',
      message: `✅ Logged insurance ${coverageType}: $${amount.toLocaleString()} in Insurance domain`
    }
  }
  
  // Insurance Renewal
  const renewalMatch = lowerMessage.match(/insurance\s+(?:renews|expires)\s+([a-z]+)\s*(\d{4})/)
  if (renewalMatch) {
    const month = renewalMatch[1]
    const year = parseInt(renewalMatch[2])
    
    console.log(`✅ Insurance renewal: ${month} ${year}`)
    
    await saveToSupabase(supabase, userId, 'insurance', {
      id: randomUUID(),
      type: 'renewal',
      renewalMonth: month,
      renewalYear: year,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_insurance_renewal',
      message: `✅ Logged insurance renewal: ${month} ${year} in Insurance domain`
    }
  }
  
  // ============================================
  // TRAVEL DOMAIN
  // ============================================
  
  // Hotel Booking
  const hotelMatch = lowerMessage.match(/(?:booked|hotel|airbnb).*?(\d+)\s*nights?.*?\$?(\d+(?:,\d{3})*)/)
  if (hotelMatch && (lowerMessage.includes('hotel') || lowerMessage.includes('airbnb') || lowerMessage.includes('booked'))) {
    const nights = parseInt(hotelMatch[1])
    const cost = parseFloat(hotelMatch[2].replace(/,/g, ''))
    const accommodationType = lowerMessage.includes('airbnb') ? 'airbnb' : 'hotel'
    
    console.log(`✅ ${accommodationType}: ${nights} nights for $${cost}`)
    
    await saveToSupabase(supabase, userId, 'travel', {
      id: randomUUID(),
      type: 'accommodation',
      accommodationType,
      nights,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_accommodation',
      message: `✅ Logged ${accommodationType}: ${nights} nights for $${cost} in Travel domain`
    }
  }
  
  // Passport Expiration
  const passportMatch = lowerMessage.match(/passport\s+expires\s+(\d{4})/)
  if (passportMatch) {
    const year = parseInt(passportMatch[1])
    
    console.log(`✅ Passport expires ${year}`)
    
    await saveToSupabase(supabase, userId, 'travel', {
      id: randomUUID(),
      type: 'passport',
      expiryYear: year,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_passport',
      message: `✅ Logged passport expiration: ${year} in Travel domain`
    }
  }
  
  // Airline Miles/Points
  const milesMatch = lowerMessage.match(/(?:earned|redeemed)\s+(\d+(?:,\d{3})?)\s*(?:airline\s+)?(?:miles?|points?)/)
  if (milesMatch && (lowerMessage.includes('airline') || lowerMessage.includes('miles') || lowerMessage.includes('points'))) {
    const miles = parseInt(milesMatch[1].replace(/,/g, ''))
    const action = lowerMessage.includes('earned') ? 'earned' : 'redeemed'
    
    console.log(`✅ ${action} ${miles} miles`)
    
    await saveToSupabase(supabase, userId, 'travel', {
      id: randomUUID(),
      type: 'airline_miles',
      action,
      miles,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_airline_miles',
      message: `✅ Logged ${action} ${miles.toLocaleString()} airline miles in Travel domain`
    }
  }
  
  // ============================================
  // HOBBIES DOMAIN
  // ============================================
  
  // Music Practice
  const musicMatch = lowerMessage.match(/played\s+(guitar|piano|drums|violin|bass|keyboard|saxophone|flute|trumpet|cello)\s+(\d+)?\s*(?:hour|hr|minute|min)/)
  if (musicMatch) {
    const instrument = musicMatch[1]
    let duration = musicMatch[2] ? parseInt(musicMatch[2]) : 30
    if (lowerMessage.includes('hour')) {
      duration = duration * 60
    }
    
    console.log(`✅ Played ${instrument}: ${duration} minutes`)
    
    await saveToSupabase(supabase, userId, 'hobbies', {
      id: randomUUID(),
      type: 'music',
      instrument,
      duration,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_music_practice',
      message: `✅ Logged ${instrument} practice: ${duration} minutes in Hobbies domain`
    }
  }
  
  // Art/Creative
  const artMatch = lowerMessage.match(/(?:painted|drawing|sketched|sculpted|crafted)(?:\s+for)?\s*(\d+)?\s*(?:hour|hr|minute|min)?/)
  if (artMatch && !lowerMessage.includes('house') && !lowerMessage.includes('room')) {
    const activityType = lowerMessage.includes('painted') ? 'painting' : lowerMessage.includes('drawing') ? 'drawing' : lowerMessage.includes('sketch') ? 'sketching' : 'art'
    let duration = artMatch[1] ? parseInt(artMatch[1]) : null
    if (duration && lowerMessage.includes('hour')) {
      duration = duration * 60
    }
    
    console.log(`✅ ${activityType}${duration ? ': ' + duration + ' min' : ''}`)
    
    await saveToSupabase(supabase, userId, 'hobbies', {
      id: randomUUID(),
      type: 'art',
      activityType,
      duration,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_art_activity',
      message: `✅ Logged ${activityType}${duration ? ': ' + duration + ' minutes' : ''} in Hobbies domain`
    }
  }
  
  // Reading
  const readingMatch = lowerMessage.match(/read(?:ing)?\s+(\d+)\s*(?:pages?|hours?|minutes?)/)
  if (readingMatch) {
    const amount = parseInt(readingMatch[1])
    const unit = lowerMessage.includes('page') ? 'pages' : lowerMessage.includes('hour') ? 'hours' : 'minutes'
    
    console.log(`✅ Reading: ${amount} ${unit}`)
    
    await saveToSupabase(supabase, userId, 'hobbies', {
      id: randomUUID(),
      type: 'reading',
      amount,
      unit,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_reading',
      message: `✅ Logged reading: ${amount} ${unit} in Hobbies domain`
    }
  }
  
  // Equipment Purchase (for hobbies)
  const hobbyEquipmentMatch = lowerMessage.match(/bought\s+(?:new\s+)?(camera|guitar|lens|keyboard|easel|art\s*supplies|paints?|canvas).*?\$?(\d+(?:,\d{3})*)/)
  if (hobbyEquipmentMatch) {
    const itemType = hobbyEquipmentMatch[1]
    const cost = parseFloat(hobbyEquipmentMatch[2].replace(/,/g, ''))
    
    console.log(`✅ Hobby equipment: ${itemType} - $${cost}`)
    
    await saveToSupabase(supabase, userId, 'hobbies', {
      id: randomUUID(),
      type: 'equipment',
      itemType,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_hobby_equipment',
      message: `✅ Logged ${itemType} purchase: $${cost} in Hobbies domain`
    }
  }
  
  // ============================================
  // COLLECTIBLES DOMAIN
  // ============================================
  
  // Collectible Purchase
  const collectibleMatch = lowerMessage.match(/(?:bought|purchased)\s+(baseball\s*card|comic\s*book|trading\s*card|figurine|coin|stamp|vintage\s*toy|collectible).*?\$?(\d+(?:,\d{3})*)/)
  if (collectibleMatch) {
    const itemType = collectibleMatch[1]
    const cost = parseFloat(collectibleMatch[2].replace(/,/g, ''))
    
    console.log(`✅ Collectible: ${itemType} - $${cost}`)
    
    await saveToSupabase(supabase, userId, 'collectibles', {
      id: randomUUID(),
      type: 'purchase',
      itemType,
      cost,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_collectible',
      message: `✅ Logged ${itemType} purchase: $${cost} in Collectibles domain`
    }
  }
  
  // Collectible Valuation
  const valuationMatch = lowerMessage.match(/(?:comic|card|collectible|item)(?:\s+is)?\s+worth\s+\$?(\d+(?:,\d{3})*)/)
  if (valuationMatch && !lowerMessage.includes('house') && !lowerMessage.includes('home') && !lowerMessage.includes('car')) {
    const value = parseFloat(valuationMatch[1].replace(/,/g, ''))
    
    console.log(`✅ Collectible valuation: $${value}`)
    
    await saveToSupabase(supabase, userId, 'collectibles', {
      id: randomUUID(),
      type: 'valuation',
      value,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_collectible_valuation',
      message: `✅ Logged collectible valuation: $${value.toLocaleString()} in Collectibles domain`
    }
  }
  
  // ============================================
  // DIGITAL-LIFE DOMAIN
  // ============================================
  
  // Domain Name
  const domainNameMatch = lowerMessage.match(/domain\s+([a-z0-9\-\.]+)\s+(?:expires|renewed)\s+(\d{4})/)
  if (domainNameMatch) {
    const domainName = domainNameMatch[1]
    const year = parseInt(domainNameMatch[2])
    
    console.log(`✅ Domain ${domainName} expires ${year}`)
    
    await saveToSupabase(supabase, userId, 'digital-life', {
      id: randomUUID(),
      type: 'domain',
      domainName,
      expiryYear: year,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_domain',
      message: `✅ Logged domain ${domainName} (expires ${year}) in Digital-Life domain`
    }
  }
  
  // Cloud Storage
  const storageMatch = lowerMessage.match(/upgraded\s+to\s+(\d+)\s*(tb|gb)\s*storage/)
  if (storageMatch) {
    const size = parseInt(storageMatch[1])
    const unit = storageMatch[2].toUpperCase()
    
    console.log(`✅ Cloud storage: ${size} ${unit}`)
    
    await saveToSupabase(supabase, userId, 'digital-life', {
      id: randomUUID(),
      type: 'cloud_storage',
      size,
      unit,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_cloud_storage',
      message: `✅ Logged cloud storage upgrade: ${size} ${unit} in Digital-Life domain`
    }
  }
  
  // ============================================
  // GOALS DOMAIN
  // ============================================
  
  // Goal Setting
  const goalMatch = lowerMessage.match(/(?:goal|new\s*goal):\s*(.+)/)
  if (goalMatch) {
    const goalDescription = goalMatch[1].trim()
    
    console.log(`✅ Goal: ${goalDescription}`)
    
    await saveToSupabase(supabase, userId, 'goals', {
      id: randomUUID(),
      type: 'goal',
      description: goalDescription,
      status: 'active',
      progress: 0,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_goal',
      message: `✅ Created goal: ${goalDescription} in Goals domain`
    }
  }
  
  // Goal Progress
  const progressMatch = lowerMessage.match(/goal\s+(\d+)%\s+complete/)
  if (progressMatch) {
    const progress = parseInt(progressMatch[1])
    
    console.log(`✅ Goal progress: ${progress}%`)
    
    await saveToSupabase(supabase, userId, 'goals', {
      id: randomUUID(),
      type: 'goal_progress',
      progress,
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_goal_progress',
      message: `✅ Logged goal progress: ${progress}% in Goals domain`
    }
  }
  
  // Milestone Reached
  const milestoneMatch = lowerMessage.match(/reached\s+milestone|hit\s+milestone/)
  if (milestoneMatch) {
    const milestoneDesc = lowerMessage.replace(/reached\s+milestone:?|hit\s+milestone:?/i, '').trim()
    
    console.log(`✅ Milestone reached${milestoneDesc ? ': ' + milestoneDesc : ''}`)
    
    await saveToSupabase(supabase, userId, 'goals', {
      id: randomUUID(),
      type: 'milestone',
      description: milestoneDesc || 'milestone reached',
      timestamp: new Date().toISOString(),
      source: 'voice_ai'
    })
    
    return {
      isCommand: true,
      action: 'save_milestone',
      message: `✅ Logged milestone${milestoneDesc ? ': ' + milestoneDesc : ''} in Goals domain`
    }
  }
  
  // Not a command
  return {
    isCommand: false
  }
}

// ============================================
// MULTI-COMMAND HANDLER (Split & Process Multiple Commands)
// ============================================

/**
 * Detects if a message segment is a RETRIEVAL query (vs data logging)
 * Retrieval queries ask for data to be shown/retrieved
 */
function isRetrievalQuerySegment(segment: string): boolean {
  const lowerSegment = segment.toLowerCase().trim()
  
  // Retrieval patterns - asking to see/get/show data
  const retrievalPatterns = [
    /^(?:pull\s*up|show\s*me|get\s*my|retrieve|find|display|open|bring\s*up|let\s*me\s*see)/i,
    /^(?:can\s+(?:i|you)\s+(?:get|show|pull|see|find|retrieve))/i,
    /^(?:where\s*(?:is|are|'s))/i,
    /^(?:what\s*(?:is|are|'s)\s+my)/i,
    /\b(?:license|registration|insurance\s*card|document|passport|certificate|id\s*card|driver'?s?\s*(?:license|docs?|documents?))\b/i,
  ]
  
  return retrievalPatterns.some(pattern => pattern.test(lowerSegment))
}

/**
 * Detects if a message segment is a DATA LOGGING command
 * Data logging adds/records information
 */
function isDataLoggingSegment(segment: string): boolean {
  const lowerSegment = segment.toLowerCase().trim()
  
  // Data logging patterns - recording/logging data
  const dataLogPatterns = [
    // Water/hydration
    /\b(?:log(?:ged)?|drank|drink|had)\s*\d+\s*(?:oz|ounces?|ml|liters?|cups?|glasses?)/i,
    /\b\d+\s*(?:oz|ounces?)\s*(?:of\s*)?water\b/i,
    // Weight
    /\b(?:i\s+)?weigh\s*\d+/i,
    /\bweight\s*(?:is|was)?\s*\d+/i,
    // Blood pressure
    /\b(?:blood\s*pressure|bp)\s*\d+[\/\-]\d+/i,
    // Exercise/fitness
    /\b(?:ran|walked|cycled|swam|worked\s*out|exercised|jogged|hiked|biked)\b/i,
    /\b(?:did|completed)\s+\d+\s*(?:minute|min|hour|hr)/i,
    // Financial
    /\b(?:spent|paid|bought|purchased)\s+\$?\d+/i,
    // Food/nutrition
    /\b(?:ate|eat|had)\s+.+\d+\s*(?:cal|calories?)/i,
    // Sleep
    /\b(?:slept|sleep)\s+\d+/i,
  ]
  
  return dataLogPatterns.some(pattern => pattern.test(lowerSegment))
}

async function handleMultipleVoiceCommands(
  message: string, 
  userId: string, 
  supabase: any
): Promise<{ isCommand: boolean; action: string; message: string; results?: any[]; queryResults?: any[] }> {
  // Split message by common separators (comma, "and", "also", "plus", semicolon)
  // Be careful not to split "blood pressure 120/80" or "120 and 80"
  const segments = message
    .split(/,(?![^(]*\))|;|\s+and\s+(?!\d)|\s+also\s+|\s+plus\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 3) // Filter out very short segments

  console.log(`🔄 [MULTI-COMMAND] Split message into ${segments.length} segments:`, segments)

  // If only one segment, use the regular handler
  if (segments.length <= 1) {
    const result = await handleVoiceCommand(message, userId, supabase)
    // Ensure we always return the required fields
    return {
      isCommand: result.isCommand,
      action: result.action || '',
      message: result.message || '',
      results: undefined
    }
  }

  // Process each segment - detect type and route appropriately
  const results: any[] = []
  const queryResults: any[] = []
  const messages: string[] = []

  for (const segment of segments) {
    console.log(`🔄 [MULTI-COMMAND] Processing segment: "${segment}"`)
    
    // Detect segment type
    const isRetrieval = isRetrievalQuerySegment(segment)
    const isDataLog = isDataLoggingSegment(segment)
    
    console.log(`🔍 [MULTI-COMMAND] Segment type: retrieval=${isRetrieval}, dataLog=${isDataLog}`)
    
    try {
      if (isRetrieval) {
        // Route to query handler for retrieval requests
        console.log(`📖 [MULTI-COMMAND] Routing to query handler: "${segment}"`)
        const queryResult = await intelligentQueryHandler(segment, userId, supabase)
        
        if (queryResult.isQuery) {
          queryResults.push({
            segment,
            type: 'retrieval',
            message: queryResult.message,
            data: queryResult.data,
            visualization: queryResult.visualization,
            success: true
          })
          messages.push(queryResult.message)
          console.log(`✅ [MULTI-COMMAND] Query segment processed successfully`)
        } else {
          console.log(`⚠️ [MULTI-COMMAND] Query handler didn't match, trying voice command: "${segment}"`)
          // Fallback to voice command if query handler didn't match
          const result = await handleVoiceCommand(segment.trim(), userId, supabase)
          if (result.isCommand) {
            results.push({
              segment,
              action: result.action,
              message: result.message,
              success: true
            })
            messages.push(result.message)
          }
        }
      } else if (isDataLog) {
        // Route to voice command handler for data logging
        console.log(`📝 [MULTI-COMMAND] Routing to data log handler: "${segment}"`)
        const result = await handleVoiceCommand(segment.trim(), userId, supabase)
        if (result.isCommand) {
          results.push({
            segment,
            action: result.action,
            message: result.message,
            success: true
          })
          messages.push(result.message)
          console.log(`✅ [MULTI-COMMAND] Data log segment processed successfully: ${result.action}`)
        } else {
          console.log(`⚠️ [MULTI-COMMAND] Data log segment did not match any pattern: "${segment}"`)
        }
      } else {
        // Unknown type - try voice command handler first
        console.log(`❓ [MULTI-COMMAND] Unknown segment type, trying voice command: "${segment}"`)
        const result = await handleVoiceCommand(segment.trim(), userId, supabase)
        if (result.isCommand) {
          results.push({
            segment,
            action: result.action,
            message: result.message,
            success: true
          })
          messages.push(result.message)
          console.log(`✅ [MULTI-COMMAND] Segment processed successfully: ${result.action}`)
        } else {
          // Try query handler as fallback
          console.log(`⚠️ [MULTI-COMMAND] Voice command didn't match, trying query handler: "${segment}"`)
          const queryResult = await intelligentQueryHandler(segment, userId, supabase)
          if (queryResult.isQuery) {
            queryResults.push({
              segment,
              type: 'retrieval',
              message: queryResult.message,
              data: queryResult.data,
              visualization: queryResult.visualization,
              success: true
            })
            messages.push(queryResult.message)
          } else {
            console.log(`⚠️ [MULTI-COMMAND] Segment did not match any pattern: "${segment}"`)
          }
        }
      }
    } catch (error: any) {
      console.error(`❌ [MULTI-COMMAND] Error processing segment "${segment}":`, error.message)
    }
  }

  // If at least one command or query was processed successfully
  const totalProcessed = results.length + queryResults.length
  if (totalProcessed > 0) {
    const combinedMessage = totalProcessed === 1 
      ? messages[0] 
      : `✅ Successfully processed ${totalProcessed} requests:\n${messages.join('\n')}`
    
    console.log(`✅ [MULTI-COMMAND] Processed ${totalProcessed} of ${segments.length} segments (${results.length} commands, ${queryResults.length} queries)`)
    
    return {
      isCommand: true,
      action: queryResults.length > 0 && results.length > 0 ? 'mixed_intent' : (queryResults.length > 0 ? 'multi_query' : 'multi_command'),
      message: combinedMessage,
      results: results.length > 0 ? results : undefined,
      queryResults: queryResults.length > 0 ? queryResults : undefined
    }
  }

  // No commands matched
  return {
    isCommand: false,
    action: '',
    message: ''
  }
}

// Save data to Supabase domains table in DomainData format
async function saveToSupabase(supabase: any, userId: string, domain: string, entry: any) {
  console.log(`💾 [SAVE START] Domain: ${domain}, User: ${userId}`)
  console.log(`📝 Entry to save:`, JSON.stringify(entry, null, 2))
  
  // Get active person ID from user settings (server-side query)
  let activePersonId = 'me'
  try {
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .maybeSingle()
    
    const settings = settingsData?.settings as Record<string, any> | null
    activePersonId = settings?.activePersonId || 
                    settings?.people?.find((p: any) => p.isActive)?.id || 
                    'me'
  } catch (e) {
    console.warn('⚠️ Could not fetch user settings for person_id, using default')
  }
  
  try {
    const now = new Date().toISOString()
    const today = now.split('T')[0]

    // Helper: detect if an entry represents health vitals even if type is inconsistent
    const isHealthVitalsEntry = (e: any): boolean => {
      const t = (e?.type || '').toLowerCase()
      const hasDirectFields =
        e?.weight != null || e?.value != null || e?.heartRate != null || e?.hr != null ||
        (e?.systolic != null && e?.diastolic != null) || e?.bloodPressure != null ||
        e?.temperature != null || e?.sleepHours != null || e?.steps != null ||
        e?.waterIntake != null || e?.mood != null
      return (
        (domain === 'health' && [
          'weight','height','sleep','steps','blood_pressure','heart_rate','temperature','mood'
        ].includes(t)) || (domain === 'health' && hasDirectFields)
      )
    }

    // Helper: normalize vitals from arbitrary entry structures
    const extractVitals = (e: any) => {
      const getNum = (v: any) => (typeof v === 'number' ? v : parseFloat(v))
      const weight = e?.weight ?? e?.value ?? (typeof e?.amount === 'number' ? e?.amount : undefined)
      const heartRate = e?.heartRate ?? e?.hr ?? (e?.type === 'heart_rate' ? e?.value : undefined)
      const bp = e?.bloodPressure || (e?.systolic != null && e?.diastolic != null
        ? { systolic: getNum(e?.systolic), diastolic: getNum(e?.diastolic) }
        : undefined)
      const glucose = e?.glucose ?? e?.bloodGlucose ?? (e?.type === 'glucose' ? e?.value : undefined)
      const temperature = e?.temperature ?? (e?.type === 'temperature' ? e?.value : undefined)
      const sleepHours = e?.sleepHours ?? (e?.type === 'sleep' ? e?.hours : undefined)
      const steps = e?.steps ?? (e?.type === 'steps' ? e?.value : undefined)
      const waterIntake = e?.waterIntake ?? (e?.type === 'water' ? e?.value : undefined)
      const mood = e?.mood
      const moodValue = e?.moodValue ?? (e?.type === 'mood' ? e?.value : undefined)

      return {
        weight: typeof weight === 'number' && !Number.isNaN(weight) ? weight : undefined,
        heartRate: typeof heartRate === 'number' && !Number.isNaN(heartRate) ? heartRate : undefined,
        bloodPressure: bp,
        glucose: typeof glucose === 'number' && !Number.isNaN(glucose) ? glucose : undefined,
        temperature: typeof temperature === 'number' && !Number.isNaN(temperature) ? temperature : undefined,
        sleepHours: typeof sleepHours === 'number' && !Number.isNaN(sleepHours) ? sleepHours : undefined,
        steps: typeof steps === 'number' && !Number.isNaN(steps) ? steps : undefined,
        waterIntake: typeof waterIntake === 'number' && !Number.isNaN(waterIntake) ? waterIntake : undefined,
        mood,
        moodValue: typeof moodValue === 'number' && !Number.isNaN(moodValue) ? moodValue : undefined,
      }
    }
    
    // For health vitals, create SEPARATE entries for each metric (matches manual UI format)
    if (isHealthVitalsEntry(entry)) {
      console.log(`🏥 Health vitals entry detected - creating separate entries for each metric...`)
      
      const v = extractVitals(entry)
      const entriesToCreate = []
      
      // Create separate entry for weight
      if (v.weight != null) {
        entriesToCreate.push({
          title: `Weight: ${v.weight} lbs`,
          description: `Weight check for ${today}`,
          metadata: {
            logType: 'weight',
            weight: v.weight,
            date: today
          }
        })
      }
      
      // Create separate entry for blood pressure
      if (v.bloodPressure) {
        entriesToCreate.push({
          title: `Blood Pressure: ${v.bloodPressure.systolic}/${v.bloodPressure.diastolic}`,
          description: `BP reading for ${today}`,
          metadata: {
            logType: 'blood_pressure',
            systolic: v.bloodPressure.systolic,
            diastolic: v.bloodPressure.diastolic,
            date: today
          }
        })
      }
      
      // Create separate entry for heart rate
      if (v.heartRate != null) {
        entriesToCreate.push({
          title: `Heart Rate: ${v.heartRate} bpm`,
          description: `HR reading for ${today}`,
          metadata: {
            logType: 'heart_rate',
            heartRate: v.heartRate,
            bpm: v.heartRate,
            date: today
          }
        })
      }
      
      // Create separate entry for glucose (if supported)
      const glucose = v.glucose || (entry.glucose != null ? parseFloat(entry.glucose) : undefined)
      if (glucose != null && !Number.isNaN(glucose)) {
        entriesToCreate.push({
          title: `Blood Sugar: ${glucose} mg/dL`,
          description: `Glucose reading for ${today}`,
          metadata: {
            logType: 'glucose',
            glucose: glucose,
            date: today
          }
        })
      }
      
      // Create separate entry for sleep
      if (v.sleepHours != null) {
        entriesToCreate.push({
          title: `Sleep: ${v.sleepHours} hours`,
          description: `Sleep tracking for ${today}`,
          metadata: {
            logType: 'sleep',
            sleepHours: v.sleepHours,
            sleepQuality: 'Good',
            date: today
          }
        })
      }
      
      console.log(`📝 Creating ${entriesToCreate.length} separate vital sign entries`)
      
      // Insert all entries
      for (const vitalEntry of entriesToCreate) {
        console.log(`💾 Inserting ${vitalEntry.metadata.logType} entry...`)
        
        const { data: insertedVital, error: insertError } = await supabase
          .from('domain_entries')
          .insert({
            user_id: userId,
            domain,
            title: vitalEntry.title,
            description: vitalEntry.description,
            metadata: vitalEntry.metadata,
            person_id: activePersonId, // 🔧 NEW: Include person_id for vitals
          })
          .select()
          .single()
        
        if (insertError) {
          console.error(`❌ Insert error for ${vitalEntry.metadata.logType}:`, insertError)
          throw insertError
        }
        
        console.log(`✅ [SAVE SUCCESS] Saved ${vitalEntry.metadata.logType} entry! ID: ${insertedVital?.id}`)
      }
      
      return
    }
    
    // For non-vitals data, save as individual normalized rows in domain_entries
    console.log(`📝 Creating new domain_entries row for ${domain} domain...`)
    
    // Create DomainData entry with smart title
    let title = entry.description || entry.type || 'Entry'
    
    // Generate better titles based on entry type
    // NUTRITION & HEALTH
    if (entry.type === 'water') {
      title = `${entry.value} ${entry.unit || 'oz'} water`
    } else if (entry.type === 'meal') {
      // Use name if available (preferred), otherwise fall back to description
      const mealName = entry.name || entry.description || 'Meal'
      title = `${mealName} (${entry.calories || 0} cal)`
    } 
    // FITNESS
    else if (entry.type === 'workout') {
      const exerciseName = entry.exercise || entry.exercise_type || entry.activityType || 'workout'
      title = `${entry.duration || 0} min ${exerciseName}`
      // Ensure activityType is set for fitness dashboard compatibility
      if (!entry.activityType) {
        entry.activityType = exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1)
      }
      if (!entry.itemType) {
        entry.itemType = 'activity'
      }
    } 
    // FINANCIAL
    else if (entry.type === 'expense') {
      title = `$${entry.amount} - ${entry.description}`
    } else if (entry.type === 'income') {
      title = `Income: $${entry.amount}`
    } else if (entry.type === 'gas') {
      title = `Gas: $${entry.amount}`
    } 
    // VEHICLES
    else if (entry.type === 'mileage_update') {
      title = `Mileage: ${entry.currentMileage?.toLocaleString()} ${entry.unit}`
    } else if (entry.type === 'fuel_purchase') {
      title = `Fuel: ${entry.gallons} ${entry.unit} ($${entry.cost})`
    } else if (entry.type === 'maintenance') {
      title = `${entry.serviceType?.replace(/_/g, ' ')}: $${entry.cost || 'N/A'}`
    } else if (entry.type === 'registration') {
      title = `Registration ${entry.expiryYear}`
    } else if (entry.type === 'car_wash') {
      title = `Car ${entry.serviceType}: $${entry.cost}`
    } else if (entry.type === 'vehicle_purchase') {
      title = `${entry.year || ''} ${entry.makeModel}: $${entry.purchasePrice?.toLocaleString()}`
    } 
    // PROPERTY
    else if (entry.type === 'home_value') {
      title = `Home Value: $${entry.value?.toLocaleString()}`
    } else if (entry.type === 'mortgage_payment') {
      title = `Mortgage: $${entry.amount?.toLocaleString()}`
    } else if (entry.type === 'property_tax') {
      title = `Property Tax: $${entry.amount?.toLocaleString()} ${entry.frequency}`
    } else if (entry.type === 'hoa_fee') {
      title = `HOA: $${entry.amount}/${entry.frequency}`
    } else if (entry.type === 'home_purchase') {
      title = `Home Purchase ${entry.purchaseYear}: $${entry.purchasePrice?.toLocaleString()}`
    } 
    // PETS
    else if (entry.type === 'feeding') {
      title = `Fed ${entry.petName}`
    } else if (entry.type === 'vet_appointment') {
      title = `Vet at ${entry.time}${entry.cost ? ' - $' + entry.cost : ''}`
    } else if (entry.type === 'vaccination') {
      title = `${entry.vaccineType} vaccine (exp ${entry.expiryYear})`
    } else if (entry.type === 'grooming') {
      title = `Pet ${entry.serviceType}: $${entry.cost}`
    } else if (entry.type === 'supplies') {
      title = `Pet ${entry.itemType}: $${entry.cost}`
    } 
    // MINDFULNESS
    else if (entry.type === 'meditation') {
      title = `${entry.meditationType} meditation: ${entry.duration} min`
    } else if (entry.type === 'breathing') {
      title = `${entry.breathingType}: ${entry.duration} min`
    } else if (entry.type === 'mood_checkin') {
      title = `Mood: ${entry.mood}`
    } else if (entry.type === 'journaling') {
      title = `${entry.journalType} journal${entry.duration ? ': ' + entry.duration + ' min' : ''}`
    } else if (entry.type === 'gratitude') {
      title = `Gratitude practice`
    } else if (entry.type === 'stress_level') {
      title = `Stress: ${entry.level}/10`
    } 
    // RELATIONSHIPS
    else if (entry.type === 'contact') {
      title = `${entry.contactMethod} with ${entry.personName}`
    } else if (entry.type === 'birthday') {
      title = `${entry.personName}'s birthday: ${entry.month} ${entry.day}`
    } else if (entry.type === 'anniversary') {
      title = `Anniversary: ${entry.month} ${entry.day}`
    } else if (entry.type === 'gift') {
      title = `Gift for ${entry.personName}: $${entry.amount}`
    } 
    // CAREER
    else if (entry.type === 'salary' || entry.type === 'hourly_rate') {
      title = `${entry.type === 'hourly_rate' ? 'Hourly Rate' : 'Salary'}: $${entry.amount?.toLocaleString()}/${entry.frequency}`
    } else if (entry.type === 'promotion') {
      title = `Promotion${entry.newTitle ? ': ' + entry.newTitle : ''}${entry.newSalary ? ' - $' + entry.newSalary.toLocaleString() : ''}`
    } else if (entry.type === 'work_hours') {
      title = `Worked ${entry.hours}h (${entry.period})`
    } else if (entry.type === 'bonus') {
      title = `Bonus: $${entry.amount?.toLocaleString()}`
    } else if (entry.type === 'certification') {
      title = `Certification: ${entry.name}`
    } 
    // EDUCATION
    else if (entry.type === 'course') {
      title = `Course: ${entry.name}`
    } else if (entry.type === 'grade') {
      title = `Grade: ${entry.grade}`
    } else if (entry.type === 'study_time') {
      title = `Studied: ${entry.hours}h`
    } else if (entry.type === 'tuition') {
      title = `Tuition: $${entry.amount?.toLocaleString()}`
    } else if (entry.type === 'credits') {
      title = `Completed ${entry.credits} credits`
    } 
    // LEGAL
    else if (entry.type === 'document') {
      title = `Signed ${entry.documentType}`
    } else if (entry.type === 'legal_fee') {
      title = `Legal ${entry.serviceType}: $${entry.amount}`
    } else if (entry.type === 'license') {
      title = `${entry.licenseType} license (exp ${entry.expiryYear})`
    } 
    // INSURANCE
    else if (entry.type === 'premium') {
      title = `${entry.insuranceType} insurance: $${entry.amount}/${entry.frequency}`
    } else if (entry.type === 'claim') {
      title = `Insurance claim: $${entry.amount} (${entry.status})`
    } else if (entry.type === 'coverage') {
      title = `${entry.coverageType?.replace(/_/g, ' ')}: $${entry.amount?.toLocaleString()}`
    } else if (entry.type === 'renewal') {
      title = `Insurance renewal: ${entry.renewalMonth} ${entry.renewalYear}`
    } 
    // TRAVEL
    else if (entry.type === 'flight') {
      title = `Flight to ${entry.destination}: $${entry.cost}`
    } else if (entry.type === 'accommodation') {
      title = `${entry.accommodationType}: ${entry.nights} nights ($${entry.cost})`
    } else if (entry.type === 'passport') {
      title = `Passport expires ${entry.expiryYear}`
    } else if (entry.type === 'airline_miles') {
      title = `${entry.action} ${entry.miles?.toLocaleString()} miles`
    } 
    // HOBBIES
    else if (entry.type === 'music') {
      title = `${entry.instrument}: ${entry.duration} min`
    } else if (entry.type === 'art') {
      title = `${entry.activityType}${entry.duration ? ': ' + entry.duration + ' min' : ''}`
    } else if (entry.type === 'reading') {
      title = `Read ${entry.amount} ${entry.unit}`
    } else if (entry.type === 'equipment') {
      title = `${entry.itemType}: $${entry.cost}`
    } 
    // COLLECTIBLES
    else if (entry.type === 'purchase') {
      title = `${entry.itemType}: $${entry.cost}`
    } else if (entry.type === 'valuation') {
      title = `Valuation: $${entry.value?.toLocaleString()}`
    } 
    // DIGITAL-LIFE
    else if (entry.type === 'subscription') {
      title = `${entry.service}: $${entry.amount}/${entry.frequency}`
    } else if (entry.type === 'domain') {
      title = `Domain ${entry.domainName} (exp ${entry.expiryYear})`
    } else if (entry.type === 'cloud_storage') {
      title = `Storage: ${entry.size} ${entry.unit}`
    } 
    // GOALS
    else if (entry.type === 'goal') {
      title = `Goal: ${entry.description}`
    } else if (entry.type === 'goal_progress') {
      title = `Progress: ${entry.progress}%`
    } else if (entry.type === 'milestone') {
      title = `Milestone: ${entry.description}`
    }
    
    const insertPayload = {
      user_id: userId,
      domain,
      title,
      description: entry.note || entry.description || '',
      metadata: entry,
      person_id: activePersonId, // 🔧 NEW: Include person_id
    }

    console.log(`📝 Inserting ${domain} entry:`, JSON.stringify(insertPayload, null, 2))

    const { data: insertedData, error: insertError } = await supabase
      .from('domain_entries')
      .insert(insertPayload)
      .select('*')
      .single()

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      console.error('❌ Error details:', JSON.stringify(insertError, null, 2))
      throw insertError
    }

    console.log(`✅ [SAVE SUCCESS] Saved new entry to domain_entries for ${domain}! ID: ${insertedData?.id}`)
    console.log(`✅ Inserted data:`, JSON.stringify(insertedData, null, 2))
  } catch (error: any) {
    console.error(`❌ [SAVE FAILED] Error saving to Supabase:`, error)
    console.error(`❌ Error message:`, error?.message)
    throw error
  }
}

// Fallback response when OpenAI API is not available
function generateFallbackResponse(message: string, userData: any): string {
  const lowerMessage = message.toLowerCase()
  
  // Financial queries
  if (lowerMessage.includes('net worth') || lowerMessage.includes('financial')) {
    const accounts = userData.financial || []
    const total = accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0)
    return `Based on your financial data, your estimated net worth is $${total.toLocaleString()}. You have ${accounts.length} financial accounts tracked.`
  }
  
  // Task queries
  if (lowerMessage.includes('task') || lowerMessage.includes('to-do')) {
    const tasks = userData.tasks || []
    const pending = tasks.filter((t: any) => !t.completed).length
    return `You currently have ${pending} pending tasks out of ${tasks.length} total tasks.`
  }
  
  // Default
  return `I understand you're asking about "${message}". I have access to your data across ${Object.keys(userData).length} life domains. Could you be more specific about what you'd like to know?`
}
