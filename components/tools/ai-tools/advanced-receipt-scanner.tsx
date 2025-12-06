'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Camera, Upload, Loader2, Download, TrendingUp, Calendar, DollarSign, Tag } from 'lucide-react'
import { useAITool } from '@/lib/hooks/use-ai-tool'

interface Receipt {
  id: string
  date: string
  merchant: string
  amount: number
  category: string
  taxDeductible: boolean
  items: Array<{ name: string; price: number; quantity: number }>
  paymentMethod?: string
  image?: string
}

export function AdvancedReceiptScanner() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [scanning, setScanning] = useState(false)
  const [activeTab, setActiveTab] = useState('scan')
  
  const { loading, performOCR, extractStructuredData, analyzeExpense } = useAITool()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    
    try {
      // Convert image to base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const imageBase64 = event.target?.result as string

        // Step 1: Perform OCR
        const ocrResult = await performOCR(imageBase64)
        
        // Step 2: Extract structured receipt data
        const receiptData = await extractStructuredData(
          ocrResult.text,
          {
            merchant: 'string',
            date: 'string (YYYY-MM-DD)',
            total: 'number',
            items: 'array of {name: string, price: number, quantity: number}',
            paymentMethod: 'string (optional)',
            taxAmount: 'number (optional)'
          },
          'Extract receipt information'
        )

        // Step 3: Analyze for categorization and tax deductibility
        const analysis = await analyzeExpense(
          `${receiptData.merchant} purchase`,
          receiptData.total
        )

        // Create receipt object
        const newReceipt: Receipt = {
          id: Date.now().toString(),
          date: receiptData.date || new Date().toISOString().split('T')[0],
          merchant: receiptData.merchant || 'Unknown',
          amount: receiptData.total || 0,
          category: analysis.category,
          taxDeductible: analysis.taxDeductible,
          items: receiptData.items || [],
          paymentMethod: receiptData.paymentMethod,
          image: imageBase64
        }

        setReceipts([newReceipt, ...receipts])
        setActiveTab('history')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Receipt scanning failed:', error)
    } finally {
      setScanning(false)
    }
  }

  const exportToCSV = () => {
    const csv = [
      ['Date', 'Merchant', 'Amount', 'Category', 'Tax Deductible', 'Payment Method'].join(','),
      ...receipts.map(r => [
        r.date,
        r.merchant,
        r.amount,
        r.category,
        r.taxDeductible ? 'Yes' : 'No',
        r.paymentMethod || 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = {
    total: receipts.reduce((sum, r) => sum + r.amount, 0),
    deductible: receipts.filter(r => r.taxDeductible).reduce((sum, r) => sum + r.amount, 0),
    count: receipts.length,
    thisMonth: receipts.filter(r => {
      const date = new Date(r.date)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).reduce((sum, r) => sum + r.amount, 0)
  }

  const categories = receipts.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-blue-500" />
            Advanced Receipt Scanner Pro
          </CardTitle>
          <CardDescription>
            AI-powered receipt scanning with automatic categorization, tax tracking, and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scan">Scan Receipt</TabsTrigger>
              <TabsTrigger value="history">History ({receipts.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="scan" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Upload Receipt Image</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Take a photo or upload an image of your receipt
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={scanning || loading}
                  className="max-w-xs mx-auto"
                />
                {(scanning || loading) && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Scanning receipt with AI...</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Scanned</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.count}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">${stats.total.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Tax Deductible</p>
                  <p className="text-2xl font-bold text-purple-600">${stats.deductible.toFixed(2)}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Receipt History</h3>
                {receipts.length > 0 && (
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                )}
              </div>

              {receipts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No receipts scanned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((receipt) => (
                    <Card key={receipt.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{receipt.merchant}</h4>
                              <Badge variant="outline">
                                <Tag className="mr-1 h-3 w-3" />
                                {receipt.category}
                              </Badge>
                              {receipt.taxDeductible && (
                                <Badge className="bg-green-500">Tax Deductible</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(receipt.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                ${receipt.amount.toFixed(2)}
                              </span>
                              {receipt.paymentMethod && (
                                <span>{receipt.paymentMethod}</span>
                              )}
                            </div>
                            {receipt.items && receipt.items.length > 0 && (
                              <div className="mt-3 text-sm">
                                <p className="font-semibold mb-1">Items:</p>
                                <ul className="space-y-1 text-muted-foreground">
                                  {receipt.items.slice(0, 3).map((item, i) => (
                                    <li key={i}>
                                      {item.quantity}x {item.name} - ${item.price.toFixed(2)}
                                    </li>
                                  ))}
                                  {receipt.items.length > 3 && (
                                    <li className="text-xs">+{receipt.items.length - 3} more items</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                          {receipt.image && (
                            <img 
                              src={receipt.image} 
                              alt="Receipt" 
                              className="w-20 h-20 object-cover rounded border"
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold text-blue-600">${stats.thisMonth.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Tax Deductible</p>
                      <p className="text-2xl font-bold text-green-600">${stats.deductible.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Receipts</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.count}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Avg. Amount</p>
                      <p className="text-2xl font-bold text-orange-600">
                        ${stats.count > 0 ? (stats.total / stats.count).toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Spending by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(categories).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No data yet. Scan some receipts to see analytics.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(categories)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, amount]) => {
                          const percentage = (amount / stats.total) * 100
                          return (
                            <div key={category}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">{category}</span>
                                <span className="text-sm font-bold">${amount.toFixed(2)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {percentage.toFixed(1)}% of total spending
                              </p>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}





