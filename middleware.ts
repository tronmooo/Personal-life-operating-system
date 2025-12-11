import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// GUEST_MODE_ENABLED: v5 - With enhanced debug logging
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Create a simple pass-through response
  const response = NextResponse.next()

  // For non-API pages: ALWAYS allow through (guest viewing mode)
  // No authentication checks, no redirects
  if (!pathname.startsWith('/api/')) {
    return response
  }

  // For API routes, set up Supabase and check auth for write operations
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Public APIs - always allow
    const publicApiPaths = ['/api/auth', '/api/cron', '/api/webhooks', '/api/plaid/webhook']
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
