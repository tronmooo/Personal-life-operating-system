'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, Upload, Loader2, AlertCircle, FileText, CheckCircle, Sparkles, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type ProcessingStage = 'idle' | 'uploading' | 'scanning' | 'extracting' | 'review' | 'saving' | 'complete'

interface DocumentCategory {
  value: string
  label: string
  subtypes?: string[]
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    value: 'Insurance',
    label: 'Insurance',
    subtypes: ['Home Insurance', 'Auto Insurance', 'Life Insurance', 'Health Insurance', 'Disability Insurance', 'Umbrella Policy']
  },
  {
    value: 'ID & Licenses',
    label: 'ID & Licenses',
    subtypes: ['Birth Certificate', 'Social Security Card', 'Passport', "Driver's License", 'Marriage Certificate']
  },
  {
    value: 'Identity Documents',
    label: 'Identity Documents',
    subtypes: ['Birth Certificate', 'Social Security Card', 'Passport', "Driver's License"]
  },
  {
    value: 'Vehicle',
    label: 'Vehicle',
    subtypes: ['Car Title', 'Registration', 'Loan/Lease Agreement', 'Maintenance Record', 'Warranty']
  },
  {
    value: 'Property',
    label: 'Property',
    subtypes: ['Deed', 'Title', 'Mortgage', 'Property Tax Record', 'Home Improvement Receipt', 'HOA Document']
  },
  {
    value: 'Education',
    label: 'Education',
    subtypes: ['Diploma', 'Degree', 'Transcript', 'Professional Certification', 'License']
  },
  {
    value: 'Medical',
    label: 'Medical',
    subtypes: ['Immunization Record', 'Diagnosis', 'Surgical Record', 'Prescription History', 'Test Result']
  },
  {
    value: 'Legal',
    label: 'Legal',
    subtypes: ['Contract', 'Custody Agreement', 'Adoption Paper', 'Settlement Agreement', 'Business Formation']
  },
  {
    value: 'Financial & Tax',
    label: 'Financial & Tax',
    subtypes: ['Tax Return', 'W-2', '1099', 'Deduction Receipt', 'Investment Statement', 'Bank Statement']
  },
  {
    value: 'Retirement & Benefits',
    label: 'Retirement & Benefits',
    subtypes: ['401(k) Statement', 'IRA Document', 'Pension Info', 'Social Security Statement']
  },
  {
    value: 'Estate Planning',
    label: 'Estate Planning',
    subtypes: ['Will', 'Trust', 'Power of Attorney (Medical)', 'Power of Attorney (Financial)', 'Living Will']
  }
]

interface SmartDocumentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function SmartDocumentUploadDialog({
  open,
  onOpenChange,
  onComplete
}: SmartDocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState<ProcessingStage>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [documentName, setDocumentName] = useState('')
  const [category, setCategory] = useState('Insurance')
  const [subtype, setSubtype] = useState('')
  const [issuer, setIssuer] = useState('')
  const [policyNumber, setPolicyNumber] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [ocrText, setOcrText] = useState('')
  const [ocrConfidence, setOcrConfidence] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setTimeout(() => {
        setFile(null)
        setStage('idle')
        setProgress(0)
        setError(null)
        setDocumentName('')
        setCategory('Insurance')
        setSubtype('')
        setIssuer('')
        setPolicyNumber('')
        setExpirationDate('')
        setOcrText('')
        setOcrConfidence(0)
        setFilePreview(null)
      }, 300)
    }
  }

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [])

  // Handle file selection
  const handleFileSelect = async (selectedFile: File) => {
    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image (JPG, PNG, WEBP) or PDF file')
      return
    }

    setFile(selectedFile)
    setError(null)

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setFilePreview(null)
    }

    // Auto-process document
    await processDocument(selectedFile)
  }

  // Process document with AI
  const processDocument = async (fileToProcess: File) => {
    setStage('uploading')
    setProgress(10)
    setError(null)

    try {
      // Stage 1: Upload/Prepare
      setProgress(20)

      const formData = new FormData()
      formData.append('file', fileToProcess)

      // Stage 2: OCR Scanning
      setStage('scanning')
      setProgress(30)

      const controller = new AbortController()
      setAbortController(controller)
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 120 seconds

      try {
        const scanResponse = await fetch('/api/documents/smart-scan?enhanced=true', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        setAbortController(null)

        if (!scanResponse.ok) {
          const errorData = await scanResponse.json().catch(() => ({}))
          const errorMsg = errorData.error || 'Failed to process document'
          throw new Error(errorMsg)
        }

        const scanResult = await scanResponse.json()

        // Stage 3: AI Classification
        setStage('extracting')
        setProgress(70)

        console.log('📄 OCR Result:', scanResult)

        // Extract and map data
        const enhanced = scanResult.enhancedData || {}
        const fields = enhanced.fields || {}

        // Auto-fill form with extracted data
        setDocumentName(
          fields.documentName || 
          fields.policyHolderName || 
          scanResult.documentType || 
          fileToProcess.name.replace(/\.[^/.]+$/, '')
        )

        // Map document type to category
        const docType = (scanResult.documentType || '').toLowerCase()
        if (docType.includes('insurance')) {
          setCategory('Insurance')
          if (docType.includes('auto')) setSubtype('Auto Insurance')
          else if (docType.includes('health')) setSubtype('Health Insurance')
          else if (docType.includes('life')) setSubtype('Life Insurance')
          else if (docType.includes('home')) setSubtype('Home Insurance')
        } else if (docType.includes('license') || docType.includes('id')) {
          setCategory('ID & Licenses')
        } else if (docType.includes('vehicle') || docType.includes('registration')) {
          setCategory('Vehicle')
        } else if (docType.includes('medical') || docType.includes('prescription')) {
          setCategory('Medical')
        } else if (docType.includes('property') || docType.includes('deed')) {
          setCategory('Property')
        } else if (docType.includes('tax') || docType.includes('financial')) {
          setCategory('Financial & Tax')
        }

        setIssuer(
          fields.insuranceCompany || 
          fields.provider || 
          fields.issuingOrganization || 
          fields.employer ||
          fields.carrier ||
          ''
        )

        setPolicyNumber(
          fields.policyNumber || 
          fields.memberID || 
          fields.accountNumber || 
          fields.licenseNumber ||
          fields.idNumber ||
          ''
        )

        // Parse expiration date
        let expDate = ''
        if (fields.expirationDate) {
          try {
            const parsed = new Date(fields.expirationDate)
            if (!isNaN(parsed.getTime())) {
              expDate = parsed.toISOString().split('T')[0] // YYYY-MM-DD
            }
          } catch (e) {
            console.warn('Failed to parse expiration date:', e)
          }
        } else if (fields.validUntil) {
          try {
            const parsed = new Date(fields.validUntil)
            if (!isNaN(parsed.getTime())) {
              expDate = parsed.toISOString().split('T')[0]
            }
          } catch (e) {
            console.warn('Failed to parse valid until date:', e)
          }
        }
        setExpirationDate(expDate)

        setOcrText(scanResult.text || '')
        setOcrConfidence(scanResult.confidence || 0)

        // Stage 4: Review
        setStage('review')
        setProgress(100)

      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Processing timeout - please try with a smaller file or clearer image')
        }
        throw fetchError
      }

    } catch (err: any) {
      console.error('Document processing error:', err)
      setError(err.message || 'Failed to process document. Please try again.')
      setStage('idle')
      setProgress(0)
    }
  }

  // Cancel processing
  const handleCancel = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    handleOpenChange(false)
  }

  // Save document
  const handleSave = async () => {
    if (!documentName.trim()) {
      setError('Please enter a document name')
      return
    }

    setStage('saving')
    setError(null)

    try {
      // Upload file if we have one
      let fileUrl: string | null = null
      let savedDocId: string | null = null

      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('domain', 'insurance') // Always save to insurance domain for document manager
        formData.append('metadata', JSON.stringify({
          name: documentName,
          category,
          subtype,
          issuer,
          policyNumber,
          ocrText: ocrText.substring(0, 5000), // Truncate for storage
          ocrConfidence
        }))

        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file')
        }

        const uploadResult = await uploadResponse.json()
        fileUrl = uploadResult.data?.file_url || uploadResult.data?.file_path
        savedDocId = uploadResult.data?.id
      }

      // Save document metadata
      const payload: Record<string, any> = {
        domain: 'insurance',
        document_name: documentName,
        file_name: file?.name || documentName,
        document_type: category,
        file_url: fileUrl,
        file_path: fileUrl,
        metadata: {
          category,
          subtype: subtype || undefined,
          issuer: issuer || undefined,
          number: policyNumber || undefined,
        },
        tags: [category, subtype].filter(Boolean),
        ocr_processed: !!ocrText,
        ocr_text: ocrText.substring(0, 5000),
        ocr_confidence: ocrConfidence || null,
        policy_number: policyNumber || null,
      }

      if (expirationDate) {
        payload.expiration_date = new Date(expirationDate).toISOString()
      }

      // If we already have a document ID from upload, update it instead of creating new
      if (savedDocId) {
        // Update the existing document with additional metadata
        const updateResponse = await fetch(`/api/documents/${savedDocId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_name: documentName,
            document_type: category,
            metadata: payload.metadata,
            tags: payload.tags,
            policy_number: policyNumber || null,
            expiration_date: expirationDate ? new Date(expirationDate).toISOString() : null,
          })
        })

        if (!updateResponse.ok) {
          console.warn('Failed to update document metadata, but file was uploaded')
        }
      } else {
        // Create new document entry
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(err.error || 'Failed to save document')
        }
      }

      setStage('complete')
      setTimeout(() => {
        onComplete()
        handleOpenChange(false)
      }, 1500)

    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save document. Please try again.')
      setStage('review')
    }
  }

  const currentCategory = DOCUMENT_CATEGORIES.find(c => c.value === category)
  const subtypes = currentCategory?.subtypes || []

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-800 text-white border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            {stage === 'review' ? 'Review Document Details' : 'Upload & Scan Document'}
          </DialogTitle>
        </DialogHeader>

        {/* Idle/Upload Stage */}
        {stage === 'idle' && (
          <div className="space-y-4">
            <Alert className="bg-blue-900/30 border-blue-700/50">
              <AlertDescription className="text-blue-300 text-sm">
                📸 Upload or take a photo of your document. AI will automatically extract details like policy numbers, expiration dates, and more.
              </AlertDescription>
            </Alert>

            {/* File input area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0])
                  }
                }}
                className="hidden"
              />
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium mb-2">Drop your document here or click to upload</p>
                <p className="text-sm text-slate-400 mb-4">
                  Supports JPG, PNG, WEBP, PDF • Max 10MB
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>

            {error && (
              <Alert className="bg-red-900/30 border-red-700/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Processing Stages */}
        {(stage === 'uploading' || stage === 'scanning' || stage === 'extracting') && (
          <div className="py-8 space-y-6">
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {stage === 'uploading' && '📤 Uploading document...'}
                {stage === 'scanning' && '🔍 Scanning with OCR...'}
                {stage === 'extracting' && '✨ Extracting details with AI...'}
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                {stage === 'uploading' && 'Preparing your document for processing'}
                {stage === 'scanning' && 'Reading text from your document'}
                {stage === 'extracting' && 'Identifying key information automatically'}
              </p>
            </div>

            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-slate-400">{progress}% complete</p>

            <div className="text-center">
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Review Stage */}
        {stage === 'review' && (
          <div className="space-y-4">
            {filePreview && (
              <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                <img 
                  src={filePreview} 
                  alt="Document preview" 
                  className="w-full h-48 object-contain"
                />
              </div>
            )}

            <Alert className="bg-blue-900/30 border-blue-700/50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-blue-300 text-sm">
                ✨ Document scanned! Review and edit the extracted details below, then save to Documents Manager.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-300">Document Name *</Label>
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g., Health Insurance Card, Driver's License"
                  className="bg-slate-900 border-slate-700 text-white mt-1"
                />
              </div>

              <div>
                <Label className="text-slate-300">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subtypes.length > 0 && (
                <div>
                  <Label className="text-slate-300">Subtype</Label>
                  <Select value={subtype} onValueChange={setSubtype}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white mt-1">
                      <SelectValue placeholder="Select subtype" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {subtypes.map((st) => (
                        <SelectItem key={st} value={st} className="text-white">
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-slate-300">Issuer / Provider</Label>
                <Input
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="e.g., Blue Cross, DMV"
                  className="bg-slate-900 border-slate-700 text-white mt-1"
                />
              </div>

              <div>
                <Label className="text-slate-300">Policy / ID Number</Label>
                <Input
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  placeholder="e.g., ABC123456"
                  className="bg-slate-900 border-slate-700 text-white mt-1"
                />
              </div>

              <div>
                <Label className="text-slate-300">Expiration Date</Label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white mt-1"
                />
              </div>
            </div>

            {ocrText && (
              <div>
                <Label className="text-slate-300">Extracted Text (OCR)</Label>
                <div className="mt-1 p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-400 max-h-32 overflow-y-auto">
                  {ocrText.substring(0, 500)}{ocrText.length > 500 && '...'}
                </div>
                {ocrConfidence > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Confidence: {Math.round(ocrConfidence)}%
                  </p>
                )}
              </div>
            )}

            {error && (
              <Alert className="bg-red-900/30 border-red-700/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button 
                onClick={handleSave} 
                size="lg" 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!documentName.trim()}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Save to Documents Manager
              </Button>
              <Button 
                onClick={handleCancel} 
                variant="outline" 
                size="lg"
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Saving Stage */}
        {stage === 'saving' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto" />
            <p className="text-lg font-medium">Saving document...</p>
          </div>
        )}

        {/* Complete Stage */}
        {stage === 'complete' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-2xl font-bold mb-2">Document Saved!</h3>
              <p className="text-slate-400">Your document has been added to the Document Manager</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

