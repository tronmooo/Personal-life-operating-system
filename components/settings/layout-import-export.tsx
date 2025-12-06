'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Download, Upload, Share2, Copy, Check, FileJson, Link2, AlertTriangle } from 'lucide-react'
import { LayoutIO } from '@/lib/dashboard/layout-io'
import { DashboardLayout } from '@/lib/types/dashboard-layout-types'

interface LayoutImportExportProps {
  currentLayout: DashboardLayout | null
  userId: string
  onImport: (layout: DashboardLayout) => void
}

export function LayoutImportExport({ currentLayout, userId, onImport }: LayoutImportExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [shareCode, setShareCode] = useState('')
  const [importCode, setImportCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const layoutIO = new LayoutIO()

  // Export as JSON file
  const handleExportJSON = async () => {
    if (!currentLayout || !currentLayout.id) {
      setError('No layout selected')
      return
    }

    try {
      setIsExporting(true)
      setError('')
      
      const layoutData = await layoutIO.exportLayout(currentLayout.id, userId)
      layoutIO.downloadLayout(layoutData, currentLayout.layout_name)
      
      setSuccess('Layout exported successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to export layout: ' + (err as Error).message)
    } finally {
      setIsExporting(false)
    }
  }

  // Import from JSON file
  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      setError('')

      const importedLayout = await layoutIO.importLayout(file)
      onImport(importedLayout)

      setSuccess('Layout imported successfully!')
      setTimeout(() => setSuccess(''), 3000)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError('Failed to import layout: ' + (err as Error).message)
    } finally {
      setIsImporting(false)
    }
  }

  // Generate share code
  const handleGenerateShareCode = async () => {
    if (!currentLayout || !currentLayout.id) {
      setError('No layout selected')
      return
    }

    try {
      setError('')
      const code = await layoutIO.shareLayout(currentLayout.id, userId)
      setShareCode(code)
      setSuccess('Share code generated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to generate share code: ' + (err as Error).message)
    }
  }

  // Copy share code
  const handleCopyShareCode = async () => {
    if (!shareCode) return

    const success = await layoutIO.copyLayoutToClipboard(shareCode)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setError('Failed to copy to clipboard')
    }
  }

  // Import from share code
  const handleImportFromCode = async () => {
    if (!importCode.trim()) {
      setError('Please enter a share code')
      return
    }

    try {
      setIsImporting(true)
      setError('')

      const importedLayout = await layoutIO.importFromShareCode(importCode.trim())
      onImport(importedLayout)

      setSuccess('Layout imported from share code!')
      setImportCode('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Invalid share code: ' + (err as Error).message)
    } finally {
      setIsImporting(false)
    }
  }

  // Copy current layout JSON
  const handleCopyJSON = async () => {
    if (!currentLayout || !currentLayout.id) {
      setError('No layout selected')
      return
    }

    try {
      const layoutData = await layoutIO.exportLayout(currentLayout.id, userId)
      const success = await layoutIO.copyLayoutToClipboard(layoutData)
      
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        setSuccess('Layout JSON copied to clipboard!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to copy to clipboard')
      }
    } catch (err) {
      setError('Failed to copy JSON: ' + (err as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Export Layout
          </CardTitle>
          <CardDescription>Download or share your current layout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleExportJSON}
              disabled={!currentLayout || isExporting}
              variant="outline"
              className="w-full"
            >
              <FileJson className="h-4 w-4 mr-2" />
              Download JSON
            </Button>

            <Button
              onClick={handleCopyJSON}
              disabled={!currentLayout}
              variant="outline"
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy JSON
                </>
              )}
            </Button>
          </div>

          {/* Share Code */}
          <div className="space-y-2">
            <Button
              onClick={handleGenerateShareCode}
              disabled={!currentLayout}
              variant="outline"
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Generate Share Code
            </Button>

            {shareCode && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Link2 className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Share Code Generated
                    </p>
                    <Textarea
                      value={shareCode}
                      readOnly
                      className="font-mono text-xs mb-2 min-h-[60px]"
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <Button
                      size="sm"
                      onClick={handleCopyShareCode}
                      className="w-full"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-green-600" />
            Import Layout
          </CardTitle>
          <CardDescription>Load a layout from a file or share code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Import from File */}
          <div>
            <label className="block text-sm font-medium mb-2">Import from JSON File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              variant="outline"
              className="w-full"
            >
              <FileJson className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Choose File'}
            </Button>
          </div>

          {/* Import from Share Code */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Import from Share Code</label>
            <Textarea
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder="Paste share code here..."
              className="font-mono text-sm min-h-[80px]"
            />
            <Button
              onClick={handleImportFromCode}
              disabled={!importCode.trim() || isImporting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import Layout'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-2 border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {success && (
        <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <p className="font-medium text-green-900 dark:text-green-100">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>💡 Tip:</strong> Share codes contain your entire layout configuration. Anyone with the code can import your layout design.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


























