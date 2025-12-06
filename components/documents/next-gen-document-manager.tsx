'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Camera, Upload, FileText, Edit, Sparkles, CheckCircle2, 
  AlertCircle, X, Loader2,
  Shield, Heart, DollarSign, Car, Home
} from 'lucide-react'
import { Domain } from '@/types/domains'
import Image from 'next/image'

type UploadMethod = 'photo' | 'file' | 'manual' | null
type ProcessingStage = 'idle' | 'scanning' | 'classifying' | 'extracting' | 'confirming' | 'complete'

interface DocumentData {
  file?: File
  imageData?: string
  ocrText?: string
  documentType?: string
  confidence?: number
  suggestedDomain?: Domain
  suggestedAction?: string
  reasoning?: string
  extractedData?: Record<string, any>
  icon?: string
  // Manual entry fields
  title?: string
  description?: string
  category?: string
}

interface NextGenDocumentManagerProps {
  onDocumentSaved?: (document: any) => void
  onCancel?: () => void
}

export function NextGenDocumentManager({ onDocumentSaved, onCancel }: NextGenDocumentManagerProps) {
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>(null)
  const [stage, setStage] = useState<ProcessingStage>('idle')
  const [progress, setProgress] = useState(0)
  const [documentData, setDocumentData] = useState<DocumentData>({})
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      setStream(mediaStream)
      setCameraActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.')
      console.error('Camera error:', err)
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraActive(false)
  }, [stream])

  // Process document with AI
  const processDocument = async (imageData: string, file?: File) => {
    setStage('scanning')
    setProgress(10)
    setError(null)

    try {
      // Stage 1: OCR Scanning
      setProgress(30)
      
      const formData = new FormData()
      if (file) {
        formData.append('file', file)
      } else {
        // Convert base64 to blob
        const response = await fetch(imageData)
        const blob = await response.blob()
        formData.append('file', blob, 'captured-image.jpg')
      }

      // Stage 2: AI Classification
      setStage('classifying')
      setProgress(50)

      const scanResponse = await fetch('/api/documents/smart-scan', {
        method: 'POST',
        body: formData,
      })

      if (!scanResponse.ok) {
        throw new Error('Failed to process document')
      }

      const scanResult = await scanResponse.json()

      // Stage 3: Data Extraction
      setStage('extracting')
      setProgress(80)

      await new Promise(resolve => setTimeout(resolve, 500)) // Brief pause for UX

      // Update document data with results
      setDocumentData({
        ...documentData,
        ocrText: scanResult.text,
        documentType: scanResult.documentType,
        confidence: scanResult.confidence,
        suggestedDomain: scanResult.suggestedDomain,
        suggestedAction: scanResult.suggestedAction,
        reasoning: scanResult.reasoning,
        extractedData: scanResult.extractedData,
        icon: scanResult.icon,
        imageData: file ? undefined : imageData,
        file: file,
      })

      setSelectedDomain(scanResult.suggestedDomain)
      
      // Pre-populate form with extracted data
      setFormData(scanResult.extractedData || {})

      setStage('confirming')
      setProgress(100)

    } catch (err: any) {
      console.error('Document processing error:', err)
      setError(err.message || 'Failed to process document. Please try again.')
      setStage('idle')
      setProgress(0)
    }
  }

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      setDocumentData({ ...documentData, imageData })
      stopCamera()
      processDocument(imageData)
    }
  }, [documentData, stopCamera])

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (JPG, PNG, WEBP)')
      return
    }

    setDocumentData({ ...documentData, file })
    
    // Convert to base64 for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      processDocument(result, file)
    }
    reader.readAsDataURL(file)
  }

  // Handle manual entry
  const handleManualEntry = () => {
    setStage('confirming')
    setDocumentData({
      title: '',
      description: '',
      category: 'general'
    })
  }

  // Save document
  const saveDocument = async () => {
    try {
      setProgress(0)
      
      // Upload file if exists
      let fileUrl = null
      if (documentData.file) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', documentData.file)
        uploadFormData.append('domain', selectedDomain || 'miscellaneous')
        uploadFormData.append('metadata', JSON.stringify({
          documentType: documentData.documentType,
          ocrText: documentData.ocrText,
          confidence: documentData.confidence,
          ...formData
        }))

        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (uploadResponse.ok) {
          const { data } = await uploadResponse.json()
          fileUrl = data.file_path
        }
      }

      // Save to domain_entries if domain is selected
      if (selectedDomain) {
        const entryData = {
          domain: selectedDomain,
          title: formData.title || documentData.documentType || 'Document',
          description: formData.notes || documentData.ocrText?.substring(0, 500) || '',
          metadata: {
            ...formData,
            documentType: documentData.documentType,
            fileUrl,
            ocrText: documentData.ocrText,
            confidence: documentData.confidence,
          }
        }

        // You can add API call to save domain entry here
        console.log('Saving document entry:', entryData)
      }

      setStage('complete')
      
      setTimeout(() => {
        onDocumentSaved?.({
          ...documentData,
          formData,
          domain: selectedDomain,
          fileUrl
        })
      }, 1500)

    } catch (err: any) {
      console.error('Save error:', err)
      setError('Failed to save document. Please try again.')
    }
  }

  // Reset to start
  const reset = () => {
    setUploadMethod(null)
    setStage('idle')
    setProgress(0)
    setDocumentData({})
    setFormData({})
    setSelectedDomain(null)
    setError(null)
    stopCamera()
  }


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step 1: Choose Upload Method */}
      {!uploadMethod && stage === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              Add New Document
            </CardTitle>
            <CardDescription>
              Choose how you want to add your document - AI will automatically categorize it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Photo Capture */}
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-3 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950"
                onClick={() => {
                  setUploadMethod('photo')
                  startCamera()
                }}
              >
                <Camera className="h-12 w-12 text-purple-500" />
                <div className="text-center">
                  <div className="font-semibold">Take Photo</div>
                  <div className="text-xs text-muted-foreground">
                    Capture with camera
                  </div>
                </div>
              </Button>

              {/* File Upload */}
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-3 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                onClick={() => {
                  setUploadMethod('file')
                  fileInputRef.current?.click()
                }}
              >
                <Upload className="h-12 w-12 text-blue-500" />
                <div className="text-center">
                  <div className="font-semibold">Upload File</div>
                  <div className="text-xs text-muted-foreground">
                    PDF, JPG, PNG
                  </div>
                </div>
              </Button>

              {/* Manual Entry */}
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-3 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={() => {
                  setUploadMethod('manual')
                  handleManualEntry()
                }}
              >
                <Edit className="h-12 w-12 text-green-500" />
                <div className="text-center">
                  <div className="font-semibold">Manual Entry</div>
                  <div className="text-xs text-muted-foreground">
                    Type information
                  </div>
                </div>
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileSelect}
            />

            <Alert className="bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-900">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-700 dark:text-purple-300">
                <strong>AI-Powered Magic:</strong> Upload any document and our AI will automatically detect if it&apos;s an insurance card, receipt, medical record, vehicle registration, or bill - then route it to the right place!
              </AlertDescription>
            </Alert>

            {onCancel && (
              <div className="flex justify-end">
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Camera View */}
      {cameraActive && (
        <Card>
          <CardHeader>
            <CardTitle>Capture Document</CardTitle>
            <CardDescription>Position document in frame and capture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex gap-3">
              <Button onClick={capturePhoto} className="flex-1" size="lg">
                <Camera className="h-5 w-5 mr-2" />
                Capture Photo
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  stopCamera()
                  setUploadMethod(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Stage */}
      {(stage === 'scanning' || stage === 'classifying' || stage === 'extracting') && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Document</CardTitle>
            <CardDescription>
              {stage === 'scanning' && 'Extracting text from document...'}
              {stage === 'classifying' && 'Identifying document type with AI...'}
              {stage === 'extracting' && 'Extracting structured data...'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              This may take 10-30 seconds...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation & Form Stage */}
      {stage === 'confirming' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {documentData.icon && <span className="text-2xl">{documentData.icon}</span>}
              Review & Save Document
            </CardTitle>
            <CardDescription>
              {documentData.documentType ? (
                <>
                  Detected: <strong>{documentData.documentType}</strong>
                  {documentData.confidence && (
                    <Badge variant="outline" className="ml-2">
                      {Math.round(documentData.confidence * 100)}% confident
                    </Badge>
                  )}
                </>
              ) : (
                'Fill in document details'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* AI Suggestion */}
            {documentData.suggestedDomain && (
              <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <AlertDescription>
                  <div className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
                    AI Suggestion
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    {documentData.suggestedAction}
                  </div>
                  {documentData.reasoning && (
                    <div className="text-xs text-purple-500 mt-1">
                      {documentData.reasoning}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Domain Selection */}
            <div className="space-y-2">
              <Label htmlFor="domain">Category / Domain</Label>
              <Select
                value={selectedDomain || ''}
                onValueChange={(value) => setSelectedDomain(value as Domain)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insurance">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Insurance / Legal
                    </div>
                  </SelectItem>
                  <SelectItem value="financial">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Financial
                    </div>
                  </SelectItem>
                  <SelectItem value="health">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Health & Medical
                    </div>
                  </SelectItem>
                  <SelectItem value="vehicles">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Vehicles
                    </div>
                  </SelectItem>
                  <SelectItem value="home">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Home
                    </div>
                  </SelectItem>
                  <SelectItem value="miscellaneous">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Other
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Form Based on Domain */}
            <DomainSpecificFields
              domain={selectedDomain}
              extractedData={documentData.extractedData || {}}
              formData={formData}
              onChange={setFormData}
            />

            {/* Document Preview (if available) */}
            {(documentData.file || documentData.imageData) && (
              <div className="space-y-2">
                <Label>Document Preview</Label>
                <div className="border rounded-lg p-4 bg-accent">
                  {documentData.file?.type === 'application/pdf' ? (
                    <div className="flex items-center gap-3">
                      <FileText className="h-12 w-12 text-red-500" />
                      <div>
                        <div className="font-medium">{documentData.file.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {(documentData.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  ) : documentData.imageData && (
                    <div className="relative w-full max-h-64 flex items-center justify-center">
                      <img 
                        src={documentData.imageData} 
                        alt="Document preview" 
                        className="max-h-64 rounded object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Extracted Text Preview */}
            {documentData.ocrText && (
              <div className="space-y-2">
                <Label>Extracted Text (OCR)</Label>
                <Textarea
                  value={documentData.ocrText.substring(0, 500)}
                  readOnly
                  rows={4}
                  className="text-xs"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={saveDocument} className="flex-1" size="lg">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Save Document
              </Button>
              <Button variant="outline" onClick={reset}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Stage */}
      {stage === 'complete' && (
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle2 className="h-6 w-6" />
              Document Saved Successfully!
            </CardTitle>
            <CardDescription>
              Your document has been saved to {selectedDomain || 'Documents'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={reset} className="w-full" variant="outline">
              Add Another Document
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Dynamic form fields based on domain
interface DomainSpecificFieldsProps {
  domain: Domain | null
  extractedData: Record<string, any>
  formData: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

function DomainSpecificFields({ domain, extractedData, formData, onChange }: DomainSpecificFieldsProps) {
  const updateField = (field: string, value: any) => {
    onChange({ ...formData, [field]: value })
  }

  // Common fields for all documents
  const commonFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Document Title *</Label>
        <Input
          id="title"
          value={formData.title || extractedData.documentName || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Enter a descriptive title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Add any additional notes..."
          rows={3}
        />
      </div>
    </>
  )

  // Insurance-specific fields
  if (domain === 'insurance') {
    return (
      <div className="space-y-4">
        {commonFields}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="policyNumber">Policy Number</Label>
            <Input
              id="policyNumber"
              value={formData.policyNumber || extractedData.policyNumber || ''}
              onChange={(e) => updateField('policyNumber', e.target.value)}
              placeholder="ABC123456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              value={formData.provider || extractedData.provider || ''}
              onChange={(e) => updateField('provider', e.target.value)}
              placeholder="Insurance Company"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date</Label>
            <Input
              id="expirationDate"
              type="date"
              value={formData.expirationDate || extractedData.expirationDate || ''}
              onChange={(e) => updateField('expirationDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renewalDate">Renewal Date</Label>
            <Input
              id="renewalDate"
              type="date"
              value={formData.renewalDate || extractedData.renewalDate || ''}
              onChange={(e) => updateField('renewalDate', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverageAmount">Coverage Amount</Label>
          <Input
            id="coverageAmount"
            type="number"
            value={formData.coverageAmount || ''}
            onChange={(e) => updateField('coverageAmount', e.target.value)}
            placeholder="100000"
          />
        </div>
      </div>
    )
  }

  // Financial-specific fields
  if (domain === 'financial') {
    return (
      <div className="space-y-4">
        {commonFields}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount || extractedData.total || extractedData.amount || ''}
              onChange={(e) => updateField('amount', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date || extractedData.date || ''}
              onChange={(e) => updateField('date', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor / Merchant</Label>
          <Input
            id="vendor"
            value={formData.vendor || extractedData.vendor || extractedData.company || ''}
            onChange={(e) => updateField('vendor', e.target.value)}
            placeholder="Store or company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category || extractedData.category || ''}
            onValueChange={(value) => updateField('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="groceries">Groceries</SelectItem>
              <SelectItem value="dining">Dining</SelectItem>
              <SelectItem value="gas">Gas/Fuel</SelectItem>
              <SelectItem value="shopping">Shopping</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  // Health-specific fields
  if (domain === 'health') {
    return (
      <div className="space-y-4">
        {commonFields}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider / Doctor</Label>
            <Input
              id="provider"
              value={formData.provider || extractedData.provider || extractedData.prescriber || ''}
              onChange={(e) => updateField('provider', e.target.value)}
              placeholder="Dr. Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date || extractedData.date || extractedData.dateFilled || ''}
              onChange={(e) => updateField('date', e.target.value)}
            />
          </div>
        </div>

        {extractedData.medicationName && (
          <div className="space-y-2">
            <Label htmlFor="medication">Medication</Label>
            <Input
              id="medication"
              value={formData.medication || extractedData.medicationName || ''}
              onChange={(e) => updateField('medication', e.target.value)}
              placeholder="Medication name"
            />
          </div>
        )}

        {extractedData.dosage && (
          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage</Label>
            <Input
              id="dosage"
              value={formData.dosage || extractedData.dosage || ''}
              onChange={(e) => updateField('dosage', e.target.value)}
              placeholder="500mg"
            />
          </div>
        )}
      </div>
    )
  }

  // Vehicles-specific fields
  if (domain === 'vehicles') {
    return (
      <div className="space-y-4">
        {commonFields}
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="make">Make</Label>
            <Input
              id="make"
              value={formData.make || extractedData.make || ''}
              onChange={(e) => updateField('make', e.target.value)}
              placeholder="Honda"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={formData.model || extractedData.model || ''}
              onChange={(e) => updateField('model', e.target.value)}
              placeholder="Civic"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={formData.year || extractedData.year || ''}
              onChange={(e) => updateField('year', e.target.value)}
              placeholder="2020"
            />
          </div>
        </div>

        {extractedData.vin && (
          <div className="space-y-2">
            <Label htmlFor="vin">VIN</Label>
            <Input
              id="vin"
              value={formData.vin || extractedData.vin || ''}
              onChange={(e) => updateField('vin', e.target.value)}
              placeholder="Vehicle Identification Number"
            />
          </div>
        )}

        {extractedData.licensePlate && (
          <div className="space-y-2">
            <Label htmlFor="licensePlate">License Plate</Label>
            <Input
              id="licensePlate"
              value={formData.licensePlate || extractedData.licensePlate || ''}
              onChange={(e) => updateField('licensePlate', e.target.value)}
              placeholder="ABC123"
            />
          </div>
        )}

        {extractedData.expirationDate && (
          <div className="space-y-2">
            <Label htmlFor="expirationDate">Registration Expiration</Label>
            <Input
              id="expirationDate"
              type="date"
              value={formData.expirationDate || extractedData.expirationDate || ''}
              onChange={(e) => updateField('expirationDate', e.target.value)}
            />
          </div>
        )}
      </div>
    )
  }

  // Default fields for all other domains
  return <div className="space-y-4">{commonFields}</div>
}

