import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: req,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getUser() for reliable server-side auth verification
  // This also refreshes the auth token if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicPaths = [
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
    '/auth/login',
    '/auth/error',
  ]
  
  const publicApiPaths = [
    '/api/vapi/webhook', // Webhook (must verify signature separately)
    '/api/ai-concierge/webhook', // Webhook (must verify signature separately)
    '/api/auth', // NextAuth routes
    '/api/plaid/webhook', // Plaid webhook
  ]
  
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )
  
  const isPublicApi = publicApiPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // Allow public paths and public APIs
  if (isPublicPath || isPublicApi) {
    return supabaseResponse
  }
  
  // Redirect to sign-in if not authenticated and trying to access protected pages
  if (!user && !req.nextUrl.pathname.startsWith('/api/')) {
    const redirectUrl = new URL('/auth/signin', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Protected routes that require authentication
  const protectedPaths = ['/api/']
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // Check authentication for protected API routes
  if (isProtectedPath && !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Exclude static assets and PWA files from middleware to avoid auth redirects
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|icon.*\\.png|icon\\.svg|apple-touch-icon.*\\.png).*)',
  ],
}
