// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFinance } from '@/lib/providers/finance-provider'
import { format } from 'date-fns'

interface InvestmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvestmentDialog({ open, onOpenChange }: InvestmentDialogProps) {
  const { createInvestment, accounts } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'stock' as 'stock' | 'bond' | 'mutual-fund' | 'etf' | 'crypto' | 'real-estate' | 'other',
    quantity: 0,
    purchase_price: 0,
    current_price: 0,
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    account_id: ''
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await createInvestment(formData)
    
    setLoading(false)
    
    if (result) {
      onOpenChange(false)
      // Reset form
      setFormData({
        name: '',
        symbol: '',
        type: 'stock',
        quantity: 0,
        purchase_price: 0,
        current_price: 0,
        purchase_date: format(new Date(), 'yyyy-MM-dd'),
        account_id: ''
      })
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Investment Holding</DialogTitle>
          <DialogDescription>Enter your investment details</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                placeholder="AAPL"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="bond">Bond</SelectItem>
                  <SelectItem value="mutual-fund">Mutual Fund</SelectItem>
                  <SelectItem value="etf">ETF</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Apple Inc."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Shares</Label>
              <Input
                id="quantity"
                type="number"
                step="0.0001"
                min="0"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Cost/Share</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.purchase_price || ''}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current_price">Current</Label>
              <Input
                id="current_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.current_price || ''}
                onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select 
              value={formData.account_id || 'none'} 
              onValueChange={(value) => setFormData({ ...formData, account_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Account</SelectItem>
                <SelectItem value="401k">401(k)</SelectItem>
                <SelectItem value="ira">IRA</SelectItem>
                <SelectItem value="brokerage">Brokerage</SelectItem>
                {accounts.filter(a => a.type === 'investment' || a.type === 'retirement').map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Holding'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

