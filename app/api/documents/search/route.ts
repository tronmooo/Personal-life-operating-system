import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic'

/**
 * Calculate Levenshtein distance between two strings (for typo tolerance)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  return dp[m][n]
}

/**
 * Check if two terms are similar (within edit distance threshold)
 */
function isSimilar(term1: string, term2: string, threshold: number = 2): boolean {
  // Exact match
  if (term1 === term2) return true
  
  // One contains the other (e.g., "member" in "membership")
  if (term1.includes(term2) || term2.includes(term1)) return true
  
  // Check if one is a stem of the other
  const stem1 = getStem(term1)
  const stem2 = getStem(term2)
  if (stem1 === stem2) return true
  if (stem1.includes(stem2) || stem2.includes(stem1)) return true
  
  // Skip if lengths are too different for edit distance
  if (Math.abs(term1.length - term2.length) > threshold + 2) return false
  
  // Calculate edit distance
  return levenshteinDistance(term1, term2) <= threshold
}

/**
 * Simple stemmer - removes common suffixes
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
    .replace(/ty$/i, '')
    .replace(/al$/i, '')
    .replace(/s$/i, '')
}

/**
 * Generate phonetic variations (sounds-alike matching)
 */
function getPhoneticVariations(term: string): string[] {
  const variations: string[] = [term]
  
  // Common phonetic substitutions
  const phoneticRules: [RegExp, string][] = [
    [/ph/gi, 'f'],           // phone -> fone
    [/ck/gi, 'k'],           // check -> chek
    [/ce/gi, 'se'],          // license -> lisense
    [/ci/gi, 'si'],          // social -> sosial
    [/ght/gi, 't'],          // right -> rit
    [/tion/gi, 'shun'],      // registration -> registrashun
    [/sion/gi, 'zhun'],      // vision -> vizhun
    [/our/gi, 'or'],         // colour -> color
    [/re$/gi, 'er'],         // centre -> center
    [/'s/gi, 's'],           // driver's -> drivers
    [/'/gi, ''],             // remove apostrophes
    [/\s+/g, ' '],           // normalize spaces
  ]
  
  let modified = term
  for (const [pattern, replacement] of phoneticRules) {
    const newTerm = modified.replace(pattern, replacement)
    if (newTerm !== modified) {
      variations.push(newTerm)
      modified = newTerm
    }
  }
  
  return [...new Set(variations)]
}

/**
 * Local term expansion with fuzzy matching support
 * Handles typos, variations, and similar-sounding words
 */
function getLocalExpansion(term: string): string[] {
  const termLower = term.toLowerCase().trim()
  
  // Comprehensive expansions with synonyms and common variations
  const expansions: Record<string, string[]> = {
    // Driver's License - ALL common variations
    'id': ['id', 'identification', 'id card', 'state id', 'id & licenses', 'photo id'],
    'dl': ['dl', 'drivers license', 'driver license', "driver's license", 'driving license', 'license'],
    'driver license': ['driver license', 'drivers license', "driver's license", 'dl', 'driving license', 'license to drive'],
    'drivers license': ['drivers license', 'driver license', "driver's license", 'dl', 'driving license', 'driver licens', 'driverslicense'],
    "driver's license": ["driver's license", 'drivers license', 'driver license', 'dl', 'driving license'],
    'driving license': ['driving license', 'drivers license', 'driver license', "driver's license", 'dl'],
    'license': ['license', 'licence', 'drivers license', "driver's license", 'driving license', 'dl', 'licens'],
    'licence': ['licence', 'license', 'drivers license', "driver's license", 'dl'],
    'licens': ['licens', 'license', 'licence', 'drivers license'],
    'driverslicense': ['driverslicense', 'drivers license', "driver's license", 'dl'],
    'driver': ['driver', 'drivers license', "driver's license", 'driving', 'drive'],
    
    // Registration - vehicle docs
    'registration': ['registration', 'vehicle registration', 'car registration', 'auto registration', 'reg', 'registraton', 'registraion'],
    'vehicle registration': ['vehicle registration', 'registration', 'car registration', 'auto registration', 'reg'],
    'car registration': ['car registration', 'vehicle registration', 'registration', 'auto registration', 'reg'],
    'reg': ['reg', 'registration', 'vehicle registration'],
    'registraton': ['registraton', 'registration', 'vehicle registration'],
    
    // Insurance - expanded
    'insurance': ['insurance', 'policy', 'coverage', 'insurace', 'insurnce', 'ins', 'insurance card', 'proof of insurance'],
    'auto insurance': ['auto insurance', 'car insurance', 'vehicle insurance', 'automobile insurance', 'motor insurance'],
    'car insurance': ['car insurance', 'auto insurance', 'vehicle insurance', 'automobile insurance'],
    'health insurance': ['health insurance', 'medical insurance', 'healthcare', 'health coverage'],
    'home insurance': ['home insurance', 'homeowners insurance', 'property insurance', 'house insurance', 'homeowner'],
    'life insurance': ['life insurance', 'life policy', 'life coverage'],
    'insurace': ['insurace', 'insurance', 'policy'],
    'insurnce': ['insurnce', 'insurance', 'policy'],
    
    // Identity documents
    'passport': ['passport', 'travel document', 'pasport', 'pass port'],
    'pasport': ['pasport', 'passport', 'travel document'],
    'ssn': ['ssn', 'social security', 'social security card', 'social security number', 'ss card', 'social'],
    'social security': ['social security', 'social security card', 'ssn', 'social security number', 'ss card', 'ss#'],
    'social': ['social', 'social security', 'ssn', 'social security card'],
    'birth certificate': ['birth certificate', 'birth cert', 'certificate of birth', 'bc'],
    'birth cert': ['birth cert', 'birth certificate', 'certificate of birth'],
    
    // Medical/Health
    'medical': ['medical', 'health', 'medical records', 'health records', 'doctor', 'hospital'],
    'health': ['health', 'medical', 'health records', 'medical records', 'healthcare'],
    'health card': ['health card', 'medical card', 'insurance card', 'health insurance card'],
    'vaccination': ['vaccination', 'vaccine', 'immunization', 'shot record', 'vax', 'covid'],
    'vaccine': ['vaccine', 'vaccination', 'immunization', 'vax'],
    
    // Financial/Tax
    'tax': ['tax', 'w-2', 'w2', '1099', 'tax return', 'tax document', 'taxes', 'irs'],
    'w2': ['w2', 'w-2', 'tax', 'tax return', 'income'],
    'w-2': ['w-2', 'w2', 'tax', 'tax return'],
    '1099': ['1099', 'tax', 'tax return', 'contractor'],
    'bank': ['bank', 'bank statement', 'banking', 'bank account', 'statement'],
    'statement': ['statement', 'bank statement', 'account statement', 'financial statement'],
    
    // Property
    'deed': ['deed', 'property deed', 'title deed', 'house deed', 'home deed'],
    'title': ['title', 'car title', 'vehicle title', 'property title', 'deed'],
    'car title': ['car title', 'vehicle title', 'title', 'auto title'],
    'mortgage': ['mortgage', 'home loan', 'house loan', 'mortgage document'],
    
    // Legal
    'will': ['will', 'last will', 'testament', 'last will and testament'],
    'contract': ['contract', 'agreement', 'legal document', 'signed'],
    'lease': ['lease', 'rental agreement', 'rent', 'lease agreement'],
    
    // Pets
    'pet': ['pet', 'pet records', 'vet', 'veterinary', 'animal'],
    'vet': ['vet', 'veterinary', 'pet', 'animal', 'vet records'],
    'vaccination record': ['vaccination record', 'vaccine', 'shot record', 'immunization'],
    
    // Membership & Cards
    'member': ['member', 'membership', 'member card', 'membership card'],
    'membership': ['membership', 'member', 'membership card', 'member card'],
    'membership card': ['membership card', 'member card', 'membership', 'member'],
    'member card': ['member card', 'membership card', 'membership', 'member'],
    'card': ['card', 'id card', 'member card', 'insurance card', 'membership card', 'credit card', 'debit card'],
    'universal': ['universal', 'general', 'all'],
    
    // ID variations
    'id card': ['id card', 'identification card', 'id', 'identification', 'photo id'],
    'identification': ['identification', 'id', 'id card', 'identity', 'photo id'],
    'identity': ['identity', 'identification', 'id', 'id card'],
    
    // Common misspellings and variations
    'lisence': ['lisence', 'license', 'licence'],
    'licnse': ['licnse', 'license', 'licence'],
    'liscense': ['liscense', 'license', 'licence'],
    'regisration': ['regisration', 'registration'],
    'registation': ['registation', 'registration'],
    'insurence': ['insurence', 'insurance'],
    'certifcate': ['certifcate', 'certificate'],
    'certiicate': ['certiicate', 'certificate'],
  }
  
  // Check for direct match first
  if (expansions[termLower]) {
    return [...new Set([...expansions[termLower], termLower])]
  }
  
  // Check phonetic variations
  const phoneticVars = getPhoneticVariations(termLower)
  for (const variant of phoneticVars) {
    if (expansions[variant]) {
      return [...new Set([...expansions[variant], termLower, variant])]
    }
  }
  
  // Fuzzy match against all known terms
  const fuzzyMatches: string[] = [termLower]
  for (const [key, values] of Object.entries(expansions)) {
    // Check if term is similar to any key
    if (isSimilar(termLower, key, 2)) {
      fuzzyMatches.push(...values)
    }
    // Check if term is similar to any value in the expansion
    for (const val of values) {
      if (isSimilar(termLower, val, 2)) {
        fuzzyMatches.push(...values)
        break
      }
    }
  }
  
  if (fuzzyMatches.length > 1) {
    return [...new Set(fuzzyMatches)]
  }
  
  // Fallback: generate basic variations
  const variations = [termLower]
  
  // Add singular/plural
  if (termLower.length > 3 && !termLower.includes(' ')) {
    if (termLower.endsWith('s')) {
      variations.push(termLower.slice(0, -1))
    } else {
      variations.push(termLower + 's')
    }
  }
  
  // Add without apostrophe
  if (termLower.includes("'")) {
    variations.push(termLower.replace(/'/g, ''))
  }
  
  // Add phonetic variations
  variations.push(...getPhoneticVariations(termLower))
  
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
      
      // SCORING-BASED MATCHING with FUZZY support
      // Prioritize exact matches but also find similar/fuzzy matches
      const originalQuery = query.toLowerCase().trim()
      
      // Helper to check fuzzy match in text
      const fuzzyMatchInText = (text: string, term: string): boolean => {
        if (text.includes(term)) return true
        // Check each word in text for similarity
        const words = text.split(/\s+/)
        return words.some(word => isSimilar(word, term, 2))
      }
      
      // Score each document based on match quality
      const scoredResults = results.map(doc => {
        const docName = doc.document_name?.toLowerCase() || ''
        const docType = doc.document_type?.toLowerCase() || ''
        const docDomain = doc.domain?.toLowerCase() || ''
        const docCategory = doc.metadata?.category?.toLowerCase() || ''
        const docSubtype = doc.metadata?.subtype?.toLowerCase() || ''
        const docText = doc.ocr_text?.toLowerCase() || ''
        const allDocText = `${docName} ${docType} ${docCategory} ${docSubtype} ${docText}`
        
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
        
        // HIGH PRIORITY: Fuzzy phrase match in document name (70 points)
        if (score < 70) {
          const queryWords = originalQuery.split(/\s+/)
          const docNameWords = docName.split(/\s+/)
          const fuzzyPhraseMatch = queryWords.every(qw => 
            docNameWords.some(dw => isSimilar(qw, dw, 2))
          )
          if (fuzzyPhraseMatch && queryWords.length > 1) {
            score += 70
            matchedTerms.push(`FUZZY:"${originalQuery}"`)
          }
        }
        
        // MEDIUM PRIORITY: Individual term matches in name (15 points each for exact, 8 for fuzzy)
        uniqueTerms.forEach(term => {
          // Exact match in name
          if (docName.includes(term)) {
            score += 15
            matchedTerms.push(term)
          } 
          // Exact match in type/category
          else if (docType.includes(term) || docCategory.includes(term) || docSubtype.includes(term)) {
            score += 10
            matchedTerms.push(term)
          } 
          // Exact match in domain
          else if (docDomain.includes(term)) {
            score += 5
            matchedTerms.push(term)
          } 
          // Exact match in OCR text
          else if (docText.includes(term)) {
            score += 3
            matchedTerms.push(term)
          }
          // Fuzzy match in name (bonus points for close matches)
          else if (fuzzyMatchInText(docName, term)) {
            score += 8
            matchedTerms.push(`~${term}`)
          }
          // Fuzzy match in type/category
          else if (fuzzyMatchInText(docType, term) || fuzzyMatchInText(docCategory, term)) {
            score += 5
            matchedTerms.push(`~${term}`)
          }
          // Fuzzy match anywhere
          else if (fuzzyMatchInText(allDocText, term)) {
            score += 2
            matchedTerms.push(`~${term}`)
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
      
      // SMART FILTERING: Only return results that are relevant to the actual query
      // If there's a clear winner, filter out documents that are much weaker matches
      const topScore = matchedResults[0]?.score || 0
      
      if (topScore >= 30) {
        // Calculate minimum threshold based on top score
        // If best match scores 100, require at least 40% (40 points)
        // If best match scores 50, require at least 50% (25 points)
        const minThreshold = Math.max(15, topScore * 0.4)
        
        console.log(`🎯 Top score: ${topScore}, filtering results below ${minThreshold}`)
        
        // Filter to only documents above the threshold
        const filteredResults = matchedResults.filter(r => r.score >= minThreshold)
        
        // Additional check: If a result ONLY matches on generic single-word terms, reject it
        // e.g., if searching for "drivers license" and a doc only matches "card", reject it
        const queryWords = originalQuery.split(/\s+/).filter(w => w.length > 2)
        results = filteredResults.filter(r => {
          // Check if any of the original query words appear in the matched terms
          const hasQueryWordMatch = queryWords.some(qw => 
            r.matchedTerms.some(mt => 
              mt.toLowerCase().includes(qw.toLowerCase()) ||
              qw.toLowerCase().includes(mt.replace(/[~"]/g, '').toLowerCase())
            )
          )
          
          // If document name contains any original query word, keep it
          const docNameLower = r.doc.document_name?.toLowerCase() || ''
          const hasDirectMatch = queryWords.some(qw => docNameLower.includes(qw))
          
          // Keep if it has a query word match OR has a high enough score
          const keep = hasQueryWordMatch || hasDirectMatch || r.score >= topScore * 0.6
          
          if (!keep) {
            console.log(`❌ FILTERED OUT (no query word match, score=${r.score}): "${r.doc.document_name}"`)
          }
          
          return keep
        }).map(r => r.doc)
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
