import { NextRequest, NextResponse } from 'next/server'

/**
 * AI-Powered Search Term Expansion
 * Uses OpenAI to intelligently expand user queries into relevant document search terms
 * 
 * Example: "my ID" → ["id", "driver license", "drivers license", "driver's license", "identification card", "state id"]
 */

// In-memory cache for search term expansions (lasts for server lifetime)
const expansionCache = new Map<string, { terms: string[], timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const queryLower = query.toLowerCase().trim()

    // Check cache first
    const cached = expansionCache.get(queryLower)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Cache hit for "${queryLower}"`)
      return NextResponse.json({
        success: true,
        originalQuery: query,
        expandedTerms: cached.terms,
        source: 'cache'
      })
    }

    // Check if OpenAI is available
    const openAIKey = process.env.OPENAI_API_KEY
    if (!openAIKey) {
      console.warn('⚠️ OpenAI API key not configured, using fallback expansion')
      const fallbackTerms = getFallbackExpansion(queryLower)
      return NextResponse.json({
        success: true,
        originalQuery: query,
        expandedTerms: fallbackTerms,
        source: 'fallback'
      })
    }

    // Call OpenAI to expand search terms
    console.log(`🤖 AI expanding search terms for: "${query}"`)
    
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
            content: `You are a PRECISE document search term expander. Given a user's document search query, generate a FOCUSED list of related search terms.

**CRITICAL RULE**: DO NOT include overly generic terms that would cause false matches!
- "driver's license" should NOT include "driver" alone (would match "driver registration")  
- "registration" should NOT include generic "vehicle" (would match unrelated vehicle documents)
- Keep expansions SPECIFIC to the document type being searched for

DOCUMENT CATEGORIES:
- ID & Licenses (driver's license, passport, birth certificate, social security card, state ID)
- Vehicle Documents (registration, title, vehicle registration)  
- Insurance (auto insurance, car insurance, home insurance, health insurance, policy)
- Medical (immunization records, prescriptions, health records)
- Financial & Tax (tax returns, W-2, 1099, bank statements)
- Legal (contracts, wills, trusts)
- Property (deeds, mortgages, HOA documents)
- Education (diplomas, degrees, transcripts, certifications)

INSTRUCTIONS:
1. Understand what SPECIFIC document type the user is asking for
2. Generate ONLY directly related variations and abbreviations
3. DO NOT include generic single words that might cause over-matching
4. Return ONLY a JSON array of search terms, nothing else
5. Keep each term SHORT (1-3 words max)
6. Return 4-10 PRECISE terms

EXAMPLES (note: NO generic single-word terms):
Query: "driver's license" → ["driver's license", "drivers license", "driver license", "dl"]
Query: "registration" → ["registration", "vehicle registration", "car registration", "auto registration"]
Query: "ID" → ["id", "identification", "id card", "state id"]
Query: "insurance" → ["insurance", "policy", "coverage"]
Query: "auto insurance" → ["auto insurance", "car insurance", "vehicle insurance"]
Query: "SSN" → ["ssn", "social security", "social security card", "social security number"]`
          },
          {
            role: 'user',
            content: `Expand this search query into related document search terms: "${query}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || ''

    // Parse AI response (expecting JSON array)
    let expandedTerms: string[] = []
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(aiResponse)
      if (Array.isArray(parsed)) {
        expandedTerms = parsed.map(t => String(t).toLowerCase().trim()).filter(t => t.length > 0)
      } else {
        throw new Error('Not an array')
      }
    } catch (parseError) {
      // Fallback: extract terms from text
      console.warn('⚠️ Could not parse AI response as JSON, extracting terms:', aiResponse)
      
      // Extract quoted terms or comma-separated values
      const matches = aiResponse.match(/"([^"]+)"|'([^']+)'|([a-zA-Z0-9\s'-]+)/g)
      if (matches) {
        expandedTerms = matches
          .map((m: string) => m.replace(/['"]/g, '').toLowerCase().trim())
          .filter((t: string) => t.length > 0 && t.length < 50) // Reasonable length
      }
    }

    // Fallback if AI didn't return useful terms
    if (expandedTerms.length === 0) {
      console.warn('⚠️ AI returned empty results, using fallback')
      expandedTerms = getFallbackExpansion(queryLower)
    }

    // Always include original query
    if (!expandedTerms.includes(queryLower)) {
      expandedTerms.unshift(queryLower)
    }

    // Remove duplicates and limit to 20 terms
    expandedTerms = [...new Set(expandedTerms)].slice(0, 20)

    console.log(`✅ Expanded "${query}" to ${expandedTerms.length} terms:`, expandedTerms.join(', '))

    // Cache the result
    expansionCache.set(queryLower, { terms: expandedTerms, timestamp: Date.now() })

    // Clean old cache entries (every 100 requests)
    if (expansionCache.size > 100) {
      const now = Date.now()
      for (const [key, value] of expansionCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          expansionCache.delete(key)
        }
      }
    }

    return NextResponse.json({
      success: true,
      originalQuery: query,
      expandedTerms,
      source: 'ai'
    })

  } catch (error: any) {
    console.error('❌ Search term expansion error:', error)
    
    // Return fallback expansion on error
    const { query } = await request.json()
    const fallbackTerms = getFallbackExpansion(query?.toLowerCase() || '')
    
    return NextResponse.json({
      success: true,
      originalQuery: query,
      expandedTerms: fallbackTerms,
      source: 'error-fallback',
      error: error.message
    })
  }
}

/**
 * Fallback expansion using hardcoded rules (when AI is unavailable)
 * 
 * CRITICAL: We use PRECISE expansions to avoid over-matching
 * "driver's license" should NOT include generic "driver" - would match "driver registration"
 */
function getFallbackExpansion(query: string): string[] {
  const termExpansions: Record<string, string[]> = {
    // ID/License - SPECIFIC variations only, no generic "driver" or "license"
    'id': ['id', 'identification', 'id card', 'state id'],
    'dl': ['dl', 'drivers license', 'driver license', "driver's license"],
    'driver license': ['driver license', 'drivers license', "driver's license", 'dl'],
    'drivers license': ['drivers license', 'driver license', "driver's license", 'dl'],
    "driver's license": ["driver's license", 'drivers license', 'driver license', 'dl'],
    
    // Registration - SPECIFIC to registration documents
    'registration': ['registration', 'vehicle registration', 'car registration', 'auto registration'],
    'vehicle registration': ['vehicle registration', 'registration', 'car registration'],
    'driver registration': ['driver registration', 'registration'],
    
    // Insurance variants
    'insurance': ['insurance', 'policy', 'coverage'],
    'auto insurance': ['auto insurance', 'car insurance', 'vehicle insurance'],
    'car insurance': ['car insurance', 'auto insurance', 'vehicle insurance'],
    'health insurance': ['health insurance', 'medical insurance'],
    
    // Other documents
    'passport': ['passport', 'travel document'],
    'ssn': ['ssn', 'social security', 'social security card', 'social security number'],
    'birth certificate': ['birth certificate', 'birth cert'],
    'medical': ['medical', 'health', 'medical records', 'health records'],
    'tax': ['tax', 'w-2', 'w2', '1099', 'tax return', 'tax document'],
    'deed': ['deed', 'property deed', 'title deed', 'house deed'],
    'will': ['will', 'last will', 'testament'],
    'bank': ['bank', 'bank statement', 'banking'],
  }

  // Check exact match first (most precise)
  if (termExpansions[query]) {
    return termExpansions[query]
  }

  // For partial matches, be CONSERVATIVE - only match if it's clearly the same concept
  for (const [key, expansions] of Object.entries(termExpansions)) {
    // Only expand if the query IS the key or contains the full key
    if (query === key || query.includes(key + ' ') || query.endsWith(key)) {
      return expansions
    }
  }

  // Default: return only the original query - don't over-expand unknown terms
  return [query]
}

