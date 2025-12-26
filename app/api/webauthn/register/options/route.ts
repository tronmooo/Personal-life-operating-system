import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { getServerWebAuthnConfig } from '@/lib/webauthn/config'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore in Server Component context
            }
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get existing credentials for this user (to exclude them)
    const { data: existingCredentials } = await supabase
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('user_id', user.id)

    const config = getServerWebAuthnConfig()

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName: config.rpName,
      rpID: config.rpID,
      userID: user.id,
      userName: user.email || user.id,
      userDisplayName: user.user_metadata?.full_name || user.email || 'User',
      // Don't re-register existing credentials
      excludeCredentials: existingCredentials?.map(cred => ({
        id: Buffer.from(cred.credential_id, 'base64url'),
        type: 'public-key',
      })) || [],
      authenticatorSelection: {
        // Platform authenticator = Face ID, Touch ID, Windows Hello
        authenticatorAttachment: 'platform',
        // Require user verification (biometric)
        userVerification: 'required',
        // Discoverable credentials for passwordless login
        residentKey: 'required',
      },
      // Support common algorithms
      supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
    })

    // Store challenge in database
    await supabase.from('webauthn_challenges').insert({
      user_id: user.id,
      challenge: options.challenge,
      type: 'registration',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
    })

    return NextResponse.json(options)
  } catch (error: any) {
    console.error('WebAuthn registration options error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate registration options' },
      { status: 500 }
    )
  }
}

