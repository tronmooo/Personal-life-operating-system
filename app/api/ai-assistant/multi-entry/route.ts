import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractMultipleEntities, UserContext } from '@/lib/ai/multi-entity-extractor'
import { routeEntities, detectDuplicates } from '@/lib/ai/domain-router'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================
// GOOGLE CALENDAR HELPER
// ============================================
async function createGoogleCalendarEvent(
  supabase: any,
  eventDetails: {
    title: string
    description?: string
    date?: string
    time?: string
    duration?: number
    location?: string
    type?: string
    company?: string
    withWhom?: string
  }
): Promise<{ success: boolean; message: string; eventId?: string; htmlLink?: string }> {
  try {
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
      const dateLower = eventDetails.date.toLowerCase()
      if (dateLower === 'tomorrow') {
        eventDate = new Date()
        eventDate.setDate(eventDate.getDate() + 1)
      } else if (dateLower === 'next week') {
        eventDate = new Date()
        eventDate.setDate(eventDate.getDate() + 7)
      } else if (dateLower !== 'today') {
        // Try to parse as ISO date
        const parsed = new Date(eventDetails.date)
        if (!isNaN(parsed.getTime())) {
          eventDate = parsed
        }
      }
    }

    // Parse the time
    let hours = 10  // Default 10 AM
    let minutes = 0
    
    if (eventDetails.time) {
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

    const duration = eventDetails.duration || 60
    const endDate = new Date(eventDate.getTime() + duration * 60 * 1000)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Build description
    let description = eventDetails.description || ''
    if (eventDetails.type) {
      description = `Type: ${eventDetails.type}\n${description}`
    }
    if (eventDetails.company) {
      description += `\nCompany: ${eventDetails.company}`
    }
    if (eventDetails.withWhom) {
      description += `\nWith: ${eventDetails.withWhom}`
    }
    description += '\n\nCreated via LifeHub AI Assistant'

    const calendarEvent = {
      summary: eventDetails.title,
      description: description.trim(),
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

    console.log('📅 [MULTI-ENTRY] Creating Google Calendar event:', calendarEvent)

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
    console.log('✅ [MULTI-ENTRY] Google Calendar event created:', createdEvent.id)

    return {
      success: true,
      message: `📅 Added "${eventDetails.title}" to Google Calendar`,
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

/**
 * FULL NUTRITION ESTIMATION - Estimates calories AND macros from food description
 * Used when user doesn't provide any nutritional info
 */
async function estimateFullNutrition(mealName: string): Promise<{
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
}> {
  const openAIKey = process.env.OPENAI_API_KEY
  
  if (!openAIKey) {
    // Fallback: estimate based on common foods
    return { calories: 400, protein: 25, carbs: 40, fats: 15, fiber: 5 }
  }

  try {
    console.log(`🥗 [MULTI-ENTRY] Estimating FULL nutrition for: ${mealName}`)
    
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
    console.log(`✅ [MULTI-ENTRY] Full nutrition estimated:`, nutrition)
    
    return {
      calories: Math.round(Number(nutrition.calories) || 400),
      protein: Math.round(Number(nutrition.protein) || 25),
      carbs: Math.round(Number(nutrition.carbs) || 40),
      fats: Math.round(Number(nutrition.fats) || 15),
      fiber: Math.round(Number(nutrition.fiber) || 5)
    }
  } catch (error) {
    console.error('❌ [MULTI-ENTRY] Full nutrition estimation failed:', error)
    return { calories: 400, protein: 25, carbs: 40, fats: 15, fiber: 5 }
  }
}

/**
 * Estimate macros (protein, carbs, fats, fiber) for a meal using AI
 */
async function estimateMealMacros(mealName: string, calories: number): Promise<{
  protein: number
  carbs: number
  fats: number
  fiber: number
}> {
  const openAIKey = process.env.OPENAI_API_KEY
  
  if (!openAIKey) {
    // Fallback estimation based on calories
    const protein = Math.round(calories * 0.2 / 4) // 20% of calories from protein (4 cal/g)
    const carbs = Math.round(calories * 0.45 / 4) // 45% from carbs (4 cal/g)
    const fats = Math.round(calories * 0.35 / 9) // 35% from fats (9 cal/g)
    const fiber = Math.round(carbs * 0.1) // ~10% of carbs as fiber
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
            content: `You are a nutrition expert. Given a meal name and calorie count, estimate the macronutrients.
            
Return ONLY a JSON object with these exact fields (numbers only, no units):
{
  "protein": <grams of protein>,
  "carbs": <grams of carbohydrates>,
  "fats": <grams of fat>,
  "fiber": <grams of fiber>
}

Base your estimates on typical nutritional values for the described food.
Ensure the macros roughly add up to the given calories:
- Protein: 4 cal/g
- Carbs: 4 cal/g  
- Fat: 9 cal/g

Return ONLY valid JSON, no explanations.`
          },
          {
            role: 'user',
            content: `Meal: ${mealName}\nCalories: ${calories}`
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    })

    if (!response.ok) {
      throw new Error('OpenAI API failed')
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('No response from AI')
    }

    // Parse JSON response
    const macros = JSON.parse(content.trim())
    console.log(`✅ [MACRO-AI] Estimated macros:`, macros)
    
    return {
      protein: Math.round(Number(macros.protein) || 0),
      carbs: Math.round(Number(macros.carbs) || 0),
      fats: Math.round(Number(macros.fats) || 0),
      fiber: Math.round(Number(macros.fiber) || 0)
    }
  } catch (error) {
    console.error('❌ [MACRO-AI] Failed to estimate macros:', error)
    // Fallback estimation
    const protein = Math.round(calories * 0.2 / 4)
    const carbs = Math.round(calories * 0.45 / 4)
    const fats = Math.round(calories * 0.35 / 9)
    const fiber = Math.round(carbs * 0.1)
    return { protein, carbs, fats, fiber }
  }
}

// User time info from client for accurate meal type detection
interface UserTimeInfo {
  localTime?: string
  localHour?: number
  timezone?: string
  timestamp?: string
}

/**
 * Multi-Entity Data Entry API
 * Extracts and saves multiple data points from natural language input
 */
export async function POST(request: NextRequest) {
  try {
    const { message, userContext, userTime } = await request.json() as { 
      message: string
      userContext?: any
      userTime?: UserTimeInfo 
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🧠 [MULTI-ENTRY] Processing message:', message)
    console.log('👤 [MULTI-ENTRY] User ID:', user.id)

    // STEP 1: Extract all entities using AI
    let extractionResult
    try {
      extractionResult = await extractMultipleEntities(message, userContext as UserContext)
      console.log(`✅ [MULTI-ENTRY] Extracted ${extractionResult.entities.length} entities`)
    } catch (extractError: any) {
      console.error('❌ [MULTI-ENTRY] Extraction failed:', extractError)
      return NextResponse.json(
        { error: `Failed to extract entities: ${extractError.message}` },
        { status: 500 }
      )
    }

    // Check if any entities were found
    if (extractionResult.entities.length === 0) {
      return NextResponse.json({
        success: false,
        message: "I couldn't extract any data from that message. Could you try being more specific?",
        results: [],
        extractionResult
      })
    }

    // STEP 2: Filter duplicates
    const uniqueEntities = detectDuplicates(extractionResult.entities)
    console.log(`✅ [MULTI-ENTRY] ${uniqueEntities.length} unique entities after deduplication`)

    // STEP 3: Route and validate entities
    const { routedEntities, conflicts } = routeEntities(uniqueEntities)
    console.log(`✅ [MULTI-ENTRY] ${routedEntities.length} entities validated and routed`)

    if (conflicts && conflicts.length > 0) {
      console.warn(`⚠️ [MULTI-ENTRY] ${conflicts.length} entities had validation conflicts`)
    }

    // Get active person ID from user settings (once, before the loop)
    // Use server-side query directly instead of client-side hook
    let activePersonId = 'me'
    try {
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single()
      
      const settings = settingsData?.settings as Record<string, any> | null
      activePersonId = settings?.activePersonId || 
                      settings?.people?.find((p: any) => p.isActive)?.id || 
                      'me'
    } catch (settingsError) {
      console.warn('⚠️ [MULTI-ENTRY] Could not fetch user settings, using default person_id')
    }
    console.log(`👤 [MULTI-ENTRY] Active person ID: ${activePersonId}`)

    // STEP 4: Create database entries (batch operation)
    const results = []
    const errors = []

    for (const entity of routedEntities) {
      try {
        console.log(`💾 [MULTI-ENTRY] Processing ${entity.domain}: ${entity.title}`)
        
        // SPECIAL HANDLING: Calendar domain goes to Google Calendar
        // Note: 'calendar' is handled as an external integration (not in Domain union)
        if ((entity as any).domain === 'calendar') {
          console.log(`📅 [MULTI-ENTRY] Routing to Google Calendar: ${entity.title}`)
          
          const calendarData = entity.data as any
          const calendarResult = await createGoogleCalendarEvent(supabase, {
            title: entity.title,
            description: typeof (entity as any).description === 'string'
              ? (entity as any).description
              : typeof (entity.data as any)?.description === 'string'
                ? (entity.data as any).description
                : undefined,
            date: calendarData?.date as string | undefined,
            time: calendarData?.time as string | undefined,
            duration: calendarData?.duration ? Number(calendarData.duration) : 60,
            location: calendarData?.location as string | undefined,
            type: calendarData?.type as string | undefined,
            company: calendarData?.company as string | undefined,
            withWhom: calendarData?.withWhom as string | undefined
          })
          
          if (calendarResult.success) {
            results.push({
              domain: 'calendar',
              title: entity.title,
              success: true,
              data: { 
                eventId: calendarResult.eventId, 
                htmlLink: calendarResult.htmlLink,
                savedTo: 'Google Calendar'
              },
              confidence: entity.confidence,
              message: calendarResult.message
            })
            console.log(`✅ [MULTI-ENTRY] Calendar event created: ${entity.title}`)
          } else {
            errors.push({
              domain: 'calendar',
              title: entity.title,
              error: calendarResult.message,
              success: false
            })
          }
          continue // Skip the regular database save
        }
        
        // Normalize entity data to match what the UI expects
        const normalizedData: Record<string, any> = { ...entity.data }
        
        // NUTRITION MEALS: Ensure proper type and logType fields + estimate nutrition
        if (entity.domain === 'nutrition' && (normalizedData.itemType === 'meal' || normalizedData.mealType || normalizedData.food || normalizedData.description)) {
          normalizedData.type = 'meal'
          normalizedData.logType = 'meal'
          const mealName = normalizedData.name || normalizedData.food || normalizedData.description || entity.title?.replace(/\s*\(.*?\)\s*$/, '') || 'Meal'
          normalizedData.name = mealName
          
          // Use client-provided time if available, otherwise fallback to server time
          const userLocalTime = userTime?.localTime || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          const userHour = userTime?.localHour ?? new Date().getHours()
          normalizedData.time = normalizedData.time || userLocalTime
          
          console.log(`🕐 [MULTI-ENTRY] Using hour: ${userHour} (user timezone: ${userTime?.timezone || 'server default'})`)
          
          // Auto-detect meal type based on USER's local time (if provided)
          if (!normalizedData.mealType) {
            if (userHour >= 5 && userHour < 11) normalizedData.mealType = 'Breakfast'
            else if (userHour >= 11 && userHour < 15) normalizedData.mealType = 'Lunch'
            else if (userHour >= 15 && userHour < 22) normalizedData.mealType = 'Dinner'
            else normalizedData.mealType = 'Snack'
            console.log(`🍽️ [MULTI-ENTRY] Auto-detected meal type: ${normalizedData.mealType} (based on user hour ${userHour})`)
          }
          
          delete normalizedData.itemType  // Remove non-standard field
          delete normalizedData.food  // Clean up extraction field
          
          // Check if any nutrition info was provided
          let calories = Number(normalizedData.calories) || 0
          const hasMacros = (Number(normalizedData.protein) > 0 || 
                           Number(normalizedData.carbs) > 0 || 
                           Number(normalizedData.fats) > 0)
          
          // 🔧 FIX: If NO calories AND NO macros provided, estimate FULL nutrition from food name
          if (calories === 0 && !hasMacros && mealName !== 'Meal') {
            console.log(`🧠 [MULTI-ENTRY] No nutrition provided, estimating FULL nutrition for "${mealName}"...`)
            const estimated = await estimateFullNutrition(mealName)
            normalizedData.calories = estimated.calories
            normalizedData.protein = estimated.protein
            normalizedData.carbs = estimated.carbs
            normalizedData.fats = estimated.fats
            normalizedData.fiber = estimated.fiber
            console.log(`✅ [MULTI-ENTRY] Estimated: ${estimated.calories} cal, ${estimated.protein}g P, ${estimated.carbs}g C, ${estimated.fats}g F`)
          } 
          // If calories provided but no macros, estimate macros only
          else if (!hasMacros && calories > 0) {
            console.log(`🧠 [MULTI-ENTRY] Estimating macros for ${mealName} (${calories} cal)...`)
            const estimatedMacros = await estimateMealMacros(mealName, calories)
            normalizedData.calories = calories
            normalizedData.protein = estimatedMacros.protein
            normalizedData.carbs = estimatedMacros.carbs
            normalizedData.fats = estimatedMacros.fats
            normalizedData.fiber = estimatedMacros.fiber
          } 
          // User provided macros, use them
          else {
            normalizedData.calories = calories
            normalizedData.protein = Number(normalizedData.protein) || 0
            normalizedData.carbs = Number(normalizedData.carbs) || 0
            normalizedData.fats = Number(normalizedData.fats) || 0
            normalizedData.fiber = Number(normalizedData.fiber) || 0
          }
          
          console.log(`🥗 [MULTI-ENTRY] Normalized meal data:`, normalizedData)
        }
        
        // NUTRITION WATER: Ensure proper type field
        if (entity.domain === 'nutrition' && normalizedData.itemType === 'water') {
          normalizedData.type = 'water'
          normalizedData.logType = 'water'
          normalizedData.value = Number(normalizedData.water) || Number(normalizedData.value) || 0
          delete normalizedData.itemType
        }
        
        const { data, error } = await supabase
          .from('domain_entries')
          .insert({
            user_id: user.id,
            domain: entity.domain,
            title: entity.title,
            description: entity.description || null,
            metadata: normalizedData,
            person_id: activePersonId, // 🔧 NEW: Include person_id
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          console.error(`❌ [MULTI-ENTRY] Database error for ${entity.domain}:`, error)
          throw error
        }

        results.push({
          domain: entity.domain,
          title: entity.title,
          success: true,
          data,
          confidence: entity.confidence
        })

        console.log(`✅ [MULTI-ENTRY] Saved successfully: ${entity.domain} - ${entity.title}`)
      } catch (err: any) {
        console.error(`❌ [MULTI-ENTRY] Failed to save ${entity.domain}:`, err)
        errors.push({
          domain: entity.domain,
          title: entity.title,
          error: err.message || 'Unknown error',
          success: false
        })
      }
    }

    // STEP 5: Generate confirmation message
    const confirmationMessage = generateConfirmationMessage(results, errors)

    // Include conflicts in response if any
    const conflictMessages = conflicts?.map(c => 
      `⚠️ Could not process: ${c.entity.title} (${c.errors.join(', ')})`
    )

    const finalMessage = [
      confirmationMessage,
      ...(conflictMessages || [])
    ].join('\n')

    console.log(`✅ [MULTI-ENTRY] Completed: ${results.length} saved, ${errors.length} failed`)

    return NextResponse.json({
      success: results.length > 0,
      message: finalMessage,
      results,
      errors: errors.length > 0 ? errors : undefined,
      conflicts,
      requiresConfirmation: extractionResult.requiresConfirmation,
      ambiguities: extractionResult.ambiguities,
      triggerReload: results.length > 0, // Trigger data reload if anything was saved
      extractionResult // Include for debugging
    })

  } catch (error: any) {
    console.error('❌ [MULTI-ENTRY] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process message',
        details: error.stack
      },
      { status: 500 }
    )
  }
}

/**
 * Generate user-friendly confirmation message
 */
function generateConfirmationMessage(results: any[], errors: any[]): string {
  if (results.length === 0 && errors.length === 0) {
    return 'No data was logged.'
  }

  if (results.length === 0 && errors.length > 0) {
    return `❌ Failed to log ${errors.length} ${errors.length === 1 ? 'entry' : 'entries'}. Please try again.`
  }
  
  if (results.length === 1 && errors.length === 0) {
    const r = results[0]
    return `✅ Logged: ${r.title} (${r.domain})`
  }

  // Multiple results
  const messages = results.map(r => `  • ${r.title} (${r.domain})`)
  
  let message = `✅ Successfully logged ${results.length} ${results.length === 1 ? 'entry' : 'entries'}:\n${messages.join('\n')}`
  
  if (errors.length > 0) {
    message += `\n\n❌ Failed to log ${errors.length} ${errors.length === 1 ? 'entry' : 'entries'}`
  }

  return message
}
















