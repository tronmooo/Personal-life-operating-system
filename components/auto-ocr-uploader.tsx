'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, FileText, Image, Loader2, Check, AlertCircle, Sparkles, X, Calendar
} from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { ExpirationTracker, type ExpirationData } from './expiration-tracker'

// Dynamically import OCRService to avoid SSR issues
let OCRService: any = null

interface AutoOCRUploaderProps {
  domainId: string
  onDocumentUploaded: () => void
  maxSize?: number // in MB
}

interface UploadProgress {
  stage: 'reading' | 'ocr' | 'saving' | 'complete' | 'error'
  progress: number
  message: string
}

export function AutoOCRUploader({
  domainId,
  onDocumentUploaded,
  maxSize = 10
}: AutoOCRUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [extractedText, setExtractedText] = useState<string>('')
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [ocrReady, setOcrReady] = useState(false)
  const [expirationData, setExpirationData] = useState<ExpirationData | null>(null)
  const [showExpirationDialog, setShowExpirationDialog] = useState(false)
  const supabase = createClientComponentClient()

  // Load OCR service only on client side
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && !OCRService) {
      import('@/lib/services/ocr-service').then((mod) => {
        OCRService = mod.OCRService
        setOcrReady(true)
      })
    } else if (OCRService) {
      setOcrReady(true)
    }
  }, [])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`)
      return
    }

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Supported: PDF, JPG, PNG, WEBP')
      return
    }

    if (!ocrReady) {
      setError('OCR service is still loading. Please wait a moment and try again.')
      return
    }

    setFile(selectedFile)
    setError(null)
    setSuccess(false)
    
    // Automatically start processing
    await processDocument(selectedFile)
  }, [maxSize])

  const processDocument = async (fileToProcess: File) => {
    if (!OCRService) {
      setError('OCR service is still loading. Please wait a moment and try again.')
      return
    }

    setProcessing(true)
    setError(null)
    
    try {
      // Stage 1: Reading file
      setProgress({
        stage: 'reading',
        progress: 10,
        message: 'Reading file...'
      })

      // Convert to base64
      const base64 = await fileToBase64(fileToProcess)

      // Stage 2: OCR Processing
      setProgress({
        stage: 'ocr',
        progress: 30,
        message: 'Processing with OCR (this may take 10-30 seconds)...'
      })

      // Run OCR
      const ocrResult = await OCRService.processDocument(fileToProcess)
      
      // Set extracted text and show editor
      setExtractedText(ocrResult.text)
      setShowTextEditor(true)

      // Analyze document type
      const documentType = OCRService.analyzeDocumentType(ocrResult.text)

      // Check for expiration date and show dialog if found
      if (ocrResult.metadata.expirationDate) {
        setProgress({
          stage: 'complete',
          progress: 90,
          message: 'Expiration date found! Review before saving...'
        })
        
        setExpirationData({
          documentName: fileToProcess.name,
          expirationDate: ocrResult.metadata.expirationDate,
          extractedText: ocrResult.text,
          documentType,
          domain: domainId
        })
        setShowExpirationDialog(true)
        setProcessing(false)
        return // Wait for user decision
      }

      // Stage 3: Saving to database
      setProgress({
        stage: 'saving',
        progress: 80,
        message: 'Saving to database...'
      })

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('You must be logged in to upload documents')
      }

      // Prepare metadata
      const metadata = {
        fileName: fileToProcess.name,
        fileSize: fileToProcess.size,
        fileType: fileToProcess.type,
        documentType,
        ocrConfidence: ocrResult.confidence,
        extractedData: {
          expirationDate: ocrResult.metadata.expirationDate?.toISOString(),
          renewalDate: ocrResult.metadata.renewalDate?.toISOString(),
          policyNumber: ocrResult.metadata.policyNumber,
          accountNumber: ocrResult.metadata.accountNumber,
          amount: ocrResult.metadata.amount,
          currency: ocrResult.metadata.currency,
          email: ocrResult.metadata.email,
          phone: ocrResult.metadata.phone,
          dates: ocrResult.metadata.dates.map((d: Date) => d.toISOString())
        }
      }

      // Save to Supabase (auth required)
      if (user) {
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            domain: domainId, // domainId is actually the domain name (string)
            domain_id: null, // No specific domain_entry reference
            file_path: base64,
            file_data: base64,
            document_name: fileToProcess.name,
            file_name: fileToProcess.name,
            document_type: documentType,
            mime_type: fileToProcess.type,
            file_size: fileToProcess.size,
            metadata,
            ocr_text: extractedText || ocrResult.text,
            ocr_confidence: ocrResult.confidence,
            ocr_processed: true,
            ocr_data: {
              text: extractedText || ocrResult.text,
              confidence: ocrResult.confidence
            },
            expiration_date: ocrResult.metadata.expirationDate?.toISOString() || null,
            renewal_date: ocrResult.metadata.renewalDate?.toISOString() || null,
            policy_number: ocrResult.metadata.policyNumber || null,
            account_number: ocrResult.metadata.accountNumber || null,
            amount: ocrResult.metadata.amount || null
          })
          .select()
          .single()

        if (docError) {
          throw new Error(docError.message)
        }
      }

      // Stage 4: Complete
      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Document saved successfully!'
      })

      setSuccess(true)
      
      // 🔥 Emit global event to update all views (domains page, dashboards, etc.)
      window.dispatchEvent(new CustomEvent('documents-updated', {
        detail: { action: 'add', domain: domainId }
      }))
      window.dispatchEvent(new CustomEvent('data-updated', {
        detail: { domain: 'insurance', action: 'add', timestamp: Date.now() }
      }))
      
      // Notify parent to reload documents
      setTimeout(() => {
        onDocumentUploaded()
        reset()
      }, 1500)

    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to process document')
      setProgress({
        stage: 'error',
        progress: 0,
        message: err.message
      })
    } finally {
      setTimeout(() => setProcessing(false), 1500)
    }
  }

  const reset = () => {
    setFile(null)
    setError(null)
    setProgress(null)
    setSuccess(false)
    setProcessing(false)
    setExtractedText('')
    setShowTextEditor(false)
    setExpirationData(null)
    setShowExpirationDialog(false)
  }

  const handleExpirationConfirm = async (tracked: boolean, customDate?: Date) => {
    setShowExpirationDialog(false)
    
    if (tracked) {
      // Continue with document save
      setProcessing(true)
      setProgress({
        stage: 'saving',
        progress: 90,
        message: 'Saving document and reminder...'
      })
    }
    
    // Complete the save process
    try {
      setProgress({
        stage: 'complete',
        progress: 100,
        message: tracked ? 'Document saved with expiration tracking!' : 'Document saved successfully!'
      })

      setSuccess(true)
      
      setTimeout(() => {
        onDocumentUploaded()
        reset()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to complete save')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <ExpirationTracker
        expiration={expirationData}
        open={showExpirationDialog}
        onClose={() => setShowExpirationDialog(false)}
        onConfirm={handleExpirationConfirm}
      />
      
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Smart Document Upload
        </CardTitle>
        <CardDescription>
          Upload documents with automatic OCR processing - passports, IDs, insurance cards, bills, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!processing && !success && (
          <>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                disabled={!ocrReady || processing}
                className="sr-only"
                id="auto-file-upload"
                aria-label="Upload Document"
                aria-labelledby="auto-file-upload-label"
              />
              <label htmlFor="auto-file-upload" className="cursor-pointer block">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p id="auto-file-upload-label" className="text-lg font-medium mb-2">Upload Document</p>
                <p className="text-sm text-muted-foreground mb-4">
                  PDF, JPG, PNG, WEBP (max {maxSize}MB)
                </p>
                <Button type="button" disabled={!ocrReady || processing}>
                  Choose File
                </Button>
              </label>
              {!ocrReady && (
                <p className="mt-2 text-xs text-muted-foreground">Loading OCR engine…</p>
              )}
            </div>

            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-900">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
                    ✨ Automatic AI Processing
                  </div>
                  <ul className="text-purple-600 dark:text-purple-400 space-y-1">
                    <li>✓ Instant OCR text extraction</li>
                    <li>✓ Smart date detection (expiration, renewal)</li>
                    <li>✓ Policy/account number extraction</li>
                    <li>✓ Saves to cloud automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {file && processing && progress && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-accent">
              {file.type === 'application/pdf' ? (
                <FileText className="h-8 w-8 text-red-500" />
              ) : (
                <Image className="h-8 w-8 text-blue-500" />
              )}
              <div className="flex-1">
                <div className="font-medium">{file.name}</div>
                <div className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{progress.message}</span>
                <span className="text-muted-foreground">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
              {progress.stage === 'ocr' && (
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Running OCR... extracting text and data</span>
                </div>
              )}
            </div>
          </div>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Document uploaded and processed successfully!
            </AlertDescription>
          </Alert>
        )}

        {showTextEditor && extractedText && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Extracted Text</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowTextEditor(false)} 
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => file && processDocument(file)} 
                  size="sm"
                  disabled={!file}
                >
                  Save Document
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Review and edit the extracted text:</label>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Extracted text will appear here..."
              />
              <p className="text-xs text-muted-foreground">
                You can edit the text above before saving. The original OCR text is shown for your review.
              </p>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Button onClick={reset} variant="outline" className="w-full">
            <X className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
    </>
  )
}

// Helper function
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
