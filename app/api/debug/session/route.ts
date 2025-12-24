import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('🔍 DEBUG SESSION:', user?.email || 'No user', error?.message || '')
  
  return NextResponse.json({
    authenticated: !!user,
    userId: user?.id || null,
    userEmail: user?.email || null,
    authError: error?.message || null
  })
}

