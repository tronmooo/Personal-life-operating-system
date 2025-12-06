import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log(`🗑️ Deleting all health entries for user: ${user.id}`)

    // Delete all health entries for this user
    const { data, error, count } = await supabase
      .from('domain_entries')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('domain', 'health')

    if (error) {
      console.error('❌ Delete failed:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully deleted ${count ?? 0} health entries`)

    return NextResponse.json({
      success: true,
      deletedCount: count ?? 0,
      message: `Deleted ${count ?? 0} health entries`
    })

  } catch (error: any) {
    console.error('❌ Server error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

