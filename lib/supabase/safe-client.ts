'use client'

import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

// Safe client that doesn't throw at module load time
let _browserClient: SupabaseClient | null = null

export function createSafeBrowserClient(): SupabaseClient | null {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safe-client.ts:createSafeBrowserClient-entry',message:'createSafeBrowserClient called',data:{hasCachedClient:!!_browserClient},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
  }
  // #endregion
  
  // Return cached client if exists
  if (_browserClient) {
    return _browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are not set, return null (for build time)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not found during client creation')
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safe-client.ts:env-missing',message:'CRITICAL: Env vars missing',data:{hasUrl:!!supabaseUrl,hasKey:!!supabaseAnonKey},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    }
    // #endregion
    return null
  }

  // Check for placeholder values
  const looksPlaceholder = (value: string) => {
    const lower = value.toLowerCase()
    return (
      lower.includes('your-project') ||
      lower.includes('placeholder') ||
      lower.includes('dummy') ||
      lower.includes('example')
    )
  }

  if (looksPlaceholder(supabaseUrl) || looksPlaceholder(supabaseAnonKey)) {
    console.warn('⚠️ Supabase credentials appear to be placeholder values')
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safe-client.ts:placeholder-values',message:'CRITICAL: Placeholder env vars',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    }
    // #endregion
    return null
  }

  _browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safe-client.ts:client-created',message:'New Supabase client created',data:{clientCreated:!!_browserClient},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
  }
  // #endregion

  return _browserClient
}

// Export a function to get the client (will return null if not configured)
export function getSafeBrowserClient(): SupabaseClient | null {
  return createSafeBrowserClient()
}






