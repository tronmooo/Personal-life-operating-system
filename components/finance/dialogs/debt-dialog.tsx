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
import { DebtFormData, DebtType, DEBT_TYPE_LABELS } from '@/types/finance'
import { format } from 'date-fns'

interface DebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DebtDialog({ open, onOpenChange }: DebtDialogProps) {
  const { createDebt } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<DebtFormData>({
    name: '',
    type: 'credit-card',
    creditor: '',
    original_amount: 0,
    current_balance: 0,
    interest_rate: 0,
    minimum_payment: 0,
    due_date: '1',
    start_date: format(new Date(), 'yyyy-MM-dd')
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await createDebt(formData)
    
    setLoading(false)
    
    if (result) {
      onOpenChange(false)
      // Reset form
      setFormData({
        name: '',
        type: 'credit-card',
        creditor: '',
        original_amount: 0,
        current_balance: 0,
        interest_rate: 0,
        minimum_payment: 0,
        due_date: '1',
        start_date: format(new Date(), 'yyyy-MM-dd')
      })
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Liability</DialogTitle>
          <DialogDescription>Enter your debt details</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Debt Name</Label>
            <Input
              id="name"
              placeholder="e.g., Chase Credit Card, Student Loan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Loan Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: DebtType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEBT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="creditor">Creditor</Label>
              <Input
                id="creditor"
                placeholder="e.g., Chase, Discover"
                value={formData.creditor}
                onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="original_amount">Original Amount</Label>
              <Input
                id="original_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.original_amount || ''}
                onChange={(e) => setFormData({ ...formData, original_amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current_balance">Current Balance</Label>
              <Input
                id="current_balance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.current_balance || ''}
                onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interest_rate">Interest Rate (%)</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                value={formData.interest_rate || ''}
                onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimum_payment">Minimum Payment</Label>
              <Input
                id="minimum_payment"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.minimum_payment || ''}
                onChange={(e) => setFormData({ ...formData, minimum_payment: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="due_date">Payment Due Date</Label>
            <Input
              id="due_date"
              placeholder="e.g., 15th of each month"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Liability'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

