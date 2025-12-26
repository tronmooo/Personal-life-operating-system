import { NextResponse } from 'next/server'

/**
 * MANUAL PROPERTY LOOKUP
 * User provides address, we return instructions to get real price
 */

export async function POST(request: Request) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({
        error: 'Address required'
      }, { status: 400 })
    }

    // Return the address for manual lookup
    return NextResponse.json({
      success: true,
      message: 'Address received. Use web search to find real Zillow price.',
      address: address,
      instructions: [
        '1. Search Google for: "' + address + ' Zillow"',
        '2. Open Zillow listing',
        '3. Copy the Zestimate price',
        '4. Return that price'
      ]
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to process request'
    }, { status: 500 })
  }
}










































