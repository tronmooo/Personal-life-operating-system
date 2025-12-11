// @ts-nocheck
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFinance } from '@/lib/providers/finance-provider-new'
import { InvestmentFormData } from '@/types/finance'

interface InvestmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvestmentDialog({ open, onOpenChange }: InvestmentDialogProps) {
  const { createInvestment } = useFinance()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<InvestmentFormData>({
    name: '',
    symbol: '',
    quantity: 0,
    purchasePrice: 0,
    currentPrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    investmentType: 'stock'
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await createInvestment(formData)
      onOpenChange(false)
      setFormData({
        name: '',
        symbol: '',
        quantity: 0,
        purchasePrice: 0,
        currentPrice: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        investmentType: 'stock'
      })
    } catch (error) {
      console.error('Error creating investment:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add Investment Holding</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter your investment details
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Symbol</Label>
              <Input
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="AAPL"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-200">Type</Label>
              <Select
                value={formData.investmentType}
                onValueChange={(value: any) => setFormData({ ...formData, investmentType: value })}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="bond">Bond</SelectItem>
                  <SelectItem value="etf">ETF</SelectItem>
                  <SelectItem value="mutual-fund">Mutual Fund</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Apple Inc."
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Shares</Label>
              <Input
                type="number"
                step="0.001"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-200">Cost/Share</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-200">Current</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.currentPrice}
                onChange={(e) => setFormData({ ...formData, currentPrice: parseFloat(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-200">Account</Label>
            <Select defaultValue="401(k)">
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="401(k)">401(k)</SelectItem>
                <SelectItem value="IRA">IRA</SelectItem>
                <SelectItem value="Brokerage">Brokerage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Adding...' : 'Add Holding'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}


