// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { TransactionFormData } from '@/types/finance'

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDialog({ open, onOpenChange }: TransactionDialogProps) {
  const { createTransaction } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<TransactionFormData>({
    title: '',
    description: '',
    type: 'expense',
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    account: 'Checking',
    paymentMethod: 'debit'
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await createTransaction(formData)
      onOpenChange(false)
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'expense',
        category: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        account: 'Checking',
        paymentMethod: 'debit'
      })
    } catch (error) {
      console.error('Error creating transaction:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter the details of your transaction
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-slate-200">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-slate-900 border-slate-700 text-white"
              required
            />
          </div>
          
          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-slate-200">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-200">Description</Label>
            <Input
              id="description"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-slate-200">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Select or type above..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {formData.type === 'income' ? (
                  <>
                    <SelectItem value="Salary">Salary</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                    <SelectItem value="Investment Income">Investment Income</SelectItem>
                    <SelectItem value="Bonus">Bonus</SelectItem>
                    <SelectItem value="Other Income">Other Income</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="Groceries">Groceries</SelectItem>
                    <SelectItem value="Dining Out">Dining Out</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="Rent/Mortgage">Rent/Mortgage</SelectItem>
                    <SelectItem value="Subscriptions">Subscriptions</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-slate-200">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              placeholder="0.00"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          
          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="account" className="text-slate-200">Account</Label>
            <Select
              value={formData.account}
              onValueChange={(value) => setFormData({ ...formData, account: value })}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="Checking">Checking</SelectItem>
                <SelectItem value="Savings">Savings</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

