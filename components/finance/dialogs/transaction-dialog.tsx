// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFinance } from '@/lib/providers/finance-provider'
import { TransactionFormData, TransactionType, TransactionCategory, TRANSACTION_CATEGORY_LABELS } from '@/types/finance'
import { format } from 'date-fns'

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDialog({ open, onOpenChange }: TransactionDialogProps) {
  const { createTransaction, accounts } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    category: 'food',
    amount: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    is_recurring: false
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await createTransaction(formData)
    
    setLoading(false)
    
    if (result) {
      onOpenChange(false)
      // Reset form
      setFormData({
        type: 'expense',
        category: 'food',
        amount: 0,
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        is_recurring: false
      })
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
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>Enter the details of your transaction</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          
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
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Brief description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                <SelectValue placeholder="Select or type above..." />
              </SelectTrigger>
              <SelectContent>
                {getCategories().map((cat) => (
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
            <Label htmlFor="account">Account</Label>
            <Select 
              value={formData.account_id || 'none'} 
              onValueChange={(value) => setFormData({ ...formData, account_id: value === 'none' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Account</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

