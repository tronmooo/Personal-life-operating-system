'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  ShareContextValue,
  SharedLink,
  ShareTemplate,
  ShareAnalytics,
  CreateShareLinkRequest,
  CreateShareLinkResponse,
  ExportDataRequest,
  ExportDataResponse,
  SendEmailRequest,
  SendEmailResponse,
  GenerateQRRequest,
  GenerateQRResponse,
  ShareAction
} from '@/types/share'
import { Domain } from '@/types/domains'
import { useToast } from '@/components/ui/use-toast'

const ShareContext = createContext<ShareContextValue | undefined>(undefined)

interface ShareProviderProps {
  children: ReactNode
}

export function ShareProvider({ children }: ShareProviderProps) {
  const [activeShares, setActiveShares] = useState<SharedLink[]>([])
  const [recentShares, setRecentShares] = useState<SharedLink[]>([])
  const [templates, setTemplates] = useState<ShareTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  /**
   * Create a new shareable link
   */
  const shareData = useCallback(async (
    request: CreateShareLinkRequest
  ): Promise<CreateShareLinkResponse> => {
    setLoading(true)
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create share link')
      }

      const result: CreateShareLinkResponse = await response.json()

      // Update state
      setActiveShares(prev => [result.link, ...prev])
      setRecentShares(prev => [result.link, ...prev.slice(0, 9)])

      toast({
        title: '✅ Share link created',
        description: 'Your data is now ready to share!'
      })

      return result
    } catch (error: any) {
      toast({
        title: '❌ Failed to create share link',
        description: error.message,
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  /**
   * Export data in various formats
   */
  const exportData = useCallback(async (
    request: ExportDataRequest
  ): Promise<ExportDataResponse> => {
    setLoading(true)
    try {
      const response = await fetch('/api/share/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      const result: ExportDataResponse = await response.json()

      toast({
        title: '✅ Export complete',
        description: `Data exported as ${request.format.toUpperCase()}`
      })

      // Trigger download
      if (result.data) {
        const blob = base64ToBlob(result.data, result.mime_type)
        downloadBlob(blob, result.filename)
      }

      return result
    } catch (error: any) {
      toast({
        title: '❌ Export failed',
        description: error.message,
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  /**
   * Send share link via email
   */
  const sendEmail = useCallback(async (
    request: SendEmailRequest
  ): Promise<SendEmailResponse> => {
    setLoading(true)
    try {
      const response = await fetch('/api/share/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }

      const result: SendEmailResponse = await response.json()

      toast({
        title: '✅ Email sent',
        description: 'Share link has been sent successfully!'
      })

      return result
    } catch (error: any) {
      toast({
        title: '❌ Failed to send email',
        description: error.message,
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  /**
   * Generate QR code for URL
   */
  const generateQR = useCallback(async (
    url: string,
    options?: Omit<GenerateQRRequest, 'url'>
  ): Promise<GenerateQRResponse> => {
    setLoading(true)
    try {
      const response = await fetch('/api/share/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...options })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate QR code')
      }

      const result: GenerateQRResponse = await response.json()

      toast({
        title: '✅ QR code generated',
        description: 'Ready to scan and share!'
      })

      return result
    } catch (error: any) {
      toast({
        title: '❌ Failed to generate QR code',
        description: error.message,
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  /**
   * Get all shared links
   */
  const getSharedLinks = useCallback(async (): Promise<SharedLink[]> => {
    try {
      const response = await fetch('/api/share')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch shared links')
      }

      const result = await response.json()
      setActiveShares(result.links || [])
      return result.links || []
    } catch (error: any) {
      console.error('Failed to fetch shared links:', error)
      return []
    }
  }, [])

  /**
   * Update shared link
   */
  const updateSharedLink = useCallback(async (
    id: string,
    updates: Partial<SharedLink>
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/share/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update shared link')
      }

      // Update local state
      setActiveShares(prev =>
        prev.map(link => (link.id === id ? { ...link, ...updates } : link))
      )

      toast({
        title: '✅ Updated',
        description: 'Share link has been updated'
      })
    } catch (error: any) {
      toast({
        title: '❌ Update failed',
        description: error.message,
        variant: 'destructive'
      })
      throw error
    }
  }, [toast])

  /**
   * Delete shared link
   */
  const deleteSharedLink = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/share?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete shared link')
      }

      // Update local state
      setActiveShares(prev => prev.filter(link => link.id !== id))

      toast({
        title: '✅ Deleted',
        description: 'Share link has been removed'
      })
    } catch (error: any) {
      toast({
        title: '❌ Delete failed',
        description: error.message,
        variant: 'destructive'
      })
      throw error
    }
  }, [toast])

  /**
   * Get analytics for a shared link
   */
  const getShareAnalytics = useCallback(async (
    linkId: string
  ): Promise<ShareAnalytics[]> => {
    try {
      const response = await fetch(`/api/share/analytics?link_id=${linkId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch analytics')
      }

      const result = await response.json()
      return result.analytics || []
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error)
      return []
    }
  }, [])

  /**
   * Track share action
   */
  const trackShareAction = useCallback(async (
    linkId: string,
    action: ShareAction,
    details?: any
  ): Promise<void> => {
    try {
      await fetch('/api/share/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: linkId, action, details })
      })
    } catch (error) {
      console.error('Failed to track action:', error)
    }
  }, [])

  /**
   * Get templates
   */
  const getTemplates = useCallback(async (
    domain?: Domain
  ): Promise<ShareTemplate[]> => {
    try {
      const url = domain ? `/api/share/templates?domain=${domain}` : '/api/share/templates'
      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch templates')
      }

      const result = await response.json()
      setTemplates(result.templates || [])
      return result.templates || []
    } catch (error: any) {
      console.error('Failed to fetch templates:', error)
      return []
    }
  }, [])

  /**
   * Save template
   */
  const saveTemplate = useCallback(async (
    template: Omit<ShareTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ShareTemplate> => {
    try {
      const response = await fetch('/api/share/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save template')
      }

      const result = await response.json()
      setTemplates(prev => [result.template, ...prev])

      toast({
        title: '✅ Template saved',
        description: 'Share template created successfully'
      })

      return result.template
    } catch (error: any) {
      toast({
        title: '❌ Failed to save template',
        description: error.message,
        variant: 'destructive'
      })
      throw error
    }
  }, [toast])

  /**
   * Delete template
   */
  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/share/templates?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete template')
      }

      setTemplates(prev => prev.filter(t => t.id !== id))

      toast({
        title: '✅ Template deleted',
        description: 'Share template has been removed'
      })
    } catch (error: any) {
      toast({
        title: '❌ Delete failed',
        description: error.message,
        variant: 'destructive'
      })
      throw error
    }
  }, [toast])

  const value: ShareContextValue = {
    activeShares,
    recentShares,
    templates,
    loading,
    shareData,
    exportData,
    sendEmail,
    generateQR,
    getSharedLinks,
    updateSharedLink,
    deleteSharedLink,
    getShareAnalytics,
    trackShareAction,
    getTemplates,
    saveTemplate,
    deleteTemplate
  }

  return <ShareContext.Provider value={value}>{children}</ShareContext.Provider>
}

/**
 * Hook to use share context
 */
export function useShare() {
  const context = useContext(ShareContext)
  if (!context) {
    throw new Error('useShare must be used within ShareProvider')
  }
  return context
}

/**
 * Utility: Convert base64 to Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    
    byteArrays.push(new Uint8Array(byteNumbers))
  }

  return new Blob(byteArrays, { type: mimeType })
}

/**
 * Utility: Download Blob as file
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

