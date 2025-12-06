/**
 * API Route: Encrypt/Decrypt Plaid Tokens
 * Server-side only for security
 */

import { NextRequest, NextResponse } from 'next/server'
import { encryptToString, decryptFromString } from '@/lib/utils/encryption'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, token } = await request.json()

    if (action === 'encrypt') {
      if (!token) {
        return NextResponse.json({ error: 'Token required' }, { status: 400 })
      }

      const encrypted = encryptToString(token)
      return NextResponse.json({ success: true, encrypted })
    }
    else if (action === 'decrypt') {
      if (!token) {
        return NextResponse.json({ error: 'Encrypted token required' }, { status: 400 })
      }

      const decrypted = decryptFromString(token)
      return NextResponse.json({ success: true, decrypted })
    }
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Token encryption error:', error)
    return NextResponse.json({
      error: 'Encryption operation failed',
      message: error.message
    }, { status: 500 })
  }
}
