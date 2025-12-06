// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TransactionType, TransactionCategory, BillFrequency, TRANSACTION_CATEGORY_LABELS, FREQUENCY_LABELS } from '@/types/finance'
import { format } from 'date-fns'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { useAuth } from '@/lib/providers/auth-provider'
import { toast } from 'sonner'

interface RecurringTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RecurringTransactionDialog({ open, onOpenChange, onSuccess }: RecurringTransactionDialogProps) {
  const supabase = createClientComponentClient()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as TransactionType,
    category: 'food' as TransactionCategory,
    amount: 0,
    frequency: 'monthly' as BillFrequency,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    next_due_date: format(new Date(), 'yyyy-MM-dd')
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('financial_recurring_transactions')
        .insert([{
          ...formData,
          user_id: user.id,
          is_active: true
        }])
      
      if (error) throw error
      
      toast.success('Recurring transaction added successfully')
      onOpenChange(false)
      onSuccess?.()
      
      // Reset form
      setFormData({
        name: '',
        type: 'expense',
        category: 'food',
        amount: 0,
        frequency: 'monthly',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        next_due_date: format(new Date(), 'yyyy-MM-dd')
      })
    } catch (error: any) {
      console.error('Error adding recurring transaction:', error)
      toast.error('Failed to add recurring transaction')
    } finally {
      setLoading(false)
    }
  }
  
  const getCategories = (): TransactionCategory[] => {
    if (formData.type === 'income') {
      return ['salary', 'freelance', 'investment-income', 'gift', 'refund', 'bonus', 'other-income']
    } else {
      return ['housing', 'transportation', 'food', 'utilities', 'insurance', 'healthcare', 'entertainment', 'shopping', 'personal-care', 'education', 'gifts', 'debt-payment', 'savings', 'other-expense']
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Recurring Transaction</DialogTitle>
          <DialogDescription>Set up automatic transaction generation</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Description</Label>
            <Input
              id="name"
              placeholder="e.g., Monthly Salary, Netflix"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: TransactionType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
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
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Salary, Subscriptions"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
              list="category-options"
              required
            />
            <datalist id="category-options">
              {getCategories().map((cat) => (
                <option key={cat} value={cat}>
                  {TRANSACTION_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </datalist>
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
          
          <div className="space-y-2">
            <Label htmlFor="next_due_date">Day of Month</Label>
            <Input
              id="next_due_date"
              type="number"
              min="1"
              max="31"
              placeholder="1"
              value={formData.next_due_date.split('-')[2] || '1'}
              onChange={(e) => {
                const day = e.target.value.padStart(2, '0')
                const yearMonth = format(new Date(), 'yyyy-MM')
                setFormData({ ...formData, next_due_date: `${yearMonth}-${day}` })
              }}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Recurring Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

