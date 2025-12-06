import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import { randomUUID } from 'crypto'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    console.log('🖼️ [IMAGE ANALYSIS] Starting analysis for user:', user.id)

    // Use GPT-4 Vision to analyze the image
    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that analyzes images and extracts structured data for a life management app with 21 domains:
          
**21 DOMAINS:**
1. health - weight, blood pressure, heart rate, temperature, sleep, steps, mood, medications, symptoms
2. fitness - workouts, running, cycling, sports, exercises with duration/distance
3. financial - expenses, income, bills, purchases, receipts
4. nutrition - meals, food, calories, water intake, macros
5. vehicles - mileage, fuel, maintenance, repairs, oil changes
6. property - home value, mortgage, property tax
7. home - utility bills, repairs, maintenance, appliances
8. appliances - appliance purchases, warranty, repairs
9. pets - pet food, vet visits, medications, grooming
10. mindfulness - meditation, journaling, mood tracking
11. relationships - contacts, birthdays, gifts
12. career - salary, promotions, work hours, certifications
13. education - courses, grades, tuition, study time
14. legal - contracts, licenses, legal fees
15. insurance - premiums, claims, coverage
16. travel - flights, hotels, passport, miles
17. hobbies - music, art, reading, equipment
18. collectibles - purchases, valuations
19. digital-life - subscriptions, domains, cloud storage
20. tasks - to-do items, task completion
21. goals - goal setting, progress, milestones

**YOUR JOB:**
1. Analyze the image and identify what type of data it contains
2. Extract ALL relevant information (amounts, dates, items, etc.)
3. Return structured JSON with:
   - domain: which of the 21 domains this belongs to
   - type: specific type (e.g., "receipt", "scale_reading", "odometer", "food", "medication")
   - data: extracted key-value pairs
   - description: brief description of what you see
   - confidence: your confidence level (high/medium/low)

**EXAMPLES:**

Receipt/Bill → financial domain:
{
  "domain": "financial",
  "type": "receipt",
  "data": {
    "amount": 45.50,
    "merchant": "Whole Foods",
    "category": "groceries",
    "date": "2024-10-18"
  },
  "description": "Receipt from Whole Foods for groceries",
  "confidence": "high"
}

Scale Reading → health domain:
{
  "domain": "health",
  "type": "weight",
  "data": {
    "weight": 175.5,
    "unit": "lbs"
  },
  "description": "Scale showing weight reading",
  "confidence": "high"
}

Odometer → vehicles domain:
{
  "domain": "vehicles",
  "type": "mileage",
  "data": {
    "mileage": 50234,
    "unit": "miles"
  },
  "description": "Car odometer reading",
  "confidence": "high"
}

Food/Meal → nutrition domain:
{
  "domain": "nutrition",
  "type": "meal",
  "data": {
    "name": "Grilled chicken with vegetables",
    "description": "Grilled chicken with vegetables",
    "calories": 450,
    "mealType": "Lunch"
  },
  "description": "Photo of a meal",
  "confidence": "medium"
}

Medication Bottle → health domain:
{
  "domain": "health",
  "type": "medication",
  "data": {
    "name": "Ibuprofen",
    "dosage": "200mg",
    "quantity": 100
  },
  "description": "Medication bottle label",
  "confidence": "high"
}

Gas Station Sign → financial/vehicles domain:
{
  "domain": "vehicles",
  "type": "fuel_price",
  "data": {
    "pricePerGallon": 3.89,
    "grade": "Regular"
  },
  "description": "Gas station price sign",
  "confidence": "high"
}

**RESPONSE FORMAT:**
Return ONLY valid JSON with no additional text. Be as specific as possible with extracted data.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and extract structured data in the JSON format specified.'
            },
            {
              type: 'image_url',
              image_url: {
                url: image
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    })

    const analysisText = visionResponse.choices[0].message.content || '{}'
    console.log('🤖 [GPT-4 VISION] Raw response:', analysisText)

    // Parse the JSON response
    let analysisData
    try {
      // Remove markdown code blocks if present
      const jsonText = analysisText.replace(/```json\n?|\n?```/g, '').trim()
      analysisData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('❌ [JSON PARSE ERROR]:', parseError)
      throw new Error('Failed to parse AI response')
    }

    console.log('📊 [EXTRACTED DATA]:', JSON.stringify(analysisData, null, 2))

    // Validate that we have the required fields
    if (!analysisData.domain || !analysisData.data) {
      throw new Error('Invalid analysis data structure')
    }

    // Now save the data to the correct domain using the same logic as voice commands
    const savedData = await saveImageDataToSupabase(
      supabase,
      user.id,
      analysisData.domain,
      analysisData.type,
      analysisData.data
    )

    // Generate confirmation message
    let confirmationMessage = ''
    if (analysisData.domain === 'financial' && analysisData.data.amount) {
      confirmationMessage = `✅ Logged expense: $${analysisData.data.amount}${analysisData.data.merchant ? ` at ${analysisData.data.merchant}` : ''} in Financial domain`
    } else if (analysisData.domain === 'health' && analysisData.data.weight) {
      confirmationMessage = `✅ Logged weight: ${analysisData.data.weight} ${analysisData.data.unit || 'lbs'} in Health domain`
    } else if (analysisData.domain === 'vehicles' && analysisData.data.mileage) {
      confirmationMessage = `✅ Logged mileage: ${analysisData.data.mileage.toLocaleString()} ${analysisData.data.unit || 'miles'} in Vehicles domain`
    } else if (analysisData.domain === 'nutrition') {
      confirmationMessage = `✅ Logged ${analysisData.type || 'nutrition entry'} in Nutrition domain`
    } else {
      confirmationMessage = `✅ Logged ${analysisData.description || 'data'} in ${analysisData.domain.charAt(0).toUpperCase() + analysisData.domain.slice(1)} domain`
    }

    return NextResponse.json({
      success: true,
      data: {
        ...analysisData,
        confirmationMessage
      },
      message: `🔍 **Image Analysis:**\n${analysisData.description}\n\n${confirmationMessage}`
    })

  } catch (error: any) {
    console.error('❌ [IMAGE ANALYSIS ERROR]:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to analyze image' 
      },
      { status: 500 }
    )
  }
}

// Save image data to Supabase in the same format as voice commands
async function saveImageDataToSupabase(
  supabase: any,
  userId: string,
  domain: string,
  type: string,
  data: any
) {
  console.log(`💾 [SAVE IMAGE DATA] Domain: ${domain}, Type: ${type}`)
  
  try {
    const now = new Date().toISOString()

    // Generate smart title based on domain and type (normalized rows)
    let title = type || 'Entry'
    if (domain === 'financial' && data.amount) {
      title = `$${data.amount}${data.merchant ? ' - ' + data.merchant : ''}${data.category ? ' (' + data.category + ')' : ''}`
    } else if (domain === 'health' && data.weight) {
      title = `${data.weight} ${data.unit || 'lbs'}`
    } else if (domain === 'vehicles' && data.mileage) {
      title = `Mileage: ${data.mileage.toLocaleString()} ${data.unit || 'miles'}`
    } else if (domain === 'vehicles' && data.pricePerGallon) {
      title = `Gas: $${data.pricePerGallon}/gal`
    } else if (domain === 'nutrition' && data.description) {
      title = `${data.description}${data.calories ? ' (' + data.calories + ' cal)' : ''}`
    } else if (domain === 'health' && data.name) {
      title = `${data.name}${data.dosage ? ' ' + data.dosage : ''}`
    }

    // For nutrition meals, ensure name field is set (UI expects metadata.name)
    if (domain === 'nutrition' && type === 'meal' && !data.name && data.description) {
      data.name = data.description
    }

    // Insert normalized domain_entries row
    const { data: inserted, error: insertError } = await supabase
      .from('domain_entries')
      .insert({
        user_id: userId,
        domain,
        title,
        description: data.description || data.merchant || data.notes || '',
        metadata: { 
          ...data, 
          type, 
          logType: type === 'meal' ? 'meal' : undefined,  // Add logType for meals
          source: 'image_scan', 
          timestamp: now 
        },
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      throw insertError
    }

    console.log(`✅ [SAVE SUCCESS] Saved image data to domain_entries (${domain})!`)
    return inserted

  } catch (error: any) {
    console.error(`❌ [SAVE FAILED] Error saving to Supabase:`, error)
    throw error
  }
}


