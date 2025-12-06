'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { DollarSign, Plus, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function BillsManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { bills, addBill, updateBill, deleteBill } = useData()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    dueDate: '',
    category: '',
    recurring: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addBill({
      ...formData,
      amount: parseFloat(formData.amount),
      status: 'pending',
    })
    setFormData({ title: '', amount: '', dueDate: '', category: '', recurring: false })
    setIsAddOpen(false)
  }

  const getStatusInfo = (bill: any) => {
    const today = new Date()
    const dueDate = new Date(bill.dueDate)
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (bill.status === 'paid') {
      return { color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle, label: 'Paid' }
    } else if (daysDiff < 0) {
      return { color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertCircle, label: `Overdue by ${Math.abs(daysDiff)} days` }
    } else if (daysDiff <= 3) {
      return { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertCircle, label: `Due in ${daysDiff} days` }
    } else {
      return { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Clock, label: `Due in ${daysDiff} days` }
    }
  }

  const sortedBills = [...bills].sort((a, b) => {
    if (a.status === 'paid' && b.status !== 'paid') return 1
    if (a.status !== 'paid' && b.status === 'paid') return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  const totalPending = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0)

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Bills & Payments
                </DialogTitle>
                <DialogDescription>
                  Total pending: {formatCurrency(totalPending)}
                </DialogDescription>
              </div>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bill
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {sortedBills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No bills yet. Add your first bill to track payments!</p>
              </div>
            ) : (
              sortedBills.map((bill) => {
                const statusInfo = getStatusInfo(bill)
                const StatusIcon = statusInfo.icon
                return (
                  <div
                    key={bill.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${statusInfo.bgColor} border-l-4`}
                  >
                    <div className="flex items-center space-x-3">
                      <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                      <div>
                        <p className="font-semibold">{bill.title}</p>
                        <p className="text-2xl font-bold">{formatCurrency(bill.amount)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {bill.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Due: {new Date(bill.dueDate).toLocaleDateString()}
                          </span>
                          {bill.recurring && (
                            <Badge variant="secondary" className="text-xs">Recurring</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {bill.status !== 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateBill(bill.id, { status: 'paid' })}
                        >
                          Mark Paid
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteBill(bill.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Bill Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Bill</DialogTitle>
            <DialogDescription>Track a new bill or payment</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Bill Name *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Electric Bill, Rent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Utilities, Housing"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="recurring" className="cursor-pointer">Recurring bill</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Bill</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}








