/**
 * CORS Utility for Supabase Edge Functions
 * Provides secure CORS headers that only allow requests from authorized origins
 */

export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    // Allow localhost in development
    ...(Deno.env.get('NODE_ENV') === 'development' || Deno.env.get('DENO_ENV') === 'development'
      ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001']
      : []
    )
  ]

  // Check if the request origin is in the allowed list
  const origin = requestOrigin && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': origin || allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export function handleCorsPreflightResponse(requestOrigin?: string | null): Response {
  const corsHeaders = getCorsHeaders(requestOrigin)
  return new Response('ok', { headers: corsHeaders, status: 200 })
}



