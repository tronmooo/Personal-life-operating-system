'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, FileText, Image, File, X, Check, AlertCircle,
  Calendar, DollarSign, Hash, Mail, Phone, Sparkles, Loader2
} from 'lucide-react'
import { SmartDocument, DocumentUploadProgress } from '@/types/documents'
import { useNotifications } from '@/lib/providers/notification-provider'
import { format } from 'date-fns'

// Dynamically import OCRService to avoid SSR issues
let OCRService: any = null

interface SmartDocumentUploaderProps {
  domain: string
  itemId?: string
  onDocumentUploaded: (document: SmartDocument) => void
  maxSize?: number // in MB
}

export function SmartDocumentUploader({
  domain,
  itemId,
  onDocumentUploaded,
  maxSize = 10
}: SmartDocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<DocumentUploadProgress | null>(null)
  const [result, setResult] = useState<SmartDocument | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { addReminder } = useNotifications()

  // Load OCR service only on client side
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && !OCRService) {
      import('@/lib/services/ocr-service').then((mod) => {
        OCRService = mod.OCRService
      })
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
      setError('Please upload a PDF or image file (JPG, PNG, WEBP)')
      return
    }

    setFile(selectedFile)
    setError(null)
    setResult(null)
  }, [maxSize])

  const processDocument = async () => {
    if (!file) return

    setProcessing(true)
    setError(null)
    
    try {
      // Stage 1: Uploading
      setProgress({
        stage: 'uploading',
        progress: 10,
        message: 'Reading file...'
      })

      // Convert to base64
      const base64 = await fileToBase64(file)

      // Stage 2: OCR Processing
      setProgress({
        stage: 'processing',
        progress: 30,
        message: 'Processing document with OCR...'
      })

      // Run OCR
      const ocrResult = await OCRService.processDocument(file)

      // Stage 3: Extracting metadata
      setProgress({
        stage: 'extracting',
        progress: 70,
        message: 'Extracting key information...'
      })

      // Analyze document type
      const documentType = OCRService.analyzeDocumentType(ocrResult.text)

      // Create smart document
      const smartDoc: SmartDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64,
        uploadedAt: new Date().toISOString(),
        domain,
        itemId,
        ocrProcessed: true,
        ocrText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        extractedData: {
          documentType,
          expirationDate: ocrResult.metadata.expirationDate?.toISOString(),
          renewalDate: ocrResult.metadata.renewalDate?.toISOString(),
          policyNumber: ocrResult.metadata.policyNumber,
          accountNumber: ocrResult.metadata.accountNumber,
          amount: ocrResult.metadata.amount,
          currency: ocrResult.metadata.currency,
          email: ocrResult.metadata.email,
          phone: ocrResult.metadata.phone,
          dates: ocrResult.metadata.dates.map((d: Date) => d.toISOString())
        },
        notes: '',
        tags: [documentType],
        reminderCreated: false
      }

      // Auto-create reminder if expiration date found
      if (ocrResult.metadata.expirationDate) {
        const expirationDate = ocrResult.metadata.expirationDate
        const daysUntil = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntil > 0 && daysUntil <= 365) {
          const reminder = await addReminder({
            title: `${file.name} expires soon`,
            description: `Document expiration: ${format(expirationDate, 'MMM dd, yyyy')}`,
            domain,
            itemId,
            category: 'reminder',
            priority: daysUntil <= 30 ? 'high' : daysUntil <= 90 ? 'medium' : 'low',
            dueDate: expirationDate,
            notificationOffset: 30 * 24 * 60 // 30 days before
          })

          smartDoc.reminderCreated = true
          smartDoc.reminderId = (reminder as any)?.id
        }
      }

      // Stage 4: Complete
      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Document processed successfully!'
      })

      setResult(smartDoc)
      
      // Notify parent component
      setTimeout(() => {
        onDocumentUploaded(smartDoc)
      }, 1000)

    } catch (err: any) {
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
    setResult(null)
    setError(null)
    setProgress(null)
  }

  return (
    <div className="space-y-4">
      {!file && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
              <span className="truncate">Smart Document Upload</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 sm:p-8 text-center hover:border-purple-500 active:border-purple-500 active:bg-purple-50 dark:active:bg-purple-950 transition-colors cursor-pointer touch-manipulation">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                id="smart-file-upload"
              />
              <label htmlFor="smart-file-upload" className="cursor-pointer block py-2">
                <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
                <p className="text-sm sm:text-lg font-medium mb-1 sm:mb-2">Tap to Upload</p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  PDF, JPG, PNG (max {maxSize}MB)
                </p>
                <Button type="button" className="pointer-events-none min-h-[44px] px-6">
                  Choose File
                </Button>
              </label>
            </div>

            <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-900">
              <div className="flex items-start gap-2 sm:gap-3">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm">
                  <div className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
                    AI-Powered
                  </div>
                  <ul className="text-purple-600 dark:text-purple-400 space-y-0.5 sm:space-y-1">
                    <li>✓ OCR text extraction</li>
                    <li>✓ Date detection</li>
                    <li>✓ Auto-reminders</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {file && !result && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Ready to Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-accent">
              {file.type === 'application/pdf' ? (
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
              ) : (
                <Image className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base truncate">{file.name}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="min-h-[40px] min-w-[40px] p-2">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {processing && progress && (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium truncate mr-2">{progress.message}</span>
                  <span className="text-muted-foreground flex-shrink-0">{progress.progress}%</span>
                </div>
                <Progress value={progress.progress} className="h-2" />
                {progress.stage === 'processing' && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-600">
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    <span>Processing... 10-30 seconds</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {!processing && !error && (
              <Button onClick={processDocument} className="w-full min-h-[48px]" size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Process with AI
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300 text-base sm:text-lg">
              <Check className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Processed Successfully!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-green-50 dark:bg-green-950">
              {result.type === 'application/pdf' ? (
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              ) : (
                <Image className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-green-700 dark:text-green-300 text-sm sm:text-base truncate">{result.name}</div>
                <div className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                  Confidence: {result.ocrConfidence}%
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="font-semibold text-sm sm:text-base">Extracted Info:</div>
              
              {result.extractedData.documentType && (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <File className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Type:</span>
                  <Badge variant="outline" className="capitalize text-xs">
                    {result.extractedData.documentType.replace(/_/g, ' ')}
                  </Badge>
                </div>
              )}

              {result.extractedData.expirationDate && (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Expires:</span>
                  <span className="text-xs sm:text-sm">
                    {format(new Date(result.extractedData.expirationDate), 'MMM dd, yyyy')}
                  </span>
                  {result.reminderCreated && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-[10px] sm:text-xs">
                      Reminder Set
                    </Badge>
                  )}
                </div>
              )}

              {result.extractedData.renewalDate && (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Renewal:</span>
                  <span className="text-xs sm:text-sm">
                    {format(new Date(result.extractedData.renewalDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}

              {result.extractedData.policyNumber && (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Policy #:</span>
                  <code className="text-xs sm:text-sm bg-accent px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate max-w-[150px] sm:max-w-none">
                    {result.extractedData.policyNumber}
                  </code>
                </div>
              )}

              {result.extractedData.accountNumber && (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Account #:</span>
                  <code className="text-xs sm:text-sm bg-accent px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate max-w-[150px] sm:max-w-none">
                    {result.extractedData.accountNumber}
                  </code>
                </div>
              )}

              {result.extractedData.amount && (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Amount:</span>
                  <span className="text-xs sm:text-sm font-semibold">
                    ${result.extractedData.amount.toLocaleString()}
                  </span>
                </div>
              )}

              {result.extractedData.email && (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Email:</span>
                  <span className="text-xs sm:text-sm truncate max-w-[180px] sm:max-w-none">{result.extractedData.email}</span>
                </div>
              )}

              {result.extractedData.phone && (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Phone:</span>
                  <span className="text-xs sm:text-sm">{result.extractedData.phone}</span>
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm">Add Notes (Optional)</Label>
              <Textarea
                placeholder="Additional notes..."
                value={result.notes}
                onChange={(e) => setResult({ ...result, notes: e.target.value })}
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="flex flex-col xs:flex-row gap-2">
              <Button onClick={reset} variant="outline" className="flex-1 min-h-[44px]">
                Upload Another
              </Button>
              <Button 
                onClick={() => {
                  onDocumentUploaded(result)
                  reset()
                }}
                className="flex-1 min-h-[44px]"
              >
                Save Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
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







