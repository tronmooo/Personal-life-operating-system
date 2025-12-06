import { NextResponse } from 'next/server'

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || ''
const PLAID_SECRET = process.env.PLAID_SECRET || ''
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'

export async function POST(request: Request) {
  try {
    const { access_token, start_date, end_date } = await request.json()

    if (!access_token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    console.log('💳 Fetching transactions from Plaid')

    // Get transactions
    const response = await fetch(`https://${PLAID_ENV}.plaid.com/transactions/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token,
        start_date: start_date || '2024-01-01',
        end_date: end_date || new Date().toISOString().split('T')[0],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Plaid API error: ${errorData.error_message || response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ Retrieved ${data.transactions.length} transactions`)

    return NextResponse.json({
      success: true,
      transactions: data.transactions,
      accounts: data.accounts,
      total_transactions: data.total_transactions,
    })
  } catch (error) {
    console.error('❌ Get transactions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}






















