'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Bell, Calendar, DollarSign, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { idbGet, idbSet } from '@/lib/utils/idb-cache'

interface Bill {
  id: string
  name: string
  amount: number
  dueDate: string
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time'
  category: string
  autopay: boolean
  reminderDays: number
  status: 'upcoming' | 'due-soon' | 'overdue' | 'paid'
}

export function BillReminderSystem() {
  const [bills, setBills] = useState<Bill[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // New bill form state
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly' as const,
    category: 'utilities',
    autopay: false,
    reminderDays: 3
  })

  useEffect(() => {
    loadBills()
  }, [])

  const loadBills = async () => {
    setLoading(true)
    try {
      // In production, fetch from API
      // For now, load from IndexedDB or use demo data
      const stored = await idbGet<Bill[]>('bills')
      if (stored) {
        setBills(stored.map((b: Bill) => ({
          ...b,
          status: calculateBillStatus(b.dueDate, b.reminderDays)
        })))
      } else {
        // Demo data
        setBills([
          {
            id: '1',
            name: 'Electric Bill',
            amount: 125.50,
            dueDate: '2024-11-15',
            frequency: 'monthly',
            category: 'utilities',
            autopay: true,
            reminderDays: 3,
            status: 'upcoming'
          },
          {
            id: '2',
            name: 'Internet',
            amount: 89.99,
            dueDate: '2024-11-10',
            frequency: 'monthly',
            category: 'utilities',
            autopay: false,
            reminderDays: 5,
            status: 'due-soon'
          },
          {
            id: '3',
            name: 'Car Insurance',
            amount: 450.00,
            dueDate: '2024-11-20',
            frequency: 'monthly',
            category: 'insurance',
            autopay: true,
            reminderDays: 7,
            status: 'upcoming'
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateBillStatus = (dueDate: string, reminderDays: number): Bill['status'] => {
    const due = new Date(dueDate)
    const today = new Date()
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) return 'overdue'
    if (daysUntilDue <= reminderDays) return 'due-soon'
    return 'upcoming'
  }

  const addBill = async () => {
    if (!newBill.name || !newBill.amount || !newBill.dueDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      })
      return
    }

    const bill: Bill = {
      id: Date.now().toString(),
      name: newBill.name,
      amount: parseFloat(newBill.amount),
      dueDate: newBill.dueDate,
      frequency: newBill.frequency,
      category: newBill.category,
      autopay: newBill.autopay,
      reminderDays: newBill.reminderDays,
      status: calculateBillStatus(newBill.dueDate, newBill.reminderDays)
    }

    const updated = [...bills, bill]
    setBills(updated)
    await idbSet('bills', updated)

    setNewBill({
      name: '',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      category: 'utilities',
      autopay: false,
      reminderDays: 3
    })
    setShowAddForm(false)

    toast({
      title: 'Bill Added!',
      description: `${bill.name} has been added to your reminders.`
    })
  }

  const deleteBill = async (id: string) => {
    const updated = bills.filter(b => b.id !== id)
    setBills(updated)
    await idbSet('bills', updated)

    toast({
      title: 'Bill Deleted',
      description: 'Bill reminder has been removed.'
    })
  }

  const markAsPaid = async (id: string) => {
    const updated = bills.map(b => 
      b.id === id ? { ...b, status: 'paid' as const } : b
    )
    setBills(updated)
    await idbSet('bills', updated)

    toast({
      title: 'Marked as Paid!',
      description: 'Bill has been marked as paid.'
    })
  }

  const getStatusColor = (status: Bill['status']) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'due-soon': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
  }

  const totalMonthlyBills = bills
    .filter(b => b.frequency === 'monthly')
    .reduce((sum, b) => sum + b.amount, 0)

  const upcomingBills = bills.filter(b => b.status === 'due-soon' || b.status === 'overdue')

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-4xl">🔔</span>
            Bill Reminder System
          </CardTitle>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bill
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Never miss a payment with AI-powered bill tracking and reminders
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Monthly Total</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    ${totalMonthlyBills.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Due Soon</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {upcomingBills.length}
                  </p>
                </div>
                <AlertCircle className="h-12 w-12 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Bills</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {bills.length}
                  </p>
                </div>
                <Bell className="h-12 w-12 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Bill Form */}
        {showAddForm && (
          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="text-lg">Add New Bill</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Bill Name *</Label>
                  <Input
                    placeholder="e.g., Electric Bill"
                    value={newBill.name}
                    onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={newBill.dueDate}
                    onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={newBill.frequency}
                    onValueChange={(value: any) => setNewBill({ ...newBill, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={newBill.category}
                    onValueChange={(value) => setNewBill({ ...newBill, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="subscriptions">Subscriptions</SelectItem>
                      <SelectItem value="rent">Rent/Mortgage</SelectItem>
                      <SelectItem value="loans">Loans</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Remind Me (days before)</Label>
                  <Select
                    value={newBill.reminderDays.toString()}
                    onValueChange={(value) => setNewBill({ ...newBill, reminderDays: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newBill.autopay}
                    onCheckedChange={(checked) => setNewBill({ ...newBill, autopay: checked })}
                  />
                  <Label>AutoPay Enabled</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={addBill} className="flex-1">Add Bill</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bills List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {bills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>No bills yet. Add your first bill to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{bill.name}</span>
                          {bill.autopay && <Badge variant="outline" className="text-xs">AutoPay</Badge>}
                          <Badge className={getStatusColor(bill.status)}>{bill.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Due: {new Date(bill.dueDate).toLocaleDateString()} • {bill.frequency} • {bill.category}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          ${bill.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {bill.status !== 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsPaid(bill.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBill(bill.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span>✨</span> Smart Features:
          </h4>
          <div className="grid md:grid-cols-2 gap-y-1">
            <div className="text-sm text-muted-foreground">• Automated reminders</div>
            <div className="text-sm text-muted-foreground">• Payment tracking</div>
            <div className="text-sm text-muted-foreground">• AutoPay detection</div>
            <div className="text-sm text-muted-foreground">• Recurring bill support</div>
            <div className="text-sm text-muted-foreground">• Category organization</div>
            <div className="text-sm text-muted-foreground">• Overdue alerts</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

