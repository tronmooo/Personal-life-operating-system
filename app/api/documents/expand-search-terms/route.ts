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
            content: `You are a document search term expander. Given a user's document search query, generate a comprehensive list of related search terms that would match relevant documents.

DOCUMENT CATEGORIES:
- Insurance (auto, home, life, health, disability, umbrella)
- ID & Licenses (driver's license, passport, birth certificate, social security card, marriage certificate)
- Vehicle (registration, title, loan agreement, maintenance records, warranty)
- Medical (immunization records, prescriptions, test results, health records)
- Financial & Tax (tax returns, W-2, 1099, bank statements, investment statements)
- Legal (contracts, wills, trusts, power of attorney)
- Property (deeds, mortgages, HOA documents)
- Education (diplomas, degrees, transcripts, certifications)

INSTRUCTIONS:
1. Understand what type of document the user is asking for
2. Generate ALL possible variations, abbreviations, and related terms
3. Include common misspellings and informal names
4. Include category names that might match
5. Return ONLY a JSON array of search terms, nothing else
6. Keep each term SHORT (1-3 words max)
7. Return 5-15 terms total

EXAMPLES:
Query: "ID" → ["id", "driver", "license", "drivers license", "driver's license", "identification", "state id", "id card", "id & licenses"]
Query: "insurance" → ["insurance", "policy", "coverage", "auto insurance", "car insurance", "home insurance", "declarations"]
Query: "registration" → ["registration", "vehicle registration", "car registration", "auto registration", "reg"]
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
 */
function getFallbackExpansion(query: string): string[] {
  const termExpansions: Record<string, string[]> = {
    'id': ['id', 'driver', 'license', 'drivers license', "driver's license", 'id & licenses', 'identification', 'state id'],
    'dl': ['driver', 'license', 'drivers license', "driver's license", 'dl'],
    'insurance': ['insurance', 'policy', 'coverage'],
    'auto insurance': ['auto insurance', 'car insurance', 'vehicle insurance', 'auto policy'],
    'registration': ['registration', 'vehicle registration', 'car registration', 'auto registration'],
    'passport': ['passport', 'travel document'],
    'ssn': ['ssn', 'social security', 'social security card', 'social security number'],
    'birth certificate': ['birth certificate', 'birth cert'],
    'medical': ['medical', 'health', 'prescription', 'health records'],
    'tax': ['tax', 'w-2', 'w2', '1099', 'tax return', 'tax document'],
    'deed': ['deed', 'property deed', 'title deed', 'house deed'],
    'will': ['will', 'last will', 'testament'],
    'bank': ['bank', 'bank statement', 'banking'],
  }

  // Check direct match
  if (termExpansions[query]) {
    return termExpansions[query]
  }

  // Check partial matches
  for (const [key, expansions] of Object.entries(termExpansions)) {
    if (query.includes(key) || key.includes(query)) {
      return expansions
    }
  }

  // Default: return original query
  return [query]
}

