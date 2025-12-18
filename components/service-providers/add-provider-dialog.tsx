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
import { Textarea } from '@/components/ui/textarea'
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

// Categories matching the screenshot exactly
const CATEGORIES: { value: ProviderCategory; label: string }[] = [
  { value: 'insurance', label: 'Insurance' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'telecom', label: 'Telecom' },
  { value: 'financial', label: 'Financial' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'other', label: 'Other' },
]

// Subcategories based on category
const SUBCATEGORIES: Record<ProviderCategory, { value: string; label: string }[]> = {
  insurance: [
    { value: 'Auto', label: 'Auto' },
    { value: 'Home', label: 'Home' },
    { value: 'Health', label: 'Health' },
    { value: 'Life', label: 'Life' },
    { value: 'Renters', label: 'Renters' },
    { value: 'Pet', label: 'Pet' },
    { value: 'Other', label: 'Other' },
  ],
  utilities: [
    { value: 'Electric', label: 'Electric' },
    { value: 'Gas', label: 'Gas' },
    { value: 'Water', label: 'Water' },
    { value: 'Trash', label: 'Trash' },
    { value: 'Sewer', label: 'Sewer' },
    { value: 'Other', label: 'Other' },
  ],
  telecom: [
    { value: 'Internet', label: 'Internet' },
    { value: 'Mobile', label: 'Mobile' },
    { value: 'Cable', label: 'Cable' },
    { value: 'Landline', label: 'Landline' },
    { value: 'Other', label: 'Other' },
  ],
  financial: [
    { value: 'Banking', label: 'Banking' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Investment', label: 'Investment' },
    { value: 'Loan', label: 'Loan' },
    { value: 'Other', label: 'Other' },
  ],
  subscriptions: [
    { value: 'Streaming', label: 'Streaming' },
    { value: 'Software', label: 'Software' },
    { value: 'Music', label: 'Music' },
    { value: 'Gaming', label: 'Gaming' },
    { value: 'News', label: 'News' },
    { value: 'Fitness', label: 'Fitness' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Other', label: 'Other' },
  ],
  other: [
    { value: 'Other', label: 'Other' },
  ],
}

export function AddProviderDialog({ open, onOpenChange, onSubmit }: AddProviderDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    provider_name: '',
    category: 'insurance' as ProviderCategory,
    subcategory: '',
    account_number: '',
    monthly_amount: '',
    billing_day: '1',
    phone: '',
    website: '',
    auto_pay_enabled: false,
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.provider_name) {
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        provider_name: formData.provider_name,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        account_number: formData.account_number || undefined,
        monthly_amount: parseFloat(formData.monthly_amount) || 0,
        billing_day: formData.billing_day ? parseInt(formData.billing_day) : undefined,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        auto_pay_enabled: formData.auto_pay_enabled,
        notes: formData.notes || undefined,
      })

      // Reset form
      setFormData({
        provider_name: '',
        category: 'insurance',
        subcategory: '',
        account_number: '',
        monthly_amount: '',
        billing_day: '1',
        phone: '',
        website: '',
        auto_pay_enabled: false,
        notes: '',
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating provider:', error)
    } finally {
      setLoading(false)
    }
  }

  const availableSubcategories = SUBCATEGORIES[formData.category] || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Provider</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Provider Name */}
          <div className="space-y-2">
            <Label className="text-slate-300">Provider Name *</Label>
            <Input
              value={formData.provider_name}
              onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
              placeholder="e.g., State Farm, Xfinity"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>

          {/* Category & Subcategory - Side by side matching screenshot */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: ProviderCategory) => 
                  setFormData({ ...formData, category: value, subcategory: '' })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-slate-700">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Subcategory</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {availableSubcategories.map((sub) => (
                    <SelectItem key={sub.value} value={sub.value} className="text-white hover:bg-slate-700">
                      {sub.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label className="text-slate-300">Account Number</Label>
            <Input
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              placeholder=""
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Monthly Amount & Billing Day - Side by side matching screenshot */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Monthly Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthly_amount}
                  onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })}
                  placeholder=""
                  className="bg-slate-800 border-slate-700 text-white pl-7 placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Billing Day</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={formData.billing_day}
                onChange={(e) => setFormData({ ...formData, billing_day: e.target.value })}
                placeholder="1"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Phone & Website - Side by side matching screenshot */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder=""
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Website</Label>
              <Input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="example.com"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Auto-pay checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto_pay"
              checked={formData.auto_pay_enabled}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, auto_pay_enabled: checked as boolean })
              }
              className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label htmlFor="auto_pay" className="text-slate-300 cursor-pointer">
              Auto-pay enabled
            </Label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-slate-300">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[80px] resize-y"
            />
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
                'Add Provider'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
