import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Auth callback error:', error)
        return NextResponse.redirect(new URL('/auth/signin?error=auth_failed', requestUrl.origin))
      }
      
      console.log('✅ Auth callback SUCCESS - User:', data.user?.email)
      
      // Store Google OAuth tokens for Calendar/Drive API access
      // These tokens come from the Supabase OAuth flow with Google
      if (data.session) {
        const { provider_token, provider_refresh_token } = data.session
        
        if (provider_token) {
          console.log('📝 Storing Google OAuth tokens for API access')
          
          // Use admin client to store tokens (bypasses RLS)
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          
          if (supabaseUrl && serviceRoleKey) {
            const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
              auth: { autoRefreshToken: false, persistSession: false }
            })
            
            // Store tokens in user_settings for later use by Calendar/Drive APIs
            const { error: upsertError } = await supabaseAdmin
              .from('user_settings')
              .upsert({
                user_id: data.user!.id,
                google_access_token: provider_token,
                google_refresh_token: provider_refresh_token || null,
                google_token_updated_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { 
                onConflict: 'user_id',
                ignoreDuplicates: false 
              })
            
            if (upsertError) {
              console.error('❌ Failed to store Google tokens:', upsertError)
            } else {
              console.log('✅ Google tokens stored successfully')
            }
          }
        }
      }
      
      // Create response with redirect
      const response = NextResponse.redirect(new URL(next, requestUrl.origin))
      
      // Ensure cookies are set
      response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate')
      
      return response
    } catch (error) {
      console.error('❌ Auth callback exception:', error)
      return NextResponse.redirect(new URL('/auth/signin?error=callback_error', requestUrl.origin))
    }
  }

  // No code, just redirect
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
}
