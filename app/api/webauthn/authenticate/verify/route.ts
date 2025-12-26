import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { getServerWebAuthnConfig } from '@/lib/webauthn/config'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Use service role for credential lookup and session creation
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    const body = await request.json()
    const { credential } = body

    if (!credential) {
      return NextResponse.json({ error: 'Missing credential' }, { status: 400 })
    }

    // Get the credential ID from the response
    const credentialId = credential.id

    // Find the stored credential
    const { data: storedCredential, error: credError } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('credential_id', credentialId)
      .single()

    if (credError || !storedCredential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 400 })
    }

    // Get the challenge - look for recent authentication challenges
    const { data: challengeData, error: challengeError } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('type', 'authentication')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (challengeError || !challengeData) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 })
    }

    const config = getServerWebAuthnConfig()

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      authenticator: {
        credentialID: Buffer.from(storedCredential.credential_id, 'base64url'),
        credentialPublicKey: Buffer.from(storedCredential.public_key, 'base64url'),
        counter: storedCredential.counter,
      },
      requireUserVerification: true,
    })

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    // Update the credential counter and last used timestamp
    await supabase
      .from('webauthn_credentials')
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', storedCredential.id)

    // Clean up the used challenge
    await supabase.from('webauthn_challenges').delete().eq('id', challengeData.id)

    // Get the user
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      storedCredential.user_id
    )

    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    // Generate a magic link for the user to complete sign-in
    // This creates a proper Supabase session
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email!,
      options: {
        redirectTo: '/',
      },
    })

    if (linkError || !linkData) {
      console.error('Failed to generate magic link:', linkError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // Extract the token from the link
    const url = new URL(linkData.properties.action_link)
    const token = url.searchParams.get('token')
    const tokenType = url.searchParams.get('type') || 'magiclink'

    return NextResponse.json({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
      },
      // Return token info for client to complete auth
      token,
      tokenType,
    })
  } catch (error: any) {
    console.error('WebAuthn authentication verify error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify authentication' },
      { status: 500 }
    )
  }
}

