'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { DollarSign, CheckCircle } from 'lucide-react'

interface QuickIncomeFormProps {
  open: boolean
  onClose: () => void
}

export function QuickIncomeForm({ open, onClose }: QuickIncomeFormProps) {
  const { addData } = useData()
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [category, setCategory] = useState('salary')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    if (!amount || !source) {
      alert('Please fill in amount and source')
      return
    }

    setIsSaving(true)

    // Save to financial domain
    await addData('financial' as any, {
      metadata: {
        type: 'income',
        logType: 'income',
        amount: parseFloat(amount),
        source,
        category,
        date,
        description: `Income from ${source}`,
      },
      title: `Income: ${source}`
    })

    setIsSaving(false)
    
    // Reset form
    setAmount('')
    setSource('')
    setCategory('salary')
    setDate(new Date().toISOString().split('T')[0])
    
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Quick Income Entry
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              placeholder="e.g., Salary, Freelance, Bonus"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">💼 Salary</SelectItem>
                <SelectItem value="freelance">💻 Freelance</SelectItem>
                <SelectItem value="bonus">🎁 Bonus</SelectItem>
                <SelectItem value="investment">📈 Investment</SelectItem>
                <SelectItem value="business">🏢 Business</SelectItem>
                <SelectItem value="gift">🎉 Gift</SelectItem>
                <SelectItem value="refund">↩️ Refund</SelectItem>
                <SelectItem value="other">📋 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
            disabled={isSaving}
          >
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Add Income
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}





