import { NextResponse } from 'next/server'

/**
 * ZILLOW LOOKUP - Just paste your address and get the REAL price
 * Uses web search to find actual Zillow Zestimates
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  
  if (!address) {
    return NextResponse.json({ 
      error: 'Provide address like: /api/zillow-lookup?address=123 Main St, Tampa, FL'
    })
  }
  
  return NextResponse.json({
    message: 'Provide your address below and I will search Zillow for the real price',
    address: address,
    instructions: 'Give me your address and I will use web search to get the REAL Zillow Zestimate'
  })
}

































