'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { Camera, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export function OCRScanner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addDocument } = useData()
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [extractedText, setExtractedText] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    tags: '',
  })

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      processImage(file)
    } else {
      setError('Please select a valid image file')
    }
  }

  const processImage = async (file: File) => {
    setStep('processing')
    setError('')

    try {
      // Simulate OCR processing (in a real app, you would call an OCR API like Google Cloud Vision, Tesseract.js, or Azure Computer Vision)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulated extracted text - in production, this would come from an OCR API
      const mockExtractedText = `Document Type: Example Receipt
Date: ${new Date().toLocaleDateString()}
Amount: $125.00
Merchant: Sample Store
Category: Utilities

This is simulated OCR text extraction. 

In production, this would use:
- Google Cloud Vision API
- Azure Computer Vision
- AWS Textract
- Tesseract.js (client-side)
- Or any other OCR service

The text would be automatically extracted from the image and displayed here for review.`

      setExtractedText(mockExtractedText)
      
      // Auto-fill some fields based on extracted text (AI/GPT enhancement)
      const category = mockExtractedText.toLowerCase().includes('receipt') ? 'Financial' : 'Personal'
      setFormData({
        ...formData,
        title: `Scanned Document - ${new Date().toLocaleDateString()}`,
        category,
      })

      setStep('review')
    } catch (err) {
      setError('Failed to process image. Please try again.')
      setStep('upload')
    }
  }

  const handleSave = () => {
    addDocument({
      title: formData.title,
      category: formData.category,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      extractedText,
      fileUrl: imagePreview, // In production, upload to storage and save URL
    })

    // Reset
    setStep('upload')
    setImageFile(null)
    setImagePreview('')
    setExtractedText('')
    setFormData({ title: '', category: '', tags: '' })
    onClose()
  }

  const handleClose = () => {
    setStep('upload')
    setImageFile(null)
    setImagePreview('')
    setExtractedText('')
    setFormData({ title: '', category: '', tags: '' })
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            OCR Document Scanner
          </DialogTitle>
          <DialogDescription>
            Capture or upload a document to extract text using AI
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                className="h-32 flex-col"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-8 w-8 mb-2" />
                <span>Take Photo</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-32 flex-col"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mb-2" />
                <span>Upload Image</span>
              </Button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-sm text-muted-foreground">
              <p className="font-medium mb-2">Supported Features:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Automatic text extraction from images</li>
                <li>AI-powered data recognition (receipts, bills, IDs)</li>
                <li>Automatic categorization</li>
                <li>Searchable document archive</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Processing image...</p>
            <p className="text-sm text-muted-foreground">Extracting text using AI</p>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Text extracted successfully!</span>
            </div>

            {imagePreview && (
              <div className="relative">
                <Label>Scanned Image</Label>
                <img 
                  src={imagePreview} 
                  alt="Scanned document" 
                  className="w-full max-h-64 object-contain rounded-lg border mt-2"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Extracted Text</Label>
              <Textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                rows={8}
                className="font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Electric Bill Oct 2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select category</option>
                  <option value="Legal">Legal</option>
                  <option value="Financial">Financial</option>
                  <option value="Medical">Medical</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., receipt, bill, important"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'review' ? (
            <>
              <Button type="button" variant="outline" onClick={() => setStep('upload')}>
                Scan Another
              </Button>
              <Button onClick={handleSave}>
                Save Document
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}








