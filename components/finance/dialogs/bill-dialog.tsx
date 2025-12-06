// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useFinance } from '@/lib/providers/finance-provider'
import { BillFormData, BillFrequency, TransactionCategory, FREQUENCY_LABELS, TRANSACTION_CATEGORY_LABELS } from '@/types/finance'

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
    amount: 0,
    due_date: '1',
    frequency: 'monthly',
    category: 'housing',
    is_autopay: false
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await createBill(formData)
    
    setLoading(false)
    
    if (result) {
      onOpenChange(false)
      // Reset form
      setFormData({
        name: '',
        provider: '',
        amount: 0,
        due_date: '1',
        frequency: 'monthly',
        category: 'housing',
        is_autopay: false
      })
    }
  }
  
  const expenseCategories: TransactionCategory[] = [
    'housing', 'transportation', 'food', 'utilities', 'insurance', 
    'healthcare', 'entertainment', 'shopping', 'personal-care', 
    'education', 'gifts', 'debt-payment', 'other-expense'
  ]
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Bill</DialogTitle>
          <DialogDescription>Enter your recurring bill details</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              placeholder="e.g., Netflix, Electric Company"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value, name: formData.name || e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value: TransactionCategory) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {TRANSACTION_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              placeholder="e.g., 15th, 1st"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select 
              value={formData.frequency} 
              onValueChange={(value: BillFrequency) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="autopay">Auto-Pay Enabled</Label>
              <p className="text-sm text-muted-foreground">Automatically paid from account</p>
            </div>
            <Switch
              id="autopay"
              checked={formData.is_autopay}
              onCheckedChange={(checked) => setFormData({ ...formData, is_autopay: checked })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Policy number, deductible, etc."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Bill'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

