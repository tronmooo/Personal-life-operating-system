import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic'

/**
 * Local term expansion fallback (when AI is unavailable or fails)
 * This provides comprehensive expansion with plural/singular variations
 */
function getLocalExpansion(term: string): string[] {
  const termLower = term.toLowerCase().trim()
  
  // Comprehensive static expansions
  const expansions: Record<string, string[]> = {
    'id': ['id', 'driver', 'license', 'drivers license', 'driver license', "driver's license", 'dl', 'identification', 'state id', 'id card', 'id & licenses', 'identity'],
    'dl': ['dl', 'driver', 'license', 'drivers license', 'driver license', "driver's license", 'drivers', 'id'],
    'driver license': ['driver license', 'drivers license', "driver's license", 'dl', 'license', 'driver', 'id'],
    'drivers license': ['drivers license', 'driver license', "driver's license", 'dl', 'license', 'driver', 'id'],
    "driver's license": ['drivers license', 'driver license', "driver's license", 'dl', 'license', 'driver', 'id'],
    'license': ['license', 'licence', 'driver license', 'drivers license', "driver's license", 'dl'],
    'registration': ['registration', 'vehicle registration', 'car registration', 'auto registration', 'reg', 'vehicle', 'car'],
    'vehicle registration': ['vehicle registration', 'registration', 'car registration', 'auto registration', 'reg'],
    'car registration': ['car registration', 'vehicle registration', 'registration', 'auto registration', 'reg'],
    'insurance': ['insurance', 'policy', 'coverage', 'insured'],
    'auto insurance': ['auto insurance', 'car insurance', 'vehicle insurance', 'insurance', 'auto', 'car'],
    'car insurance': ['car insurance', 'auto insurance', 'vehicle insurance', 'insurance', 'auto', 'car'],
    'passport': ['passport', 'travel document', 'id'],
    'ssn': ['ssn', 'social security', 'social security card', 'social security number', 'ss card'],
    'social security': ['social security', 'social security card', 'ssn', 'social security number', 'ss card'],
    'birth certificate': ['birth certificate', 'birth cert', 'certificate of birth'],
    'medical': ['medical', 'health', 'prescription', 'health records', 'medical records'],
    'health': ['health', 'medical', 'prescription', 'health records', 'medical records'],
    'tax': ['tax', 'w-2', 'w2', '1099', 'tax return', 'tax document', 'irs'],
    'deed': ['deed', 'property deed', 'title deed', 'house deed', 'title'],
    'title': ['title', 'deed', 'property title', 'car title', 'vehicle title'],
    'will': ['will', 'last will', 'testament', 'last will and testament'],
    'bank': ['bank', 'bank statement', 'banking', 'statement'],
    'vehicle': ['vehicle', 'car', 'auto', 'automobile'],
    'car': ['car', 'vehicle', 'auto', 'automobile'],
  }
  
  // Direct match
  if (expansions[termLower]) {
    return [...expansions[termLower], termLower]
  }
  
  // Check if term contains any known keys
  for (const [key, values] of Object.entries(expansions)) {
    if (termLower.includes(key) || key.includes(termLower)) {
      return [...values, termLower]
    }
  }
  
  // Smart variations for unknown terms
  const variations = [termLower]
  
  // Add singular/plural variations
  if (termLower.endsWith('s') && termLower.length > 2) {
    variations.push(termLower.slice(0, -1)) // Remove 's'
  } else {
    variations.push(termLower + 's') // Add 's'
  }
  
  // Add common possessive variations
  if (!termLower.includes("'")) {
    variations.push(termLower.replace(/s$/, "'s"))
  }
  
  return [...new Set(variations)]
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabaseAuth.auth.getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    // Accept both ?category= and ?domain= for flexibility
    const categoryParam = searchParams.get('category') || searchParams.get('domain') || ''
    const category = (categoryParam || '').toString().trim().toLowerCase()

    console.log('🔍 Document search:', { query, category, user: session.user.id })

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
      .eq('user_id', session.user.id)
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
      
      // If multiple terms, match ANY term (OR logic)
      // If single term, match normally
      results = results.filter(doc => {
        const docName = doc.document_name?.toLowerCase() || ''
        const docType = doc.document_type?.toLowerCase() || ''
        const docDomain = doc.domain?.toLowerCase() || ''
        const docCategory = doc.metadata?.category?.toLowerCase() || ''
        const docSubtype = doc.metadata?.subtype?.toLowerCase() || ''
        const docText = doc.ocr_text?.toLowerCase() || ''
        
        // Check if ANY search term matches
        const matched = uniqueTerms.some(term =>
          docName.includes(term) ||
          docType.includes(term) ||
          docDomain.includes(term) ||
          docCategory.includes(term) ||
          docSubtype.includes(term) ||
          docText.includes(term)
        )
        
        // Debug logging for each document
        if (matched) {
          const matchedTerms = uniqueTerms.filter(term =>
            docName.includes(term) ||
            docType.includes(term) ||
            docDomain.includes(term) ||
            docCategory.includes(term) ||
            docSubtype.includes(term) ||
            docText.includes(term)
          )
          console.log(`✅ MATCHED: "${doc.document_name}" (${doc.metadata?.category || doc.domain}) - matched terms: [${matchedTerms.join(', ')}]`)
        }
        
        return matched
      })
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
