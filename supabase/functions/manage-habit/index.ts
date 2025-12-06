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

    const { action, habit_id, habit_data } = await req.json()

    let result
    let error

    switch (action) {
      case 'create':
        ({ data: result, error } = await supabase
          .from('habits')
          .insert({
            user_id: user.id,
            name: habit_data.name,
            icon: habit_data.icon || '✓',
            frequency: habit_data.frequency || 'daily',
            streak: 0,
            completion_history: [],
          })
          .select()
          .single())
        break

      case 'update':
        ({ data: result, error } = await supabase
          .from('habits')
          .update(habit_data)
          .eq('id', habit_id)
          .eq('user_id', user.id)
          .select()
          .single())
        break

      case 'toggle':
        // Get current habit
        const { data: habit, error: fetchError } = await supabase
          .from('habits')
          .select('*')
          .eq('id', habit_id)
          .eq('user_id', user.id)
          .single()

        if (fetchError || !habit) {
          return new Response(
            JSON.stringify({ error: 'Habit not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const today = new Date().toISOString().split('T')[0]
        const history = habit.completion_history || []
        
        // Toggle today's completion
        const updatedHistory = history.includes(today)
          ? history.filter((date: string) => date !== today)
          : [...history, today]

        // Calculate streak
        const sortedHistory = updatedHistory.sort().reverse()
        let streak = 0
        let currentDate = new Date()
        
        for (const date of sortedHistory) {
          const historyDate = new Date(date)
          const diffDays = Math.floor((currentDate.getTime() - historyDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (diffDays === streak) {
            streak++
          } else {
            break
          }
        }

        ({ data: result, error } = await supabase
          .from('habits')
          .update({
            completion_history: updatedHistory,
            streak: streak,
          })
          .eq('id', habit_id)
          .eq('user_id', user.id)
          .select()
          .single())
        break

      case 'delete':
        ({ data: result, error } = await supabase
          .from('habits')
          .delete()
          .eq('id', habit_id)
          .eq('user_id', user.id))
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

