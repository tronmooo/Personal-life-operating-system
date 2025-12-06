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

    const { action, task_id, task_data } = await req.json()

    let result
    let error

    switch (action) {
      case 'create':
        ({ data: result, error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: task_data.title,
            completed: task_data.completed || false,
            priority: task_data.priority || 'medium',
            due_date: task_data.due_date || null,
          })
          .select()
          .single())
        break

      case 'update':
        ({ data: result, error } = await supabase
          .from('tasks')
          .update(task_data)
          .eq('id', task_id)
          .eq('user_id', user.id)
          .select()
          .single())
        break

      case 'delete':
        ({ data: result, error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', task_id)
          .eq('user_id', user.id))
        break

      case 'toggle':
        ({ data: result, error } = await supabase
          .from('tasks')
          .update({ completed: task_data.completed })
          .eq('id', task_id)
          .eq('user_id', user.id)
          .select()
          .single())
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

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

