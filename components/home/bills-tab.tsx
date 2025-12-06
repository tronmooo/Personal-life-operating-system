'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, DollarSign, Calendar } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface BillsTabProps {
  homeId: string
}

interface Bill {
  id: string
  billName: string
  amount: number
  dueDate: string
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time'
  category: 'mortgage' | 'utilities' | 'insurance' | 'tax' | 'other'
  autoPay: boolean
  provider?: string
  lastPaid?: string
}

export function BillsTab({ homeId }: BillsTabProps) {
  const { getData, addData, deleteData } = useData()
  const [bills, setBills] = useState<Bill[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    billName: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly' as Bill['frequency'],
    category: 'utilities' as Bill['category'],
    autoPay: false,
    provider: ''
  })

  useEffect(() => {
    loadBills()
  }, [homeId, getData])

  useEffect(() => {
    const handleUpdate = () => loadBills()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('home-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('home-data-updated', handleUpdate)
    }
  }, [homeId, getData])

  const loadBills = () => {
    const homeData = getData('home') as any[]
    const homeBills = homeData.filter(item => 
      item.metadata?.homeId === homeId && 
      item.metadata?.itemType === 'bill'
    ).map(item => ({
      id: item.id,
      billName: item.metadata?.billName || item.title || '',
      amount: Number(item.metadata?.amount) || 0,
      dueDate: item.metadata?.dueDate || '',
      frequency: item.metadata?.frequency || 'monthly',
      category: item.metadata?.category || 'utilities',
      autoPay: item.metadata?.autoPay || false,
      provider: item.metadata?.provider || '',
      lastPaid: item.metadata?.lastPaid
    }))
    
    setBills(homeBills)
    console.log(`💵 Loaded ${homeBills.length} bills for home ${homeId}`)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    await addData('home', {
      title: formData.billName,
      description: `${formData.frequency} ${formData.category} - $${formData.amount}`,
      metadata: {
        itemType: 'bill',
        homeId: homeId,
        billName: formData.billName,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        frequency: formData.frequency,
        category: formData.category,
        autoPay: formData.autoPay,
        provider: formData.provider
      }
    })
    
    console.log('✅ Bill saved to database')
    setFormData({
      billName: '',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      category: 'utilities',
      autoPay: false,
      provider: ''
    })
    setShowDialog(false)
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('home-data-updated'))
    }
    loadBills()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bill? This action cannot be undone.')) return
    
    setDeletingIds(prev => new Set(prev).add(id))
    setBills(prev => prev.filter(b => b.id !== id))
    
    try {
      await deleteData('home', id)
      console.log('✅ Bill deleted successfully')
      await loadBills() // Reload to stay in sync with database
    } catch (e) {
      console.error('❌ Failed to delete bill:', e)
      await loadBills() // Reload even on error to ensure UI consistency
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const totalMonthly = bills
    .filter(b => b.frequency === 'monthly')
    .reduce((sum, bill) => sum + bill.amount, 0)

  const billsByCategory = bills.reduce((acc, bill) => {
    const cat = bill.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(bill)
    return acc
  }, {} as Record<string, Bill[]>)

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      mortgage: '🏠',
      utilities: '💡',
      insurance: '🛡️',
      tax: '📋',
      other: '📄'
    }
    return icons[category] || '📄'
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Bill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bill Name *</Label>
                <Input
                  value={formData.billName}
                  onChange={(e) => setFormData({ ...formData, billName: e.target.value })}
                  placeholder="e.g., Mortgage, Electric Bill"
                  required
                />
              </div>
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Due Date (day of month)</Label>
                <Input
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  placeholder="e.g., 15th, 1st"
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: Bill['frequency']) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: Bill['category']) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mortgage">Mortgage</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="tax">Tax</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Provider</Label>
                <Input
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g., Bank of America"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoPay"
                checked={formData.autoPay}
                onChange={(e) => setFormData({ ...formData, autoPay: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="autoPay" className="cursor-pointer">Auto-pay enabled</Label>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Bill
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Summary Card */}
        <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Monthly Bills
              </h3>
              <p className="text-muted-foreground text-sm">Track your recurring expenses</p>
            </div>
            <Button 
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bill
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Monthly Expenses</p>
            <p className="text-3xl font-bold text-purple-600">${totalMonthly.toFixed(2)}</p>
          </div>
        </Card>

        {/* Bills by Category */}
        {bills.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No bills tracked yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(billsByCategory).map(([category, categoryBills]) => (
              <Card key={category} className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 capitalize">
                  <span className="text-2xl">{getCategoryIcon(category)}</span>
                  {category} ({categoryBills.length})
                </h4>
                
                <div className="space-y-3">
                  {categoryBills.map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h5 className="font-semibold">{bill.billName}</h5>
                          {bill.autoPay && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                              Auto-pay
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>${bill.amount.toFixed(2)}</span>
                          <span>•</span>
                          <span className="capitalize">{bill.frequency}</span>
                          {bill.dueDate && (
                            <>
                              <span>•</span>
                              <span>Due: {bill.dueDate}</span>
                            </>
                          )}
                        </div>
                        {bill.provider && (
                          <p className="text-xs text-muted-foreground mt-1">{bill.provider}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(bill.id)}
                        disabled={deletingIds.has(bill.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingIds.has(bill.id) ? (
                          <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}















