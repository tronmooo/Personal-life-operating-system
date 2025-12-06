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

    const { month, categories, total_income, total_expenses } = await req.json()

    if (!month || !categories) {
      return new Response(
        JSON.stringify({ error: 'month and categories are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert budget for the month
    const { data: result, error } = await supabase
      .from('monthly_budgets')
      .upsert(
        {
          user_id: user.id,
          month,
          categories,
          total_income,
          total_expenses,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,month',
        }
      )
      .select()
      .single()

    if (error) {
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

