import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// GUEST_MODE_ENABLED: v6 - FIX: Refresh session for ALL routes (not just API)
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // #region agent log
  if (pathname.includes('/api/subscriptions')) {
    console.log('🛡️ [MIDDLEWARE] Processing subscriptions request:', pathname)
    console.log('🛡️ [MIDDLEWARE] Cookies in request:', req.cookies.getAll().map(c => c.name).join(', '))
  }
  // #endregion
  
  // Create response that we'll modify with refreshed cookies
  const response = NextResponse.next()

  // Always create Supabase client and refresh session for ALL routes
  // This ensures the browser client gets valid session cookies
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // CRITICAL: Call getUser() on EVERY request to refresh session cookies
    // This ensures the browser client gets valid, refreshed session data
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // #region agent log
    if (pathname.includes('/api/subscriptions')) {
      console.log('🛡️ [MIDDLEWARE] Auth result for subscriptions:', { hasUser: !!user, userId: user?.id, authError: authError?.message })
    }
    // #endregion

    // For non-API pages: allow through (guest viewing mode) but with refreshed cookies
    if (!pathname.startsWith('/api/')) {
      return response
    }

    // Public APIs - always allow
    const publicApiPaths = ['/api/auth', '/api/cron', '/api/webhooks', '/api/plaid/webhook', '/api/voice', '/api/zillow-scrape', '/api/concierge', '/api/estimate']
    if (publicApiPaths.some(p => pathname.startsWith(p))) {
      return response
    }

    // Only check auth for write operations
    const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
    
    if (isWriteOperation && !user) {
      // Log auth failure for debugging
      console.log('[Middleware] Auth check failed:', {
        path: pathname,
        method: req.method,
        hasUser: !!user,
        authError: authError?.message,
        cookieCount: req.cookies.getAll().length
      })
      
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('[Middleware] Error:', error)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.ico).*)',
  ],
}
