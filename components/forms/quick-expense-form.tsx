'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { useTransactions } from '@/lib/hooks/use-transactions'

interface QuickExpenseFormProps {
  open: boolean
  onClose: () => void
}

const EXPENSE_CATEGORIES = [
  { value: 'food', label: '🍔 Food & Dining', color: 'bg-orange-500' },
  { value: 'transport', label: '🚗 Transportation', color: 'bg-blue-500' },
  { value: 'shopping', label: '🛍️ Shopping', color: 'bg-pink-500' },
  { value: 'bills', label: '💳 Bills & Utilities', color: 'bg-red-500' },
  { value: 'healthcare', label: '⚕️ Healthcare', color: 'bg-green-500' },
  { value: 'entertainment', label: '🎬 Entertainment', color: 'bg-purple-500' },
  { value: 'groceries', label: '🛒 Groceries', color: 'bg-emerald-500' },
  { value: 'housing', label: '🏠 Housing', color: 'bg-amber-500' },
  { value: 'education', label: '📚 Education', color: 'bg-indigo-500' },
  { value: 'travel', label: '✈️ Travel', color: 'bg-cyan-500' },
  { value: 'insurance', label: '🛡️ Insurance', color: 'bg-slate-500' },
  { value: 'other', label: '📦 Other', color: 'bg-gray-500' },
]

export function QuickExpenseForm({ open, onClose }: QuickExpenseFormProps) {
  const { add } = useTransactions()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [merchant, setMerchant] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return

    setIsSaving(true)

    const selectedCategory = EXPENSE_CATEGORIES.find(c => c.value === category)

    await add({
      date,
      name: description || merchant || selectedCategory?.label || 'Expense',
      amount: parseFloat(amount),
      merchant_name: merchant || null,
      user_category: category,
      notes: description || null,
      currency_code: 'USD',
      transaction_type: 'debit',
    })

    // Reset form
    setAmount('')
    setCategory('food')
    setMerchant('')
    setDescription('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setIsSaving(false)

    onClose()
  }

  const handleClose = () => {
    setAmount('')
    setCategory('food')
    setMerchant('')
    setDescription('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Add Expense
          </DialogTitle>
          <DialogDescription>
            Quickly log an expense. It will be saved to your financial domain.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant/Payee</Label>
            <Input
              id="merchant"
              placeholder="e.g., Starbucks, Amazon, etc."
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any notes about this expense..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !amount}>
              {isSaving ? 'Saving...' : 'Save Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


























