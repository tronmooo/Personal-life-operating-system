'use client'

import { useState, useRef, useCallback, ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, Upload, Loader2, AlertCircle, FileText, Image as ImageIcon, CheckCircle } from 'lucide-react'
import { Domain } from '@/types/domains'
import { DynamicReviewForm } from './dynamic-review-form'
import { EnhancedExtractedData } from '@/lib/ai/enhanced-document-extractor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DOMAIN_CONFIGS } from '@/types/domains'

type ProcessingStage = 'idle' | 'uploading' | 'scanning' | 'classifying' | 'extracting' | 'review' | 'quick-upload' | 'preview-confirm' | 'saving' | 'complete'

interface SmartUploadDialogProps {
  domain: Domain
  trigger: ReactNode
  onComplete: (document: any) => void
  onCancel?: () => void
}

export function SmartUploadDialog({
  domain,
  trigger,
  onComplete,
  onCancel
}: SmartUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState<ProcessingStage>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<EnhancedExtractedData | null>(null)
  const [documentType, setDocumentType] = useState<string>('')
  const [suggestedDomain, setSuggestedDomain] = useState<Domain | null>(null)
  
  // Quick upload form state
  const [documentName, setDocumentName] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<Domain>(domain)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset on close
      setTimeout(() => {
        setFile(null)
        setStage('idle')
        setProgress(0)
        setError(null)
        setExtractedData(null)
        setDocumentType('')
        setSuggestedDomain(null)
        setDocumentName('')
        setExpirationDate('')
        setSelectedDomain(domain)
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
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or image file (JPG, PNG, WEBP)')
      return
    }

    setFile(selectedFile)
    setError(null)
    
    // For photos, call OpenAI Vision DIRECTLY (fastest!)
    const isPhoto = selectedFile.type.startsWith('image/')
    if (isPhoto) {
      setStage('scanning')
      setProgress(20)
      
      try {
        console.log('🤖 Starting document upload...')
        console.log('📄 File details:', {
          name: selectedFile.name,
          type: selectedFile.type,
          size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
        })
        
        const aiFormData = new FormData()
        aiFormData.append('file', selectedFile)
        
        setProgress(40)
        console.log('📡 Calling /api/documents/auto-ingest...')
        
        // Add 45 second timeout to fetch request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          console.error('⏱️ Request timeout triggered (45 seconds)')
          controller.abort()
        }, 45000)
        
        try {
          const scanResponse = await fetch('/api/documents/auto-ingest', {
            method: 'POST',
            body: aiFormData,
            signal: controller.signal,
          })
          
          clearTimeout(timeoutId)
          console.log('📡 Response received!')
          console.log('   Status:', scanResponse.status)
          console.log('   Status Text:', scanResponse.statusText)
          console.log('   Headers:', Object.fromEntries(scanResponse.headers.entries()))
          
          setProgress(80)
          
          // Read response body
          const responseText = await scanResponse.text()
          console.log('📝 Response body (raw):', responseText.substring(0, 500))
          
          if (scanResponse.ok) {
            try {
              const result = JSON.parse(responseText)
              console.log('✅ Auto-ingest SUCCESS:', result)
              
              if (!result.document) {
                throw new Error('API returned success but no document data')
              }
              
              setProgress(100)
              setStage('complete')
              
              setTimeout(() => {
                onComplete(result.document)
                handleOpenChange(false)
              }, 1000)
            } catch (parseErr: any) {
              console.error('❌ Failed to parse success response:', parseErr)
              setError(`Server returned invalid data: ${parseErr.message}`)
              setStage('idle')
              setProgress(0)
            }
          } else {
            // Error response
            let errorData: any = {}
            try {
              errorData = JSON.parse(responseText)
            } catch {
              errorData = { error: responseText || `HTTP ${scanResponse.status}: ${scanResponse.statusText}` }
            }
            
            console.error('❌ Auto-ingest FAILED:', errorData)
            console.error('   HTTP Status:', scanResponse.status)
            console.error('   Error message:', errorData.error)
            
            const errorMessage = errorData.error || errorData.message || 'Failed to process document'
            setError(`Upload failed: ${errorMessage}`)
            setStage('idle')
            setProgress(0)
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId)
          
          console.error('❌ Fetch error:', fetchErr)
          console.error('   Error name:', fetchErr.name)
          console.error('   Error message:', fetchErr.message)
          console.error('   Error stack:', fetchErr.stack)
          
          if (fetchErr.name === 'AbortError') {
            setError('⏱️ Upload timed out (45s). The server may be slow or the image is too large. Try a smaller image or click "Skip OCR & Upload Now".')
          } else {
            setError(`Network error: ${fetchErr.message}. Check your internet connection.`)
          }
          setStage('idle')
          setProgress(0)
        }
        
      } catch (err: any) {
        console.error('❌ Unexpected error:', err)
        console.error('   Error name:', err.name)
        console.error('   Error message:', err.message)
        console.error('   Error stack:', err.stack)
        setError(`Unexpected error: ${err.message || 'Unknown error'}`)
        setStage('idle')
        setProgress(0)
      }
    } else {
      // For PDFs, start smart scan immediately
      await processDocument(selectedFile)
    }
  }
  
  // Extract expiration date from OCR text
  const extractExpirationFromText = (text: string): string | null => {
    // Comprehensive list of date-related keywords
    const keywords = [
      'expiration date', 'expiration', 'expiry date', 'expiry', 'expires on', 'expires',
      'effective date', 'effective thru', 'effective end', 'effective until',
      'valid until', 'valid thru', 'valid through', 'valid to',
      'end date', 'exp date', 'exp', 'exp:'
    ]
    const lowerText = text.toLowerCase()
    
    // Date patterns - including YYYY-MM-DD format common on insurance cards
    const datePatterns = [
      /\b(\d{4})[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/g,  // YYYY-MM-DD (most common)
      /\b(0?[1-9]|1[0-2])[\/\-\.](0?[1-9]|[12]\d|3[01])[\/\-\.](\d{4})\b/g, // MM/DD/YYYY
      /\b(0?[1-9]|1[0-2])[\/\-](20\d{2}|\d{2})\b/g, // MM/YY
    ]
    
    // Look for dates near keywords
    for (const keyword of keywords) {
      const index = lowerText.indexOf(keyword)
      if (index !== -1) {
        const searchText = text.substring(index, index + 100)
        for (const pattern of datePatterns) {
          const match = searchText.match(pattern)
          if (match) {
            // Convert to YYYY-MM-DD format
            const dateStr = match[0]
            try {
              // Handle YYYY-MM-DD format (most common on insurance cards)
              if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(dateStr)) {
                const parts = dateStr.split(/[\/\-]/)
                const year = parts[0]
                const month = parts[1].padStart(2, '0')
                const day = parts[2].padStart(2, '0')
                return `${year}-${month}-${day}`
              }
              
              // Handle MM/YY format
              if (/^\d{1,2}[\/\-]\d{2,4}$/.test(dateStr)) {
                const parts = dateStr.split(/[\/\-]/)
                const month = parts[0]
                let year = parts[1]
                if (year.length === 2) year = '20' + year
                const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
                return `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
              }
              
              // Standard date parsing (MM/DD/YYYY)
              const date = new Date(dateStr.replace(/[\.]/g, '/'))
              if (!isNaN(date.getTime()) && date > new Date()) {
                return date.toISOString().split('T')[0]
              }
            } catch (e) {
              continue
            }
          }
        }
      }
    }
    
    return null
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

      // Create abort controller with 120 second timeout (OCR can be slow)
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
          const suggestion = errorData.suggestion || ''
          throw new Error(suggestion ? `${errorMsg}\n\n${suggestion}` : errorMsg)
        }

          const scanResult = await scanResponse.json()

        // Stage 3: AI Classification
        setStage('classifying')
        setProgress(50)

        await new Promise(resolve => setTimeout(resolve, 500))

        setDocumentType(scanResult.documentType)
        setSuggestedDomain(scanResult.suggestedDomain || domain)

        // Stage 4: Use Enhanced Data from API
        setStage('extracting')
        setProgress(70)

        // API already returned enhanced data
        const enhanced = scanResult.enhancedData || {
          fields: {},
          documentTitle: scanResult.documentType,
          summary: scanResult.suggestedAction,
          allDatesFound: [],
          allNumbersFound: [],
          allNamesFound: [],
        }

        setExtractedData(enhanced)

        // Stage 5: Review
        setStage('review')
        setProgress(100)

        console.log(`✅ Extraction complete: ${Object.keys(enhanced.fields).length} fields found`)

      } catch (fetchErr: any) {
        clearTimeout(timeoutId)
        setAbortController(null)
        
        if (fetchErr.name === 'AbortError') {
          throw new Error('Document processing timed out (120s). The image may be too large or complex. Try using a smaller image or enable Google Cloud Vision API for faster processing.')
        }
        throw fetchErr
      }

    } catch (err: any) {
      console.error('Document processing error:', err)
      setError(err.message || 'Failed to process document. Please try again.')
      setStage('idle')
      setProgress(0)
      setAbortController(null)
    }
  }

  // Instant upload - upload with user-confirmed details
  const handleConfirmedUpload = async () => {
    if (!file) return
    
    if (!documentName.trim()) {
      setError('Please enter a document name')
      return
    }
    
    setStage('saving')
    setProgress(20)
    setError(null)
    
    try {
      // Parse expiration date if provided
      let expirationDateISO: string | null = null
      if (expirationDate) {
        const date = new Date(expirationDate)
        if (!isNaN(date.getTime())) {
          expirationDateISO = date.toISOString()
        }
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      // Do NOT set domain → keep it null so everything goes to Documents Manager
      // Map the selected value to a human-friendly category label
      const CATEGORY_LABELS: Record<string, string> = {
        insurance: 'Insurance',
        health: 'Medical',
        vehicles: 'Vehicle',
        home: 'Property',
        education: 'Education',
        legal: 'Legal',
        financial: 'Financial & Tax',
        pets: 'Pets',
        travel: 'Travel',
        digital: 'Digital Assets',
        mindfulness: 'Wellness',
        miscellaneous: 'Other',
      }
      const categoryLabel = CATEGORY_LABELS[String(selectedDomain)] || 'Other'
      uploadFormData.append('metadata', JSON.stringify({
        name: documentName.trim(),
        // Set document type to the chosen category for correct filtering in Documents Manager
        documentType: categoryLabel,
        category: categoryLabel,
        expirationDate: expirationDateISO,
        uploadedWithoutOCR: true
      }))

      setProgress(40)
      console.log('🚀 SmartUploadDialog: Uploading to /api/documents/upload...')
      const uploadResponse = await fetch('/api/documents/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        console.error('❌ Upload failed:', errorData)
        throw new Error(errorData.error || 'Upload failed')
      }

      const { data } = await uploadResponse.json()
      console.log('✅ Upload response received:', data)
      
      if (data.uploaded_to_drive) {
        console.log('🎉 File was uploaded to Google Drive!')
        console.log('   Drive Link:', data.drive_link)
      } else {
        console.log('⚠️ File uploaded to Supabase only (not Google Drive)')
      }
      
      setProgress(80)
      
      // Background OCR will extract expiration date automatically
      // No need to wait - the edge function processes it
      
      setStage('complete')
      setProgress(100)

      // Call completion callback
      setTimeout(() => {
        onComplete({
          ...data,
          expiration_date: expirationDateISO,
          document_name: documentName.trim()
        })
        handleOpenChange(false)
      }, 800)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload document. Please try again.')
      setStage('preview-confirm')
      setProgress(0)
    }
  }


  // Skip OCR and upload without extraction (legacy - for smart scan skip)
  const handleSkipOCR = async () => {
    if (!file) return
    
    // Cancel ongoing OCR
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    
    setStage('saving')
    setProgress(10)
    
    try {
      // Upload file without OCR data
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      // Keep domain unset so it saves to Documents Manager
      uploadFormData.append('metadata', JSON.stringify({
        documentType: 'Other',
        uploadedWithoutOCR: true
      }))

      console.log('🚀 SmartUploadDialog: Uploading without OCR to /api/documents/upload...')
      const uploadResponse = await fetch('/api/documents/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (uploadResponse.ok) {
        const { data } = await uploadResponse.json()
        console.log('✅ Upload response received:', data)
        
        if (data.uploaded_to_drive) {
          console.log('🎉 File was uploaded to Google Drive!')
          console.log('   Drive Link:', data.drive_link)
        } else {
          console.log('⚠️ File uploaded to Supabase only (not Google Drive)')
        }

        setStage('complete')
        setProgress(100)

        // Call completion callback
        setTimeout(() => {
          onComplete(data)
          handleOpenChange(false)
        }, 500)
      } else {
        throw new Error('Upload failed')
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      setError('Failed to upload document. Please try again.')
      setStage('idle')
      setProgress(0)
    }
  }

  // Handle save from review form
  const handleSave = async (fields: Record<string, any>) => {
    setStage('saving')
    setProgress(0)

    try {
      // Upload file to Supabase
      if (file) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('domain', suggestedDomain || domain)
        uploadFormData.append('metadata', JSON.stringify({
          documentType,
          ...fields,
          extractedFieldCount: Object.keys(fields).length
        }))

        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (uploadResponse.ok) {
          const { data } = await uploadResponse.json()
          
          setStage('complete')
          
          // Call completion callback
          setTimeout(() => {
            onComplete({
              ...data,
              fields,
              domain: suggestedDomain || domain
            })
            handleOpenChange(false)
          }, 1000)
        } else {
          throw new Error('Failed to upload document')
        }
      }
    } catch (err: any) {
      console.error('Save error:', err)
      setError('Failed to save document. Please try again.')
      setStage('review')
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Smart Document Upload
          </DialogTitle>
        </DialogHeader>

        {/* Upload Zone */}
        {stage === 'idle' && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                  : 'border-gray-300 dark:border-gray-700 hover:border-purple-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              
              <h3 className="text-lg font-semibold mb-2">
                Drop your document here
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="lg"
                >
                  Choose File
                </Button>
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  size="lg"
                  variant="outline"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Supports PDF, JPG, PNG, WEBP (max 10MB)
              </p>
            </div>

            <Alert className="bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-900">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-700 dark:text-purple-300">
                <strong>Instant Upload:</strong> Photos upload immediately! Expiration dates and other data are extracted automatically in the background.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Processing Stages */}
        {(stage === 'uploading' || stage === 'scanning' || stage === 'classifying' || stage === 'extracting') && (
          <div className="space-y-4 py-8">
            <div className="flex items-center justify-center mb-6">
              <Loader2 className="h-16 w-16 animate-spin text-purple-500" />
            </div>

            {file && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-accent">
                {file.type === 'application/pdf' ? (
                  <FileText className="h-8 w-8 text-red-500" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-blue-500" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{getStageMessage(stage)}</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                {stage === 'uploading' && 'OpenAI Vision is analyzing your document...'}
                {stage === 'scanning' && 'OpenAI Vision is analyzing your document...'}
                {stage === 'classifying' && 'AI categorizing document...'}
                {stage === 'extracting' && 'AI extracting expiration date and details...'}
              </p>

              {/* Skip OCR Button - only show during scanning */}
              {stage === 'scanning' && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSkipOCR}
                    className="text-xs"
                  >
                    Skip OCR & Upload Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Preview & Confirm - for photos */}
        {stage === 'preview-confirm' && file && filePreview && (
          <div className="space-y-6 py-4">
            {/* Image Preview */}
            <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700">
              <img 
                src={filePreview} 
                alt="Document preview" 
                className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-900"
              />
              <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Review your document</strong> - Add details below and save to Documents Manager
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentName">Document Name *</Label>
                <Input
                  id="documentName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g., Insurance Card, Driver's License"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date (Optional)</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedDomain} onValueChange={(value) => setSelectedDomain(value as Domain)}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="health">Medical</SelectItem>
                    <SelectItem value="vehicles">Vehicle</SelectItem>
                    <SelectItem value="home">Property</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="financial">Financial & Tax</SelectItem>
                    <SelectItem value="pets">Pets</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="digital">Digital Assets</SelectItem>
                    <SelectItem value="mindfulness">Wellness</SelectItem>
                    <SelectItem value="miscellaneous">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={handleConfirmedUpload} 
                size="lg" 
                className="flex-1"
                disabled={!documentName.trim()}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Save to Documents Manager
              </Button>
              <Button 
                onClick={handleCancel} 
                variant="outline" 
                size="lg"
              >
                Cancel
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Expiration date will be extracted automatically in the background
            </p>
          </div>
        )}

        {/* Review Stage */}
        {stage === 'review' && extractedData && (
          <DynamicReviewForm
            extractedFields={extractedData.fields}
            documentType={documentType}
            documentTitle={extractedData.documentTitle}
            summary={extractedData.summary}
            onSave={handleSave}
            onCancel={handleCancel}
          />
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
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
              <Camera className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-green-700 dark:text-green-300">
              Document Saved Successfully!
            </h3>
            <p className="text-sm text-muted-foreground">
              Your document has been processed and saved.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Helper functions
function getStageMessage(stage: ProcessingStage): string {
  const messages: Record<ProcessingStage, string> = {
    idle: 'Ready',
    uploading: 'Processing with AI...',
    scanning: 'OpenAI Vision analyzing...',
    classifying: 'Categorizing...',
    extracting: 'Extracting data...',
    review: 'Review',
    'quick-upload': 'Quick Upload',
    'preview-confirm': 'Preview & Confirm',
    saving: 'Saving...',
    complete: 'Complete!',
  }
  return messages[stage] || 'Processing...'
}


















