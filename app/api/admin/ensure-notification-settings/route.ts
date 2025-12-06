import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dryRun = searchParams.get('dryRun') === 'true'

    // Fetch all users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    if (usersError) throw usersError

    let created = 0
    const defaults = {
      push_enabled: false,
      critical_enabled: true,
      important_enabled: true,
      info_enabled: true,
      daily_digest_time: '08:00',
      weekly_summary_day: 1,
    }

    for (const user of users?.users || []) {
      const userId = user.id
      const { data: existing, error: selectError } = await supabaseAdmin
        .from('notification_settings')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (selectError && selectError.code !== 'PGRST116') throw selectError
      if (!existing && !dryRun) {
        const { error: insertError } = await supabaseAdmin
          .from('notification_settings')
          .insert({ user_id: userId, ...defaults })
        if (insertError) throw insertError
        created += 1
      }
    }

    return NextResponse.json({ success: true, total: users?.users.length || 0, created, dryRun })
  } catch (error: any) {
    console.error('ensure-notification-settings error:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}








