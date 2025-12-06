// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { AssetFormData } from '@/types/finance'

interface AssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssetDialog({ open, onOpenChange }: AssetDialogProps) {
  const { createAsset } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    assetType: 'other',
    currentValue: 0,
    purchasePrice: 0,
    purchaseDate: '',
    notes: ''
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await createAsset(formData)
      onOpenChange(false)
      setFormData({
        name: '',
        assetType: 'other',
        currentValue: 0,
        purchasePrice: 0,
        purchaseDate: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error creating asset:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter the details of your asset
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Asset Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Primary Checking"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Type</Label>
            <Select
              value={formData.assetType}
              onValueChange={(value: any) => setFormData({ ...formData, assetType: value })}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="valuables">Valuables</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Current Value</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.currentValue}
              onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) })}
              placeholder="0.00"
              className="bg-slate-900 border-slate-700 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Last Updated</Label>
            <Input
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Account number, institution, etc."
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              rows={3}
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-slate-900"
          >
            {loading ? 'Adding...' : 'Add Asset'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}


