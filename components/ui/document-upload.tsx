'use client'

import { useState, useEffect, useMemo } from 'react'
import { Upload, FileText, Sparkles, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from './button'
import { processDocument, OCRResult, extractStructuredMetadata } from '@/lib/ocr-processor'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

interface DocumentUploadProps {
  domain?: string
  recordId?: string
  label?: string
  accept?: string
  enableOCR?: boolean
  onUploadComplete?: (fileId: string, extractedMetadata?: any) => void
}

type AuthStatus = 'pending' | 'ready' | 'unauthenticated'

export function DocumentUpload({
  domain,
  recordId,
  label = 'Documents',
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  enableOCR = true,
  onUploadComplete,
}: DocumentUploadProps) {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [authStatus, setAuthStatus] = useState<AuthStatus>('pending')
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [lastUpload, setLastUpload] = useState<{
    id: string
    url: string
    fileName: string
    metadata?: Record<string, any>
  } | null>(null)
  const [extractedPreview, setExtractedPreview] = useState<string>('')

  useEffect(() => {
    let mounted = true
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!mounted) return
        setAuthStatus(user ? 'ready' : 'unauthenticated')
      })
      .catch(() => {
        if (!mounted) return
        setAuthStatus('unauthenticated')
      })

    return () => {
      mounted = false
    }
  }, [supabase])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (authStatus !== 'ready') {
      setErrorMessage('You must be signed in to upload documents.')
      return
    }

    setUploading(true)
    setStatusMessage('')
    setErrorMessage('')
    let ocrResult: OCRResult | undefined
    let structuredMetadata: Record<string, any> | undefined

    try {
      if (enableOCR) {
        setOcrProcessing(true)
        try {
          ocrResult = await processDocument(file)
          const extractedText = ocrResult?.text?.trim() || ''
          if (extractedText) {
            setExtractedPreview(extractedText.slice(0, 400))
            structuredMetadata = await extractStructuredMetadata(extractedText)
          } else {
            setExtractedPreview('')
          }
        } catch (ocrError) {
          console.error('OCR processing failed:', ocrError)
          setExtractedPreview('')
        } finally {
          setOcrProcessing(false)
        }
      }

      const metadataPayload = cleanMetadata({
        domain,
        recordId,
        originalFileName: file.name,
        mimeType: file.type,
        size: file.size,
        ocrText: ocrResult?.text ? truncateText(ocrResult.text, 6000) : undefined,
        ocrConfidence: ocrResult?.confidence,
        ...structuredMetadata,
      })

      const formData = new FormData()
      formData.append('file', file)
      if (domain) {
        formData.append('domain', domain)
      }
      if (recordId) {
        formData.append('domain_id', recordId)
      }
      formData.append('metadata', JSON.stringify(metadataPayload))

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await safeJson(response)
        throw new Error(err?.error || 'Upload failed. Please try again.')
      }

      const { data } = await response.json()
      const fileUrl: string = data?.file_path
      const fileId: string = data?.id

      setLastUpload({
        id: fileId,
        url: fileUrl,
        fileName: file.name,
        metadata: metadataPayload,
      })
      setStatusMessage('Document uploaded successfully.')

      if (onUploadComplete) {
        onUploadComplete(fileId, {
          ...metadataPayload,
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
        })
      }
    } catch (error) {
      console.error('Upload failed:', error)
      setErrorMessage((error as Error)?.message ?? 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const statusIcon = useMemo(() => {
    if (ocrProcessing) {
      return <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-500 animate-pulse" />
    }
    if (uploading) {
      return <Upload className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-pulse" />
    }
    return <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
  }, [ocrProcessing, uploading])

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">{label}</label>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-700'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          accept={accept}
          onChange={handleChange}
          disabled={uploading || ocrProcessing || authStatus !== 'ready'}
        />
        <div className="text-center">
          {statusIcon}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {authStatus === 'unauthenticated'
              ? 'Sign in to upload documents.'
              : ocrProcessing
              ? '✨ Extracting text...'
              : uploading
              ? 'Uploading...'
              : 'Drag and drop or click to upload'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PDF, DOC, DOCX, JPG, PNG {enableOCR && '• Auto text extraction enabled'}
          </p>
        </div>
      </div>

      {authStatus === 'pending' && (
        <div className="py-3 text-center text-sm text-gray-500">Checking authentication…</div>
      )}

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-md border border-green-600/40 bg-green-600/10 px-3 py-2 text-sm text-green-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-md border border-red-600/40 bg-red-600/10 px-3 py-2 text-sm text-red-300">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {lastUpload && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lastUpload.fileName}</p>
                {lastUpload.metadata?.documentName && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{lastUpload.metadata.documentName}</p>
                )}
                {lastUpload.metadata?.expirationDate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Expires {formatDate(lastUpload.metadata.expirationDate)}
                  </p>
                )}
              </div>
            </div>
            {lastUpload.url && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => window.open(lastUpload.url, '_blank')}
              >
                <ExternalLink className="mr-2 h-3 w-3" />
                View
              </Button>
            )}
          </div>
          {extractedPreview && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {extractedPreview.length > 280 ? `${extractedPreview.slice(0, 280)}…` : extractedPreview}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function cleanMetadata(metadata: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

async function safeJson(response: Response) {
  try {
    return await response.json()
  } catch (error) {
    return null
  }
}

function formatDate(value: string) {
  try {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleDateString()
  } catch (error) {
    return value
  }
}

