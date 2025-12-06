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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Smart Document Upload with OCR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Upload a Document</p>
                <p className="text-sm text-muted-foreground mb-4">
                  PDF, JPG, PNG, WEBP (max {maxSize}MB)
                </p>
                <Button type="button">Choose File</Button>
              </label>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-900">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
                    AI-Powered Extraction
                  </div>
                  <ul className="text-purple-600 dark:text-purple-400 space-y-1">
                    <li>✓ Automatic text extraction (OCR)</li>
                    <li>✓ Smart date detection (expiration, renewal)</li>
                    <li>✓ Policy/account number extraction</li>
                    <li>✓ Auto-creates reminders for expiring documents</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {file && !result && (
        <Card>
          <CardHeader>
            <CardTitle>Document Ready to Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {processing && progress && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{progress.message}</span>
                  <span className="text-muted-foreground">{progress.progress}%</span>
                </div>
                <Progress value={progress.progress} className="h-2" />
                {progress.stage === 'processing' && (
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Running OCR... this may take 10-30 seconds</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!processing && !error && (
              <Button onClick={processDocument} className="w-full" size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Process with AI
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Check className="h-5 w-5" />
              Document Processed Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950">
              {result.type === 'application/pdf' ? (
                <FileText className="h-8 w-8 text-green-600" />
              ) : (
                <Image className="h-8 w-8 text-green-600" />
              )}
              <div className="flex-1">
                <div className="font-medium text-green-700 dark:text-green-300">{result.name}</div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  OCR Confidence: {result.ocrConfidence}%
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-semibold">Extracted Information:</div>
              
              {result.extractedData.documentType && (
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Type:</span>
                  <Badge variant="outline" className="capitalize">
                    {result.extractedData.documentType.replace(/_/g, ' ')}
                  </Badge>
                </div>
              )}

              {result.extractedData.expirationDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Expiration:</span>
                  <span className="text-sm">
                    {format(new Date(result.extractedData.expirationDate), 'MMM dd, yyyy')}
                  </span>
                  {result.reminderCreated && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Reminder Created
                    </Badge>
                  )}
                </div>
              )}

              {result.extractedData.renewalDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Renewal:</span>
                  <span className="text-sm">
                    {format(new Date(result.extractedData.renewalDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}

              {result.extractedData.policyNumber && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Policy #:</span>
                  <code className="text-sm bg-accent px-2 py-1 rounded">
                    {result.extractedData.policyNumber}
                  </code>
                </div>
              )}

              {result.extractedData.accountNumber && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Account #:</span>
                  <code className="text-sm bg-accent px-2 py-1 rounded">
                    {result.extractedData.accountNumber}
                  </code>
                </div>
              )}

              {result.extractedData.amount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Amount:</span>
                  <span className="text-sm font-semibold">
                    ${result.extractedData.amount.toLocaleString()}
                  </span>
                </div>
              )}

              {result.extractedData.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Email:</span>
                  <span className="text-sm">{result.extractedData.email}</span>
                </div>
              )}

              {result.extractedData.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Phone:</span>
                  <span className="text-sm">{result.extractedData.phone}</span>
                </div>
              )}
            </div>

            <div>
              <Label>Add Notes (Optional)</Label>
              <Textarea
                placeholder="Add any additional notes about this document..."
                value={result.notes}
                onChange={(e) => setResult({ ...result, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={reset} variant="outline" className="flex-1">
                Upload Another
              </Button>
              <Button 
                onClick={() => {
                  onDocumentUploaded(result)
                  reset()
                }}
                className="flex-1"
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







