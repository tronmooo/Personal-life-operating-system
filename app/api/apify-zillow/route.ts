import { NextResponse } from 'next/server'

/**
 * APIFY ZILLOW DETAIL SCRAPER
 * Uses Apify's maxcopell/zillow-detail-scraper actor to get real property values
 * 
 * Required env var: APIFY_API_TOKEN
 */

// Note: Apify API uses tilde (~) instead of slash (/) in actor IDs for API calls
const APIFY_ACTOR_ID = 'maxcopell~zillow-detail-scraper'
const APIFY_API_BASE = 'https://api.apify.com/v2'

interface ZillowResult {
  zpid?: string
  address?: string
  price?: number
  zestimate?: number
  rentZestimate?: number
  bedrooms?: number
  bathrooms?: number
  livingArea?: number
  lotSize?: number
  yearBuilt?: number
  propertyType?: string
  homeStatus?: string
  url?: string
  [key: string]: any
}

async function runApifyZillowScraper(address: string): Promise<ZillowResult | null> {
  const apiToken = process.env.APIFY_API_TOKEN
  
  if (!apiToken) {
    console.error('❌ APIFY_API_TOKEN not configured')
    throw new Error('APIFY_API_TOKEN environment variable is required')
  }

  console.log('🏠 [APIFY] Starting Zillow scraper for:', address)

  try {
    // Run the actor synchronously and get dataset items
    // timeout=120 gives 2 minutes for the scraper to complete
    const runUrl = `${APIFY_API_BASE}/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${apiToken}&timeout=120`
    
    console.log('🔗 [APIFY] Calling actor:', APIFY_ACTOR_ID)

    // The Zillow Detail Scraper uses "addresses" parameter for address lookup
    // We also try without property status filter to find any property type
    const response = await fetch(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Use addresses parameter for address-based lookup
        addresses: [address],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [APIFY] Run failed:', response.status, errorText)
      throw new Error(`Apify run failed: ${response.status} - ${errorText}`)
    }

    const responseText = await response.text()
    console.log('📦 [APIFY] Raw response:', responseText.substring(0, 500))
    
    let results: ZillowResult[]
    try {
      results = JSON.parse(responseText)
    } catch {
      console.error('❌ [APIFY] Failed to parse response as JSON')
      throw new Error('Invalid response from Apify')
    }
    
    console.log('✅ [APIFY] Got', results.length, 'results')
    if (results.length > 0) {
      console.log('📋 [APIFY] First result keys:', Object.keys(results[0]))
    }

    if (results.length === 0) {
      console.log('⚠️ [APIFY] No results found')
      return null
    }

    // Return the first/best result
    const result = results[0]
    console.log('✅ [APIFY] Best result:', {
      address: result.address,
      price: result.price,
      zestimate: result.zestimate,
    })

    return result

  } catch (error) {
    console.error('❌ [APIFY] Error:', error instanceof Error ? error.message : String(error))
    throw error
  }
}

// Alternative: Start a run and poll for results (for longer-running scrapes)
async function runApifyZillowScraperAsync(address: string): Promise<ZillowResult | null> {
  const apiToken = process.env.APIFY_API_TOKEN
  
  if (!apiToken) {
    throw new Error('APIFY_API_TOKEN environment variable is required')
  }

  console.log('🏠 [APIFY ASYNC] Starting Zillow scraper for:', address)

  try {
    // Start the actor run
    const startRunUrl = `${APIFY_API_BASE}/acts/${APIFY_ACTOR_ID}/runs?token=${apiToken}`
    
    const startResponse = await fetch(startRunUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Use addresses parameter for address-based lookup
        addresses: [address],
      }),
    })

    if (!startResponse.ok) {
      throw new Error(`Failed to start run: ${startResponse.status}`)
    }

    const runData = await startResponse.json()
    const runId = runData.data.id
    console.log('🚀 [APIFY] Run started:', runId)

    // Poll for completion (max 60 seconds)
    const maxWait = 60000
    const pollInterval = 2000
    let elapsed = 0

    while (elapsed < maxWait) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      elapsed += pollInterval

      const statusUrl = `${APIFY_API_BASE}/actor-runs/${runId}?token=${apiToken}`
      const statusResponse = await fetch(statusUrl)
      const statusData = await statusResponse.json()
      const status = statusData.data.status

      console.log(`⏳ [APIFY] Run status: ${status} (${elapsed/1000}s)`)

      if (status === 'SUCCEEDED') {
        // Fetch dataset items
        const datasetId = statusData.data.defaultDatasetId
        const datasetUrl = `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${apiToken}`
        const datasetResponse = await fetch(datasetUrl)
        const results: ZillowResult[] = await datasetResponse.json()

        if (results.length > 0) {
          return results[0]
        }
        return null
      } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`Run ${status}`)
      }
    }

    throw new Error('Run timed out')

  } catch (error) {
    console.error('❌ [APIFY ASYNC] Error:', error)
    throw error
  }
}

// Fallback market estimate
function getMarketEstimate(address: string): { value: number; source: string; confidence: string } {
  console.log('📊 [FALLBACK] Using market estimate for:', address)
  
  const lower = address.toLowerCase()
  let baseValue = 350000
  
  if (lower.includes('california') || lower.includes(', ca')) {
    baseValue = 750000
    if (lower.includes('san francisco') || lower.includes('los angeles')) baseValue = 1200000
    if (lower.includes('san diego') || lower.includes('orange county')) baseValue = 900000
  } else if (lower.includes('florida') || lower.includes(', fl')) {
    baseValue = 400000
    if (lower.includes('miami') || lower.includes('palm beach')) baseValue = 650000
  } else if (lower.includes('new york') || lower.includes(', ny')) {
    baseValue = 600000
    if (lower.includes('manhattan') || lower.includes('brooklyn')) baseValue = 1000000
  } else if (lower.includes('texas') || lower.includes(', tx')) {
    baseValue = 380000
    if (lower.includes('austin') || lower.includes('dallas')) baseValue = 500000
  } else if (lower.includes('washington') || lower.includes(', wa')) {
    baseValue = 550000
    if (lower.includes('seattle')) baseValue = 850000
  } else if (lower.includes('colorado') || lower.includes(', co')) {
    baseValue = 500000
    if (lower.includes('denver') || lower.includes('boulder')) baseValue = 650000
  } else if (lower.includes('massachusetts') || lower.includes(', ma')) {
    baseValue = 550000
    if (lower.includes('boston')) baseValue = 800000
  }
  
  const variance = (Math.random() - 0.5) * 0.15
  const finalValue = Math.round(baseValue * (1 + variance))
  
  return {
    value: finalValue,
    source: 'Market Estimate',
    confidence: 'medium'
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  console.log('\n🏡 ==================== APIFY ZILLOW LOOKUP ====================')
  
  try {
    const { address } = await request.json()

    if (!address || typeof address !== 'string' || address.trim() === '') {
      return NextResponse.json(
        { error: 'Address required', success: false },
        { status: 400 }
      )
    }

    const cleanAddress = address.trim()
    console.log('📍 Address:', cleanAddress)

    // Check if APIFY_API_TOKEN is configured
    if (!process.env.APIFY_API_TOKEN) {
      console.warn('⚠️ APIFY_API_TOKEN not set, using market estimate')
      const estimate = getMarketEstimate(cleanAddress)
      
      return NextResponse.json({
        success: true,
        estimatedValue: estimate.value,
        address: cleanAddress,
        source: estimate.source,
        confidence: estimate.confidence,
        isRealData: false,
        message: 'APIFY_API_TOKEN not configured. Add your Apify API token to .env.local',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      })
    }

    try {
      // Try the sync API first (faster for quick lookups)
      const result = await runApifyZillowScraper(cleanAddress)
      
      if (result) {
        // Extract the property value (prefer zestimate, then price)
        const propertyValue = result.zestimate || result.price || 0
        
        const duration = Date.now() - startTime
        console.log(`✅ RESULT: $${propertyValue.toLocaleString()} from Zillow via Apify`)
        console.log(`⚡ ${duration}ms`)
        console.log('==================== END ====================\n')
        
        return NextResponse.json({
          success: true,
          estimatedValue: propertyValue,
          zestimate: result.zestimate,
          price: result.price,
          rentZestimate: result.rentZestimate,
          address: result.address || cleanAddress,
          source: 'Zillow (via Apify)',
          confidence: 'high',
          isRealData: true,
          propertyDetails: {
            zpid: result.zpid,
            bedrooms: result.bedrooms,
            bathrooms: result.bathrooms,
            livingArea: result.livingArea,
            lotSize: result.lotSize,
            yearBuilt: result.yearBuilt,
            propertyType: result.propertyType,
            homeStatus: result.homeStatus,
            url: result.url,
          },
          responseTime: duration,
          timestamp: new Date().toISOString()
        })
      }
      
      // No results from Apify, fall back to estimate
      console.log('⚠️ No Zillow data found, using market estimate')
      const estimate = getMarketEstimate(cleanAddress)
      
      return NextResponse.json({
        success: true,
        estimatedValue: estimate.value,
        address: cleanAddress,
        source: estimate.source,
        confidence: estimate.confidence,
        isRealData: false,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      })
      
    } catch (apifyError) {
      console.error('⚠️ Apify error, falling back to estimate:', apifyError)
      
      const estimate = getMarketEstimate(cleanAddress)
      
      return NextResponse.json({
        success: true,
        estimatedValue: estimate.value,
        address: cleanAddress,
        source: estimate.source,
        confidence: estimate.confidence,
        isRealData: false,
        error: apifyError instanceof Error ? apifyError.message : 'Apify lookup failed',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ ERROR:', error instanceof Error ? error.message : String(error))
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch property data',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}







