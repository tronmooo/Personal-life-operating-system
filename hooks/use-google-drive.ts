'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
  webContentLink?: string
  thumbnailLink?: string
  createdTime: string
  modifiedTime: string
  size?: string
  extractedText?: string
  documentName?: string // Extracted document name
  documentDescription?: string // Extracted description
  issueDate?: string // Extracted issue date (YYYY-MM-DD)
}

interface UploadResult {
  success: boolean
  file?: DriveFile
  error?: string
  extractedMetadata?: {
    documentName?: string
    documentDescription?: string
    issueDate?: string
  }
}

export function useGoogleDrive(domain: string) {
  const { data: session } = useSession()
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Upload file to Google Drive
   */
  const uploadFile = useCallback(
    async (file: File, recordId?: string, extractedText?: string): Promise<UploadResult> => {
      if (!session) {
        return { success: false, error: 'Not authenticated' }
      }

      setLoading(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('domain', domain)
        if (recordId) formData.append('recordId', recordId)
        if (extractedText) formData.append('extractedText', extractedText)

        const response = await fetch('/api/drive/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed')
        }

        // Refresh file list
        await listFiles()

        return { success: true, file: data.file }
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to upload file'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      } finally {
        setLoading(false)
      }
    },
    [session, domain]
  )

  /**
   * List files for current domain
   */
  const listFiles = useCallback(async () => {
    if (!session) {
      setFiles([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/drive/list?domain=${domain}`, {
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to list files')
      }

      setFiles(data.files || [])
    } catch (err: any) {
      setError(err.message || 'Failed to list files')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [session, domain])

  /**
   * Delete file from Google Drive
   */
  const deleteFile = useCallback(
    async (fileId: string) => {
      if (!session) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/drive/delete', {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Delete failed')
        }

        // Refresh file list
        await listFiles()
      } catch (err: any) {
        setError(err.message || 'Failed to delete file')
      } finally {
        setLoading(false)
      }
    },
    [session, listFiles]
  )

  /**
   * Create shareable link for file
   */
  const createShareableLink = useCallback(
    async (fileId: string): Promise<string | null> => {
      if (!session) return null

      try {
        const response = await fetch('/api/drive/share', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId, anyoneWithLink: true }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create link')
        }

        return data.link
      } catch (err: any) {
        console.error('Error creating shareable link:', err.message)
        return null
      }
    },
    [session]
  )

  /**
   * Share file with specific email
   */
  const shareWithEmail = useCallback(
    async (fileId: string, email: string, role: 'reader' | 'writer' = 'reader') => {
      if (!session) return

      try {
        const response = await fetch('/api/drive/share', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId, email, role }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to share')
        }

        return data
      } catch (err: any) {
        console.error('Error sharing file:', err.message)
        throw err
      }
    },
    [session]
  )

  return {
    files,
    loading,
    error,
    uploadFile,
    listFiles,
    deleteFile,
    createShareableLink,
    shareWithEmail,
    isAuthenticated: !!session,
  }
}

