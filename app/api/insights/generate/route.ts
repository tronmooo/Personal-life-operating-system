import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateWeeklyInsightsForUser, saveInsights } from '@/lib/ai/insights-generator'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-token'
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Weekly run: iterate users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    let total = 0
    for (const user of users.users) {
      const userId = user.id
      // Load domains we actively use
      const domains = ['finance', 'health', 'vehicles', 'home', 'relationships', 'goals', 'nutrition']
      const data: Record<string, any[]> = {}
      for (const d of domains) {
        const { data: rows } = await supabase
          .from('domains')
          .select('data')
          .eq('user_id', userId)
          .eq('domain_name', d)
          .limit(1)
        data[d] = (rows?.[0]?.data as any[]) || []
      }

      const insights = await generateWeeklyInsightsForUser(userId, data)
      if (insights.length > 0) {
        await saveInsights(userId, insights)
        total += insights.length
      }
    }

    return NextResponse.json({ success: true, generated: total })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 })
  }
}


