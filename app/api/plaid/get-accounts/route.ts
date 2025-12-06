import { NextResponse } from 'next/server'

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || ''
const PLAID_SECRET = process.env.PLAID_SECRET || ''
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'

export async function POST(request: Request) {
  try {
    const { access_token } = await request.json()

    if (!access_token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    console.log('🏦 Fetching account balances from Plaid')

    // Get account balances
    const response = await fetch(`https://${PLAID_ENV}.plaid.com/accounts/balance/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Plaid API error: ${errorData.error_message || response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Account balances retrieved successfully')

    return NextResponse.json({
      success: true,
      accounts: data.accounts,
      item: data.item,
    })
  } catch (error) {
    console.error('❌ Get accounts error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch accounts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}






















