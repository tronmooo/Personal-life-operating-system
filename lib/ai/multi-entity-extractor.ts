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
 * Multi-Entity Extraction using GPT-4
 * Extracts ALL data points from natural language input
 */
export async function extractMultipleEntities(
  input: string,
  userContext?: UserContext
): Promise<MultiEntityResult> {
  
  const systemPrompt = `You are a MULTI-ENTITY DATA EXTRACTOR for a comprehensive life management app.

**YOUR PRIMARY JOB:** Extract EVERY piece of data from the user's input and route each to the correct domain.

**SPECIAL HANDLING - CALENDAR EVENTS:**
- **Interviews, meetings, appointments, plans, events, reminders** → route to "calendar" domain
- These should NOT go to "relationships" or other domains
- Include date, time, title, and any relevant details

**ALL 14 DOMAINS:**
1. **calendar** - interviews, meetings, appointments, plans, events, reminders, scheduled activities
2. **financial** - expenses, income, accounts, budgets, bills, transactions
3. **health** - medical records, doctor appointments (non-scheduled), medications, symptoms, weight, blood pressure
4. **insurance** - policies, claims, documents, contracts, legal documents
5. **home** - maintenance, repairs, projects, properties, service providers
6. **vehicles** - maintenance, mileage, fuel, repairs, oil changes
7. **appliances** - assets, warranties, maintenance schedules
8. **pets** - health records, vet visits, weight, vaccinations, feeding
9. **relationships** - contacts, birthdays, anniversaries, interactions (NOT interviews or meetings!)
10. **digital** - subscriptions, accounts, passwords, services
11. **mindfulness** - meditation, mood, journaling, stress tracking
12. **fitness** - workouts, exercises, activities, duration, calories
13. **nutrition** - meals, calories, water intake, macros
14. **miscellaneous** - boats, jewelry, collectibles, other valuable assets

**IMPORTANT ROUTING RULES:**
- "interview at Amazon" → calendar (NOT relationships)
- "meeting with John" → calendar (NOT relationships)
- "appointment tomorrow" → calendar
- "plan to visit Mom" → calendar
- "reminder for dentist" → calendar
- "Mom's birthday is March 5" → relationships (this is storing contact info, not scheduling)
- "spent $50 at lunch with coworker" → financial (expense, not relationship)

**EXTRACTION RULES:**
1. Extract EVERY distinct data point (don't skip any!)
2. Each data point gets its own entity object
3. Match entity to MOST SPECIFIC domain
4. Include confidence score (0-100)
5. Extract ALL relevant metadata fields for each domain
6. Use current timestamp if not specified
7. Infer missing details intelligently

**METADATA EXTRACTION BY DOMAIN:**

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

**EXAMPLES:**

Input: "my dog weighs 175 pounds and i drank 20 oz water"
Output:
{
  "entities": [
    {
      "domain": "pets",
      "confidence": 95,
      "title": "Dog weight check",
      "data": {
        "type": "health_record",
        "petName": "dog",
        "species": "Dog",
        "weight": "175",
        "date": "${new Date().toISOString()}"
      },
      "rawText": "my dog weighs 175 pounds"
    },
    {
      "domain": "nutrition",
      "confidence": 98,
      "title": "Water intake",
      "data": {
        "type": "water",
        "logType": "water",
        "water": 20,
        "value": 20,
        "date": "${new Date().toISOString()}"
      },
      "rawText": "i drank 20 oz water"
    }
  ],
  "originalInput": "my dog weighs 175 pounds and i drank 20 oz water",
  "timestamp": "${new Date().toISOString()}",
  "requiresConfirmation": false
}

Input: "spent $45 on groceries, walked 30 minutes, car needs oil change"
Output:
{
  "entities": [
    {
      "domain": "financial",
      "confidence": 95,
      "title": "Grocery expense",
      "data": {
        "type": "expense",
        "amount": "45",
        "category": "groceries",
        "description": "groceries",
        "transactionDate": "${new Date().toISOString()}"
      },
      "rawText": "spent $45 on groceries"
    },
    {
      "domain": "fitness",
      "confidence": 92,
      "title": "Walking workout",
      "data": {
        "activityType": "Walking",
        "duration": "30",
        "date": "${new Date().toISOString()}"
      },
      "rawText": "walked 30 minutes"
    },
    {
      "domain": "vehicles",
      "confidence": 85,
      "title": "Oil change needed",
      "description": "Car needs oil change",
      "data": {
        "type": "maintenance",
        "serviceType": "Oil Change",
        "status": "Pending",
        "needsService": true,
        "date": "${new Date().toISOString()}"
      },
      "rawText": "car needs oil change"
    }
  ],
  "originalInput": "spent $45 on groceries, walked 30 minutes, car needs oil change",
  "timestamp": "${new Date().toISOString()}",
  "requiresConfirmation": false
}

Input: "Max had vet appointment $150, need to buy dog food"
Output:
{
  "entities": [
    {
      "domain": "pets",
      "confidence": 95,
      "title": "Vet appointment - Max",
      "data": {
        "petName": "Max",
        "type": "vet_visit",
        "cost": "150",
        "date": "${new Date().toISOString()}"
      },
      "rawText": "Max had vet appointment $150"
    },
    {
      "domain": "financial",
      "confidence": 88,
      "title": "Vet expense",
      "data": {
        "type": "expense",
        "amount": "150",
        "category": "pet care",
        "description": "vet appointment for Max",
        "transactionDate": "${new Date().toISOString()}"
      },
      "rawText": "Max had vet appointment $150"
    }
  ],
  "originalInput": "Max had vet appointment $150, need to buy dog food",
  "timestamp": "${new Date().toISOString()}",
  "requiresConfirmation": false
}

Input: "ran 5 miles in 45 minutes, blood pressure 120/80, ate chicken salad 450 calories"
Output:
{
  "entities": [
    {
      "domain": "fitness",
      "confidence": 95,
      "title": "Running workout",
      "data": {
        "activityType": "Running",
        "duration": "45",
        "distance": "5",
        "date": "${new Date().toISOString()}"
      },
      "rawText": "ran 5 miles in 45 minutes"
    },
    {
      "domain": "health",
      "confidence": 98,
      "title": "Blood pressure reading",
      "data": {
        "recordType": "blood_pressure",
        "systolic": "120",
        "diastolic": "80",
        "date": "${new Date().toISOString()}"
      },
      "rawText": "blood pressure 120/80"
    },
    {
      "domain": "nutrition",
      "confidence": 92,
      "title": "Chicken salad meal",
      "data": {
        "type": "meal",
        "logType": "meal",
        "name": "Chicken salad",
        "mealType": "Lunch",
        "description": "chicken salad",
        "calories": 450,
        "time": "${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}",
        "date": "${new Date().toISOString()}"
      },
      "rawText": "ate chicken salad 450 calories"
    }
  ],
  "originalInput": "ran 5 miles in 45 minutes, blood pressure 120/80, ate chicken salad 450 calories",
  "timestamp": "${new Date().toISOString()}",
  "requiresConfirmation": false
}

Input: "I have an interview at Amazon tomorrow at 4:30 PM"
Output:
{
  "entities": [
    {
      "domain": "calendar",
      "confidence": 98,
      "title": "Interview with Amazon",
      "data": {
        "type": "interview",
        "company": "Amazon",
        "date": "tomorrow",
        "time": "4:30 PM",
        "duration": 60,
        "description": "Job interview at Amazon"
      },
      "rawText": "interview at Amazon tomorrow at 4:30 PM"
    }
  ],
  "originalInput": "I have an interview at Amazon tomorrow at 4:30 PM",
  "timestamp": "${new Date().toISOString()}",
  "requiresConfirmation": false
}

Input: "meeting with John at 2pm, spent $45 on lunch"
Output:
{
  "entities": [
    {
      "domain": "calendar",
      "confidence": 95,
      "title": "Meeting with John",
      "data": {
        "type": "meeting",
        "withWhom": "John",
        "time": "2:00 PM",
        "duration": 60,
        "date": "${new Date().toISOString().split('T')[0]}"
      },
      "rawText": "meeting with John at 2pm"
    },
    {
      "domain": "financial",
      "confidence": 95,
      "title": "Lunch expense",
      "data": {
        "type": "expense",
        "amount": "45",
        "category": "food",
        "description": "lunch",
        "transactionDate": "${new Date().toISOString()}"
      },
      "rawText": "spent $45 on lunch"
    }
  ],
  "originalInput": "meeting with John at 2pm, spent $45 on lunch",
  "timestamp": "${new Date().toISOString()}",
  "requiresConfirmation": false
}

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

  const openAIKey = process.env.OPENAI_API_KEY
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAIKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt + contextPrompt },
        { role: 'user', content: input }
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  const resultText = data.choices[0].message.content
  
  console.log('🤖 [MULTI-ENTITY] Raw AI response:', resultText)
  
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
















