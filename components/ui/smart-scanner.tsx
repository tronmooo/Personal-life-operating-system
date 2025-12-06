'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Camera, FileText, X, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface SmartScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (data: any) => void
}

interface ScanResult {
  text: string
  documentType: string
  confidence: number
  suggestedDomain: string
  suggestedAction: string
  reasoning: string
  extractedData: any
  icon: string
}

export function SmartScanner({ open, onOpenChange, onSave }: SmartScannerProps) {
  const [mode, setMode] = useState<'select' | 'camera' | 'processing' | 'result' | 'edit'>('select')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [editedData, setEditedData] = useState<Record<string, any>>({})
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setMode('processing')
    await processDocument(file)
  }

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setMode('camera')
      }
    } catch (error) {
      console.error('Camera access denied:', error)
      setError('Could not access camera. Please check permissions.')
    }
  }

  // Capture photo from camera
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return
      
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setMode('processing')
      await processDocument(file)
    }, 'image/jpeg', 0.95)
  }

  // Process document with AI
  const processDocument = async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setProgress(0)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', file)

      console.log('📤 Uploading document for processing...')
      setProgress(10)

      // Call API to process document
      const response = await fetch('/api/documents/smart-scan', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process document')
      }

      const result = await response.json()
      console.log('✅ Document processed:', result)
      
      setProgress(100)
      setScanResult(result)
      setMode('result')
    } catch (error: any) {
      console.error('❌ Document processing error:', error)
      setError(error.message || 'Failed to process document')
      setMode('select')
    } finally {
      setIsProcessing(false)
    }
  }

  // Approve and save
  const handleApprove = async () => {
    if (!scanResult) return

    try {
      console.log('💾 Saving document...')
      
      // Call onSave callback if provided
      if (onSave) {
        onSave({
          ...scanResult,
          file: selectedFile,
          previewUrl,
        })
      }

      // Close dialog
      handleClose()
    } catch (error) {
      console.error('Save error:', error)
      setError('Failed to save document')
    }
  }

  // Close and cleanup
  const handleClose = () => {
    // Stop camera if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Reset state
    setMode('select')
    setSelectedFile(null)
    setPreviewUrl(null)
    setScanResult(null)
    setError(null)
    setProgress(0)
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Smart Document Scanner
          </DialogTitle>
          <DialogDescription>
            Upload or scan a document - AI will automatically classify and extract data
          </DialogDescription>
        </DialogHeader>

        {/* Mode: Select */}
        {mode === 'select' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Upload Button */}
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <Upload className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Upload Document</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Choose from your device
                  </p>
                </CardContent>
              </Card>

              {/* Camera Button */}
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={startCamera}>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <Camera className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Take Photo</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Scan with your camera
                  </p>
                </CardContent>
              </Card>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {error && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-semibold">✨ AI-Powered Features:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Automatic document type detection</li>
                <li>Smart data extraction (dates, amounts, etc.)</li>
                <li>Suggested actions and domain placement</li>
                <li>One-click to add to your life domains</li>
              </ul>
            </div>
          </div>
        )}

        {/* Mode: Camera */}
        {mode === 'camera' && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex gap-2">
              <Button onClick={capturePhoto} className="flex-1" size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Capture Photo
              </Button>
              <Button onClick={() => {
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach(track => track.stop())
                }
                setMode('select')
              }} variant="outline" size="lg">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Mode: Processing */}
        {mode === 'processing' && (
          <div className="space-y-6 py-8">
            {previewUrl && (
              <div className="flex justify-center">
                <img src={previewUrl} alt="Preview" className="max-w-md rounded-lg border" />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="font-semibold">Processing document with AI...</p>
              </div>

              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-sm text-muted-foreground text-center space-y-1">
                <p>🔍 Extracting text with Google Cloud Vision...</p>
                <p>🤖 Classifying document with AI...</p>
                <p>📊 Extracting structured data...</p>
              </div>
            </div>
          </div>
        )}

        {/* Mode: Result */}
        {mode === 'result' && scanResult && (
          <div className="space-y-6">
            {/* Preview */}
            {previewUrl && (
              <div className="flex justify-center">
                <img src={previewUrl} alt="Scanned" className="max-w-md rounded-lg border" />
              </div>
            )}

            {/* Classification Result */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{scanResult.icon}</span>
                  <span>AI Classification</span>
                  <Badge className="ml-auto">{Math.round(scanResult.confidence * 100)}% confident</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Document Type</p>
                  <p className="font-semibold">{scanResult.documentType}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Suggested Domain</p>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {scanResult.suggestedDomain}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Suggested Action</p>
                  <p className="font-semibold text-primary">{scanResult.suggestedAction}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">AI Reasoning</p>
                  <p className="text-sm">{scanResult.reasoning}</p>
                </div>
              </CardContent>
            </Card>

            {/* Extracted Data */}
            {scanResult.extractedData && Object.keys(scanResult.extractedData).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>📊 Extracted Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(scanResult.extractedData).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <p className="font-medium mt-1">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={() => {
                setEditedData(scanResult.extractedData || {})
                setMode('edit')
              }} variant="outline" className="flex-1" size="lg">
                <FileText className="mr-2 h-5 w-5" />
                Edit Data
              </Button>
              <Button onClick={handleApprove} className="flex-1" size="lg">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Save to {scanResult.suggestedDomain}
              </Button>
            </div>
          </div>
        )}

        {/* Mode: Edit */}
        {mode === 'edit' && scanResult && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>✏️ Edit Extracted Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {Object.entries(editedData).map(([key, value]) => (
                    <div key={key}>
                      <Label className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      {Array.isArray(value) ? (
                        <Textarea
                          value={value.join(', ')}
                          onChange={(e) => setEditedData({
                            ...editedData,
                            [key]: e.target.value.split(',').map(s => s.trim())
                          })}
                          className="mt-1"
                        />
                      ) : (
                        <Input
                          value={String(value)}
                          onChange={(e) => setEditedData({
                            ...editedData,
                            [key]: e.target.value
                          })}
                          className="mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setMode('result')} variant="outline" size="lg">
                Cancel
              </Button>
              <Button onClick={() => {
                // Update scan result with edited data
                setScanResult({
                  ...scanResult,
                  extractedData: editedData
                })
                setMode('result')
              }} className="flex-1" size="lg">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

