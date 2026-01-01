import { NextRequest, NextResponse } from 'next/server'

/**
 * AI-Powered Search Term Expansion
 * Uses AI to intelligently expand user queries into relevant document search terms
 * 
 * Example: "universal membership card" → ["universal member card", "member card", "membership", "member", "universal", "card"]
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

    // Check if we have any AI API available
    const openAIKey = process.env.OPENAI_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
    
    let expandedTerms: string[] = []
    let source = 'fallback'
    
    // Try Gemini first if available
    if (geminiKey && expandedTerms.length === 0) {
      try {
        expandedTerms = await expandWithGemini(query, geminiKey)
        source = 'gemini'
        console.log(`✅ Gemini expanded "${query}" to ${expandedTerms.length} terms`)
      } catch (error) {
        console.warn('⚠️ Gemini expansion failed:', error)
      }
    }
    
    // Try OpenAI if Gemini failed
    if (openAIKey && expandedTerms.length === 0) {
      try {
        expandedTerms = await expandWithOpenAI(query, openAIKey)
        source = 'openai'
        console.log(`✅ OpenAI expanded "${query}" to ${expandedTerms.length} terms`)
      } catch (error) {
        console.warn('⚠️ OpenAI expansion failed:', error)
      }
    }
    
    // Use smart fallback if AI services failed or unavailable
    if (expandedTerms.length === 0) {
      expandedTerms = getSmartFallbackExpansion(queryLower)
      source = 'smart-fallback'
      console.log(`📋 Smart fallback expanded "${query}" to ${expandedTerms.length} terms`)
    }
    
    // Always include each word from the original query
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1)
    queryWords.forEach(word => {
      if (!expandedTerms.includes(word)) {
        expandedTerms.push(word)
      }
      // Also add word stems
      const stem = getStem(word)
      if (stem !== word && !expandedTerms.includes(stem)) {
        expandedTerms.push(stem)
      }
    })
    
    // Remove duplicates
    expandedTerms = [...new Set(expandedTerms)]
    
    console.log(`✅ Final expansion for "${query}" (${source}): [${expandedTerms.join(', ')}]`)

    // Cache the result
    expansionCache.set(queryLower, { terms: expandedTerms, timestamp: Date.now() })

    // Clean old cache entries periodically
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
      source
    })

  } catch (error: any) {
    console.error('❌ Search term expansion error:', error)
    
    // Return smart fallback expansion on error
    try {
      const body = await request.clone().json()
      const fallbackTerms = getSmartFallbackExpansion(body?.query?.toLowerCase() || '')
      
      return NextResponse.json({
        success: true,
        originalQuery: body?.query,
        expandedTerms: fallbackTerms,
        source: 'error-fallback',
        error: error.message
      })
    } catch {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }
  }
}

/**
 * Simple stemmer - removes common suffixes to find word roots
 */
function getStem(word: string): string {
  return word
    .replace(/ing$/i, '')
    .replace(/tion$/i, '')
    .replace(/ship$/i, '')
    .replace(/ment$/i, '')
    .replace(/ness$/i, '')
    .replace(/able$/i, '')
    .replace(/ible$/i, '')
    .replace(/ful$/i, '')
    .replace(/less$/i, '')
    .replace(/ous$/i, '')
    .replace(/ive$/i, '')
    .replace(/ly$/i, '')
    .replace(/er$/i, '')
    .replace(/or$/i, '')
    .replace(/ist$/i, '')
    .replace(/ity$/i, '')
    .replace(/al$/i, '')
    .replace(/s$/i, '')
}

/**
 * Expand search terms using Gemini AI
 */
async function expandWithGemini(query: string, apiKey: string): Promise<string[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a document search assistant. Generate SPECIFIC search terms to find a document.

User is searching for: "${query}"

RULES:
1. Generate terms that are SPECIFIC to what the user is looking for
2. DO NOT include generic single words that would match unrelated documents
3. Focus on variations of the MAIN concept, not tangentially related terms

BAD examples (too generic):
- For "drivers license": DON'T include "card", "id", "document" alone - these would match unrelated documents
- For "insurance card": DON'T include just "card" - would match member cards, credit cards, etc.

GOOD examples (specific):
- For "drivers license": "drivers license", "driver license", "driver's license", "driving license", "dl", "driver"
- For "universal membership card": "universal membership card", "universal member card", "member card", "membership card"

Generate 6-10 search terms. Return ONLY a JSON array:
["term1", "term2", "term3"]`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 200
        }
      }),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API returned ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  
  // Parse JSON array from response
  const match = text.match(/\[[\s\S]*?\]/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (Array.isArray(parsed)) {
        return parsed.map((t: any) => String(t).toLowerCase().trim()).filter((t: string) => t.length > 0)
      }
    } catch (e) {
      console.warn('Failed to parse Gemini response:', text)
    }
  }
  
  return []
}

/**
 * Expand search terms using OpenAI
 */
async function expandWithOpenAI(query: string, apiKey: string): Promise<string[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a document search assistant. Generate SPECIFIC search terms.

RULES:
1. Generate terms SPECIFIC to what the user wants - not generic words
2. DO NOT include single generic words that would match unrelated documents
3. "drivers license" should NOT expand to just "card" or "id" alone

BAD (too generic):
- "drivers license" → including "card", "id", "document" - would match unrelated docs

GOOD (specific):
- "drivers license" → ["drivers license", "driver license", "driver's license", "driving license", "dl"]
- "membership card" → ["membership card", "member card", "membership", "member"]

Return ONLY a JSON array of 6-10 specific lowercase search terms.`
        },
        {
          role: 'user',
          content: `Generate specific search terms for: "${query}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    }),
    signal: AbortSignal.timeout(5000) // 5 second timeout
  })

  if (!response.ok) {
    throw new Error(`OpenAI API returned ${response.status}`)
  }

  const data = await response.json()
  const aiResponse = data.choices?.[0]?.message?.content || ''

  // Parse AI response
  try {
    const parsed = JSON.parse(aiResponse)
    if (Array.isArray(parsed)) {
      return parsed.map(t => String(t).toLowerCase().trim()).filter(t => t.length > 0)
    }
  } catch {
    // Extract from text if JSON parsing fails
    const match = aiResponse.match(/\[[\s\S]*?\]/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        if (Array.isArray(parsed)) {
          return parsed.map((t: any) => String(t).toLowerCase().trim()).filter((t: string) => t.length > 0)
        }
      } catch {
        console.warn('Failed to parse OpenAI response:', aiResponse)
      }
    }
  }

  return []
}

/**
 * Smart fallback expansion when AI is unavailable
 * Uses word stemming and common variations - but stays SPECIFIC to the query
 */
function getSmartFallbackExpansion(query: string): string[] {
  const terms: string[] = [query]
  const words = query.split(/\s+/).filter(w => w.length > 2)
  
  // Add multi-word combinations first (more specific)
  if (words.length >= 2) {
    // Add pairs of adjacent words
    for (let i = 0; i < words.length - 1; i++) {
      terms.push(`${words[i]} ${words[i+1]}`)
    }
  }
  
  // Add each meaningful word (but not super generic ones alone)
  const genericWords = ['card', 'document', 'file', 'paper', 'form', 'the', 'my', 'a', 'an']
  words.forEach(word => {
    // Only add individual words if they're not too generic
    if (!genericWords.includes(word) && !terms.includes(word)) {
      terms.push(word)
    }
    
    // Add word stem variations
    const stem = getStem(word)
    if (stem !== word && stem.length > 3 && !terms.includes(stem) && !genericWords.includes(stem)) {
      terms.push(stem)
    }
    
    // Common variations
    if (word.endsWith('ship')) {
      terms.push(word.replace(/ship$/, ''))
    }
    if (word.endsWith('tion')) {
      terms.push(word.replace(/tion$/, 'ter'))
    }
    if (word.includes("'")) {
      terms.push(word.replace(/'/g, ''))
    }
    if (word.endsWith('s') && word.length > 4) {
      terms.push(word.slice(0, -1))
    }
    if (!word.endsWith('s') && word.length > 3) {
      terms.push(word + 's')
    }
  })
  
  // Known expansions for SPECIFIC document types (not generic terms)
  const knownExpansions: Record<string, string[]> = {
    'license': ['licence', 'dl'],
    'licence': ['license', 'dl'],
    'drivers': ['driver', "driver's"],
    'driver': ['drivers', "driver's"],
    'dl': ['driver license', 'drivers license'],
    'ssn': ['social security'],
    'membership': ['member'],
    'member': ['membership'],
    'registration': ['reg'],
    'passport': ['travel document'],
  }
  
  words.forEach(word => {
    if (knownExpansions[word]) {
      knownExpansions[word].forEach(exp => {
        if (!terms.includes(exp)) terms.push(exp)
      })
    }
  })
  
  return [...new Set(terms)].filter(t => t.length > 0)
}
