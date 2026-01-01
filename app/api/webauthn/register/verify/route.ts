import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
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

    const body = await request.json()
    const { credential, deviceName } = body

    if (!credential) {
      return NextResponse.json({ error: 'Missing credential' }, { status: 400 })
    }

    // Get the stored challenge
    const { data: challengeData, error: challengeError } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'registration')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (challengeError || !challengeData) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 })
    }

    const config = getServerWebAuthnConfig()

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    const { credentialID, credentialPublicKey, counter, credentialBackedUp, credentialDeviceType } = 
      verification.registrationInfo

    // Store the credential
    const { error: insertError } = await supabase.from('webauthn_credentials').insert({
      user_id: user.id,
      credential_id: Buffer.from(credentialID).toString('base64url'),
      public_key: Buffer.from(credentialPublicKey).toString('base64url'),
      counter: counter,
      device_type: credentialDeviceType,
      transports: credential.response.transports || [],
      device_name: deviceName || getDefaultDeviceName(),
      backed_up: credentialBackedUp,
    })

    if (insertError) {
      console.error('Failed to store credential:', insertError)
      return NextResponse.json({ error: 'Failed to store credential' }, { status: 500 })
    }

    // Clean up the used challenge
    await supabase.from('webauthn_challenges').delete().eq('id', challengeData.id)

    return NextResponse.json({ 
      success: true,
      message: 'Passkey registered successfully'
    })
  } catch (error: any) {
    console.error('WebAuthn registration verify error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify registration' },
      { status: 500 }
    )
  }
}

function getDefaultDeviceName(): string {
  // This runs on server, so we can't detect the actual device
  // The client should pass the device name
  return 'Unknown Device'
}














