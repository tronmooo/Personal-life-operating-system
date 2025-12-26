import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { getServerWebAuthnConfig } from '@/lib/webauthn/config'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Use service role for unauthenticated passkey lookup
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

    const body = await request.json().catch(() => ({}))
    const { email } = body

    const config = getServerWebAuthnConfig()
    let allowCredentials: any[] | undefined = undefined

    // If email is provided, only allow credentials for that user
    if (email) {
      // First find the user by email
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
      
      if (!userError && userData?.users) {
        const users = userData.users as Array<{ id: string; email?: string }>
        const matchingUser = users.find(u => u.email === email)
        
        if (matchingUser) {
          const { data: credentials } = await supabase
            .from('webauthn_credentials')
            .select('credential_id, transports')
            .eq('user_id', matchingUser.id)

          if (credentials && credentials.length > 0) {
            allowCredentials = credentials.map(cred => ({
              id: Buffer.from(cred.credential_id, 'base64url'),
              type: 'public-key' as const,
              transports: cred.transports || ['internal'],
            }))
          }
        }
      }
    }

    // Generate authentication options
    // If no email provided or no credentials found, let the browser show all available passkeys
    const options = await generateAuthenticationOptions({
      rpID: config.rpID,
      userVerification: 'required',
      allowCredentials: allowCredentials,
    })

    // Store challenge for verification (use null user_id for unauthenticated requests)
    await supabase.from('webauthn_challenges').insert({
      user_id: null,
      challenge: options.challenge,
      type: 'authentication',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })

    return NextResponse.json(options)
  } catch (error: any) {
    console.error('WebAuthn authentication options error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate authentication options' },
      { status: 500 }
    )
  }
}

