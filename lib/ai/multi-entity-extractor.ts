import { Domain } from '@/types/domains'
import { DomainMetadataMap } from '@/types/domain-metadata'

export interface ExtractedEntity {
  domain: Domain
  confidence: number
  data: Partial<DomainMetadataMap[Domain]>
  rawText: string
  title: string
  description?: string
}

export interface MultiEntityResult {
  entities: ExtractedEntity[]
  originalInput: string
  timestamp: string
  requiresConfirmation: boolean
  ambiguities?: string[]
}

export interface UserContext {
  recentEntries?: any[]
  preferences?: {
    defaultPetName?: string
    defaultVehicle?: string
    defaultHome?: string
  }
  domains?: Domain[]
}

/**
 * Multi-Entity Extraction using GPT-4 (with Gemini fallback)
 * Extracts ALL data points from natural language input
 */
export async function extractMultipleEntities(
  input: string,
  userContext?: UserContext
): Promise<MultiEntityResult> {
  
  // Get current date/time for accurate timestamps
  const currentDate = new Date()
  const currentISODate = currentDate.toISOString()
  const currentDateOnly = currentISODate.split('T')[0]
  const currentTime = currentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  
  const systemPrompt = `You are a MULTI-ENTITY DATA EXTRACTOR for a comprehensive life management app.

**🚨 CRITICAL - READ THE USER'S ACTUAL INPUT AND EXTRACT EXACT VALUES:**
- You MUST extract the EXACT numbers, names, and values from what the user says
- DO NOT use values from examples - examples are just for structure/format reference
- If user says "175 pounds" → extract 175, NOT any other number
- If user says "42 minutes" → extract 42, NOT any other number  
- If user says "eggs and toast" → extract "eggs and toast", NOT "chicken salad"
- If user says "118/76" → extract 118/76, NOT 120/80

**CURRENT DATE/TIME FOR ALL ENTRIES:**
- Use this exact timestamp for dates: ${currentISODate}
- Use this date-only value: ${currentDateOnly}
- Use this time value: ${currentTime}

**YOUR PRIMARY JOB:** Extract EVERY piece of data from the user's input and route each to the correct domain.

**SPECIAL HANDLING - CALENDAR EVENTS:**
- **Interviews, meetings, appointments, plans, events, reminders** → route to "calendar" domain
- These should NOT go to "relationships" or other domains
- Include date, time, title, and any relevant details

**ALL 15 DOMAINS:**
1. **calendar** - interviews, meetings, appointments, plans, events, reminders, scheduled activities
2. **tasks** - todo items, tasks to complete, reminders, things to do, action items
3. **financial** - expenses, income, accounts, budgets, bills, transactions
4. **health** - medical records, doctor appointments (non-scheduled), medications, symptoms, weight, blood pressure
5. **insurance** - policies, claims, documents, contracts, legal documents
6. **home** - maintenance, repairs, projects, properties, service providers
7. **vehicles** - maintenance, mileage, fuel, repairs, oil changes
8. **appliances** - assets, warranties, maintenance schedules
9. **pets** - health records, vet visits, weight, vaccinations, feeding
10. **relationships** - contacts, birthdays, anniversaries, interactions (NOT interviews or meetings!)
11. **digital** - subscriptions, accounts, passwords, services
12. **mindfulness** - meditation, mood, journal entries, stress tracking, emotional venting, feelings
13. **fitness** - workouts, exercises, activities, duration, calories
14. **nutrition** - meals, calories, water intake, macros
15. **miscellaneous** - boats, jewelry, collectibles, other valuable assets

**🚨 RETRIEVAL COMMANDS - DO NOT EXTRACT:**
- "retrieve", "pull up", "show me", "get my", "find my" → These are QUERIES, not data to create
- Return entities with domain: "retrieval" and the search terms in data.searchTerms
- Example: "retrieve my membership card" → { domain: "retrieval", data: { searchTerms: ["membership card"] } }

**IMPORTANT - MINDFULNESS DOMAIN:**
- Emotional statements like "I'm pissed off", "I feel lonely", "I'm depressed", "I don't know what to do" → mindfulness (journal entry)
- Any expression of feelings, venting, emotional processing → mindfulness (journal entry)
- Must use type: "journal" and logType: "journal-entry" (NOT "journaling" or "entry")

**IMPORTANT ROUTING RULES:**
- "interview at Amazon" → calendar (NOT relationships)
- "meeting with John" → calendar (NOT relationships)
- "appointment tomorrow" → calendar
- "plan to visit Mom" → calendar
- "reminder for dentist" → calendar
- "Mom's birthday is March 5" → relationships (this is storing contact info, not scheduling)
- "spent $50 at lunch with coworker" → financial (expense, not relationship)
- "add task to buy groceries" → tasks (NOT miscellaneous)
- "task: call mom" → tasks
- "todo: pick up prescription" → tasks
- "remind me to pay rent" → tasks
- "retrieve my membership card" → retrieval (this is a SEARCH, not data to create)
- "pull up my insurance" → retrieval (this is a SEARCH, not data to create)
- "get my ID" → retrieval (this is a SEARCH, not data to create)

**EXTRACTION RULES:**
1. Extract EVERY distinct data point (don't skip any!)
2. Each data point gets its own entity object
3. Match entity to MOST SPECIFIC domain
4. Include confidence score (0-100)
5. Extract ALL relevant metadata fields for each domain
6. Use current timestamp if not specified
7. Infer missing details intelligently

**METADATA EXTRACTION BY DOMAIN:**

**tasks domain:** (for todo items, tasks, action items)
- title: the task description (required)
- priority: "low", "medium", "high" (default: "medium")
- dueDate: ISO date if mentioned
- description: additional details
- category: inferred category if clear

**retrieval domain:** (for document/data searches - NOT actual data creation!)
- searchTerms: array of search terms extracted from the request
- domain: optional domain to filter by (if mentioned like "insurance" or "vehicles")
- type: type of document/data being requested

**calendar domain:** (for interviews, meetings, appointments, plans)
- type: "interview", "meeting", "appointment", "plan", "event", "reminder"
- title: descriptive title (e.g., "Interview with Amazon", "Meeting with John")
- date: ISO date string or relative (e.g., "tomorrow", "next week")
- time: time string (e.g., "2:30 PM", "14:00")
- duration: minutes (default 60)
- location: if mentioned
- description: any additional details
- company: for interviews
- withWhom: for meetings

**pets domain:**
- petName, species (Dog/Cat/Bird/etc), breed, weight, age, vetName
- type: "health_record", "vet_visit", "vaccination", "feeding"
- Look for: dog/cat/bird names, weight measurements, vet appointments

**nutrition domain:**
- type: "water", "meal", "snack"
- logType: same as type (e.g. "meal", "water")
- name: name of the food/meal (for meals only)
- water (in ounces for water entries)
- calories (number), protein (number), carbs (number), fats (number)
- mealType: "Breakfast", "Lunch", "Dinner", "Snack"
- time: current time formatted as "3:45 PM"
- date: ISO timestamp

**health domain:**
- recordType: "weight", "blood_pressure", "medication", "symptom"
- weight (lbs), heartRate (bpm), systolic, diastolic, temperature
- Look for: "I weigh", "blood pressure", "took medication"

**fitness domain:**
- activityType: "Running", "Cycling", "Walking", "Strength Training", "Yoga", "Swimming", "Other"
- duration (minutes), distance (miles), calories, steps
- exercises, notes

**financial domain:**
- type: "expense", "income", "bill", "transfer"
- amount (number), category, description, date
- transactionType, accountType

**vehicles domain:**
- type: "maintenance", "cost", "fuel", "mileage"
- mileage, serviceType ("Oil Change", "Tire Rotation", "Repair"), cost, date
- make, model, needsService (boolean)

**home domain:**
- itemType: "Maintenance Task", "Asset/Warranty", "Project", "Property", "Service Provider"
- category: "HVAC", "Plumbing", "Electrical", "Appliances", etc.
- status: "Pending", "In Progress", "Completed"
- cost, dueDate, priority

**appliances domain:**
- name, brand, model, serialNumber
- value, purchaseDate, purchasePrice
- warrantyExpiry, warrantyType
- condition: "Excellent", "Good", "Fair", "Needs Repair"

**relationships domain:**
- name, relationshipType: "Family", "Partner/Spouse", "Close Friend", "Friend", "Colleague"
- birthday, anniversaryDate, email, phone
- lastContact, frequency

**mindfulness domain:** (CRITICAL - use exact field names!)
- type: MUST be "journal" (NOT "journaling")
- logType: MUST be "journal-entry" (NOT "entry")
- entryType: "Journal"
- fullContent: the FULL journal text/content (NOT "entry" or "content")
- wordCount: number of words in the journal entry
- date: ISO timestamp
- mood: extracted mood keywords if present (e.g., "angry", "sad", "anxious")
- EXAMPLES of journal-worthy input:
  - "I'm pissed off" → journal entry
  - "I don't know what to do" → journal entry
  - "I'm feeling lonely and depressed" → journal entry
  - Any emotional venting or feeling expression → journal entry

**FORMAT EXAMPLES (for structure reference ONLY - use USER'S actual values, not example values!):**

🚨 REMEMBER: These show FORMAT only - extract actual values from user input!

Example showing fitness + nutrition format:
- If user says "ran 5 miles 45 min" → domain: fitness, duration: "45", distance: "5"
- If user says "ate pizza 600 cal" → domain: nutrition, name: "pizza", calories: 600

Example JSON structure for multi-entity:
{
  "entities": [
    { "domain": "[from user input]", "confidence": 95, "title": "[from user input]", "data": { ... }, "rawText": "[exact quote from user]" }
  ],
  "originalInput": "[user's full input]",
  "timestamp": "${currentISODate}",
  "requiresConfirmation": false
}

**DOMAIN ROUTING EXAMPLES (format reference only):**
- Calendar events: { domain: "calendar", data: { type: "meeting/interview", date: "[from user]", time: "[from user]" } }
- Financial: { domain: "financial", data: { type: "expense", amount: "[from user]", category: "[inferred]" } }
- Mindfulness/emotional: { domain: "mindfulness", data: { type: "journal", logType: "journal-entry", fullContent: "[user's exact words]" } }

**CRITICAL RULES:**
- Extract ALL entities (don't miss any!)
- Each entity must have domain, confidence, title, data, rawText
- Use proper metadata fields for each domain (match DomainMetadataMap interface)
- Set requiresConfirmation=true if confidence < 75 for ANY entity
- Include ambiguities array if interpretation unclear
- Store numbers as strings in data (e.g., "175" not 175) for metadata compatibility
- ALWAYS return valid JSON matching the MultiEntityResult interface
- Never skip entities - if in doubt, include it with lower confidence

Return ONLY valid JSON matching the MultiEntityResult interface. No other text.`

  const contextPrompt = userContext?.preferences ? `

**USER CONTEXT:**
- Default pet: ${userContext.preferences.defaultPetName || 'Unknown'}
- Default vehicle: ${userContext.preferences.defaultVehicle || 'Unknown'}
Use these defaults when user doesn't specify names.` : ''

  const extractionReminder = `

🚨 FINAL REMINDER - EXTRACT EXACT VALUES FROM USER INPUT:
- READ the user's message carefully
- Extract the EXACT numbers they say (not example numbers)
- Extract the EXACT food/activity names they mention
- Use today's date: ${currentDateOnly}
- Use current timestamp: ${currentISODate}
- Use current time: ${currentTime}
- If user says "175" → use 175, if user says "42" → use 42
- NEVER substitute example values for user values`

  const openAIKey = process.env.OPENAI_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  
  console.log('🔑 [MULTI-ENTITY] API keys status:', {
    openai: openAIKey ? 'configured' : 'missing',
    gemini: geminiKey ? 'configured' : 'missing'
  })
  
  if (!openAIKey && !geminiKey) {
    throw new Error('Neither OpenAI nor Gemini API key is configured')
  }

  let resultText: string | null = null
  let aiSource = 'unknown'
  let openAIError: string | null = null
  
  // Try Gemini FIRST if available (more reliable when OpenAI has quota issues)
  if (geminiKey) {
    try {
      console.log('🤖 [MULTI-ENTITY] Trying Gemini first...')
      console.log('🎯 [MULTI-ENTITY] User input to extract from:', input)
      const geminiPrompt = `${systemPrompt}${contextPrompt}${extractionReminder}

**USER'S ACTUAL INPUT TO EXTRACT FROM (use ONLY these values):**
"${input}"

Extract the EXACT values from the user's input above. Return ONLY valid JSON matching the MultiEntityResult interface. No markdown, no code blocks, just raw JSON.`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: geminiPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 3000,
            }
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (content) {
          // Clean up Gemini response - it sometimes wraps in markdown code blocks
          resultText = content
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim()
          aiSource = 'gemini'
          console.log('✅ [MULTI-ENTITY] Gemini response received')
        }
      } else {
        const error = await response.text()
        console.warn(`⚠️ [MULTI-ENTITY] Gemini failed (${response.status}): ${error.substring(0, 200)}`)
      }
    } catch (geminiError: any) {
      console.warn('⚠️ [MULTI-ENTITY] Gemini error:', geminiError.message)
    }
  }
  
  // Fallback to OpenAI if Gemini failed or isn't available
  if (!resultText && openAIKey) {
    try {
      console.log('🤖 [MULTI-ENTITY] Trying OpenAI as fallback...')
      console.log('🎯 [MULTI-ENTITY] User input to extract from:', input)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Use gpt-4o-mini for better rate limits
          messages: [
            { role: 'system', content: systemPrompt + contextPrompt + extractionReminder },
            { role: 'user', content: `**USER'S ACTUAL INPUT TO EXTRACT FROM (use ONLY these values):**\n"${input}"\n\nExtract the EXACT values from this input.` }
          ],
          temperature: 0.1, // Lower temperature for more precise extraction
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        })
      })

      if (response.ok) {
        const data = await response.json()
        resultText = data.choices[0].message.content
        aiSource = 'openai'
        console.log('✅ [MULTI-ENTITY] OpenAI response received')
      } else {
        const error = await response.text()
        openAIError = error.substring(0, 200)
        console.warn(`⚠️ [MULTI-ENTITY] OpenAI failed (${response.status}): ${openAIError}`)
        
        // Check for quota error specifically
        if (response.status === 429 || error.includes('quota') || error.includes('insufficient_quota')) {
          console.error('❌ [MULTI-ENTITY] OpenAI quota exceeded! Consider adding credits or using Gemini.')
        }
      }
    } catch (openaiError: any) {
      console.warn('⚠️ [MULTI-ENTITY] OpenAI error:', openaiError.message)
      openAIError = openaiError.message
    }
  }
  
  // If both failed, throw detailed error
  if (!resultText) {
    const errorDetails = []
    if (!geminiKey) errorDetails.push('Gemini API key not configured')
    else errorDetails.push('Gemini API call failed')
    if (!openAIKey) errorDetails.push('OpenAI API key not configured')
    else if (openAIError) errorDetails.push(`OpenAI error: ${openAIError}`)
    else errorDetails.push('OpenAI API call failed')
    
    throw new Error(`Both AI providers failed. ${errorDetails.join('; ')}. Please check your API keys and quotas.`)
  }
  
  console.log(`🤖 [MULTI-ENTITY] Raw AI response (${aiSource}):`, resultText.substring(0, 500))
  
  // Parse JSON response
  let result: MultiEntityResult
  try {
    result = JSON.parse(resultText)
  } catch (parseError) {
    console.error('❌ [MULTI-ENTITY] Failed to parse JSON:', resultText)
    throw new Error('Failed to parse AI response as JSON')
  }
  
  // Validate structure
  if (!result.entities || !Array.isArray(result.entities)) {
    throw new Error('Invalid response structure: missing entities array')
  }

  // Filter low confidence entities
  result.entities = result.entities.filter(e => e.confidence >= 50)
  
  // Ensure all entities have required fields
  result.entities = result.entities.filter(e => 
    e.domain && e.title && e.data && e.rawText
  )

  console.log(`✅ [MULTI-ENTITY] Extracted ${result.entities.length} entities`)
  
  return result
}
















