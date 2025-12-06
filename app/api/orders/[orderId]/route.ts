/**
 * Order Management API
 * Get, update, and manage individual orders
 */

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { orderService } from '@/lib/services/order-service'

// GET /api/orders/[orderId] - Get order details
export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orderSummary = await orderService.getOrderSummary(params.orderId)

    if (!orderSummary) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify user owns this order
    if (orderSummary.order.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(orderSummary)

  } catch (error: any) {
    console.error('[GET_ORDER_ERROR]', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

// PATCH /api/orders/[orderId] - Update order
export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status, note } = body

    // Get order to verify ownership
    const order = await orderService.getOrder(params.orderId)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update status
    if (status) {
      const result = await orderService.updateOrderStatus(
        params.orderId,
        status,
        note
      )

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to update order' },
          { status: 500 }
        )
      }
    }

    // Get updated order
    const updatedOrder = await orderService.getOrderSummary(params.orderId)

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })

  } catch (error: any) {
    console.error('[UPDATE_ORDER_ERROR]', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

// DELETE /api/orders/[orderId] - Cancel order
export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get order to verify ownership
    const order = await orderService.getOrder(params.orderId)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Only allow cancelling pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Order cannot be cancelled at this stage' },
        { status: 400 }
      )
    }

    const { reason } = await request.json().catch(() => ({ reason: undefined }))

    const result = await orderService.cancelOrder(params.orderId, reason)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to cancel order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    })

  } catch (error: any) {
    console.error('[CANCEL_ORDER_ERROR]', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}
















