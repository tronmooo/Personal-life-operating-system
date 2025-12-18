import { NextRequest, NextResponse } from 'next/server'

type AssetEstimateRequest = {
  name?: string
  category?: string
  description?: string
  condition?: string
  purchaseDate?: string
  purchasePrice?: number
  imageUrls?: string[]
}

/**
 * Asset Price Estimation API using Gemini with Google Search Grounding
 * 
 * This endpoint uses Google Gemini AI with real-time Google Search grounding
 * to get accurate current market prices from actual retailers (Amazon, Walmart,
 * Home Depot, Best Buy, etc.)
 */

export async function POST(req: NextRequest) {
  try {
    // Accept either JSON body or form-data JSON string under "payload"
    let body: AssetEstimateRequest
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      body = await req.json()
    } else {
      const form = await req.formData()
      const payload = form.get('payload') as string
      body = JSON.parse(payload || '{}')
    }

    const { name, category, description, condition, purchaseDate, purchasePrice, imageUrls = [] } = body || {}

    // Build search query for the product
    const productName = name || description || category || 'unknown item'
    const brandModel = description?.split(' ').slice(0, 2).join(' ') || ''
    const searchQuery = `${productName} ${brandModel}`.trim()

    console.log(`🔍 Estimating price for: "${searchQuery}"`)

    // Try Gemini with Google Search Grounding first (most accurate)
    const geminiKey = process.env.GEMINI_API_KEY
    if (geminiKey) {
      try {
        console.log('🤖 Using Gemini AI with Google Search grounding for real-time pricing...')
        
        // Build the prompt for Gemini
        const prompt = `You are a product pricing expert. I need you to find the CURRENT REAL retail price for this product by searching actual store prices.

Product to price:
- Name: ${name || 'Not specified'}
- Category: ${category || 'General'}
- Brand/Model: ${description || 'Not specified'}
- Condition: ${condition || 'Good'}

INSTRUCTIONS:
1. Search Google for current prices of this EXACT product at major retailers (Amazon, Walmart, Best Buy, Home Depot, Lowe's, Target, etc.)
2. Find the NEW retail price (what it costs to buy new today)
3. If the product is used/not new (condition is not "Excellent" or "New"), apply appropriate depreciation
4. Report the ACTUAL prices you find from real stores

DEPRECIATION GUIDE (only apply if condition is not "New/Excellent"):
- Excellent/Like New: 10-15% off retail
- Good: 20-30% off retail
- Fair: 40-50% off retail
- Poor: 60-70% off retail

CRITICAL: Use REAL prices from your search results. Do NOT make up prices or use generic estimates.

Return your response as JSON in this exact format:
{
  "estimatedValue": <number - the estimated current value>,
  "valueLow": <number - conservative low estimate>,
  "valueHigh": <number - optimistic high estimate>,
  "retailPrice": <number - new retail price found>,
  "confidence": <number 0.1 to 1.0>,
  "reasoning": "<string - 2-3 sentences explaining the price with specific sources cited>",
  "sources": "<string - list of retailers/sources where prices were found>",
  "pricesFound": [
    {"retailer": "<store name>", "price": <number>}
  ]
}

ONLY return valid JSON. No markdown, no explanations outside the JSON.`

        // Use Gemini 2.0 Flash with Google Search grounding
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1500,
                topP: 0.95
              },
              tools: [{
                googleSearch: {}
              }]
            }),
            signal: AbortSignal.timeout(45000) // 45 second timeout for search
          }
        )

        if (response.ok) {
          const data = await response.json()
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text
          
          if (content) {
            console.log(`📊 Gemini response (preview): ${content.substring(0, 300)}...`)
            
            // Parse the JSON response
            try {
              // Clean the response - remove markdown code blocks if present
              let cleanedContent = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim()
              
              // Find the JSON object
              const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                
                if (parsed.estimatedValue) {
                  console.log(`✅ Gemini + Google Search estimate: $${parsed.estimatedValue}`)
                  console.log(`   Retail price found: $${parsed.retailPrice || 'N/A'}`)
                  console.log(`   Sources: ${parsed.sources || 'N/A'}`)
                  
                  return NextResponse.json({
                    estimatedValue: parsed.estimatedValue,
                    valueLow: parsed.valueLow || Math.round(parsed.estimatedValue * 0.85),
                    valueHigh: parsed.valueHigh || Math.round(parsed.estimatedValue * 1.15),
                    confidence: parsed.confidence || 0.85,
                    reasoning: parsed.reasoning || 'Based on current market prices from Google Search',
                    attributes: {
                      retailPrice: parsed.retailPrice,
                      sources: parsed.sources,
                      pricesFound: parsed.pricesFound,
                      conditionApplied: condition
                    },
                    dataSource: parsed.sources || 'Google Search via Gemini 2.0',
                    source: 'gemini-google-search',
                    lastUpdated: new Date().toISOString()
                  })
                }
              }
            } catch (parseError) {
              console.error('Failed to parse Gemini JSON response:', parseError)
              console.log('Raw response:', content)
            }
          }
        } else {
          const errorText = await response.text()
          console.warn('⚠️ Gemini API error:', response.status, errorText)
        }
      } catch (geminiError) {
        console.warn('⚠️ Gemini request failed:', geminiError)
      }
    }

    // Fallback: Try Gemini without Google Search (still better than heuristics)
    if (geminiKey) {
      try {
        console.log('🤖 Trying Gemini standard model (no search grounding)...')
        
        const fallbackPrompt = `You are a product pricing expert with extensive knowledge of current retail prices.

Product to price:
- Name: ${name || 'Not specified'}
- Category: ${category || 'General'}
- Brand/Model: ${description || 'Not specified'}
- Condition: ${condition || 'Good'}
- Purchase Date: ${purchaseDate || 'Unknown'}

Based on your knowledge of typical retail prices as of late 2024/2025, estimate the current value.

Common price ranges to reference:
- Small freezers (upright, 6-7 cu ft): $150-$300 new
- Medium freezers (7-10 cu ft): $250-$450 new
- Large freezers (12+ cu ft): $400-$700 new
- Compact refrigerators: $150-$400 new
- Full-size refrigerators: $600-$2,500 new
- Washing machines: $500-$1,200 new
- Dryers: $400-$1,000 new
- Dishwashers: $400-$900 new
- Microwaves: $80-$300 new

Apply depreciation based on condition:
- Good: 20-35% off new price
- Fair: 40-55% off new price
- Poor: 60-75% off new price

Return ONLY valid JSON:
{
  "estimatedValue": <number>,
  "valueLow": <number>,
  "valueHigh": <number>,
  "retailPrice": <number - estimated new retail price>,
  "confidence": <number 0.1 to 1.0>,
  "reasoning": "<string>"
}`

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fallbackPrompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000
              }
            }),
            signal: AbortSignal.timeout(20000)
          }
        )

        if (response.ok) {
          const data = await response.json()
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text
          
          if (content) {
            try {
              const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
              const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                if (parsed.estimatedValue) {
                  console.log(`✅ Gemini fallback estimate: $${parsed.estimatedValue}`)
                  return NextResponse.json({
                    ...parsed,
                    source: 'gemini-fallback',
                    dataSource: 'Gemini AI knowledge base',
                    lastUpdated: new Date().toISOString()
                  })
                }
              }
            } catch (e) {
              console.warn('Failed to parse Gemini fallback response')
            }
          }
        }
      } catch (e) {
        console.warn('Gemini fallback also failed:', e)
      }
    }

    // Final fallback: heuristic pricing
    console.log('⚠️ Using heuristic fallback (less accurate). Configure GEMINI_API_KEY for better results.')
    
    let estimatedValue = 200
    const searchText = `${category || ''} ${name || ''} ${description || ''}`.toLowerCase()
    
    // Category-based pricing with more realistic values
    if (searchText.match(/freezer|upright freezer/i)) {
      estimatedValue = 220 // Small freezers are typically $150-$300
    } else if (searchText.match(/refrigerator|fridge/i)) {
      if (searchText.match(/french door|side.by.side/i)) {
        estimatedValue = 1400
      } else if (searchText.match(/mini|compact/i)) {
        estimatedValue = 250
      } else {
        estimatedValue = 800
      }
    } else if (searchText.match(/washer|washing machine/i)) {
      estimatedValue = 550
    } else if (searchText.match(/dryer/i)) {
      estimatedValue = 450
    } else if (searchText.match(/dishwasher/i)) {
      estimatedValue = 500
    } else if (searchText.match(/microwave/i)) {
      estimatedValue = 120
    } else if (searchText.match(/oven|range|stove/i)) {
      estimatedValue = 700
    } else if (searchText.match(/tv|television/i)) {
      estimatedValue = 400
    } else if (searchText.match(/laptop|computer/i)) {
      estimatedValue = 600
    }
    
    // Apply condition depreciation
    if (condition === 'Fair') {
      estimatedValue = Math.round(estimatedValue * 0.65)
    } else if (condition === 'Poor') {
      estimatedValue = Math.round(estimatedValue * 0.45)
    } else if (condition === 'Good') {
      estimatedValue = Math.round(estimatedValue * 0.75)
    }
    // Excellent = no depreciation
    
    return NextResponse.json({
      estimatedValue,
      valueLow: Math.round(estimatedValue * 0.80),
      valueHigh: Math.round(estimatedValue * 1.25),
      confidence: 0.4,
      reasoning: `Heuristic estimate based on category "${category || searchText}". For accurate real-time pricing, configure GEMINI_API_KEY.`,
      source: 'heuristic',
      dataSource: 'Category-based estimate',
      lastUpdated: new Date().toISOString()
    })
    
  } catch (e: any) {
    console.error('❌ Asset estimation error:', e)
    return NextResponse.json({ error: e.message || 'Failed to estimate' }, { status: 400 })
  }
}
