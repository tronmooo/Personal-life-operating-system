'use client'

import { useState, useRef, lazy, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Camera, FileText, Loader2, Sparkles } from 'lucide-react'

// Lazy load OCR components
const AutoOCRUploader = lazy(() => import('@/components/auto-ocr-uploader').then(module => ({ default: module.AutoOCRUploader })))
const MobileCameraOCR = lazy(() => import('@/components/mobile-camera-ocr').then(module => ({ default: module.MobileCameraOCR })))

interface UnifiedDocumentUploaderProps {
  domainId: string
  onDocumentUploaded: () => void
}

function UnifiedDocumentUploader({ domainId, onDocumentUploaded }: UnifiedDocumentUploaderProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Document Upload & Scan
        </CardTitle>
        <CardDescription>
          Upload files or use your camera to scan documents with automatic OCR
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'camera')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Camera Scan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <Suspense fallback={
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading uploader...</p>
              </div>
            }>
              <AutoOCRUploader 
                domainId={domainId}
                onDocumentUploaded={onDocumentUploaded}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="camera" className="mt-4">
            <Suspense fallback={
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading camera...</p>
              </div>
            }>
              <MobileCameraOCR 
                domainId={domainId}
                documentType="scanned"
                onImageCaptured={onDocumentUploaded}
              />
            </Suspense>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-dashed">
          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Automatic OCR Processing</p>
              <p className="text-xs text-muted-foreground">
                All uploads are automatically processed to extract text, dates, amounts, and other key information
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default UnifiedDocumentUploader
