'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, CheckCircle, Download, Sparkles, Loader2, Trash2 } from 'lucide-react'
import { useAutoFillData } from '@/lib/tools/auto-fill'
import { toast } from '@/lib/utils/toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TaxDocument {
  id: string
  document_type: string
  tax_year: number
  employer_name?: string
  wages?: number
  federal_tax_withheld?: number
  status: 'uploaded' | 'processed'
  raw_data?: Record<string, any>
  created_at?: string
}

export function TaxPrepAssistant() {
  const autoFillData = useAutoFillData()
  const [documents, setDocuments] = useState<TaxDocument[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [docType, setDocType] = useState('W-2')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [estimatedRefund, setEstimatedRefund] = useState<number | null>(null)

  // Load existing tax documents on mount
  useEffect(() => {
    fetchTaxDocuments()
  }, [])

  const fetchTaxDocuments = async () => {
    try {
      const response = await fetch('/api/ai-tools/tax-documents', { credentials: 'include' })
      if (response.ok) {
        const result = await response.json()
        setDocuments((result.data || []).map((doc: any) => ({
          ...doc,
          status: 'processed'
        })))
      }
    } catch (error) {
      console.error('Failed to fetch tax documents:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate total income from W-2s
  const totalWages = documents.reduce((sum, doc) => sum + (doc.wages || 0), 0)
  const totalWithheld = documents.reduce((sum, doc) => sum + (doc.federal_tax_withheld || 0), 0)
  const effectiveIncome = totalWages > 0 ? totalWages : autoFillData.income.annual

  // Calculate estimated tax based on auto-filled data + uploaded docs
  const calculateTaxEstimate = () => {
    const income = effectiveIncome
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
    
    // Use actual withholding from W-2s if available, otherwise estimate
    const withheld = totalWithheld > 0 ? totalWithheld : income * 0.15
    const refund = withheld - tax
    
    setEstimatedRefund(Math.round(refund))
    
    toast.success('Analysis Complete', 'Estimated refund updated based on your data')
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', docType === 'W-2' ? 'w2' : 'document')
      
      // First, extract data using OCR
      const ocrResponse = await fetch('/api/ai-tools/ocr', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (!ocrResponse.ok) {
        throw new Error('Failed to process document')
      }
      
      const ocrResult = await ocrResponse.json()
      const extractedData = ocrResult.data || {}
      
      // Prepare document data for saving
      const documentData = {
        document_type: docType,
        tax_year: extractedData.tax_year || new Date().getFullYear(),
        employer_name: extractedData.employer_name || extractedData.employer || file.name.replace(/\.[^/.]+$/, ''),
        employer_ein: extractedData.employer_ein || extractedData.ein,
        employee_name: extractedData.employee_name || extractedData.name,
        wages: parseFloat(extractedData.wages) || parseFloat(extractedData.total_wages) || 0,
        federal_tax_withheld: parseFloat(extractedData.federal_tax) || parseFloat(extractedData.federal_withheld) || 0,
        social_security_wages: parseFloat(extractedData.social_security_wages) || 0,
        medicare_wages: parseFloat(extractedData.medicare_wages) || 0,
        raw_data: extractedData
      }

      // Save to database
      const saveResponse = await fetch('/api/ai-tools/tax-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(documentData)
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to save tax document')
      }

      const savedDoc = await saveResponse.json()
      
      setDocuments([{ ...savedDoc.data, status: 'processed' }, ...documents])
      
      toast.success('Document Processed', `Successfully extracted data from ${file.name}`)
    } catch (error: any) {
      toast.error('Upload Failed', error.message || 'Failed to process document')
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

  const deleteDocument = async (id: string) => {
    // For now, just remove from local state
    // In production, you'd add a DELETE endpoint
    setDocuments(documents.filter(d => d.id !== id))
    toast.success('Removed', 'Document removed')
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Wages (W-2s)</p>
              <p className="text-2xl font-bold text-blue-600">
                ${totalWages > 0 ? totalWages.toLocaleString() : autoFillData.income.annual.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Tax Withheld</p>
              <p className="text-2xl font-bold text-yellow-600">
                ${totalWithheld.toLocaleString()}
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
              <p className={`text-2xl font-bold ${estimatedRefund !== null && estimatedRefund >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {estimatedRefund !== null ? `${estimatedRefund >= 0 ? '+' : ''}$${Math.abs(estimatedRefund).toLocaleString()}` : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tax Documents ({documents.length})</CardTitle>
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
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No tax documents uploaded yet.</p>
              <p className="text-sm mt-2">Upload W-2s, 1099s, or deduction receipts</p>
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-semibold">{doc.document_type} - {doc.employer_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.wages ? `Wages: $${doc.wages.toLocaleString()}` : ''} 
                      {doc.federal_tax_withheld ? ` | Withheld: $${doc.federal_tax_withheld.toLocaleString()}` : ''}
                    </p>
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
                <span>Your effective tax rate is approximately {effectiveIncome > 0 ? ((effectiveIncome * 0.15 - estimatedRefund) / effectiveIncome * 100).toFixed(1) : 0}%</span>
              </li>
              {estimatedRefund >= 0 ? (
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>You may receive a refund of ${estimatedRefund.toLocaleString()}</span>
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span>You may owe ${Math.abs(estimatedRefund).toLocaleString()} - consider adjusting withholding</span>
                </li>
              )}
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































