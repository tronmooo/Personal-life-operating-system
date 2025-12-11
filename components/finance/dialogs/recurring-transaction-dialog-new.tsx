// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { RecurringTransactionFormData } from '@/types/finance'

interface RecurringTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecurringTransactionDialog({ open, onOpenChange }: RecurringTransactionDialogProps) {
  const { createRecurringTransaction } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<RecurringTransactionFormData>({
    name: '',
    type: 'expense',
    category: '',
    amount: 0,
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    account: 'Checking'
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await createRecurringTransaction(formData)
      onOpenChange(false)
      setFormData({
        name: '',
        type: 'expense',
        category: '',
        amount: 0,
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        account: 'Checking'
      })
    } catch (error) {
      console.error('Error creating recurring transaction:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add Recurring Transaction</DialogTitle>
          <DialogDescription className="text-slate-400">
            Set up automatic transaction generation
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Description</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Monthly Salary, Netflix"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Type</Label>
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
                className="bg-slate-900 border-slate-700 text-white"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="e.g., Salary, Subscriptions" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {formData.type === 'income' ? (
                  <>
                    <SelectItem value="Salary">Salary</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                    <SelectItem value="Rental Income">Rental Income</SelectItem>
                    <SelectItem value="Investment Income">Investment Income</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="Subscriptions">Subscriptions</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Rent/Mortgage">Rent/Mortgage</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="Loan Payment">Loan Payment</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Day of Month</Label>
            <Input
              type="number"
              min="1"
              max="31"
              placeholder="1"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Account</Label>
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
              </SelectContent>
            </Select>
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Adding...' : 'Add Recurring Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

