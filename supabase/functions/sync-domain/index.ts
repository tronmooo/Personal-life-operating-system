import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightResponse } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight with secure headers
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(req.headers.get('origin'))
  }

  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { domain_name, data } = await req.json()

    if (!domain_name) {
      return new Response(
        JSON.stringify({ error: 'domain_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert domain data
    const { data: result, error } = await supabase
      .from('domains')
      .upsert(
        {
          user_id: user.id,
          domain_name,
          data,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,domain_name',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error syncing domain:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

