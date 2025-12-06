// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { BillFormData } from '@/types/finance'

interface BillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BillDialog({ open, onOpenChange }: BillDialogProps) {
  const { createBill } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<BillFormData>({
    name: '',
    provider: '',
    category: 'utilities',
    amount: 0,
    dueDate: '',
    recurring: true,
    frequency: 'monthly',
    isAutoPay: false,
    notes: ''
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await createBill(formData)
      onOpenChange(false)
      setFormData({
        name: '',
        provider: '',
        category: 'utilities',
        amount: 0,
        dueDate: '',
        recurring: true,
        frequency: 'monthly',
        isAutoPay: false,
        notes: ''
      })
    } catch (error) {
      console.error('Error creating bill:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Bill</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter your recurring bill details
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Provider</Label>
            <Input
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value, name: e.target.value })}
              placeholder="e.g., Netflix, Electric Company"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: any) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="housing">Housing</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              placeholder="0.00"
              className="bg-slate-900 border-slate-700 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Due Date</Label>
            <Input
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              placeholder="e.g., 15th, 1st"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-slate-200">Auto-Pay Enabled</Label>
            <Switch
              checked={formData.isAutoPay}
              onCheckedChange={(checked) => setFormData({ ...formData, isAutoPay: checked })}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Policy number, deductible, etc."
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              rows={3}
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-slate-900"
          >
            {loading ? 'Adding...' : 'Add Bill'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}


