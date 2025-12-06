'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bell, Calendar, Plus, CheckCircle, AlertCircle, Trash2, Upload, Loader2, Camera } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAutoFillData } from '@/lib/tools/auto-fill'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Bill {
  id: string
  name: string
  amount: number
  dueDate: string
  status: 'paid' | 'upcoming' | 'overdue'
  autopay: boolean
  category?: string
}

export function BillAutomation() {
  const autoFillData = useAutoFillData()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newBill, setNewBill] = useState({ name: '', amount: '', dueDate: '1st', autopay: false, category: 'Utilities' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/ai-tools/budgets', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        const data = result.data || []
        // Filter for bills
        const billItems = data.filter((item: any) => item.type === 'bill')
        setBills(billItems.map((b: any) => ({
          id: b.id,
          name: b.name || b.title || 'Bill',
          amount: parseFloat(b.amount) || 0,
          dueDate: b.due_date || b.dueDate || '1st',
          status: b.status || 'upcoming',
          autopay: b.autopay || false,
          category: b.category
        })))
      }
    } catch (error) {
      console.error('Failed to fetch bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalMonthly = bills.reduce((sum, bill) => sum + bill.amount, 0)
  const autopayEnabled = bills.filter(b => b.autopay).length

  const handleFileUpload = async (file: File) => {
    setScanning(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', 'document')
      
      const ocrResponse = await fetch('/api/ai-tools/ocr', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (!ocrResponse.ok) {
        throw new Error('Failed to scan bill')
      }
      
      const ocrResult = await ocrResponse.json()
      const extractedData = ocrResult.data || {}
      
      // Save bill
      const response = await fetch('/api/ai-tools/budgets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bill',
          name: extractedData.title || extractedData.merchant_name || 'Scanned Bill',
          amount: extractedData.amount || extractedData.total || 0,
          due_date: extractedData.due_date || '1st',
          status: 'upcoming',
          autopay: false,
          category: extractedData.category || 'Utilities'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save bill')
      }
      
      const saved = await response.json()
      const newBillItem: Bill = {
        id: saved.data.id,
        name: saved.data.name,
        amount: parseFloat(saved.data.amount) || 0,
        dueDate: saved.data.due_date || '1st',
        status: 'upcoming',
        autopay: false,
        category: saved.data.category
      }
      
      setBills([newBillItem, ...bills])
      
      toast({
        title: 'Bill Scanned!',
        description: `Added: ${newBillItem.name} - $${newBillItem.amount.toFixed(2)}`
      })
    } catch (error: any) {
      toast({
        title: 'Scan Failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setScanning(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    e.target.value = ''
  }

  const handleAddManual = async () => {
    if (!newBill.name || !newBill.amount) {
      toast({
        title: 'Missing Information',
        description: 'Please enter bill name and amount.',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/ai-tools/budgets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bill',
          name: newBill.name,
          amount: parseFloat(newBill.amount),
          due_date: newBill.dueDate,
          status: 'upcoming',
          autopay: newBill.autopay,
          category: newBill.category
        })
      })

      if (!response.ok) throw new Error('Failed to save bill')

      const saved = await response.json()
      const billItem: Bill = {
        id: saved.data.id,
        name: saved.data.name,
        amount: parseFloat(saved.data.amount) || 0,
        dueDate: saved.data.due_date || '1st',
        status: 'upcoming',
        autopay: saved.data.autopay || false,
        category: saved.data.category
      }

      setBills([billItem, ...bills])
      setDialogOpen(false)
      setNewBill({ name: '', amount: '', dueDate: '1st', autopay: false, category: 'Utilities' })
      
      toast({
        title: 'Bill Added',
        description: `${billItem.name} - $${billItem.amount.toFixed(2)}`
      })
    } catch (error: any) {
      toast({
        title: 'Failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const deleteBill = async (id: string) => {
    try {
      const response = await fetch(`/api/ai-tools/budgets?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setBills(bills.filter(b => b.id !== id))
        toast({
          title: 'Deleted',
          description: 'Bill removed.'
        })
      }
    } catch (error) {
      toast({
        title: 'Failed',
        description: 'Could not delete bill.',
        variant: 'destructive'
      })
    }
  }

  const togglePaid = (id: string) => {
    setBills(bills.map(b => 
      b.id === id ? { ...b, status: b.status === 'paid' ? 'upcoming' : 'paid' as const } : b
    ))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-4xl">🔔</span>
          Bill Pay Automation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload bills or add them manually. Track payments and set reminders.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{bills.length}</div>
            <div className="text-sm text-muted-foreground">Active Bills</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${totalMonthly.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Monthly Total</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{autopayEnabled}</div>
            <div className="text-sm text-muted-foreground">AutoPay Enabled</div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          <Camera className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <h3 className="font-semibold mb-2">Scan Bill with AI</h3>
          <p className="text-sm text-muted-foreground mb-3">Upload a photo of your bill and AI will extract the details</p>
          <Button onClick={handleUploadClick} disabled={scanning}>
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Bill
              </>
            )}
          </Button>
        </div>

        {/* Bills List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Your Bills
            </h3>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Bill</DialogTitle>
                  <DialogDescription>
                    Add a recurring bill to track and automate payments
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Bill Name</Label>
                    <Input 
                      placeholder="e.g., Electricity" 
                      value={newBill.name}
                      onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Amount ($)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      value={newBill.amount}
                      onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Select value={newBill.dueDate} onValueChange={(v) => setNewBill({ ...newBill, dueDate: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <SelectItem key={day} value={`${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}`}>
                            {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={newBill.category} onValueChange={(v) => setNewBill({ ...newBill, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Internet">Internet/Phone</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Subscription">Subscription</SelectItem>
                        <SelectItem value="Rent">Rent/Mortgage</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddManual} className="w-full">Add Bill</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading bills...</p>
              </div>
            ) : bills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No bills added yet. Scan a bill or add one manually!</p>
              </div>
            ) : (
              bills.map((bill) => (
                <div key={bill.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => togglePaid(bill.id)}
                      className={`p-3 rounded-lg transition-colors ${
                        bill.status === 'paid' 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : 'bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                      }`}
                    >
                      {bill.status === 'paid' ? (
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </button>
                    <div>
                      <div className="font-semibold">{bill.name}</div>
                      <div className="text-sm text-muted-foreground">Due on {bill.dueDate} of each month</div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={bill.status === 'paid' ? 'default' : 'secondary'}>
                          {bill.status}
                        </Badge>
                        {bill.autopay && <Badge variant="outline">AutoPay</Badge>}
                        {bill.category && <Badge variant="outline">{bill.category}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="text-2xl font-bold">${bill.amount.toFixed(2)}</div>
                      <Button variant="ghost" size="sm" className="mt-1">
                        <Bell className="h-4 w-4 mr-2" />
                        Remind Me
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteBill(bill.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Insights */}
        {bills.length > 0 && autoFillData.income.monthly > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">💡 AI Insights:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Your bills represent {((totalMonthly / autoFillData.income.monthly) * 100).toFixed(0)}% of your monthly income</li>
              {bills.length > autopayEnabled && (
                <li>• Enable AutoPay on {bills.length - autopayEnabled} remaining bills to avoid late fees</li>
              )}
              <li>• Click the status icon to mark bills as paid/unpaid</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}































