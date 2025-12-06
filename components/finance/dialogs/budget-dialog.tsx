// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFinance } from '@/lib/providers/finance-provider'
import { BudgetItemFormData, TransactionCategory, TRANSACTION_CATEGORY_LABELS } from '@/types/finance'

interface BudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BudgetDialog({ open, onOpenChange }: BudgetDialogProps) {
  const { createBudgetItem, currentMonth } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<BudgetItemFormData>({
    name: '',
    category: 'housing',
    budgeted_amount: 0,
    month: currentMonth
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await createBudgetItem(formData)
    
    setLoading(false)
    
    if (result) {
      onOpenChange(false)
      // Reset form
      setFormData({
        name: '',
        category: 'housing',
        budgeted_amount: 0,
        month: currentMonth
      })
    }
  }
  
  const expenseCategories: TransactionCategory[] = [
    'housing', 'transportation', 'food', 'utilities', 'insurance', 
    'healthcare', 'entertainment', 'shopping', 'personal-care', 
    'education', 'gifts', 'savings', 'other-expense'
  ]
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Budget Item</DialogTitle>
          <DialogDescription>Set a budget for a spending category</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Housing, Food, Entertainment"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              list="category-options"
              required
            />
            <datalist id="category-options">
              {expenseCategories.map((cat) => (
                <option key={cat} value={TRANSACTION_CATEGORY_LABELS[cat]} />
              ))}
            </datalist>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="budgeted_amount">Budgeted Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="budgeted_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.budgeted_amount || ''}
                onChange={(e) => setFormData({ ...formData, budgeted_amount: parseFloat(e.target.value) || 0 })}
                className="pl-7"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="goal">Monthly Goal (optional)</Label>
            <Input
              id="goal"
              placeholder="e.g., Save $500 for vacation"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Budget Item'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

