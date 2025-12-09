/**
 * Shared Supabase configuration for scripts
 * 
 * This module loads Supabase credentials from environment variables
 * instead of hardcoding them in each script file.
 * 
 * Usage:
 *   import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, createSupabaseClient } from './lib/supabase-config.js'
 *   const supabase = createSupabaseClient()
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load environment variables from .env.local in the project root
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '../..')

// Try to load from various env files
dotenv.config({ path: resolve(projectRoot, '.env.local') })
dotenv.config({ path: resolve(projectRoot, '.env') })

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Validate that required environment variables are set
 * Call this at the start of scripts that need Supabase access
 */
export function validateSupabaseEnv() {
  const missing = []
  
  if (!SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY')
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(v => console.error(`   - ${v}`))
    console.error('\nPlease ensure these are set in your .env.local file:')
    console.error(`   ${resolve(projectRoot, '.env.local')}\n`)
    console.error('Example .env.local:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
    console.error('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key')
    process.exit(1)
  }
  
  // Warn about placeholder values
  const placeholderPatterns = ['placeholder', 'your-project', 'dummy', 'example']
  const looksLikePlaceholder = (value) => 
    placeholderPatterns.some(p => value.toLowerCase().includes(p))
  
  if (looksLikePlaceholder(SUPABASE_URL)) {
    console.error('⚠️  SUPABASE_URL appears to be a placeholder value')
    console.error('   Please set the real URL in .env.local')
    process.exit(1)
  }
  
  console.log('✅ Supabase environment variables loaded')
  console.log(`   URL: ${SUPABASE_URL}`)
  console.log(`   Key: ${SUPABASE_SERVICE_ROLE_KEY.slice(0, 20)}...`)
}

/**
 * Create a Supabase client with service role privileges
 * Validates env vars before creating the client
 */
export function createSupabaseClient() {
  validateSupabaseEnv()
  
  // Dynamic import to avoid issues if @supabase/supabase-js isn't available
  return import('@supabase/supabase-js').then(({ createClient }) => {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  })
}

/**
 * Synchronous version - requires env validation first
 */
export function createSupabaseClientSync(createClient) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Call validateSupabaseEnv() before createSupabaseClientSync()')
  }
  
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}







