/**
 * Order Service
 * Manages order lifecycle from creation to completion
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface OrderItem {
  name: string
  quantity: number
  price: number
  notes?: string
  customizations?: string[]
}

export interface Order {
  id?: string
  userId: string
  businessId?: string
  businessName: string
  businessPhone?: string
  callId?: string
  
  items: OrderItem[]
  
  subtotal: number
  tax?: number
  deliveryFee?: number
  serviceFee?: number
  tip?: number
  totalPrice: number
  currency?: string
  
  orderType: 'delivery' | 'pickup' | 'dine-in'
  deliveryAddress?: string
  deliveryInstructions?: string
  scheduledTime?: Date
  estimatedTime?: string
  
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'failed'
  confirmationNumber?: string
  trackingUrl?: string
  
  orderMethod: 'phone' | 'api' | 'web' | 'manual'
  orderSource?: string
  
  specialRequests?: string
  contactPhone?: string
  contactEmail?: string
  
  paymentMethod?: string
  paymentStatus?: 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded'
  paymentId?: string
  
  metadata?: Record<string, any>
  notes?: string
}

export interface OrderSummary {
  order: Order
  estimatedDelivery?: string
  businessInfo?: {
    name: string
    phone: string
    address?: string
  }
  timeline?: OrderTimelineEvent[]
}

export interface OrderTimelineEvent {
  status: string
  note: string
  timestamp: Date
}

export class OrderService {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Create a new order
   */
  async createOrder(order: Order): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
    try {
      // Validate order
      const validation = this.validateOrder(order)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Calculate totals if not provided
      if (!order.subtotal) {
        order.subtotal = this.calculateSubtotal(order.items)
      }

      if (!order.totalPrice) {
        order.totalPrice = this.calculateTotal(order)
      }

      // Insert order
      const { data, error } = await (this.supabase
        .from('orders') as any)
        .insert({
          user_id: order.userId,
          business_id: order.businessId,
          call_id: order.callId,
          business_name: order.businessName,
          business_phone: order.businessPhone,
          items: order.items,
          subtotal: order.subtotal,
          tax: order.tax || 0,
          delivery_fee: order.deliveryFee || 0,
          service_fee: order.serviceFee || 0,
          tip: order.tip || 0,
          total_price: order.totalPrice,
          currency: order.currency || 'USD',
          order_type: order.orderType,
          delivery_address: order.deliveryAddress,
          delivery_instructions: order.deliveryInstructions,
          scheduled_time: order.scheduledTime?.toISOString(),
          estimated_time: order.estimatedTime,
          status: order.status || 'pending',
          confirmation_number: order.confirmationNumber,
          tracking_url: order.trackingUrl,
          order_method: order.orderMethod,
          order_source: order.orderSource,
          special_requests: order.specialRequests,
          contact_phone: order.contactPhone,
          contact_email: order.contactEmail,
          payment_method: order.paymentMethod,
          payment_status: order.paymentStatus || 'pending',
          payment_id: order.paymentId,
          metadata: order.metadata || {},
          notes: order.notes
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating order:', error)
        return { success: false, error: error.message }
      }

      return {
        success: true,
        orderId: data.id,
        orderNumber: data.order_number
      }

    } catch (error: any) {
      console.error('Order creation error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !data) return null

    return this.mapDbToOrder(data)
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single()

    if (error || !data) return null

    return this.mapDbToOrder(data)
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId: string, options: {
    limit?: number
    status?: string
    orderBy?: 'created_at' | 'scheduled_time'
  } = {}): Promise<Order[]> {
    const { limit = 50, status, orderBy = 'created_at' } = options

    let query = this.supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order(orderBy, { ascending: false }).limit(limit)

    const { data, error } = await query

    if (error || !data) return []

    return data.map(this.mapDbToOrder)
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    note?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: any = { status }

      // Set timestamp for specific statuses
      if (status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString()
      } else if (status === 'delivered') {
        updates.completed_at = new Date().toISOString()
      } else if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString()
      }

      const { error } = await (this.supabase
        .from('orders') as any)
        .update(updates)
        .eq('id', orderId)

      if (error) {
        return { success: false, error: error.message }
      }

      // Add note to history if provided
      if (note) {
        await (this.supabase
          .from('order_history') as any)
          .insert({
            order_id: orderId,
            status,
            note
          })
      }

      return { success: true }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateOrderStatus(orderId, 'cancelled', reason || 'Order cancelled by user')
  }

  /**
   * Get order timeline
   */
  async getOrderTimeline(orderId: string): Promise<OrderTimelineEvent[]> {
    const { data, error } = await (this.supabase
      .from('order_history') as any)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error || !data) return []

    return data.map((entry: any) => ({
      status: entry.status,
      note: entry.note,
      timestamp: new Date(entry.created_at)
    }))
  }

  /**
   * Get order summary with full details
   */
  async getOrderSummary(orderId: string): Promise<OrderSummary | null> {
    const order = await this.getOrder(orderId)
    if (!order) return null

    const timeline = await this.getOrderTimeline(orderId)

    // Get business info if available
    let businessInfo
    if (order.businessId) {
      const { data: business } = await (this.supabase
        .from('businesses') as any)
        .select('name, phone, address')
        .eq('id', order.businessId)
        .single()

      if (business) {
        businessInfo = {
          name: business.name,
          phone: business.phone,
          address: business.address
        }
      }
    }

    return {
      order,
      estimatedDelivery: order.estimatedTime,
      businessInfo: businessInfo || {
        name: order.businessName,
        phone: order.businessPhone || ''
      },
      timeline
    }
  }

  /**
   * Validate order
   */
  private validateOrder(order: Order): { valid: boolean; error?: string } {
    if (!order.userId) {
      return { valid: false, error: 'User ID is required' }
    }

    if (!order.businessName) {
      return { valid: false, error: 'Business name is required' }
    }

    if (!order.items || order.items.length === 0) {
      return { valid: false, error: 'Order must have at least one item' }
    }

    if (!order.orderType) {
      return { valid: false, error: 'Order type is required' }
    }

    if (order.orderType === 'delivery' && !order.deliveryAddress) {
      return { valid: false, error: 'Delivery address is required for delivery orders' }
    }

    return { valid: true }
  }

  /**
   * Calculate subtotal
   */
  private calculateSubtotal(items: OrderItem[]): number {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  /**
   * Calculate total
   */
  private calculateTotal(order: Order): number {
    return (
      order.subtotal +
      (order.tax || 0) +
      (order.deliveryFee || 0) +
      (order.serviceFee || 0) +
      (order.tip || 0)
    )
  }

  /**
   * Map database record to Order
   */
  private mapDbToOrder(record: any): Order {
    return {
      id: record.id,
      userId: record.user_id,
      businessId: record.business_id,
      businessName: record.business_name,
      businessPhone: record.business_phone,
      callId: record.call_id,
      items: record.items,
      subtotal: parseFloat(record.subtotal),
      tax: record.tax ? parseFloat(record.tax) : undefined,
      deliveryFee: record.delivery_fee ? parseFloat(record.delivery_fee) : undefined,
      serviceFee: record.service_fee ? parseFloat(record.service_fee) : undefined,
      tip: record.tip ? parseFloat(record.tip) : undefined,
      totalPrice: parseFloat(record.total_price),
      currency: record.currency,
      orderType: record.order_type,
      deliveryAddress: record.delivery_address,
      deliveryInstructions: record.delivery_instructions,
      scheduledTime: record.scheduled_time ? new Date(record.scheduled_time) : undefined,
      estimatedTime: record.estimated_time,
      status: record.status,
      confirmationNumber: record.confirmation_number,
      trackingUrl: record.tracking_url,
      orderMethod: record.order_method,
      orderSource: record.order_source,
      specialRequests: record.special_requests,
      contactPhone: record.contact_phone,
      contactEmail: record.contact_email,
      paymentMethod: record.payment_method,
      paymentStatus: record.payment_status,
      paymentId: record.payment_id,
      metadata: record.metadata,
      notes: record.notes
    }
  }
}

// Singleton instance
export const orderService = new OrderService()

