'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Download, Send, Plus, Trash2, Save, Eye, List } from 'lucide-react'
import { useAutoFillData } from '@/lib/tools/auto-fill'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

interface Invoice {
  id?: string
  invoice_number: string
  client_name: string
  client_email?: string
  client_address?: string
  items: { description: string; quantity: number; rate: number }[]
  subtotal: number
  tax: number
  total: number
  due_date?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  notes?: string
  created_at?: string
}

export function InvoiceGenerator() {
  const autoFillData = useAutoFillData()
  const { toast } = useToast()
  const [view, setView] = useState<'create' | 'list'>('create')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [items, setItems] = useState([{ description: '', quantity: 1, rate: 0 }])
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid' | 'overdue'>('draft')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (view === 'list') {
      fetchInvoices()
    }
  }, [view])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai-tools/invoices', {
        credentials: 'include'
      })
      if (response.ok) {
        const result = await response.json()
        setInvoices(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + tax

  const saveInvoice = async () => {
    if (!clientName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a client name.',
        variant: 'destructive'
      })
      return
    }

    if (items.length === 0 || !items.some(i => i.description.trim())) {
      toast({
        title: 'Missing Items',
        description: 'Please add at least one line item.',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/ai-tools/invoices', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          client_name: clientName,
          client_email: clientEmail,
          client_address: clientAddress,
          items: items.filter(i => i.description.trim()),
          subtotal,
          tax,
          total,
          due_date: dueDate || null,
          status,
          notes
        })
      })

      if (!response.ok) throw new Error('Failed to save invoice')

      const savedInvoice = await response.json()
      
      toast({
        title: 'Invoice Saved!',
        description: `Invoice ${invoiceNumber} has been saved successfully.`
      })

      // Reset form
      setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`)
      setClientName('')
      setClientEmail('')
      setClientAddress('')
      setItems([{ description: '', quantity: 1, rate: 0 }])
      setDueDate('')
      setStatus('draft')
      setNotes('')
      setView('list')
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save invoice.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const downloadPDF = async () => {
    try {
      const response = await fetch('/api/ai-tools/generate-pdf', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invoice',
          data: {
            invoice_number: invoiceNumber,
            client_name: clientName,
            client_email: clientEmail,
            client_address: clientAddress,
            items: items.filter(i => i.description.trim()),
            subtotal,
            tax,
            total,
            due_date: dueDate
          }
        })
      })

      if (!response.ok) throw new Error('Failed to generate PDF')

      const result = await response.json()
      
      // Open HTML in new window for printing
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(result.html)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (error: any) {
      toast({
        title: 'PDF Generation Failed',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      const response = await fetch(`/api/ai-tools/invoices?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setInvoices(invoices.filter(inv => inv.id !== id))
        toast({
          title: 'Invoice Deleted',
          description: 'Invoice has been removed successfully.'
        })
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete invoice.',
        variant: 'destructive'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (view === 'list') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-4xl">📝</span>
              My Invoices
            </CardTitle>
            <Button onClick={() => setView('create')}>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p>No invoices yet. Create your first invoice!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{invoice.invoice_number}</div>
                    <div className="text-sm text-muted-foreground">{invoice.client_name}</div>
                    <Badge className={`mt-1 ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${invoice.total?.toFixed(2) || '0.00'}
                      </div>
                      {invoice.created_at && (
                        <div className="text-sm text-muted-foreground">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => invoice.id && deleteInvoice(invoice.id)}
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
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-4xl">📝</span>
            AI Invoice Generator
          </CardTitle>
          <Button variant="outline" onClick={() => setView('list')}>
            <List className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate professional invoices with auto-fill and PDF export
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Header */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Invoice Number</Label>
            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </div>
          <div>
            <Label>Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        {/* Client Info */}
        <div className="space-y-3">
          <div>
            <Label>Client Name *</Label>
            <Input 
              placeholder="Enter client name..." 
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div>
            <Label>Client Email (Optional)</Label>
            <Input 
              type="email"
              placeholder="client@example.com" 
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Client Address (Optional)</Label>
            <Textarea 
              placeholder="Enter client address..." 
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-lg">Line Items *</Label>
            <Button onClick={addItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <Input 
                    placeholder="Description" 
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input 
                    type="number" 
                    placeholder="Qty" 
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-3">
                  <Input 
                    type="number" 
                    placeholder="Rate" 
                    value={item.rate}
                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status and Notes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes (Optional)</Label>
            <Input 
              placeholder="Additional notes..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Total Calculation */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-end items-center gap-4">
            <span className="text-sm text-muted-foreground">Subtotal:</span>
            <span className="text-lg font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-end items-center gap-4">
            <span className="text-sm text-muted-foreground">Tax (8%):</span>
            <span className="text-lg font-semibold">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-end items-center gap-4 border-t pt-2">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={saveInvoice} disabled={saving} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Invoice'}
          </Button>
          <Button variant="outline" onClick={downloadPDF} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* AI Suggestions */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span>✨</span> AI Features:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Automatic invoice number generation</li>
            <li>• Tax calculation (8% default)</li>
            <li>• Professional PDF export with print option</li>
            <li>• Status tracking (Draft, Sent, Paid, Overdue)</li>
            <li>• Client database integration</li>
            <li>• Persistent cloud storage</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}































