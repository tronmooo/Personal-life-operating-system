#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const dryRun = process.argv.includes('--dryRun')
  const defaults = {
    push_enabled: false,
    critical_enabled: true,
    important_enabled: true,
    info_enabled: true,
    daily_digest_time: '08:00',
    weekly_summary_day: 1,
  }

  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) throw usersError

  let created = 0
  for (const user of users.users) {
    const { data: existing, error: selectError } = await supabase
      .from('notification_settings')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (selectError && selectError.code !== 'PGRST116') throw selectError
    if (!existing && !dryRun) {
      const { error: insertError } = await supabase
        .from('notification_settings')
        .insert({ user_id: user.id, ...defaults })
      if (insertError) throw insertError
      created += 1
    }
  }

  console.log(JSON.stringify({ total: users.users.length, created, dryRun }))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})








