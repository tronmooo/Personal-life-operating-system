'use client'

import { useState } from 'react'
import { useSubscriptions } from '@/lib/hooks/use-subscriptions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AddSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSubscriptionDialog({ open, onOpenChange }: AddSubscriptionDialogProps) {
  const { createSubscription } = useSubscriptions()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    service_name: '',
    cost: '',
    frequency: 'monthly',
    category: 'streaming',
    status: 'active',
    next_due_date: '',
    payment_method: '',
    last_four: '',
    account_url: '',
    auto_renew: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.service_name || !formData.cost || !formData.next_due_date) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      await createSubscription({
        ...formData,
        cost: parseFloat(formData.cost),
      })
      
      // Reset form
      setFormData({
        service_name: '',
        cost: '',
        frequency: 'monthly',
        category: 'streaming',
        status: 'active',
        next_due_date: '',
        payment_method: '',
        last_four: '',
        account_url: '',
        auto_renew: true,
      })
      
      onOpenChange(false)
    } catch (error) {
      // Error handled by hook
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Subscription</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Service Name */}
          <div className="space-y-2">
            <Label htmlFor="service_name" className="text-slate-300">
              Service Name
            </Label>
            <Input
              id="service_name"
              value={formData.service_name}
              onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
              placeholder="e.g., Netflix"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          {/* Cost and Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost" className="text-slate-300">
                Cost
              </Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-slate-300">
                Frequency
              </Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                  <SelectItem value="yearly" className="text-white">Yearly</SelectItem>
                  <SelectItem value="quarterly" className="text-white">Quarterly</SelectItem>
                  <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                  <SelectItem value="daily" className="text-white">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-slate-300">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="streaming" className="text-white">Streaming</SelectItem>
                  <SelectItem value="software" className="text-white">Software</SelectItem>
                  <SelectItem value="ai_tools" className="text-white">AI Tools</SelectItem>
                  <SelectItem value="productivity" className="text-white">Productivity</SelectItem>
                  <SelectItem value="cloud_storage" className="text-white">Cloud Storage</SelectItem>
                  <SelectItem value="gaming" className="text-white">Gaming</SelectItem>
                  <SelectItem value="music" className="text-white">Music</SelectItem>
                  <SelectItem value="fitness" className="text-white">Fitness</SelectItem>
                  <SelectItem value="news" className="text-white">News</SelectItem>
                  <SelectItem value="other" className="text-white">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-slate-300">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="active" className="text-white">Active</SelectItem>
                  <SelectItem value="trial" className="text-white">Trial</SelectItem>
                  <SelectItem value="paused" className="text-white">Paused</SelectItem>
                  <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Next Due Date */}
          <div className="space-y-2">
            <Label htmlFor="next_due_date" className="text-slate-300">
              Next Due Date
            </Label>
            <Input
              id="next_due_date"
              type="date"
              value={formData.next_due_date}
              onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment_method" className="text-slate-300">
              Payment Method
            </Label>
            <Input
              id="payment_method"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              placeholder="e.g., Visa •••• 4242"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Account URL */}
          <div className="space-y-2">
            <Label htmlFor="account_url" className="text-slate-300">
              Account URL
            </Label>
            <Input
              id="account_url"
              type="url"
              value={formData.account_url}
              onChange={(e) => setFormData({ ...formData, account_url: e.target.value })}
              placeholder="https://..."
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Auto-renew checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto_renew"
              checked={formData.auto_renew}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, auto_renew: checked as boolean })
              }
              className="border-slate-700"
            />
            <Label
              htmlFor="auto_renew"
              className="text-slate-300 cursor-pointer"
            >
              Auto-renew enabled
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Subscription'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}




