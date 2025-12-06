'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Receipt, Plus, Trash2, DollarSign, Edit2, Save, X, Calendar, AlertCircle } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface Bill {
  id: string
  name: string
  amount: number
  dueDate: number // Day of month (1-31)
  category: 'utilities' | 'phone' | 'internet' | 'insurance' | 'rent' | 'mortgage' | 'subscription' | 'loan' | 'credit-card' | 'other'
  frequency: 'monthly' | 'weekly' | 'bi-weekly' | 'quarterly' | 'yearly'
  recurring: boolean
  status: 'paid' | 'pending' | 'overdue'
  autoPay: boolean
  lastPaid?: string
  nextDue?: string
  notes?: string
}

export function BillsManager() {
  const { addBill } = useData()
  const [bills, setBills] = useState<Bill[]>([])
  
  // Load initial bills from DataProvider (if any)
  useEffect(() => {
    // This component now treats DataProvider as source of truth; local UI state only mirrors.
  }, [])

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: '',
    category: 'utilities' as Bill['category'],
    frequency: 'monthly' as Bill['frequency'],
    recurring: true,
    autoPay: false,
    notes: ''
  })

  const saveBills = (newBills: Bill[]) => {
    setBills(newBills)
    // Persist new or updated bills to DataProvider
    newBills.forEach(bill => {
      addBill({
        title: bill.name,
        amount: bill.amount,
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), bill.dueDate).toISOString().split('T')[0],
        status: bill.status,
        category: 'Monthly',
        recurring: true
      })
    })
  }

  const calculateNextDue = (dueDay: number, frequency: Bill['frequency']): string => {
    const today = new Date()
    const nextDue = new Date(today.getFullYear(), today.getMonth(), dueDay)
    
    if (nextDue < today) {
      nextDue.setMonth(nextDue.getMonth() + 1)
    }
    
    return nextDue.toISOString().split('T')[0]
  }

  const handleAdd = () => {
    if (!formData.name || !formData.amount || !formData.dueDate) return

    const newBill: Bill = {
      id: Date.now().toString(),
      name: formData.name,
      amount: parseFloat(formData.amount),
      dueDate: parseInt(formData.dueDate),
      category: formData.category,
      frequency: formData.frequency,
      recurring: formData.recurring,
      status: 'pending',
      autoPay: formData.autoPay,
      nextDue: calculateNextDue(parseInt(formData.dueDate), formData.frequency),
      notes: formData.notes
    }

    saveBills([...bills, newBill])
    setFormData({ name: '', amount: '', dueDate: '', category: 'utilities', frequency: 'monthly', recurring: true, autoPay: false, notes: '' })
    setIsAdding(false)
  }

  const handleUpdate = (id: string) => {
    const updated = bills.map(b => 
      b.id === id
        ? {
            ...b,
            name: formData.name,
            amount: parseFloat(formData.amount),
            dueDate: parseInt(formData.dueDate),
            category: formData.category,
            frequency: formData.frequency,
            autoPay: formData.autoPay,
            notes: formData.notes
          }
        : b
    )
    saveBills(updated)
    setEditingId(null)
    setFormData({ name: '', amount: '', dueDate: '', category: 'utilities', frequency: 'monthly', recurring: true, autoPay: false, notes: '' })
  }

  const handleDelete = (id: string) => {
    saveBills(bills.filter(b => b.id !== id))
  }

  const markAsPaid = (id: string) => {
    const updated = bills.map(b => 
      b.id === id
        ? { ...b, status: 'paid' as const, lastPaid: new Date().toISOString() }
        : b
    )
    saveBills(updated)
  }

  const markAsPending = (id: string) => {
    const updated = bills.map(b => 
      b.id === id
        ? { ...b, status: 'pending' as const }
        : b
    )
    saveBills(updated)
  }

  const startEdit = (bill: Bill) => {
    setEditingId(bill.id)
    setFormData({
      name: bill.name,
      amount: bill.amount.toString(),
      dueDate: bill.dueDate.toString(),
      category: bill.category,
      frequency: bill.frequency,
      recurring: bill.recurring,
      autoPay: bill.autoPay,
      notes: bill.notes || ''
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ name: '', amount: '', dueDate: '', category: 'utilities', frequency: 'monthly', recurring: true, autoPay: false, notes: '' })
  }

  const totalMonthly = bills.reduce((sum, b) => sum + b.amount, 0)
  const unpaidBills = bills.filter(b => b.status !== 'paid')
  const unpaidTotal = unpaidBills.reduce((sum, b) => sum + b.amount, 0)

  // Check for overdue bills
  useEffect(() => {
    const today = new Date().getDate()
    const updated = bills.map(bill => {
      if (bill.status !== 'paid' && bill.dueDate < today) {
        return { ...bill, status: 'overdue' as const }
      }
      return bill
    })
    if (JSON.stringify(updated) !== JSON.stringify(bills)) {
      setBills(updated)
    }
  }, [bills])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-500" />
              Bills Tracker
            </CardTitle>
            <CardDescription>
              {bills.length} bills • ${totalMonthly.toFixed(2)}/month • ${unpaidTotal.toFixed(2)} unpaid
            </CardDescription>
          </div>
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bill
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <Card className="border-2 border-green-500/50">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Bill Name</Label>
                  <Input
                    placeholder="Electric Bill, Phone Bill, etc."
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="150.00"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Due Date (Day of Month)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as Bill['category'] })}
                  >
                    <option value="utilities">Utilities (Electric, Water, Gas)</option>
                    <option value="phone">Phone</option>
                    <option value="internet">Internet/Cable</option>
                    <option value="insurance">Insurance</option>
                    <option value="rent">Rent</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="subscription">Subscription</option>
                    <option value="loan">Loan Payment</option>
                    <option value="credit-card">Credit Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Frequency</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.frequency}
                    onChange={e => setFormData({ ...formData, frequency: e.target.value as Bill['frequency'] })}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly (every 3 months)</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label>Notes (Optional)</Label>
                  <Input
                    placeholder="Additional details..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.autoPay}
                      onChange={e => setFormData({ ...formData, autoPay: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Auto-Pay Enabled</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Add'} Bill
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bills List */}
        {bills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No bills tracked yet</p>
            <p className="text-sm mt-2">Add your first bill to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bills
              .sort((a, b) => a.dueDate - b.dueDate)
              .map(bill => (
              <Card key={bill.id} className={bill.status === 'overdue' ? 'border-red-500' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{bill.name}</span>
                        <Badge variant={
                          bill.status === 'paid' ? 'default' : 
                          bill.status === 'overdue' ? 'destructive' : 
                          'secondary'
                        }>
                          {bill.status}
                        </Badge>
                        {bill.autoPay && (
                          <Badge variant="outline" className="text-xs">Auto-Pay</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-bold text-lg">${bill.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {bill.dueDate}{bill.dueDate === 1 ? 'st' : bill.dueDate === 2 ? 'nd' : bill.dueDate === 3 ? 'rd' : 'th'} of month</span>
                        </div>
                        <span className="capitalize">{bill.frequency}</span>
                        <span className="capitalize">{bill.category.replace('-', ' ')}</span>
                      </div>
                      {bill.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{bill.notes}</p>
                      )}
                      {bill.lastPaid && (
                        <p className="text-xs text-green-600 mt-2">
                          Last paid: {new Date(bill.lastPaid).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {bill.status !== 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsPaid(bill.id)}
                          className="text-green-600"
                        >
                          Mark Paid
                        </Button>
                      )}
                      {bill.status === 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsPending(bill.id)}
                        >
                          Unpaid
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(bill)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(bill.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {bills.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-500/10 border-green-500/50">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Monthly</div>
                <div className="text-2xl font-bold text-green-600">
                  ${totalMonthly.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/10 border-orange-500/50">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Unpaid Bills</div>
                <div className="text-2xl font-bold text-orange-600">
                  {unpaidBills.length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/50">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Amount Due</div>
                <div className="text-2xl font-bold text-red-600">
                  ${unpaidTotal.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}






