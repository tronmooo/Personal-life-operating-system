import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic'

/**
 * Local term expansion fallback (when AI is unavailable or fails)
 * This provides PRECISE expansion - avoiding over-broad terms that cause false matches
 * 
 * KEY CHANGE: "driver's license" should NOT match "driver registration"
 * We use EXACT phrase matching priority and avoid single-word generic terms
 */
function getLocalExpansion(term: string): string[] {
  const termLower = term.toLowerCase().trim()
  
  // PRECISE expansions - avoid generic single words that cause over-matching
  // For specific document types, we expand to RELATED document names, not generic words
  const expansions: Record<string, string[]> = {
    // ID documents - SPECIFIC to identification cards, NOT vehicle registration
    'id': ['id', 'identification', 'id card', 'state id', 'id & licenses'],
    'dl': ['dl', 'drivers license', 'driver license', "driver's license"],
    'driver license': ['driver license', 'drivers license', "driver's license", 'dl'],
    'drivers license': ['drivers license', 'driver license', "driver's license", 'dl'],
    "driver's license": ["driver's license", 'drivers license', 'driver license', 'dl'],
    // NOTE: We intentionally DON'T include 'driver' or 'license' alone - too broad!
    
    // Registration - SPECIFIC to vehicle registration documents
    'registration': ['registration', 'vehicle registration', 'car registration', 'auto registration', 'reg'],
    'vehicle registration': ['vehicle registration', 'registration', 'car registration', 'auto registration', 'reg'],
    'car registration': ['car registration', 'vehicle registration', 'registration', 'auto registration', 'reg'],
    'driver registration': ['driver registration', 'registration'],
    // NOTE: We don't include generic 'vehicle' or 'car' - too broad!
    
    // Insurance - keep specific
    'insurance': ['insurance', 'policy', 'coverage'],
    'auto insurance': ['auto insurance', 'car insurance', 'vehicle insurance'],
    'car insurance': ['car insurance', 'auto insurance', 'vehicle insurance'],
    'health insurance': ['health insurance', 'medical insurance'],
    'home insurance': ['home insurance', 'homeowners insurance', 'property insurance'],
    
    // Other documents - specific expansions only
    'passport': ['passport', 'travel document'],
    'ssn': ['ssn', 'social security', 'social security card', 'social security number', 'ss card'],
    'social security': ['social security', 'social security card', 'ssn', 'social security number', 'ss card'],
    'birth certificate': ['birth certificate', 'birth cert', 'certificate of birth'],
    'medical': ['medical', 'health', 'medical records', 'health records'],
    'health': ['health', 'medical', 'health records', 'medical records'],
    'tax': ['tax', 'w-2', 'w2', '1099', 'tax return', 'tax document'],
    'deed': ['deed', 'property deed', 'title deed', 'house deed'],
    'title': ['title', 'car title', 'vehicle title', 'property title'],
    'will': ['will', 'last will', 'testament', 'last will and testament'],
    'bank': ['bank', 'bank statement', 'banking'],
  }
  
  // Direct match - return precise expansions only
  if (expansions[termLower]) {
    return [...expansions[termLower], termLower]
  }
  
  // Check for multi-word phrases that match a key exactly
  for (const key of Object.keys(expansions)) {
    if (termLower === key) {
      return [...expansions[key], termLower]
    }
  }
  
  // For unknown terms, be CONSERVATIVE - don't over-expand
  // Just return the original term and close variations
  const variations = [termLower]
  
  // Only add singular/plural for simple, specific terms
  if (termLower.length > 3 && !termLower.includes(' ')) {
    if (termLower.endsWith('s')) {
      variations.push(termLower.slice(0, -1))
    } else {
      variations.push(termLower + 's')
    }
  }
  
  return [...new Set(variations)]
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = await createServerClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    // Accept both ?category= and ?domain= for flexibility
    const categoryParam = searchParams.get('category') || searchParams.get('domain') || ''
    const category = (categoryParam || '').toString().trim().toLowerCase()

    console.log('🔍 Document search:', { query, category, user: user.id })

    // Use service role for reliable server-side reads (still scoped to user_id)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase env vars for search endpoint')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Build query
    let dbQuery = supabase
      .from('documents')
      .select('id, document_name, document_type, file_url, file_path, expiration_date, domain, metadata, uploaded_at, ocr_text')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })

    // Filter by category if provided
    if (category && category !== 'all') {
      // Normalize some common aliases
      const categoryMap: Record<string, string> = {
        insurance: 'insurance',
        health: 'health',
        medical: 'health',
        vehicle: 'vehicles',
        vehicles: 'vehicles',
        auto: 'insurance', // auto insurance stored under insurance
        legal: 'legal',
        financial: 'financial',
        travel: 'travel',
        education: 'education',
      }
      const mapped = categoryMap[category] || category
      dbQuery = dbQuery.eq('domain', mapped)
    }

    const { data: documents, error } = await dbQuery.limit(50)

    if (error) {
      console.error('Database error:', error)
      // Do not throw; return safe empty payload to avoid 500s
      return NextResponse.json(
        {
          success: true,
          documents: [],
          results: [],
          count: 0,
          query,
          category,
          warning: `Database query failed: ${error.message}`
        },
        { status: 200 }
      )
    }

    // Filter by search query
    let results = documents || []
    let uniqueTerms: string[] = [] // Declare outside for access in logs
    
    if (query.trim()) {
      const searchLower = query.toLowerCase()
      
      // Split by commas for multi-term search (e.g., "registration, insurance, drivers license")
      const searchTerms = searchLower
        .split(',')
        .map(term => term.trim())
        .filter(term => term.length > 0)
      
      // AI-POWERED EXPANSION: Try to use AI to expand each search term
      let expansionSucceeded = false
      
      try {
        // Call AI expansion endpoint for each unique term
        const expansionPromises = searchTerms.map(async (term) => {
          try {
            const expansionResponse = await fetch(
              `${request.nextUrl.origin}/api/documents/expand-search-terms`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: term }),
                signal: AbortSignal.timeout(3000) // 3s timeout
              }
            )
            
            if (expansionResponse.ok) {
              const expansionData = await expansionResponse.json()
              if (expansionData.success && Array.isArray(expansionData.expandedTerms)) {
                console.log(`✨ AI expanded "${term}" → [${expansionData.expandedTerms.join(', ')}] (${expansionData.source})`)
                return expansionData.expandedTerms
              }
            }
            console.warn(`⚠️ Expansion failed for "${term}", using enhanced fallback`)
          } catch (expansionError) {
            console.warn(`⚠️ Could not expand term "${term}":`, expansionError)
          }
          
          // Enhanced fallback: expand locally with common variations
          return getLocalExpansion(term)
        })
        
        // Wait for all expansions (with timeout)
        const allExpansions = await Promise.all(expansionPromises)
        uniqueTerms = [...new Set(allExpansions.flat())]
        expansionSucceeded = uniqueTerms.length > searchTerms.length
        
      } catch (error) {
        console.error('❌ AI expansion failed completely, using local fallback:', error)
        // Use local expansion for all terms
        uniqueTerms = searchTerms.flatMap(term => getLocalExpansion(term))
        uniqueTerms = [...new Set(uniqueTerms)]
      }
      
      console.log(`🔍 Search query: "${query}"`)
      console.log(`🔍 Original terms: [${searchTerms.join(', ')}]`)
      console.log(`🔍 Expanded terms (${uniqueTerms.length}): [${uniqueTerms.join(', ')}]`)
      console.log(`🔍 Expansion ${expansionSucceeded ? 'succeeded ✅' : 'fell back to local'}`)
      
      // SCORING-BASED MATCHING: Prioritize EXACT phrase matches over partial term matches
      // This prevents "driver's license" from matching "driver registration"
      const originalQuery = query.toLowerCase().trim()
      
      // Score each document based on match quality
      const scoredResults = results.map(doc => {
        const docName = doc.document_name?.toLowerCase() || ''
        const docType = doc.document_type?.toLowerCase() || ''
        const docDomain = doc.domain?.toLowerCase() || ''
        const docCategory = doc.metadata?.category?.toLowerCase() || ''
        const docSubtype = doc.metadata?.subtype?.toLowerCase() || ''
        const docText = doc.ocr_text?.toLowerCase() || ''
        
        let score = 0
        const matchedTerms: string[] = []
        
        // HIGHEST PRIORITY: Exact phrase match in document name (100 points)
        if (docName.includes(originalQuery)) {
          score += 100
          matchedTerms.push(`EXACT:"${originalQuery}"`)
        }
        
        // HIGH PRIORITY: Exact phrase match in type/category (80 points)
        if (docType.includes(originalQuery) || docCategory.includes(originalQuery)) {
          score += 80
          matchedTerms.push(`TYPE:"${originalQuery}"`)
        }
        
        // MEDIUM PRIORITY: Individual term matches in name (10 points each)
        uniqueTerms.forEach(term => {
          if (docName.includes(term)) {
            score += 10
            matchedTerms.push(term)
          } else if (docType.includes(term) || docCategory.includes(term) || docSubtype.includes(term)) {
            score += 5
            matchedTerms.push(term)
          } else if (docDomain.includes(term)) {
            score += 3
            matchedTerms.push(term)
          } else if (docText.includes(term)) {
            score += 1
            matchedTerms.push(term)
          }
        })
        
        return { doc, score, matchedTerms: [...new Set(matchedTerms)] }
      })
      
      // Filter to only documents with positive scores
      const matchedResults = scoredResults.filter(r => r.score > 0)
      
      // Sort by score (highest first)
      matchedResults.sort((a, b) => b.score - a.score)
      
      // Log matches for debugging
      matchedResults.forEach(r => {
        console.log(`✅ MATCHED (score=${r.score}): "${r.doc.document_name}" - terms: [${r.matchedTerms.join(', ')}]`)
      })
      
      // If there's a clear winner (score >= 100), only return exact matches
      // This prevents "driver's license" from also returning "driver registration"
      const hasExactMatch = matchedResults.some(r => r.score >= 100)
      if (hasExactMatch) {
        console.log('🎯 Found exact match(es) - filtering to high-confidence results only')
        results = matchedResults
          .filter(r => r.score >= 50) // Only keep high-confidence matches
          .map(r => r.doc)
      } else {
        results = matchedResults.map(r => r.doc)
      }
    }

    console.log(`✅ Found ${results.length} document(s) matching query "${query}"`)
    if (results.length === 0) {
      console.warn(`⚠️ No documents found. Searched ${documents?.length || 0} total documents with ${uniqueTerms.length} search terms.`)
    }

    // Format response
    const formatted = results.map(doc => ({
      id: doc.id,
      name: doc.document_name || 'Untitled Document',
      type: doc.document_type || 'Document',
      category: doc.metadata?.category || doc.domain || 'Unknown',
      expirationDate: doc.expiration_date,
      url: doc.file_url || doc.file_path,
      uploadedAt: doc.uploaded_at
    }))

    return NextResponse.json({
      success: true,
      // Back-compat for clients expecting either key
      documents: formatted,
      results: formatted,
      count: formatted.length,
      query,
      category
    })

  } catch (error: any) {
    console.error('❌ Document search error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Search failed',
        success: false,
        documents: [],
        results: [],
        count: 0
      },
      { status: 500 }
    )
  }
}
