import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { COMMAND_CATALOG } from '@/lib/ai/command-catalog'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    catalog: COMMAND_CATALOG,
  })
}

















