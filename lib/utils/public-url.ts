/**
 * Compute a public base URL for server-side code.
 *
 * Why:
 * - Twilio webhooks + Media Streams must target a publicly reachable HTTPS domain
 * - When running behind a proxy/tunnel, `request.url` may not reflect the public origin unless we honor forwarded headers
 */

export function getPublicBaseUrl(request: Request): string {
  const headers = request.headers
  const xfProto = headers.get('x-forwarded-proto')
  const xfHost = headers.get('x-forwarded-host')
  
  // For tunnels (ngrok, localtunnel, cloudflare), prefer forwarded headers over env config
  // This ensures Twilio webhooks get the correct public URL
  if (xfHost && (xfHost.includes('.loca.lt') || xfHost.includes('ngrok') || xfHost.includes('trycloudflare.com'))) {
    const proto = xfProto || 'https'
    return `${proto}://${xfHost}`.replace(/\/$/, '')
  }
  
  // Use explicit configuration for production
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl && envUrl.trim().length > 0) return envUrl.replace(/\/$/, '')

  const host = xfHost || headers.get('host')
  const proto = xfProto || (host?.includes('localhost') ? 'http' : 'https')

  if (host) return `${proto}://${host}`.replace(/\/$/, '')

  // Fallback: whatever Next gives us
  return new URL(request.url).origin.replace(/\/$/, '')
}

export function getPublicWsBaseUrl(request: Request): string {
  const base = getPublicBaseUrl(request)
  return base.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
}


















