/**
 * Place Order API
 * Handles order placement with user approval flow
 */

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { orderService, type Order, type OrderItem } from '@/lib/services/order-service'
import { businessSearch } from '@/lib/services/business-search'
import { userContextBuilder } from '@/lib/services/user-context-builder'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      businessName,
      businessPhone,
      businessId,
      items,
      orderType,
      deliveryAddress,
      deliveryInstructions,
      scheduledTime,
      specialRequests,
      contactPhone,
      tip,
      orderMethod = 'manual', // 'phone', 'api', 'web', 'manual'
      callId
    } = body

    // Validate required fields
    if (!businessName || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Business name and items are required' },
        { status: 400 }
      )
    }

    if (!orderType || !['delivery', 'pickup', 'dine-in'].includes(orderType)) {
      return NextResponse.json(
        { error: 'Valid order type required (delivery, pickup, or dine-in)' },
        { status: 400 }
      )
    }

    // Get user context for contact info
    const userContext = await userContextBuilder.buildFullContext(user.id)

    // Calculate pricing
    const subtotal = items.reduce((sum: number, item: OrderItem) => 
      sum + (item.price * item.quantity), 0
    )

    const deliveryFee = orderType === 'delivery' ? 3.50 : 0 // Standard delivery fee
    const tax = subtotal * 0.0825 // 8.25% tax (adjust based on location)
    const serviceFee = 0 // Optional service fee
    const tipAmount = tip || 0
    const totalPrice = subtotal + tax + deliveryFee + serviceFee + tipAmount

    // Prepare order
    const order: Order = {
      userId: user.id,
      businessId,
      businessName,
      businessPhone,
      callId,
      items,
      subtotal,
      tax,
      deliveryFee,
      serviceFee,
      tip: tipAmount,
      totalPrice,
      currency: 'USD',
      orderType,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      deliveryInstructions: orderType === 'delivery' ? deliveryInstructions : undefined,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      status: 'pending',
      orderMethod,
      specialRequests,
      contactPhone: contactPhone || userContext.user.phone || '',
      contactEmail: userContext.user.email,
      paymentMethod: 'card', // Default, should be selected by user
      paymentStatus: 'pending'
    }

    // Create order in database
    const result = await orderService.createOrder(order)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create order' },
        { status: 500 }
      )
    }

    // If order method is 'phone', initiate voice call via OpenAI + Twilio
    if (orderMethod === 'phone' && businessPhone) {
      try {
        await initiatePhoneOrder({
          orderId: result.orderId!,
          orderNumber: result.orderNumber!,
          business: {
            name: businessName,
            phone: businessPhone
          },
          items,
          orderType,
          deliveryAddress,
          specialRequests,
          userContext,
          userId: user.id
        })
      } catch (error) {
        console.error('Failed to initiate phone order:', error)
        // Don't fail the whole order, just log the error
      }
    }

    // Get full order summary
    const orderSummary = await orderService.getOrderSummary(result.orderId!)

    return NextResponse.json({
      success: true,
      order: orderSummary,
      message: orderMethod === 'phone' 
        ? 'Order created. AI is calling to place your order now.'
        : 'Order created successfully.'
    })

  } catch (error: any) {
    console.error('[PLACE_ORDER_ERROR]', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

/**
 * Initiate phone order via OpenAI Realtime + Twilio
 */
async function initiatePhoneOrder(params: {
  orderId: string
  orderNumber: string
  business: { name: string; phone: string }
  items: OrderItem[]
  orderType: string
  deliveryAddress?: string
  specialRequests?: string
  userContext: any
  userId: string
}) {
  // Check if voice calling is configured
  if (!process.env.OPENAI_API_KEY || !process.env.TWILIO_ACCOUNT_SID) {
    throw new Error('Voice calling not configured')
  }

  // Build order description
  const itemsList = params.items
    .map(item => `${item.quantity}x ${item.name}${item.customizations ? ' (' + item.customizations.join(', ') + ')' : ''}`)
    .join(', ')

  const orderDetails = `Order ${params.orderNumber}: ${itemsList}`
  
  const userRequest = `Place an order for ${params.orderType}. ${orderDetails}. ${
    params.deliveryAddress ? `Deliver to: ${params.deliveryAddress}. ` : ''
  }${params.specialRequests ? `Special requests: ${params.specialRequests}` : ''}`

  // Initiate call via voice API
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/voice/initiate-call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phoneNumber: params.business.phone,
      businessName: params.business.name,
      userRequest,
      category: 'order_placement',
      userName: params.userContext.user.name,
      userData: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        items: params.items,
        orderType: params.orderType,
        deliveryAddress: params.deliveryAddress,
        specialRequests: params.specialRequests
      }
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to initiate phone call')
  }

  return data
}
















