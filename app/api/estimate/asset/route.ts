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
 * Perform web search using MCP Brave Search (free via MCP)
 * Returns top search results with titles, descriptions, and URLs
 */
async function performWebSearch(query: string, baseUrl: string): Promise<string> {
  try {
    console.log(`🔍 Executing web search: "${query}"`)
    
    // Call MCP Web Search via internal API
    const searchResponse = await fetch(`${baseUrl}/api/mcp/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serverId: 'web-search',
        capability: 'web_search',
        parameters: {
          query: query,
          count: 10
        }
      })
    })
    
    if (!searchResponse.ok) {
      console.warn('⚠️ MCP search failed, trying direct approach')
      // Fallback: Try to extract info from query itself
      return `Search attempted for "${query}". Limited results available. Please use current market research for accurate pricing.`
    }
    
    const searchData = await searchResponse.json()
    
    if (!searchData.success || !searchData.result?.web?.results) {
      console.warn('⚠️ No search results returned')
      return `No specific pricing data found for "${query}". Recommend checking retailer websites directly.`
    }
    
    // Extract and format results
    const webResults = searchData.result.web.results || []
    
    if (webResults.length === 0) {
      return `No results found for "${query}".`
    }
    
    const formatted = webResults.slice(0, 8).map((r: any, i: number) => {
      let result = `[${i + 1}] ${r.title || 'No title'}`
      if (r.description) result += `\n${r.description}`
      if (r.url) result += `\nURL: ${r.url}`
      if (r.price) result += `\n💰 Price: ${r.price}`
      return result
    }).join('\n\n')
    
    console.log(`✅ Got ${webResults.length} search results`)
    return formatted
    
  } catch (error) {
    console.error('❌ Web search error:', error)
    return `Search failed for "${query}". Using fallback estimation method.`
  }
}

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

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY

    // STEP 1: Let ChatGPT search the web using function calling
    const webSearchResults = ''

    // Get base URL for internal API calls
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`

    // If an OpenAI key is available, use vision + text reasoning for valuation
    if (apiKey) {
      console.log('✅ Using OpenAI API for accurate pricing with web search')
      // Build detailed search query
      const searchQuery = `${name || ''} ${category || ''} ${description || ''} current market price retail value ${condition || ''} 2025`
      
      const prompt = `You are a professional asset appraiser with access to REAL-TIME web search results. You MUST find ACTUAL current retail prices from real stores (Home Depot, Best Buy, Amazon, etc.) and then apply appropriate depreciation.

Asset Details:
- Name: ${name || 'Not specified'}
- Category: ${category || 'General'}
- Brand: ${description?.split(' ')[0] || 'Generic'}
- Model: ${description?.split(' ').slice(1).join(' ') || 'Not specified'}
- Condition: ${condition || 'Good'}
- Purchase Date: ${purchaseDate || 'Unknown'}
- Original Purchase Price: ${purchasePrice ? '$' + purchasePrice : 'Unknown'}
- Current Year: 2025

**CRITICAL: You MUST call search_web function to find current retail prices BEFORE estimating. DO NOT make up prices.**

${webSearchResults ? `
🌐 REAL-TIME WEB SEARCH RESULTS (Use these for accurate pricing):
${webSearchResults}

INSTRUCTIONS: Extract ACTUAL prices from the search results above. Look for:
- Current retail prices from retailers (Home Depot, Lowes, Best Buy, Amazon, etc.)
- Used/resale prices from marketplaces (eBay, Facebook, Craigslist)
- Specific model numbers and prices mentioned
- DO NOT make up prices - use only what's in the search results
- If search results show conflicting prices, use the median value
` : 'NOTE: No web search results available. Provide conservative estimate based on category.'}

NOTE: If brand/model information is missing or generic, provide a conservative estimate based on the category and typical market values for similar items in that category.

CRITICAL INSTRUCTIONS FOR ACCURATE PRICING:
1. **If web search results provided above, extract EXACT prices from them**
   - Find new retail prices mentioned in search results
   - Find used/resale prices mentioned in search results
   - Use the MEDIAN of multiple sources
   - Cite specific retailers and prices

2. **If NO web search results (or search failed), use your knowledge + Model-Specific Pricing Guide**:
   
   REFRIGERATORS:
   - Samsung RF32CG5100SR (32 cu.ft. French Door): $2,300-$2,500 new (2025)
   - Samsung RF-series (28-32 cu.ft.): $2,000-$2,800 new
   - GE GTS17DTNRBB (top-mount, 16.6 cu.ft.): $550-$650 new (2025)
   - GE top-mount (15-18 cu.ft.): $500-$800 new
   - LG French door (25-30 cu.ft.): $1,800-$2,500 new
   - Whirlpool side-by-side: $1,500-$2,200 new
   
   WASHERS/DRYERS:
   - Samsung front-load washer: $800-$1,400 new
   - LG front-load: $900-$1,500 new
   - Whirlpool top-load: $600-$1,000 new
   - GE dryer: $700-$1,200 new
   
   DISHWASHERS:
   - Bosch 300 series: $700-$900 new
   - KitchenAid: $800-$1,200 new
   - GE: $500-$800 new
   
   If exact model not listed: Use comparable model in same series/capacity range
   
3. **Depreciation Calculation - REALISTIC RATES**:
   Appliances (Refrigerators, Washers, Dryers, Dishwashers):
   - Year 1: 15-20% depreciation
   - Year 2-3: 10-15% per year
   - Year 4-5: 10% per year
   - After 5 years: 5-8% per year
   - Excellent condition: -5% from depreciation rate
   - Good condition: Use standard rate
   - Fair condition: +10% to depreciation rate
   - Poor condition: +20% to depreciation rate
   
   Electronics (TVs, Computers, Phones):
   - Year 1: 25-30% depreciation
   - Year 2-3: 20-25% per year
   - Year 4+: 15-20% per year
   
   Furniture:
   - Year 1: 30-40% depreciation
   - Year 2+: 10-15% per year
   
   EXAMPLE: 2-year-old refrigerator, Good condition, bought for $600:
   - After Year 1: $600 × 0.82 = $492
   - After Year 2: $492 × 0.88 = $433
   - Estimated value: $430-$450

4. **TWO-STEP VALUATION PROCESS**:
   Step 1: Find current NEW retail price (from web search OR pricing guide above)
   Step 2: Apply depreciation based on age and condition
   Step 3: Cross-check with used market prices if available
   Step 4: Use the HIGHER of: (depreciation calculation) OR (used market average)
   
   WHY: Sometimes used items sell for more than depreciation would suggest (supply/demand)
   
5. **Validation**:
   - If original purchase price provided, ensure estimate is realistic vs. that baseline
   - Cross-reference multiple sources when available
   - Account for inflation/deflation since purchase
   - Consider if item is discontinued or newer model available

6. **Current Year Context**: It is November 2025. Use 2025 pricing data.

7. **Balance Conservatism with Accuracy**: 
   - Don't under-value items that hold value well (appliances, quality furniture)
   - Don't over-value items that depreciate quickly (consumer electronics, fashion)
   - Use actual resale comps when available

IMPORTANT: 
- DO NOT hallucinate prices - use real data sources
- MUST check BOTH new retail AND used market prices
- For appliances in good condition, typical resale is 50-70% of new retail, not 30-40%
- Use realistic depreciation rates provided above, NOT generic steep rates

Respond with valid JSON in this EXACT format:
{
  "estimatedValue": <realistic current market value number>,
  "valueLow": <conservative low estimate>,
  "valueHigh": <optimistic high estimate>,
  "confidence": <0.1 to 1.0 based on data availability>,
  "reasoning": "<2-3 sentence explanation with specific price sources mentioned>",
  "attributes": {
    "retailPrice": <current new retail if applicable>,
    "depreciationApplied": "<percentage>",
    "marketSources": "<sources checked>"
  },
  "dataSource": "<specific websites/sources used>",
  "lastUpdated": "${new Date().toISOString()}"
}`

      const messages: any[] = [
        {
          role: 'system',
          content: `You are a professional appraiser with mandatory web search capability.

MANDATORY PROCESS:
1. FIRST: Call search_web with query "${name || description || category} ${(description || '').split(' ')[0]} ${new Date().getFullYear()} price Home Depot Best Buy" and search_type "new_retail"
2. SECOND: Extract ACTUAL retail prices from search results (look for $XXX.XX format)
3. THIRD: Apply realistic depreciation (1 year old = 15-20% off, not 40%+)
4. FOURTH: Return JSON with the calculated value

DEPRECIATION EXAMPLES:
- Brand new (0-1 months old): 10-15% off retail (it's now "used")
  - Example: $598 new → $520 used value
- 1 year old, good condition: 15-20% total depreciation
  - Example: $598 new → $490 used value
- 2-3 years old: Additional 10-15% per year
- Always verify current retail price via search_web FIRST

DO NOT estimate without searching. DO NOT use made-up prices. ALWAYS call search_web first.

Return strict JSON format: {estimatedValue, valueLow, valueHigh, confidence, reasoning, attributes, dataSource}`
        },
        {
          role: 'user',
          content: imageUrls.length > 0 ? [
            { type: 'text', text: prompt },
            ...imageUrls.map(u => ({ type: 'image_url', image_url: { url: u } }))
          ] : prompt
        }
      ]

      // STEP 2: Use gpt-4o with web search function calling
      console.log('🤖 Using ChatGPT with web search capability...')
      
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          temperature: 0.2,
          max_tokens: 1500,
          tools: [
            {
              type: 'function',
              function: {
                name: 'search_web',
                description: 'Search the web for current pricing information from retailers and marketplaces. Use this to find actual current prices for products.',
                parameters: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'The search query (e.g., "Samsung RF32CG5100SR price 2025")'
                    },
                    search_type: {
                      type: 'string',
                      enum: ['new_retail', 'used_resale'],
                      description: 'Type of prices to search for'
                    }
                  },
                  required: ['query', 'search_type']
                }
              }
            }
          ],
          tool_choice: 'auto'
        })
      })

      if (!resp.ok) {
        const err = await resp.text()
        console.error('❌ OpenAI API error:', resp.status, err)
        throw new Error(`OpenAI error: ${resp.status} ${err}`)
      }
      
      let data = await resp.json()
      let message = data?.choices?.[0]?.message
      
      // STEP 3: Handle function calls (web searches)
      if (message?.tool_calls && message.tool_calls.length > 0) {
        console.log(`✅ ChatGPT is calling ${message.tool_calls.length} web search function(s) to find real prices`)
        
        const toolMessages = [
          ...messages,
          message
        ]
        
        // Execute each function call
        for (const toolCall of message.tool_calls) {
          if (toolCall.function.name === 'search_web') {
            const args = JSON.parse(toolCall.function.arguments)
            console.log(`🌐 Searching: "${args.query}" (${args.search_type})`)
            
            // Perform web search using MCP Brave Search
            const searchResults = await performWebSearch(args.query, baseUrl)
            
            toolMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                query: args.query,
                results: searchResults
              })
            })
          }
        }
        
        // STEP 4: Send search results back to ChatGPT for final answer
        const secondResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: toolMessages,
            temperature: 0.2,
            max_tokens: 1500
          })
        })
        
        if (!secondResp.ok) {
          throw new Error('OpenAI second call failed')
        }
        
        data = await secondResp.json()
        message = data?.choices?.[0]?.message
      }
      
      const content = message?.content?.trim() || ''
      
      console.log(`📊 AI Response preview: ${content.substring(0, 200)}...`)
      
      // Parse JSON response - handle code blocks
      let parsed
      try {
        const cleanedText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        parsed = JSON.parse(cleanedText)
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        throw new Error('Invalid JSON response from AI')
      }
      
      if (parsed?.estimatedValue) {
        console.log(`✅ AI Estimate: $${parsed.estimatedValue} (confidence: ${parsed.confidence})`)
        return NextResponse.json({ ...parsed, source: 'openai-gpt4o-websearch' })
      }
    } else {
      console.warn('⚠️ OpenAI API key not configured. Using fallback heuristic pricing (less accurate).')
      console.warn('💡 Set OPENAI_API_KEY in .env.local for accurate AI-powered pricing with web search.')
    }

    // Fallback heuristic if no API key or parsing failed
    // Use purchase price if provided, otherwise use category-based estimates
    let estimatedValue = 100
    
    if (purchasePrice && purchasePrice > 0) {
      // Calculate depreciation based on age
      let years = 0
      if (purchaseDate) {
        const d = new Date(purchaseDate)
        if (!isNaN(d.getTime())) {
          years = Math.max(0, (Date.now() - d.getTime()) / (365 * 24 * 60 * 60 * 1000))
        }
      }
      
      const searchText = `${category || ''} ${name || ''} ${description || ''}`.toLowerCase()
      
      // Determine asset type for depreciation calculation
      const isAppliance = searchText.match(/refrigerator|freezer|washer|dryer|dishwasher|oven|stove|range|microwave|hvac|appliance/i)
      const isFurniture = searchText.match(/furniture|couch|sofa|table|chair|desk|bed|cabinet/i)
      const isJewelry = searchText.match(/jewelry|jewel|watch|ring|necklace|bracelet|diamond/i)
      const isArt = searchText.match(/art|painting|sculpture|collectible|antique/i)
      const isTools = searchText.match(/tool|equipment|machinery|drill|saw/i)
      const isInstrument = searchText.match(/instrument|guitar|piano|drum|keyboard|violin/i)
      const isSports = searchText.match(/sports|bike|bicycle|golf|tennis|exercise|gym/i)
      const isVehicleAccessory = searchText.match(/vehicle|car|auto|accessory|tire|rim/i)
      const isOfficeEquipment = searchText.match(/office|computer|laptop|printer|monitor|desk/i)
      
      let currentValue = purchasePrice
      
      if (isAppliance) {
        // Appliances: Realistic depreciation (retain more value)
        if (years < 0.1) {
          // Brand new (less than 1 month) - only 10-12% depreciation (now "used")
          currentValue *= 0.88
        } else {
          for (let i = 0; i < Math.floor(years); i++) {
            let yearlyRate = 0.85 // 15% depreciation base
            if (i === 0) yearlyRate = 0.80 // 20% first year
            else if (i <= 2) yearlyRate = 0.87 // 13% years 2-3
            else if (i <= 4) yearlyRate = 0.90 // 10% years 4-5
            else yearlyRate = 0.93 // 7% after year 5
            
            // Adjust for condition
            if (condition === 'Excellent') yearlyRate += 0.08
            else if (condition === 'Fair') yearlyRate -= 0.05
            else if (condition === 'Poor') yearlyRate -= 0.10
            
            currentValue *= yearlyRate
          }
        }
      } else if (isJewelry || isArt) {
        // Jewelry & Art: Often appreciate or hold value very well
        let appreciationRate = 1.0 // Hold steady
        if (isJewelry) appreciationRate = 1.02 // 2% appreciation per year
        else appreciationRate = 1.03 // Art can appreciate 3% per year
        
        // Condition matters less for jewelry/art
        if (condition === 'Excellent') appreciationRate += 0.01
        else if (condition === 'Poor') appreciationRate -= 0.05
        
        currentValue = purchasePrice * Math.pow(appreciationRate, years)
      } else if (isFurniture) {
        // Furniture: High initial depreciation, then stabilizes
        for (let i = 0; i < Math.floor(years); i++) {
          let yearlyRate = i === 0 ? 0.65 : 0.88 // 35% first year, 12% after
          if (condition === 'Excellent') yearlyRate += 0.10
          else if (condition === 'Fair') yearlyRate -= 0.10
          else if (condition === 'Poor') yearlyRate -= 0.20
          currentValue *= yearlyRate
        }
      } else if (isInstrument) {
        // Musical instruments: Hold value well if maintained
        for (let i = 0; i < Math.floor(years); i++) {
          let yearlyRate = 0.95 // 5% per year
          if (condition === 'Excellent') yearlyRate = 0.98 // Barely depreciate
          else if (condition === 'Fair') yearlyRate = 0.90
          else if (condition === 'Poor') yearlyRate = 0.80
          currentValue *= yearlyRate
        }
      } else if (isTools) {
        // Tools/Equipment: Good retention if quality
        for (let i = 0; i < Math.floor(years); i++) {
          let yearlyRate = 0.88 // 12% per year
          if (condition === 'Excellent') yearlyRate = 0.92
          else if (condition === 'Fair') yearlyRate = 0.83
          else if (condition === 'Poor') yearlyRate = 0.75
          currentValue *= yearlyRate
        }
      } else if (isSports) {
        // Sports equipment: Moderate depreciation
        for (let i = 0; i < Math.floor(years); i++) {
          let yearlyRate = 0.80 // 20% per year
          if (condition === 'Excellent') yearlyRate = 0.88
          else if (condition === 'Fair') yearlyRate = 0.75
          else if (condition === 'Poor') yearlyRate = 0.65
          currentValue *= yearlyRate
        }
      } else if (isOfficeEquipment) {
        // Electronics/Computers: Faster depreciation
        for (let i = 0; i < Math.floor(years); i++) {
          let yearlyRate = 0.70 // 30% per year
          if (condition === 'Excellent') yearlyRate = 0.78
          else if (condition === 'Fair') yearlyRate = 0.65
          else if (condition === 'Poor') yearlyRate = 0.55
          currentValue *= yearlyRate
        }
      } else {
        // General items: Standard depreciation
        let depreciationRate = 0.75 // Good condition: 25% per year
        if (condition === 'Excellent') depreciationRate = 0.85 // 15% per year
        else if (condition === 'Fair') depreciationRate = 0.65 // 35% per year
        else if (condition === 'Poor') depreciationRate = 0.55 // 45% per year
        
        currentValue = purchasePrice * Math.pow(depreciationRate, years)
      }
      
      estimatedValue = Math.max(Math.round(purchasePrice * 0.15), Math.round(currentValue)) // Min 15% of purchase price
    } else {
      // Category-based realistic estimates (NO purchase price provided)
      const cat = (category || name || description || '').toLowerCase()
      
      // Home Appliances - Higher base estimates
      if (cat.includes('refrigerator')) estimatedValue = 800
      else if (cat.includes('freezer')) estimatedValue = 600
      else if (cat.includes('washer') || cat.includes('washing machine')) estimatedValue = 650
      else if (cat.includes('dryer')) estimatedValue = 550
      else if (cat.includes('dishwasher')) estimatedValue = 500
      else if (cat.includes('oven') || cat.includes('range') || cat.includes('stove')) estimatedValue = 700
      else if (cat.includes('microwave')) estimatedValue = 150
      else if (cat.includes('hvac') || cat.includes('air conditioner')) estimatedValue = 2500
      else if (cat.includes('home appliance') || cat.includes('appliance')) estimatedValue = 600
      
      // Electronics
      else if (cat.includes('television') || cat.includes('tv')) estimatedValue = 450
      else if (cat.includes('laptop') || cat.includes('computer')) estimatedValue = 600
      else if (cat.includes('tablet') || cat.includes('ipad')) estimatedValue = 350
      else if (cat.includes('phone') || cat.includes('smartphone')) estimatedValue = 400
      else if (cat.includes('camera')) estimatedValue = 500
      else if (cat.includes('speaker') || cat.includes('audio')) estimatedValue = 250
      else if (cat.includes('electronic')) estimatedValue = 400
      
      // Furniture
      else if (cat.includes('couch') || cat.includes('sofa')) estimatedValue = 600
      else if (cat.includes('bed') || cat.includes('mattress')) estimatedValue = 700
      else if (cat.includes('table')) estimatedValue = 400
      else if (cat.includes('desk')) estimatedValue = 350
      else if (cat.includes('chair')) estimatedValue = 200
      else if (cat.includes('furniture')) estimatedValue = 500
      
      // Jewelry & Watches
      else if (cat.includes('jewelry') || cat.includes('jewel')) estimatedValue = 800
      else if (cat.includes('watch')) estimatedValue = 600
      else if (cat.includes('ring')) estimatedValue = 700
      else if (cat.includes('necklace')) estimatedValue = 500
      else if (cat.includes('bracelet')) estimatedValue = 400
      
      // Art & Collectibles
      else if (cat.includes('art') || cat.includes('painting')) estimatedValue = 1000
      else if (cat.includes('sculpture')) estimatedValue = 800
      else if (cat.includes('collectible') || cat.includes('antique')) estimatedValue = 600
      
      // Tools & Equipment
      else if (cat.includes('drill')) estimatedValue = 150
      else if (cat.includes('saw')) estimatedValue = 200
      else if (cat.includes('tool')) estimatedValue = 250
      else if (cat.includes('equipment')) estimatedValue = 500
      else if (cat.includes('machinery')) estimatedValue = 1500
      
      // Musical Instruments
      else if (cat.includes('guitar')) estimatedValue = 500
      else if (cat.includes('piano')) estimatedValue = 2000
      else if (cat.includes('drum')) estimatedValue = 800
      else if (cat.includes('keyboard') && cat.includes('music')) estimatedValue = 600
      else if (cat.includes('violin')) estimatedValue = 700
      else if (cat.includes('instrument')) estimatedValue = 600
      
      // Sports Equipment
      else if (cat.includes('bicycle') || cat.includes('bike')) estimatedValue = 500
      else if (cat.includes('treadmill') || cat.includes('elliptical')) estimatedValue = 800
      else if (cat.includes('golf')) estimatedValue = 400
      else if (cat.includes('tennis')) estimatedValue = 200
      else if (cat.includes('sports')) estimatedValue = 300
      
      // Vehicle Accessories
      else if (cat.includes('tire')) estimatedValue = 150
      else if (cat.includes('wheel') || cat.includes('rim')) estimatedValue = 200
      else if (cat.includes('vehicle') || cat.includes('car') || cat.includes('auto')) estimatedValue = 300
      
      // Office Equipment
      else if (cat.includes('printer')) estimatedValue = 250
      else if (cat.includes('monitor')) estimatedValue = 300
      else if (cat.includes('projector')) estimatedValue = 400
      else if (cat.includes('office')) estimatedValue = 350
      
      // Default
      else estimatedValue = 400
    }
    
    return NextResponse.json({ 
      estimatedValue, 
      valueLow: Math.round(estimatedValue * 0.75), 
      valueHigh: Math.round(estimatedValue * 1.40), 
      confidence: 0.4, 
      reasoning: purchasePrice 
        ? `Calculated based on original price of $${purchasePrice} with realistic depreciation for condition and age. For AI-powered market analysis, OpenAI API key required.` 
        : `Category-based estimate using market averages. Enter purchase price and date for more accurate depreciation calculation.`, 
      attributes: { method: 'improved_heuristic', hadPurchasePrice: !!purchasePrice }, 
      source: 'heuristic' 
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to estimate' }, { status: 400 })
  }
}


