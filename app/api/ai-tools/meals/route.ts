import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get meal plans from domain_entries
    const { data, error } = await supabaseAdmin
      .from('domain_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('domain', 'meal_plans')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching meal plans:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform domain_entries to meal plan format
    const mealPlans = (data || []).map((entry: any) => ({
      id: entry.id,
      week_start: entry.metadata?.week_start || entry.created_at?.split('T')[0],
      meals: entry.metadata?.meals || {},
      grocery_list: entry.metadata?.grocery_list || [],
      dietary_preferences: entry.metadata?.dietary_preferences || [],
      created_at: entry.created_at
    }))

    return NextResponse.json({ data: mealPlans })
  } catch (error) {
    console.error('❌ Exception in GET /api/ai-tools/meals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Store in domain_entries for consistency
    const { data, error } = await supabaseAdmin
      .from('domain_entries')
      .insert({
        user_id: userId,
        domain: 'meal_plans',
        title: `Meal Plan - Week of ${body.week_start || new Date().toISOString().split('T')[0]}`,
        description: `7-day meal plan${body.dietary_preferences?.length ? ` (${body.dietary_preferences.join(', ')})` : ''}`,
        metadata: {
          week_start: body.week_start,
          meals: body.meals,
          grocery_list: body.grocery_list,
          dietary_preferences: body.dietary_preferences
        }
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating meal plan:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return in expected format
    const mealPlan = {
      id: data.id,
      week_start: data.metadata?.week_start || data.created_at?.split('T')[0],
      meals: data.metadata?.meals || {},
      grocery_list: data.metadata?.grocery_list || [],
      dietary_preferences: data.metadata?.dietary_preferences || [],
      created_at: data.created_at
    }

    return NextResponse.json({ data: mealPlan })
  } catch (error) {
    console.error('❌ Exception in POST /api/ai-tools/meals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Meal plan ID required' }, { status: 400 })
    }

    const userId = user.id
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error } = await supabaseAdmin
      .from('domain_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('domain', 'meal_plans')

    if (error) {
      console.error('❌ Error deleting meal plan:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Exception in DELETE /api/ai-tools/meals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
