// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { DebtFormData } from '@/types/finance'

interface DebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DebtDialog({ open, onOpenChange }: DebtDialogProps) {
  const { createDebt } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<DebtFormData>({
    name: '',
    creditor: '',
    loanType: 'personal',
    interestRate: 0,
    originalBalance: 0,
    currentBalance: 0,
    minimumPayment: 0,
    dueDate: ''
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await createDebt(formData)
      onOpenChange(false)
      setFormData({
        name: '',
        creditor: '',
        loanType: 'personal',
        interestRate: 0,
        originalBalance: 0,
        currentBalance: 0,
        minimumPayment: 0,
        dueDate: ''
      })
    } catch (error) {
      console.error('Error creating debt:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Liability</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter the details of your debt
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Creditor</Label>
            <Input
              value={formData.creditor}
              onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
              placeholder="e.g., BigBank Auto"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Loan Type</Label>
            <Input
              value={formData.loanType}
              onChange={(e) => setFormData({ ...formData, loanType: e.target.value as any })}
              placeholder="e.g., Car Loan, Credit Card"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Interest Rate (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.interestRate || ''}
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value ? parseFloat(e.target.value) : 0 })}
              placeholder="0.00"
              className="bg-slate-900 border-slate-700 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Original Balance</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.originalBalance || ''}
              onChange={(e) => setFormData({ ...formData, originalBalance: e.target.value ? parseFloat(e.target.value) : 0 })}
              placeholder="0.00"
              className="bg-slate-900 border-slate-700 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Current Balance</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.currentBalance || ''}
              onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value ? parseFloat(e.target.value) : 0 })}
              placeholder="0.00"
              className="bg-slate-900 border-slate-700 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Minimum Payment</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.minimumPayment || ''}
              onChange={(e) => setFormData({ ...formData, minimumPayment: e.target.value ? parseFloat(e.target.value) : 0 })}
              placeholder="0.00"
              className="bg-slate-900 border-slate-700 text-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Due Date (day of month)</Label>
            <Input
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              placeholder="e.g., 15th, 1st"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-slate-900"
          >
            {loading ? 'Adding...' : 'Add Liability'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}


