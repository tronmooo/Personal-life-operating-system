/**
 * WebAuthn Configuration
 * Centralized config for passkey/Face ID authentication
 */

// Get the RP (Relying Party) ID from environment or derive from hostname
export function getWebAuthnConfig() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // In production, use the actual domain
  // In development, use localhost
  const rpID = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || 
    (typeof window !== 'undefined' ? window.location.hostname : 'localhost')
  
  const rpName = process.env.NEXT_PUBLIC_APP_NAME || 'LifeHub'
  
  // Origin must match exactly what the browser sends
  const origin = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

  return {
    rpID,
    rpName,
    origin,
    // Allow credentials to be used across subdomains in production
    allowCredentials: isProduction,
  }
}

// Server-side config (doesn't use window)
export function getServerWebAuthnConfig() {
  const rpID = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || 'localhost'
  const rpName = process.env.NEXT_PUBLIC_APP_NAME || 'LifeHub'
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return {
    rpID,
    rpName,
    origin,
  }
}

