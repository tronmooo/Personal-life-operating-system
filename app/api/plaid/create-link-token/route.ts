import { NextResponse } from 'next/server'

// Plaid API credentials - User needs to add these to .env.local
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || ''
const PLAID_SECRET = process.env.PLAID_SECRET || ''
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox' // sandbox, development, or production
const PLAID_WEBHOOK_URL = process.env.PLAID_WEBHOOK_URL || ''
const PLAID_REDIRECT_URI = process.env.PLAID_REDIRECT_URI || ''

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      return NextResponse.json(
        { error: 'Plaid credentials not configured. Please add PLAID_CLIENT_ID and PLAID_SECRET to .env.local' },
        { status: 500 }
      )
    }

    console.log('🏦 Creating Plaid Link token for user:', userId)

    // Build request body and avoid forcing OAuth redirect in sandbox
    const requestBody: any = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      user: {
        client_user_id: userId || 'default-user',
      },
      client_name: 'LifeHub',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
      webhook: PLAID_WEBHOOK_URL || undefined,
    }

    // Only include redirect_uri for non-sandbox (OAuth institutions require dashboard config)
    if (PLAID_ENV !== 'sandbox' && PLAID_REDIRECT_URI) {
      requestBody.redirect_uri = PLAID_REDIRECT_URI
    }

    // Debug log (safe: contains no secrets)
    console.log('🧪 Plaid link/token/create env:', PLAID_ENV, 'redirect?', Boolean(requestBody.redirect_uri))

    // Call Plaid API to create link token
    const response = await fetch(`https://${PLAID_ENV}.plaid.com/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Plaid API error: ${errorData.error_message || response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Plaid Link token created successfully')

    return NextResponse.json({
      success: true,
      link_token: data.link_token,
      expiration: data.expiration,
    })
  } catch (error) {
    console.error('❌ Plaid Link token creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create Plaid Link token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}






















