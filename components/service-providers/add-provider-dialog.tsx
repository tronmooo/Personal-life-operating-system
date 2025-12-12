'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { CreateProviderInput, ProviderCategory } from '@/lib/hooks/use-service-providers'

interface AddProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateProviderInput) => Promise<unknown>
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'streaming', label: 'Streaming' },
  { value: 'software', label: 'Software' },
  { value: 'ai_tools', label: 'AI Tools' },
  { value: 'cloud_storage', label: 'Cloud Storage' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'music', label: 'Music' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'news', label: 'News' },
  { value: 'other', label: 'Other' },
]

const FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'weekly', label: 'Weekly' },
]

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Trial' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function AddProviderDialog({ open, onOpenChange, onSubmit }: AddProviderDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    provider_name: '',
    monthly_amount: '',
    frequency: 'monthly',
    subcategory: 'streaming',
    status: 'active',
    billing_day: '',
    payment_method: '',
    website: '',
    auto_pay_enabled: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.provider_name || !formData.monthly_amount) {
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        provider_name: formData.provider_name,
        category: 'subscriptions' as ProviderCategory, // Main category
        subcategory: formData.subcategory,
        monthly_amount: parseFloat(formData.monthly_amount),
        billing_day: formData.billing_day ? parseInt(formData.billing_day) : undefined,
        website: formData.website || undefined,
        auto_pay_enabled: formData.auto_pay_enabled,
      })

      // Reset form
      setFormData({
        provider_name: '',
        monthly_amount: '',
        frequency: 'monthly',
        subcategory: 'streaming',
        status: 'active',
        billing_day: '',
        payment_method: '',
        website: '',
        auto_pay_enabled: true,
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating provider:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Subscription</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Service Name */}
          <div className="space-y-2">
            <Label className="text-slate-300">Service Name</Label>
            <Input
              value={formData.provider_name}
              onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
              placeholder="e.g., Netflix"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          {/* Cost & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Cost</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.monthly_amount}
                  onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })}
                  placeholder="0.00"
                  className="bg-slate-800 border-slate-700 text-white pl-7"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value} className="text-white">
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Category</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-white">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value} className="text-white">
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Next Due Date */}
          <div className="space-y-2">
            <Label className="text-slate-300">Next Due Date</Label>
            <Input
              type="date"
              value={formData.billing_day ? `2025-01-${formData.billing_day.padStart(2, '0')}` : ''}
              onChange={(e) => {
                const date = new Date(e.target.value)
                setFormData({ ...formData, billing_day: date.getDate().toString() })
              }}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label className="text-slate-300">Payment Method</Label>
            <Input
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              placeholder="e.g., Visa •••• 4242"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Account URL */}
          <div className="space-y-2">
            <Label className="text-slate-300">Account URL</Label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://..."
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Auto-renew */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto_renew"
              checked={formData.auto_pay_enabled}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, auto_pay_enabled: checked as boolean })
              }
              className="border-slate-600 data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="auto_renew" className="text-slate-300 cursor-pointer">
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

