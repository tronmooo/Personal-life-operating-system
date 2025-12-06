'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle,
  Phone,
  MapPin,
  DollarSign,
  ChevronRight,
  Loader2
} from 'lucide-react'
import type { OrderSummary } from '@/lib/services/order-service'

interface OrderTrackingProps {
  orderId: string
  onClose?: () => void
}

export function OrderTracking({ orderId, onClose }: OrderTrackingProps) {
  const [orderData, setOrderData] = useState<OrderSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadOrder()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadOrder, 30000)
    return () => clearInterval(interval)
  }, [orderId])

  const loadOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load order')
      }

      setOrderData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User requested cancellation' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order')
      }

      // Reload order to show updated status
      await loadOrder()
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !orderData) {
    return (
      <div className="p-4 text-center text-red-600">
        {error || 'Order not found'}
      </div>
    )
  }

  const { order, businessInfo, timeline } = orderData

  const statusConfig = {
    pending: { label: 'Order Pending', color: 'bg-yellow-500', icon: Clock },
    confirmed: { label: 'Order Confirmed', color: 'bg-blue-500', icon: CheckCircle },
    preparing: { label: 'Being Prepared', color: 'bg-purple-500', icon: Package },
    ready: { label: 'Ready for Pickup/Delivery', color: 'bg-green-500', icon: Package },
    delivered: { label: 'Delivered', color: 'bg-green-600', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-gray-500', icon: XCircle },
    failed: { label: 'Failed', color: 'bg-red-500', icon: XCircle }
  }

  const currentStatus = statusConfig[order.status]
  const StatusIcon = currentStatus.icon

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Order Tracking</h2>
          <p className="text-muted-foreground">Order #{order.id?.slice(0, 8)}</p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>Close</Button>
        )}
      </div>

      {/* Current Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full ${currentStatus.color} flex items-center justify-center text-white`}>
              <StatusIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-lg">{currentStatus.label}</div>
              {order.estimatedTime && (
                <div className="text-sm text-muted-foreground">
                  Estimated time: {order.estimatedTime}
                </div>
              )}
            </div>
            {order.confirmationNumber && (
              <Badge variant="secondary">
                #{order.confirmationNumber}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {businessInfo?.name || order.businessName}
          </CardTitle>
          {businessInfo?.phone && (
            <CardDescription>{businessInfo.phone}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Badge variant={order.orderType === 'delivery' ? 'default' : 'secondary'}>
            {order.orderType === 'delivery' ? 'Delivery' : order.orderType === 'pickup' ? 'Pickup' : 'Dine-in'}
          </Badge>
          {order.deliveryAddress && (
            <div className="flex items-start gap-2 mt-3 text-sm">
              <MapPin className="h-4 w-4 mt-0.5" />
              <span>{order.deliveryAddress}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <div className="font-medium">
                    {item.quantity}x {item.name}
                  </div>
                  {item.customizations && item.customizations.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {item.customizations.join(', ')}
                    </div>
                  )}
                </div>
                <div className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}

            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.tax && order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
              )}
              {order.deliveryFee && order.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>${order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {order.tip && order.tip > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tip</span>
                  <span>${order.tip.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>${order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Timeline */}
      {timeline && timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    {index < timeline.length - 1 && (
                      <div className="h-full w-0.5 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="font-medium capitalize">{event.status.replace('_', ' ')}</div>
                    <div className="text-sm text-muted-foreground">{event.note}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {event.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {['pending', 'confirmed'].includes(order.status) && (
        <div className="flex gap-3">
          <Button
            variant="destructive"
            onClick={handleCancelOrder}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Order
          </Button>
        </div>
      )}
    </div>
  )
}
















