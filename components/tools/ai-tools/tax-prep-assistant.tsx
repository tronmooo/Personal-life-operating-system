'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, CheckCircle, AlertCircle, Download, Sparkles, Loader2, Trash2, Camera } from 'lucide-react'
import { useAutoFillData } from '@/lib/tools/auto-fill'
import { useToast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TaxDocument {
  id: string
  type: string
  name: string
  status: 'uploaded' | 'processed'
  data?: Record<string, any>
  uploadedAt: string
}

export function TaxPrepAssistant() {
  const autoFillData = useAutoFillData()
  const [documents, setDocuments] = useState<TaxDocument[]>([])
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('W-2')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  const [estimatedRefund, setEstimatedRefund] = useState<number | null>(null)

  // Calculate estimated tax based on auto-filled data + uploaded docs
  const calculateTaxEstimate = () => {
    const income = autoFillData.income.annual
    const deductions = 14600 // Standard deduction for single filers 2024
    const taxableIncome = Math.max(0, income - deductions)
    
    // Simple tax bracket calculation (2024 rates)
    let tax = 0
    if (taxableIncome <= 11600) {
      tax = taxableIncome * 0.10
    } else if (taxableIncome <= 47150) {
      tax = 1160 + (taxableIncome - 11600) * 0.12
    } else if (taxableIncome <= 100525) {
      tax = 5426 + (taxableIncome - 47150) * 0.22
    } else {
      tax = 17168.50 + (taxableIncome - 100525) * 0.24
    }
    
    // Estimate withholding (assume 15% of income)
    const withheld = income * 0.15
    const refund = withheld - tax
    
    setEstimatedRefund(Math.round(refund))
    
    toast({
      title: 'Analysis Complete',
      description: `Estimated refund updated based on your data.`
    })
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', docType === 'W-2' ? 'w2' : 'document')
      
      const response = await fetch('/api/ai-tools/ocr', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to process document')
      }
      
      const result = await response.json()
      const extractedData = result.data || {}
      
      const newDoc: TaxDocument = {
        id: Date.now().toString(),
        type: docType,
        name: file.name,
        status: 'processed',
        data: extractedData,
        uploadedAt: new Date().toISOString()
      }
      
      setDocuments([newDoc, ...documents])
      
      toast({
        title: 'Document Processed',
        description: `Successfully extracted data from ${file.name}`
      })
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to process document.',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
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

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id))
    toast({
      title: 'Removed',
      description: 'Document removed.'
    })
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
            <FileText className="h-6 w-6 text-blue-500" />
            AI Tax Prep Assistant
          </CardTitle>
          <CardDescription>
            Upload your W-2s and documents. AI extracts data and estimates your tax return.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Annual Income</p>
              <p className="text-2xl font-bold text-blue-600">
                ${autoFillData.income.annual.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Deductions</p>
              <p className="text-2xl font-bold text-green-600">
                $14,600
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Est. Refund</p>
              <p className="text-2xl font-bold text-purple-600">
                {estimatedRefund !== null ? `$${estimatedRefund.toLocaleString()}` : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tax Documents</CardTitle>
            <div className="flex gap-2">
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="W-2">W-2</SelectItem>
                  <SelectItem value="1099">1099</SelectItem>
                  <SelectItem value="1098">1098 (Mortgage)</SelectItem>
                  <SelectItem value="Receipt">Deduction Receipt</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleUploadClick} disabled={uploading} size="sm">
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No tax documents uploaded yet.</p>
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-semibold">{doc.type}</p>
                    <p className="text-sm text-muted-foreground">{doc.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Processed</Badge>
                  <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={calculateTaxEstimate} className="flex-1">
          <Sparkles className="h-4 w-4 mr-2" />
          Calculate Estimate
        </Button>
        <Button variant="outline" className="flex-1" disabled={documents.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* AI Insights */}
      {estimatedRefund !== null && (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Tax Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>You qualify for the standard deduction of $14,600</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Your effective tax rate is {((autoFillData.income.annual - (estimatedRefund || 0)) / autoFillData.income.annual * 100).toFixed(1)}%</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Consider increasing 401(k) contributions to reduce taxable income</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}































