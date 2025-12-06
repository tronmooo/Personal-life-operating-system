import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    // Get all users (paginate if needed)
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    let processed = 0
    const today = new Date().toISOString().split('T')[0]

    for (const user of users.users) {
      const userId = user.id

      // Load counts quickly
      const [tasksCount, habitsCount, billsCount] = await Promise.all([
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('bills').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ])

      const data = {
        tasks: tasksCount.count || 0,
        habits: habitsCount.count || 0,
        bills: billsCount.count || 0,
        generated_at: new Date().toISOString(),
      }

      // Upsert daily snapshot
      await supabase
        .from('dashboard_aggregates')
        .upsert({ user_id: userId, snapshot_date: today as any, data })

      processed += 1
    }

    return NextResponse.json({ success: true, processed, date: today })
  } catch (error: any) {
    console.error('Nightly cron error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}








