import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Test endpoint to diagnose AI Assistant issues
 * GET /api/ai-assistant/test
 */
export async function GET(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      openaiKeyConfigured: false,
      openaiKeyValid: false,
      supabaseConfigured: false,
    },
    errors: [] as string[],
  }

  // Check OpenAI API key
  const openAIKey = process.env.OPENAI_API_KEY
  
  if (!openAIKey) {
    diagnostics.errors.push('OPENAI_API_KEY environment variable is not set')
  } else {
    diagnostics.checks.openaiKeyConfigured = true
    
    // Test the API key with a simple request
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
        },
      })
      
      if (response.ok) {
        diagnostics.checks.openaiKeyValid = true
      } else {
        const error = await response.text()
        diagnostics.errors.push(`OpenAI API key test failed: ${response.status} - ${error}`)
      }
    } catch (error: any) {
      diagnostics.errors.push(`OpenAI API request failed: ${error.message}`)
    }
  }

  // Check Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    diagnostics.errors.push('Supabase environment variables not configured')
  } else {
    diagnostics.checks.supabaseConfigured = true
  }

  const status = diagnostics.errors.length === 0 ? 200 : 500

  return NextResponse.json(diagnostics, { status })
}

