'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Receipt, Camera, Tag, TrendingDown, Sparkles, Trash2, Loader2, Plus } from 'lucide-react'
import { useAutoFillData } from '@/lib/tools/auto-fill'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Expense {
  id: string
  date: string
  merchant: string
  amount: number
  category: string
  autoDetected: boolean
}

const CATEGORIES = ['Groceries', 'Transportation', 'Entertainment', 'Dining', 'Shopping', 'Utilities', 'Healthcare', 'Gas', 'Other']

export function ExpenseTrackerAI() {
  const autoFillData = useAutoFillData()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [newExpense, setNewExpense] = useState({ merchant: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0] })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load expenses from API
  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/ai-tools/receipts', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        const data = result.data || []
        setExpenses(data.map((r: any) => ({
          id: r.id,
          date: r.date || new Date().toISOString().split('T')[0],
          merchant: r.merchant_name || 'Unknown',
          amount: parseFloat(r.amount) || 0,
          category: r.category || 'Other',
          autoDetected: true
        })))
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const categorySummary = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {} as Record<string, number>)

  const handleFileUpload = async (file: File) => {
    setScanning(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', 'receipt')
      
      const ocrResponse = await fetch('/api/ai-tools/ocr', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (!ocrResponse.ok) {
        throw new Error('Failed to scan receipt')
      }
      
      const ocrResult = await ocrResponse.json()
      const extractedData = ocrResult.data || {}
      
      // Save to database
      const saveResponse = await fetch('/api/ai-tools/receipts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_name: extractedData.merchant_name || 'Unknown',
          amount: extractedData.amount || 0,
          date: extractedData.date || new Date().toISOString().split('T')[0],
          category: extractedData.category || 'Other',
          items: extractedData.items || [],
          tax: extractedData.tax || 0
        })
      })
      
      if (!saveResponse.ok) {
        throw new Error('Failed to save expense')
      }
      
      const savedReceipt = await saveResponse.json()
      const newExpense: Expense = {
        id: savedReceipt.data.id,
        date: savedReceipt.data.date,
        merchant: savedReceipt.data.merchant_name,
        amount: parseFloat(savedReceipt.data.amount) || 0,
        category: savedReceipt.data.category,
        autoDetected: true
      }
      
      setExpenses([newExpense, ...expenses])
      
      toast({
        title: 'Receipt Scanned!',
        description: `Added expense: ${newExpense.merchant} - $${newExpense.amount.toFixed(2)}`
      })
    } catch (error: any) {
      toast({
        title: 'Scan Failed',
        description: error.message || 'Failed to scan receipt.',
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
    if (!newExpense.merchant || !newExpense.amount) {
      toast({
        title: 'Missing Information',
        description: 'Please enter merchant and amount.',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/ai-tools/receipts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_name: newExpense.merchant,
          amount: parseFloat(newExpense.amount),
          date: newExpense.date,
          category: newExpense.category
        })
      })

      if (!response.ok) throw new Error('Failed to save expense')

      const saved = await response.json()
      const expense: Expense = {
        id: saved.data.id,
        date: saved.data.date,
        merchant: saved.data.merchant_name,
        amount: parseFloat(saved.data.amount) || 0,
        category: saved.data.category,
        autoDetected: false
      }

      setExpenses([expense, ...expenses])
      setManualDialogOpen(false)
      setNewExpense({ merchant: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0] })
      
      toast({
        title: 'Expense Added',
        description: `${expense.merchant} - $${expense.amount.toFixed(2)}`
      })
    } catch (error: any) {
      toast({
        title: 'Failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      const response = await fetch(`/api/ai-tools/receipts?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setExpenses(expenses.filter(e => e.id !== id))
        toast({
          title: 'Deleted',
          description: 'Expense removed.'
        })
      }
    } catch (error) {
      toast({
        title: 'Failed',
        description: 'Could not delete expense.',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-green-500" />
            AI Expense Tracker
          </CardTitle>
          <CardDescription>
            Scan receipts, auto-categorize expenses, and get AI insights on spending patterns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Tracked</p>
              <p className="text-2xl font-bold text-red-600">
                ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Budget Remaining</p>
              <p className="text-2xl font-bold text-blue-600">
                ${Math.max(0, autoFillData.income.monthly - totalSpent - autoFillData.expenses.monthly).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold text-purple-600">
                {expenses.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={handleUploadClick} disabled={scanning}>
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Scan Receipt
            </>
          )}
        </Button>
        <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Manually
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Merchant</Label>
                <Input 
                  placeholder="Store name..." 
                  value={newExpense.merchant}
                  onChange={(e) => setNewExpense({ ...newExpense, merchant: e.target.value })}
                />
              </div>
              <div>
                <Label>Amount ($)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
              </div>
              <Button onClick={handleAddManual} className="w-full">Add Expense</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categorySummary).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(categorySummary)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span>{category}</span>
                </div>
                <span className="font-semibold">${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No expenses tracked yet. Scan a receipt or add one manually to get started!</p>
            </div>
          ) : (
            expenses.map(expense => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{expense.merchant}</p>
                    {expense.autoDetected && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI-detected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{expense.date} • {expense.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">${expense.amount.toFixed(2)}</p>
                  <Button variant="ghost" size="sm" onClick={() => deleteExpense(expense.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      {expenses.length > 0 && (
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              AI Spending Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {Object.keys(categorySummary).length > 0 && (
                <li className="flex items-start gap-2">
                  <TrendingDown className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Top spending category: {Object.entries(categorySummary).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Average transaction: ${(totalSpent / expenses.length || 0).toFixed(2)}</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 text-green-500 mt-0.5" />
                <span>{expenses.length} transactions tracked across {Object.keys(categorySummary).length} categories</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}































