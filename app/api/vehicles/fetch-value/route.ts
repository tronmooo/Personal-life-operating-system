import { NextRequest, NextResponse } from 'next/server'
import * as AI from '@/lib/services/ai-service'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore errors in Server Components
            }
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    const { 
      year, 
      make, 
      model, 
      mileage, 
      condition, 
      trim,
      drivetrain,
      exteriorColor,
      interiorColor,
      features,
      location,
      zipCode,
      certifiedPreOwned
    } = await request.json()

    if (!year || !make || !model) {
      return NextResponse.json(
        { error: 'Missing required fields: year, make, model' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'AI valuation is not available. The app administrator needs to configure GEMINI_API_KEY or OPENAI_API_KEY in the deployment environment variables.',
          suggestion: 'You can still add your vehicle manually by entering an estimated value yourself.'
        },
        { status: 503 }
      )
    }

    console.log(`🚗 Fetching real-time value for: ${year} ${make} ${model}${trim ? ` ${trim}` : ''}`)
    if (drivetrain) console.log(`   Drivetrain: ${drivetrain}`)
    if (location) console.log(`   Location: ${location}`)
    
    // Build comprehensive search query
    const searchQuery = `${year} ${make} ${model}${trim ? ` ${trim}` : ''}${drivetrain ? ` ${drivetrain}` : ''} current market value KBB Edmunds ${mileage ? mileage + ' miles' : ''} ${condition || 'good condition'} ${location || ''} 2025`
    
    console.log(`🔍 Web search query: ${searchQuery}`)

    const prompt = `You are a vehicle valuation expert with access to current market data. Research the ACTUAL current market value for this vehicle using real-time pricing data from sources like KBB, Edmunds, NADA, CarGurus, and Autotrader.

Vehicle Details:
- Year: ${year}
- Make: ${make}
- Model: ${model}
${trim ? `- Trim Level: ${trim}` : ''}
${drivetrain ? `- Drivetrain: ${drivetrain} (AWD typically adds $1,500-$3,000 value)` : ''}
${mileage ? `- Mileage: ${mileage} miles` : ''}
- Condition: ${condition || 'Good'}
${exteriorColor ? `- Exterior Color: ${exteriorColor}` : ''}
${interiorColor ? `- Interior Color: ${interiorColor}` : ''}
${features ? `- Features: ${features}` : ''}
${location ? `- Location: ${location} (prices vary by region)` : ''}
${zipCode ? `- ZIP Code: ${zipCode}` : ''}
${certifiedPreOwned ? `- Certified Pre-Owned: YES (adds 5-10% value)` : ''}

CRITICAL FACTORS TO CONSIDER:
1. **Trim Level Impact**: Higher trims (EX-L, Touring, Limited, etc.) command 10-30% premium over base models
2. **Drivetrain**: AWD adds $1,500-$3,000 over FWD in most cases
3. **Regional Pricing**: ${location ? `Account for ${location} market conditions` : 'Consider national average with regional variance'}
4. **Mileage**: Significant factor - compare to average 12,000 miles/year
5. **Condition**: ${condition || 'Good'} affects value significantly
6. **Features**: Premium features (navigation, sunroof, leather) add value
7. **CPO Status**: ${certifiedPreOwned ? 'CPO adds warranty value' : 'Non-CPO pricing'}
8. **Current Market**: Consider 2025 supply/demand dynamics

IMPORTANT: 
- Search for REAL current market prices from KBB, Edmunds, NADA
- Use actual 2025 market data, not generic estimates
- Account for ALL provided factors in valuation
- Show price RANGE to reflect trim/feature variations

Respond with valid JSON in this exact format:
{
  "estimatedValue": <market value for THIS specific configuration>,
  "valueLow": <lowest for base trim/features>,
  "valueHigh": <highest for premium trim/features>,
  "tradeInValue": <dealer trade-in offer>,
  "privatePartyValue": <selling to individual>,
  "dealerRetailValue": <dealer asking price>,
  "confidence": "high/medium/low",
  "marketTrend": "increasing/stable/decreasing",
  "analysis": "<3-4 sentence analysis mentioning trim, drivetrain, location impact, and sources>",
  "depreciationRate": "<annual percentage>",
  "dataSource": "<specific sources: KBB, Edmunds, etc>",
  "regionalNote": "<how location affects price>",
  "trimImpact": "<how trim level affects value>",
  "drivetrainImpact": "${drivetrain ? 'Price adjustment for ' + drivetrain : 'N/A'}",
  "lastUpdated": "${new Date().toISOString()}"
}

Base your estimate on REAL market data accounting for ALL factors.`

    const aiResponse = await AI.requestAI({
      prompt,
      systemPrompt: 'You are a professional vehicle appraiser with real-time access to market data from KBB, Edmunds, NADA, and other automotive pricing sources. Always provide accurate, data-backed valuations. Respond with valid JSON only.',
      temperature: 0.3,
      maxTokens: 800
    })

    const responseText = aiResponse.content?.trim() || ''
    
    console.log(`📊 AI Response preview: ${responseText.substring(0, 200)}...`)
    
    // Parse the JSON response
    let valuation
    try {
      // Remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      valuation = JSON.parse(cleanedText)
      
      console.log(`✅ Valuation retrieved:`, {
        estimatedValue: valuation.estimatedValue,
        source: valuation.dataSource || 'AI estimate',
        confidence: valuation.confidence
      })
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', responseText)
      return NextResponse.json(
        { error: 'Invalid AI response format', details: responseText },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      valuation: {
        estimatedValue: valuation.estimatedValue,
        valueLow: valuation.valueLow,
        valueHigh: valuation.valueHigh,
        tradeInValue: valuation.tradeInValue,
        privatePartyValue: valuation.privatePartyValue,
        dealerRetailValue: valuation.dealerRetailValue,
        confidence: valuation.confidence,
        marketTrend: valuation.marketTrend,
        analysis: valuation.analysis,
        depreciationRate: valuation.depreciationRate,
        dataSource: valuation.dataSource || 'Real-time market data (KBB, Edmunds, NADA)',
        regionalNote: valuation.regionalNote || (location ? `Prices adjusted for ${location} market` : 'National average pricing'),
        trimImpact: valuation.trimImpact || (trim ? `${trim} trim accounted for in valuation` : 'Base model pricing'),
        drivetrainImpact: valuation.drivetrainImpact || (drivetrain ? `${drivetrain} adjustment included` : 'Standard drivetrain'),
        lastUpdated: valuation.lastUpdated || new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        // Additional context
        factors: {
          trim: trim || 'Not specified',
          drivetrain: drivetrain || 'Not specified',
          location: location || 'National',
          certifiedPreOwned: certifiedPreOwned || false,
          mileage: mileage || 'Not specified',
          condition: condition || 'Good'
        }
      }
    })

  } catch (error: any) {
    console.error('Error fetching vehicle value:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vehicle value' },
      { status: 500 }
    )
  }
}

















