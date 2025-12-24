'use client'

import { useState } from 'react'
import { useSubscriptions, BillingType, RenewalType } from '@/lib/hooks/use-subscriptions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Loader2, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
    // NEW: Billing terms fields
    billing_type: 'recurring' as BillingType,
    renewal_type: 'auto' as RenewalType,
    contract_end_date: '',
    original_term_months: '',
    price_locked: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.service_name || !formData.cost || !formData.next_due_date) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate that one-time/lifetime subscriptions have an end date
    if ((formData.billing_type === 'one_time' || formData.billing_type === 'lifetime') && !formData.contract_end_date) {
      toast.error('Please specify an expiration date for one-time or lifetime subscriptions')
      return
    }

    setLoading(true)
    try {
      await createSubscription({
        ...formData,
        cost: parseFloat(formData.cost),
        original_term_months: formData.original_term_months ? parseInt(formData.original_term_months) : undefined,
        contract_end_date: formData.contract_end_date || undefined,
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
        billing_type: 'recurring',
        renewal_type: 'auto',
        contract_end_date: '',
        original_term_months: '',
        price_locked: false,
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

          {/* NEW: Billing Type and Renewal Settings */}
          <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-slate-200">Subscription Terms</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Set whether this is a recurring subscription or one-time purchase, and how it should renew.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billing_type" className="text-slate-300">
                  Billing Type
                </Label>
                <Select
                  value={formData.billing_type}
                  onValueChange={(value: BillingType) => {
                    setFormData({ 
                      ...formData, 
                      billing_type: value,
                      // Auto-set renewal type based on billing type
                      renewal_type: value === 'recurring' ? 'auto' : 'expires',
                      auto_renew: value === 'recurring',
                    })
                  }}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="recurring" className="text-white">Recurring</SelectItem>
                    <SelectItem value="one_time" className="text-white">One-Time Purchase</SelectItem>
                    <SelectItem value="lifetime" className="text-white">Lifetime Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="renewal_type" className="text-slate-300">
                  At Renewal
                </Label>
                <Select
                  value={formData.renewal_type}
                  onValueChange={(value: RenewalType) => setFormData({ ...formData, renewal_type: value })}
                  disabled={formData.billing_type !== 'recurring'}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="auto" className="text-white">Auto-Renews</SelectItem>
                    <SelectItem value="manual" className="text-white">Manual Renewal</SelectItem>
                    <SelectItem value="expires" className="text-white">Expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract_end_date" className="text-slate-300">
                  {formData.billing_type === 'recurring' ? 'Contract End Date' : 'Expiration Date'}
                  {(formData.billing_type === 'one_time' || formData.billing_type === 'lifetime') && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </Label>
                <Input
                  id="contract_end_date"
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-400">
                  {formData.billing_type === 'recurring' 
                    ? 'Optional: When the contract/commitment ends'
                    : 'When access expires'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="original_term_months" className="text-slate-300">
                  Term Length (Months)
                </Label>
                <Input
                  id="original_term_months"
                  type="number"
                  min="1"
                  placeholder="e.g., 12 for annual"
                  value={formData.original_term_months}
                  onChange={(e) => setFormData({ ...formData, original_term_months: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="price_locked"
                checked={formData.price_locked}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, price_locked: checked as boolean })
                }
                className="border-slate-700"
              />
              <Label
                htmlFor="price_locked"
                className="text-slate-300 cursor-pointer"
              >
                Price is locked for contract duration
              </Label>
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










