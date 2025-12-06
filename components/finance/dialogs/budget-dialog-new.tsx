// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { BudgetItemFormData } from '@/types/finance'

interface BudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BudgetDialog({ open, onOpenChange }: BudgetDialogProps) {
  const { createBudgetItem } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  
  const [formData, setFormData] = useState<BudgetItemFormData>({
    category: '',
    budgetedAmount: 0,
    month: currentMonth,
    year: now.getFullYear()
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await createBudgetItem(formData)
      onOpenChange(false)
      setFormData({
        category: '',
        budgetedAmount: 0,
        month: currentMonth,
        year: now.getFullYear()
      })
    } catch (error) {
      console.error('Error creating budget item:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add Budget Item</DialogTitle>
          <DialogDescription className="text-slate-400">
            Set a budget for a spending category
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="e.g., Housing, Food, Entertainment" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="Housing">Housing</SelectItem>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Shopping">Shopping</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
                <SelectItem value="Subscriptions">Subscriptions</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Personal Care">Personal Care</SelectItem>
                <SelectItem value="Pets">Pets</SelectItem>
                <SelectItem value="Gifts">Gifts</SelectItem>
                <SelectItem value="Savings">Savings</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Budgeted Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.budgetedAmount}
              onChange={(e) => setFormData({ ...formData, budgetedAmount: parseFloat(e.target.value) })}
              placeholder="0.00"
              className="bg-slate-900 border-slate-700 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Monthly Goal (optional)</Label>
            <Input
              placeholder="e.g., Save $500 for vacation"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-slate-900"
          >
            {loading ? 'Adding...' : 'Add Budget Item'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

