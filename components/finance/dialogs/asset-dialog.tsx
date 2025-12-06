// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFinance } from '@/lib/providers/finance-provider'
import { AssetFormData, AssetType, ASSET_TYPE_LABELS } from '@/types/finance'
import { format } from 'date-fns'

interface AssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssetDialog({ open, onOpenChange }: AssetDialogProps) {
  const { createAsset } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    type: 'cash',
    current_value: 0,
    is_liquid: true
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await createAsset(formData)
    
    setLoading(false)
    
    if (result) {
      onOpenChange(false)
      // Reset form
      setFormData({
        name: '',
        type: 'cash',
        current_value: 0,
        is_liquid: true
      })
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>Enter the details of your asset</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Asset Name</Label>
            <Input
              id="name"
              placeholder="e.g., Primary Checking"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: AssetType) => {
                const isLiquid = ['cash', 'bank-account', 'money-market'].includes(value)
                setFormData({ ...formData, type: value, is_liquid: isLiquid })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="current_value">Current Value</Label>
            <Input
              id="current_value"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.current_value || ''}
              onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purchase_date">Last Updated</Label>
            <Input
              id="purchase_date"
              type="date"
              value={formData.purchase_date || format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Account number, institution, etc."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Asset'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

