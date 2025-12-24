'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { format } from 'date-fns'

interface BudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BUDGET_CATEGORIES = [
  { value: 'Housing', label: 'Housing (Rent/Mortgage)' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Food', label: 'Food & Groceries' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Shopping', label: 'Shopping' },
  { value: 'Personal', label: 'Personal Care' },
  { value: 'Education', label: 'Education' },
  { value: 'Savings', label: 'Savings' },
  { value: 'Debt', label: 'Debt Payment' },
  { value: 'Other', label: 'Other' },
]

export function BudgetDialog({ open, onOpenChange }: BudgetDialogProps) {
  const { createBudgetItem } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  
  const [formData, setFormData] = useState({
    category: 'Housing',
    budgetedAmount: 0,
    month: currentMonth,
    year: now.getFullYear(),
    rollover: false
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
        category: 'Housing',
        budgetedAmount: 0,
        month: currentMonth,
        year: now.getFullYear(),
        rollover: false
      })
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Add Budget Category</DialogTitle>
          <DialogDescription className="text-slate-400">
            Set a monthly budget for a spending category. Spending will be automatically tracked from your transactions.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-slate-200">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {BUDGET_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-slate-200">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Transactions matching this category will be automatically counted toward this budget
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="budgetedAmount" className="text-slate-200">Monthly Budget</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <Input
                id="budgetedAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.budgetedAmount || ''}
                onChange={(e) => setFormData({ ...formData, budgetedAmount: parseFloat(e.target.value) || 0 })}
                className="pl-7 bg-slate-700/50 border-slate-600 text-slate-100"
                required
              />
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-800/50">
            <p className="text-sm text-blue-300">
              💡 <strong>Tip:</strong> When you add transactions with categories like "Housing", "Food", or "Transportation", 
              they will automatically be counted against your budget for that category.
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Budget Category'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
