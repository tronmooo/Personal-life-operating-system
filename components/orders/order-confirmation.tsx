'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  MapPin, 
  Clock, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import type { OrderItem } from '@/lib/services/order-service'

interface OrderConfirmationProps {
  businessName: string
  businessPhone?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  deliveryFee?: number
  tip?: number
  total: number
  orderType: 'delivery' | 'pickup' | 'dine-in'
  deliveryAddress?: string
  estimatedTime?: string
  onConfirm: (orderData: any) => Promise<void>
  onCancel: () => void
}

export function OrderConfirmation({
  businessName,
  businessPhone,
  items,
  subtotal,
  tax,
  deliveryFee = 0,
  tip = 0,
  total,
  orderType,
  deliveryAddress: initialDeliveryAddress,
  estimatedTime,
  onConfirm,
  onCancel
}: OrderConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState(initialDeliveryAddress || '')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [tipAmount, setTipAmount] = useState(tip)
  const [error, setError] = useState('')

  const finalTotal = total - tip + tipAmount

  const handleConfirm = async () => {
    setError('')
    setIsConfirming(true)

    try {
      // Validate
      if (orderType === 'delivery' && !deliveryAddress.trim()) {
        setError('Please enter a delivery address')
        setIsConfirming(false)
        return
      }

      await onConfirm({
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
        deliveryInstructions: orderType === 'delivery' ? deliveryInstructions : undefined,
        specialRequests,
        contactPhone,
        tip: tipAmount
      })
    } catch (err: any) {
      setError(err.message || 'Failed to place order')
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {businessName}
          </CardTitle>
          {businessPhone && (
            <CardDescription>{businessPhone}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={orderType === 'delivery' ? 'default' : 'secondary'}>
              {orderType === 'delivery' ? 'Delivery' : orderType === 'pickup' ? 'Pickup' : 'Dine-in'}
            </Badge>
            {estimatedTime && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{estimatedTime}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">
                    {item.quantity}x {item.name}
                  </div>
                  {item.customizations && item.customizations.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {item.customizations.join(', ')}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-sm text-muted-foreground italic">
                      {item.notes}
                    </div>
                  )}
                </div>
                <div className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
            )}
            
            {/* Tip Input */}
            <div className="flex justify-between items-center text-sm">
              <span>Tip</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                  className="w-20 h-8"
                />
              </div>
            </div>
            
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery/Pickup Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {orderType === 'delivery' ? 'Delivery Details' : 'Pickup Details'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderType === 'delivery' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                <div className="flex gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-2" />
                  <Textarea
                    id="deliveryAddress"
                    placeholder="Enter your delivery address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
                <Textarea
                  id="deliveryInstructions"
                  placeholder="e.g., Ring doorbell, Leave at door, etc."
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
            <Textarea
              id="specialRequests"
              placeholder="Any special requests or modifications?"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Info */}
      <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Before you confirm:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>The AI will call {businessName} to place your order</li>
                <li>You'll receive a confirmation once the order is accepted</li>
                <li>You can track your order status in the Orders section</li>
                <li>Total amount: ${finalTotal.toFixed(2)}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isConfirming}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="flex-1"
        >
          {isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm & Place Order
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
















