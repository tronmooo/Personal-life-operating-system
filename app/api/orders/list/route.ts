/**
 * List Orders API
 * Get user's order history
 */

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { orderService } from '@/lib/services/order-service'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    const orders = await orderService.getUserOrders(user.id, {
      status: status || undefined,
      limit
    })

    // Group by status for easy display
    const grouped = {
      active: orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)),
      completed: orders.filter(o => o.status === 'delivered'),
      cancelled: orders.filter(o => ['cancelled', 'failed'].includes(o.status))
    }

    return NextResponse.json({
      success: true,
      orders,
      grouped,
      total: orders.length
    })

  } catch (error: any) {
    console.error('[LIST_ORDERS_ERROR]', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}
















