'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Camera, FileText, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Tesseract from 'tesseract.js'
import { format } from 'date-fns'

interface DocumentUploadScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDocumentSaved: (document: UploadedDocument) => void
  category?: string
  title?: string
  description?: string
  autoStartCamera?: boolean
  autoOpenFilePicker?: boolean
}

export interface UploadedDocument {
  id: string
  name: string
  file: File | null
  fileUrl: string | null
  extractedText: string
  expirationDate: Date | null
  uploadDate: Date
  category: string
  metadata: {
    size?: number
    type?: string
    source: 'upload' | 'camera'
    // Optional AI nutrition payload returned by /api/analyze-food-vision
    nutritionData?: any
  }
}

export function DocumentUploadScanner({
  open,
  onOpenChange,
  onDocumentSaved,
  category = 'general',
  title = 'Upload or Scan Document',
  description = 'Upload a document or take a photo to scan',
  autoStartCamera = false,
  autoOpenFilePicker = false
}: DocumentUploadScannerProps) {
  const [mode, setMode] = useState<'select' | 'upload' | 'camera'>('select')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractedText, setExtractedText] = useState('')
  const [documentName, setDocumentName] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [nutritionData, setNutritionData] = useState<any>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Auto actions when dialog opens
  if (open && autoStartCamera && mode === 'select') {
    // Start camera immediately on first paint when requested
    // Note: guarded so it doesn't loop
    setTimeout(() => startCamera(), 0)
  }
  if (open && autoOpenFilePicker && mode === 'select') {
    setTimeout(() => fileInputRef.current?.click(), 0)
  }

  // Extract expiration date from text
  const extractExpirationDate = useCallback((text: string): Date | null => {
    // Common patterns for expiration dates
    const patterns = [
      /expir(?:es|ation|y)?\s*(?:date)?:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /valid\s*(?:until|thru|through)?:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /renew(?:al)?(?:\s*date)?:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /due\s*(?:date)?:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /exp\.?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /best\s*(?:by|before)\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /use\s*by\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /sell\s*by\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        try {
          const dateStr = match[1]
          // Try to parse the date
          const parts = dateStr.split(/[-\/]/)
          if (parts.length === 3) {
            let [month, day, year] = parts
            
            // Handle 2-digit years
            if (year.length === 2) {
              year = `20${year}`
            }
            
            const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
            if (!isNaN(date.getTime())) {
              return date
            }
          }
        } catch (error) {
          console.error('Error parsing date:', error)
        }
      }
    }
    return null
  }, [])

  // Process OCR and nutrition analysis
  const processOCR = useCallback(async (imageSource: string | File) => {
    setIsProcessing(true)
    setProgress(0)

    try {
      // If this is a nutrition-meal, analyze food instead of OCR
      if (category === 'nutrition-meal') {
        setProgress(50)
        
        // Convert image to base64
        let base64Image = ''
        if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
          base64Image = imageSource
        } else if (imageSource instanceof File) {
          const reader = new FileReader()
          base64Image = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string || '')
            reader.readAsDataURL(imageSource)
          })
        }

        // Call food analysis API
        const response = await fetch('/api/analyze-food-vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const nutrition = data.nutrition
            const foods = data.foods.map((f: any) => f.name).join(', ')
            
            const nutritionText = `🍽️ DETECTED FOODS: ${foods}

📊 NUTRITION ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 Calories: ${nutrition.calories} kcal
🥩 Protein: ${nutrition.protein}g
🍞 Carbs: ${nutrition.carbs}g
🥑 Fat: ${nutrition.fat}g
🌾 Fiber: ${nutrition.fiber}g
🍬 Sugar: ${nutrition.sugar}g
━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Analysis complete! Click "Save Document" to log this meal.`
            
            setExtractedText(nutritionText)
            setNutritionData(data) // Save nutrition data for later
            setProgress(100)
            return nutritionText
          }
        } else {
          // Fallback to lightweight analyzer endpoint that simulates/estimates
          try {
            const fd = new FormData()
            if (imageSource instanceof File) {
              fd.append('image', imageSource)
            } else {
              // Convert dataURL to Blob
              const res = await fetch(imageSource)
              const blob = await res.blob()
              fd.append('image', new File([blob], 'meal.jpg', { type: blob.type || 'image/jpeg' }))
            }
            const alt = await fetch('/api/analyze-food', { method: 'POST', body: fd })
            if (alt.ok) {
              const data = await alt.json()
              if (data.success) {
                const n = data.totalNutrition || data.nutrition
                const foods = (data.foodItems || data.foods || []).map((f: any) => f.name).join(', ')
                const nutritionText = `🍽️ DETECTED FOODS: ${foods}\n\n📊 NUTRITION ANALYSIS:\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🔥 Calories: ${n.calories} kcal\n🥩 Protein: ${n.protein}g\n🍞 Carbs: ${n.carbs}g\n🥑 Fat: ${n.fat}g\n🌾 Fiber: ${n.fiber}g\n🍬 Sugar: ${n.sugar}g\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✅ Analysis complete! Click "Save Document" to log this meal.`
                setExtractedText(nutritionText)
                setNutritionData({ foods: data.foodItems || data.foods, nutrition: n })
                setProgress(100)
                return nutritionText
              }
            }
          } catch (_) {
            // continue to OCR fallback
          }
        }
        
        // Fallback: if API fails, still do OCR
        console.log('⚠️ Food analysis failed, falling back to OCR')
      }

      // Standard OCR processing
      const result = await Tesseract.recognize(
        imageSource,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          }
        }
      )

      const text = result.data.text
      setExtractedText(text)

      // Try to extract expiration date
      const foundExpiration = extractExpirationDate(text)
      if (foundExpiration) {
        setExpirationDate(format(foundExpiration, 'yyyy-MM-dd'))
      }

      return text
    } catch (error) {
      console.error('OCR Error:', error)
      alert('Failed to extract text from image')
      return ''
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }, [extractExpirationDate, category])

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setDocumentName(file.name)

    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Process OCR if image
    if (file.type.startsWith('image/')) {
      await processOCR(file)
    }

    setMode('upload')
  }

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setMode('camera')
    } catch (error) {
      console.error('Camera Error:', error)
      alert('Failed to access camera. Please check permissions.')
    }
  }

  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    
    const imageUrl = canvas.toDataURL('image/jpeg')
    setPreviewUrl(imageUrl)
    
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Process OCR
    await processOCR(imageUrl)

    // Generate filename
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss')
    setDocumentName(`scan_${timestamp}.jpg`)

    setMode('upload')
  }, [processOCR])

  // Save document
  const handleSave = async () => {
    if (!documentName) {
      alert('Please provide a document name')
      return
    }

    let file = selectedFile
    
    // If captured from camera, convert to file
    if (!file && previewUrl && previewUrl.startsWith('data:')) {
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      file = new File([blob], documentName, { type: 'image/jpeg' })
    }

    const document: UploadedDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: documentName,
      file: file,
      fileUrl: previewUrl,
      extractedText,
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      uploadDate: new Date(),
      category,
      metadata: {
        size: file?.size,
        type: file?.type,
        source: selectedFile ? 'upload' : 'camera',
        // include AI nutrition payload so caller can populate macros immediately
        nutritionData: nutritionData || null
      }
    }

    // Persist to database via API
    try {
      // Prefer uploading raw file if available, else send data URL
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        // Don't send domain_id if it's a category string like "nutrition-meal"
        // The domain should be null for general documents
        formData.append('domain_id', '') // Leave empty to let it be null
        formData.append('metadata', JSON.stringify({
          name: document.name,
          category: document.category,
          size: document.metadata.size,
          type: document.metadata.type,
          extractedText: document.extractedText,
          expirationDate: document.expirationDate?.toISOString() || null,
          nutritionData: nutritionData || null, // Include nutrition data if available
        }))

        const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to upload document')
        }
        // Use server-returned id and public URL
        const { data: saved } = await res.json()
        if (saved?.id) {
          document.id = saved.id
          document.fileUrl = saved.file_path || document.fileUrl
        }
      } else {
        // Fallback: save metadata when we only have data URL
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain_id: null, // Set to null for general documents
            file_path: previewUrl,
            metadata: {
              name: document.name,
              category: document.category,
              extractedText: document.extractedText,
              expirationDate: document.expirationDate?.toISOString() || null,
              nutritionData: nutritionData || null,
            },
            ocr_data: document.extractedText ? { text: document.extractedText } : null,
          })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to save document metadata')
        }
        const { data: saved } = await res.json()
        if (saved?.id) {
          document.id = saved.id
          document.fileUrl = saved.file_path || document.fileUrl
        }
      }
    } catch (e) {
      console.error(e)
      alert((e as Error).message)
      return
    }

    // Trigger callback to update UI immediately

    onDocumentSaved(document)
    handleClose()
  }

  // Close and cleanup
  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setMode('select')
    setPreviewUrl(null)
    setSelectedFile(null)
    setExtractedText('')
    setDocumentName('')
    setExpirationDate('')
    setNutritionData(null)
    setProgress(0)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Select Mode */}
        {mode === 'select' && (
          <div className="grid md:grid-cols-2 gap-4 py-8">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="h-40 flex flex-col gap-4 bg-gradient-to-br from-purple-600 to-blue-600"
              size="lg"
            >
              <Upload className="h-12 w-12" />
              <div>
                <div className="font-semibold text-lg">Upload File</div>
                <div className="text-sm opacity-90">PDF, Images, Documents</div>
              </div>
            </Button>

            <Button
              onClick={startCamera}
              className="h-40 flex flex-col gap-4 bg-gradient-to-br from-blue-600 to-cyan-600"
              size="lg"
            >
              <Camera className="h-12 w-12" />
              <div>
                <div className="font-semibold text-lg">Take Photo</div>
                <div className="text-sm opacity-90">Scan with camera</div>
              </div>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Camera Mode */}
        {mode === 'camera' && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-2">
              <Button onClick={capturePhoto} className="flex-1" size="lg">
                <Camera className="h-5 w-5 mr-2" />
                Capture Photo
              </Button>
              <Button onClick={handleClose} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Upload/Preview Mode */}
        {mode === 'upload' && (
          <div className="space-y-4">
            {/* Preview */}
            {previewUrl && (
              <div className="relative rounded-lg overflow-hidden border">
                {(selectedFile?.type === 'application/pdf') ? (
                  <div className="p-8 text-center bg-gray-50">
                    <FileText className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-muted-foreground">PDF Preview</p>
                  </div>
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full" />
                )}
              </div>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium">Extracting text...</p>
                  <div className="w-full h-2 bg-blue-200 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Extracted Text */}
            {extractedText && !isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <Label>Extracted Text</Label>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border max-h-40 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{extractedText}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="doc-name">Document Name</Label>
                <Input
                  id="doc-name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter document name"
                />
              </div>

              <div>
                <Label htmlFor="expiration">Expiration Date (Optional)</Label>
                <Input
                  id="expiration"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
                {expirationDate && (
                  <p className="text-sm text-muted-foreground mt-1">
                    You'll be notified 30 days before expiration
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1" disabled={isProcessing}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Document
              </Button>
              <Button onClick={handleClose} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

