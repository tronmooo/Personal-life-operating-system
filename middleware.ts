import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - this is critical!
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes that don't require authentication
  const publicPaths = [
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
    '/auth/login',
    '/auth/error',
    '/', // Allow home page - it will handle its own auth redirect
  ]
  
  const publicApiPaths = [
    '/api/vapi/webhook', // Webhook (must verify signature separately)
    '/api/ai-concierge/webhook', // Webhook (must verify signature separately)
    '/api/auth', // NextAuth routes
  ]
  
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )
  
  const isPublicApi = publicApiPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // Allow public paths and public APIs
  if (isPublicPath || isPublicApi) {
    return res
  }
  
  // Redirect to sign-in if not authenticated and trying to access protected pages
  if (!session && !req.nextUrl.pathname.startsWith('/api/')) {
    const redirectUrl = new URL('/auth/signin', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Protected routes that require authentication
  const protectedPaths = ['/api/']
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // Check authentication for protected API routes
  if (isProtectedPath && !session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return res
}

export const config = {
  matcher: [
    // Exclude static assets and PWA files from middleware to avoid auth redirects
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|icon.*\.png|icon\.svg|apple-touch-icon.*\.png).*)',
  ],
}

