'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, Upload, FileText, X, Check, Loader2, 
  Image as ImageIcon, Scan, Eye, Download
} from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

// Dynamically import Tesseract and OCR service to avoid SSR issues
let Tesseract: any = null
let OCRService: any = null

interface MobileCameraOCRProps {
  onTextExtracted?: (text: string) => void
  onImageCaptured?: (imageData: string, fileName: string) => void
  domainId?: string
  documentType?: string
}

export function MobileCameraOCR({ 
  onTextExtracted, 
  onImageCaptured,
  domainId,
  documentType 
}: MobileCameraOCRProps) {
  const { addData, addTask } = useData()
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [fileName, setFileName] = useState('')
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  // Load OCR libraries only on client side
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      if (!Tesseract) {
        import('tesseract.js').then((mod) => {
          Tesseract = mod.default || mod
        })
      }
      if (!OCRService) {
        import('@/lib/services/ocr-service').then((mod) => {
          OCRService = mod.OCRService
        })
      }
    }
  }, [])

  // Handle file upload from gallery
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const imageData = event.target?.result as string
      setCapturedImage(imageData)
      setShowPreview(true)

      // Auto-extract text and save
      await extractTextFromImage(imageData, file.name)
    }
    reader.readAsDataURL(file)
  }

  // Handle camera capture
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const captureFileName = `camera_${Date.now()}.jpg`
    setFileName(captureFileName)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const imageData = event.target?.result as string
      setCapturedImage(imageData)
      setShowPreview(true)

      // Auto-extract text and save
      await extractTextFromImage(imageData, captureFileName)
    }
    reader.readAsDataURL(file)
  }

  // Extract text using OCR and automatically save
  const extractTextFromImage = async (imageData: string, docFileName: string) => {
    if (!Tesseract) {
      console.error('Tesseract not loaded yet')
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      const result = await Tesseract.recognize(
        imageData,
        'eng',
        {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              setProcessingProgress(Math.round(m.progress * 100))
            }
          }
        }
      )

      const text = result.data.text.trim()
      setExtractedText(text)
      setShowTextEditor(true)
      
      if (onTextExtracted) {
        onTextExtracted(text)
      }

      // Automatically save to database
      if (domainId) {
        await saveToDatabase(imageData, text, docFileName)
      }

    } catch (error) {
      console.error('OCR Error:', error)
      setExtractedText('Failed to extract text. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }

  // Extract dates from text
  const extractDates = (text: string) => {
    const dates: Date[] = []
    const datePatterns = [
      // MM/DD/YYYY or MM-DD-YYYY
      /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,
      // YYYY-MM-DD
      /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/g,
      // Month DD, YYYY
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2}),? (\d{4})\b/gi,
      // DD Month YYYY
      /\b(\d{1,2}) (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{4})\b/gi
    ]

    datePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern)
      for (const match of matches) {
        try {
          const dateStr = match[0]
          const parsedDate = new Date(dateStr)
          if (!isNaN(parsedDate.getTime())) {
            dates.push(parsedDate)
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    })

    return dates
  }

  // Extract expiration date (looks for dates after keywords like "exp", "expiration", "valid until", etc.)
  const extractExpirationDate = (text: string): Date | null => {
    const expirationKeywords = ['exp', 'expiration', 'expires', 'valid until', 'valid thru', 'valid through', 'expiry']
    const lowerText = text.toLowerCase()
    
    for (const keyword of expirationKeywords) {
      const index = lowerText.indexOf(keyword)
      if (index !== -1) {
        // Look for date within 50 characters after the keyword
        const searchText = text.substring(index, index + 50)
        const dates = extractDates(searchText)
        if (dates.length > 0) {
          return dates[0]
        }
      }
    }
    
    // If no keyword found, return the latest date in the future
    const allDates = extractDates(text)
    const futureDates = allDates.filter(date => date > new Date())
    if (futureDates.length > 0) {
      return futureDates[futureDates.length - 1] // Return the latest future date
    }
    
    return null
  }

  // Save document to database AND create item with extracted data
  const saveToDatabase = async (imageData: string, text: string, docFileName: string) => {
    if (!domainId) return

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Extract structured data from OCR text
      const expirationDate = extractExpirationDate(text)
      const allDates = extractDates(text)
      
      // Detect document type from text
      const detectedType = detectDocumentType(text)
      
      // Prepare metadata
      const metadata = {
        fileName: docFileName,
        fileSize: Math.round(imageData.length * 0.75),
        fileType: 'image/jpeg',
        documentType: detectedType || documentType || 'scanned',
        extractedText: text,
        expirationDate: expirationDate?.toISOString(),
        allDates: allDates.map(d => d.toISOString())
      }

      // 1. Save document (PDF/image)
      if (user) {
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            domain_id: domainId,
            file_path: imageData,
            metadata,
            ocr_data: {
              text,
              confidence: 85
            }
          })
          .select()
          .single()

        if (docError) {
          console.error('Error saving document:', docError)
        }
      } else {
        // Save to IndexedDB when not authenticated (will sync on sign-in)
        const documentData = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          domain_id: domainId,
          file_path: imageData,
          metadata,
          ocr_data: {
            text,
            confidence: 85
          },
          uploaded_at: new Date().toISOString(),
          pendingSync: true // Flag for syncing on sign-in
        }
        
        const { idbGet, idbSet } = await import('@/lib/utils/idb-cache')
        const existingDocs = (await idbGet<any[]>('lifehub-documents', [])) || []
        existingDocs.push(documentData)
        await idbSet('lifehub-documents', existingDocs)
        
        console.log('⚠️ Document saved to IndexedDB - will sync on sign-in')
      }

      // 2. ALSO save extracted text as an item in the domain
      const itemTitle = `${detectedType || 'Document'} - ${docFileName.replace(/\.[^/.]+$/, '')}`
      addData(domainId as any, {
        title: itemTitle,
        description: text.substring(0, 500), // First 500 chars
        metadata: {
          type: 'document-extracted',
          documentType: detectedType,
          extractedText: text,
          expirationDate: expirationDate?.toISOString(),
          fileName: docFileName,
          ocrConfidence: 85
        }
      })
      console.log('✅ Item created with extracted data')

      // 3. If expiration date found, create a reminder task
      if (expirationDate && expirationDate > new Date()) {
        const daysUntilExpiration = Math.floor((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        
        // Create task to renew 30 days before expiration
        const reminderDate = new Date(expirationDate)
        reminderDate.setDate(reminderDate.getDate() - 30)
        
        if (reminderDate > new Date()) {
          addTask({
            title: `Renew ${detectedType || 'Document'}: ${docFileName.replace(/\.[^/.]+$/, '')} - Expires ${expirationDate.toLocaleDateString()}`,
            dueDate: reminderDate.toISOString().split('T')[0],
            priority: daysUntilExpiration < 60 ? 'high' : 'medium',
            completed: false
          })
          console.log(`✅ Reminder task created for ${expirationDate.toLocaleDateString()}`)
        }
      }

      // Notify parent
      if (onImageCaptured) {
        onImageCaptured(imageData, docFileName)
      }

      // Clear after successful save
      setTimeout(() => {
        handleClear()
      }, 2000)

    } catch (error) {
      console.error('Failed to save document:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Detect document type from OCR text
  const detectDocumentType = (text: string): string => {
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('passport') || lowerText.includes('travel document')) return 'Passport'
    if (lowerText.includes('driver') && lowerText.includes('license')) return 'Driver License'
    if (lowerText.includes('insurance') && lowerText.includes('card')) return 'Insurance Card'
    if (lowerText.includes('insurance') && lowerText.includes('policy')) return 'Insurance Policy'
    if (lowerText.includes('bill') || lowerText.includes('invoice')) return 'Bill'
    if (lowerText.includes('receipt')) return 'Receipt'
    if (lowerText.includes('contract')) return 'Contract'
    if (lowerText.includes('lease') || lowerText.includes('rental agreement')) return 'Lease Agreement'
    if (lowerText.includes('identification') || lowerText.includes('id card')) return 'ID Card'
    if (lowerText.includes('certificate')) return 'Certificate'
    if (lowerText.includes('medical') || lowerText.includes('prescription')) return 'Medical Document'
    
    return 'Document'
  }

  // Clear current capture
  const handleClear = () => {
    setCapturedImage(null)
    setExtractedText('')
    setShowPreview(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  // Download image
  const handleDownload = () => {
    if (!capturedImage) return
    
    const link = document.createElement('a')
    link.href = capturedImage
    link.download = `document_${Date.now()}.jpg`
    link.click()
  }

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-blue-600" />
          Mobile Scanner & OCR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Options */}
        {!capturedImage && (
          <div className="grid grid-cols-2 gap-3">
            {/* Camera Button (Mobile Only) */}
            <Button
              onClick={() => cameraInputRef.current?.click()}
              className="h-24 flex flex-col gap-2"
              variant="outline"
            >
              <Camera className="h-8 w-8" />
              <span className="text-sm">Take Photo</span>
            </Button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />

            {/* Upload from Gallery */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="h-24 flex flex-col gap-2"
              variant="outline"
            >
              <Upload className="h-8 w-8" />
              <span className="text-sm">Upload Image</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Image Preview */}
        {capturedImage && showPreview && (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
              <img 
                src={capturedImage} 
                alt="Captured document" 
                className="w-full h-auto"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Status Messages */}
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving to database...</span>
              </div>
            )}
            {!isProcessing && !isSaving && extractedText && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                <Check className="h-4 w-4" />
                <span>Document saved successfully!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => extractTextFromImage(capturedImage, fileName)}
                variant="outline"
                className="flex-1"
                disabled={isProcessing || isSaving}
              >
                <Scan className="h-4 w-4 mr-2" />
                Re-scan OCR
              </Button>
            </div>
          </div>
        )}

        {/* OCR Processing */}
        {isProcessing && (
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Extracting text...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {processingProgress}% complete
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extracted Text */}
        {extractedText && !isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                Extracted Text
              </Label>
              <Badge variant="secondary">
                <Check className="h-3 w-3 mr-1" />
                OCR Complete
              </Badge>
            </div>
            
            <Textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Extracted text will appear here..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        )}

        {/* Tips */}
        {!capturedImage && (
          <Card className="bg-gray-50 dark:bg-gray-900 border-dashed">
            <CardContent className="py-4">
              <p className="text-sm font-medium mb-2">📸 Tips for best results:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Ensure good lighting</li>
                <li>• Keep camera steady</li>
                <li>• Capture entire document</li>
                <li>• Avoid shadows and glare</li>
                <li>• Use flat surface if possible</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

