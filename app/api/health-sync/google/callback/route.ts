import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeCodeForToken } from '@/lib/integrations/google-fit'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/health-sync?error=missing_code`)

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/health-sync/google/callback`
    const token = await exchangeCodeForToken(code, redirectUri)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Identify current user via cookies is not available here; ask frontend to hit POST with session.
    // Fallback: store token-less, then the settings page will bind to the logged-in user via POST route.
    const stateUserId = request.nextUrl.searchParams.get('stateUserId')
    if (stateUserId) {
      await supabase.from('health_connections').upsert({
        user_id: stateUserId,
        provider: 'google_fit',
        scope: 'read',
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: new Date(Date.now() + (token.expires_in || 3600) * 1000).toISOString(),
      }, { onConflict: 'user_id,provider' })
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/health-sync?connected=google_fit`)
  } catch (e: any) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/health-sync?error=${encodeURIComponent(e.message)}`)
  }
}


