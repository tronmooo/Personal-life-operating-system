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
import { AccountFormData, AccountType, ACCOUNT_TYPE_LABELS } from '@/types/finance'
import { format } from 'date-fns'

interface AccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountDialog({ open, onOpenChange }: AccountDialogProps) {
  const { createAccount } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'checking',
    institution: '',
    balance: 0,
    opened_date: format(new Date(), 'yyyy-MM-dd'),
    is_active: true
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await createAccount(formData)
    
    setLoading(false)
    
    if (result) {
      onOpenChange(false)
      // Reset form
      setFormData({
        name: '',
        type: 'checking',
        institution: '',
        balance: 0,
        opened_date: format(new Date(), 'yyyy-MM-dd'),
        is_active: true
      })
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Financial Account</DialogTitle>
          <DialogDescription>Enter your account details</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g., Chase Checking, Capital One Savings"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Account Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: AccountType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                placeholder="e.g., Chase, Bank of America"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.balance || ''}
              onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          
          {formData.type === 'credit-card' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Credit Limit</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.credit_limit || ''}
                  onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minimum_payment">Minimum Payment</Label>
                <Input
                  id="minimum_payment"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.minimum_payment || ''}
                  onChange={(e) => setFormData({ ...formData, minimum_payment: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="account_number">Account Number (Last 4)</Label>
            <Input
              id="account_number"
              placeholder="****"
              maxLength={4}
              value={formData.account_number || ''}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
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
            {loading ? 'Adding...' : 'Add Account'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

