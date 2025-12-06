'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Download, FileText, Image, Calendar, DollarSign, Hash, 
  Mail, Phone, Sparkles, Copy, Check
} from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

interface DocumentPreviewModalProps {
  document: any
  open: boolean
  onClose: () => void
}

export function DocumentPreviewModal({ document, open, onClose }: DocumentPreviewModalProps) {
  const [copiedText, setCopiedText] = useState(false)

  if (!document) return null

  const isImage = document.fileType?.includes('image')
  const isPDF = document.fileType?.includes('pdf')

  const handleCopyText = async () => {
    if (document.fullText) {
      await navigator.clipboard.writeText(document.fullText)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    }
  }

  const handleDownload = () => {
    const link = window.document.createElement('a')
    link.href = document.base64Content
    link.download = document.name
    link.click()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isImage ? (
              <Image className="h-5 w-5 text-blue-500" />
            ) : (
              <FileText className="h-5 w-5 text-red-500" />
            )}
            {document.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Type and Confidence */}
          <div className="flex items-center gap-2 flex-wrap">
            {document.documentType && (
              <Badge variant="outline" className="capitalize">
                {document.documentType.replace(/_/g, ' ')}
              </Badge>
            )}
            {document.ocrConfidence > 0 && (
              <Badge variant="secondary">
                <Sparkles className="h-3 w-3 mr-1" />
                {Math.round(document.ocrConfidence)}% OCR Confidence
              </Badge>
            )}
            {document.expirationDate && (() => {
              const daysUntil = Math.ceil((document.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const isExpiring = daysUntil > 0 && daysUntil <= 30
              return (
                <Badge variant={isExpiring ? "destructive" : "secondary"}>
                  {isExpiring ? `⚠️ Expires in ${daysUntil} days` : `Valid`}
                </Badge>
              )
            })()}
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
              <TabsTrigger value="text">Full Text</TabsTrigger>
            </TabsList>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              {isImage && document.base64Content && (
                <div className="rounded-lg border overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
                  <img 
                    src={document.base64Content} 
                    alt={document.name}
                    className="w-full h-auto max-h-[500px] object-contain mx-auto"
                  />
                </div>
              )}
              {isPDF && (
                <div className="rounded-lg border p-8 text-center bg-gray-50 dark:bg-gray-900">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    PDF Preview (OCR text available in other tabs)
                  </p>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              )}
              
              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Uploaded</div>
                  <div className="text-sm font-medium">
                    {format(document.uploadDate, 'MMM dd, yyyy')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">File Size</div>
                  <div className="text-sm font-medium">
                    {(document.size / 1024).toFixed(0)} KB
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Extracted Data Tab */}
            <TabsContent value="extracted" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dates */}
                {document.expirationDate && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200">
                    <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Expiration Date</div>
                      <div className="text-sm font-semibold">
                        {format(document.expirationDate, 'MMMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                )}

                {document.renewalDate && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Renewal Date</div>
                      <div className="text-sm font-semibold">
                        {format(document.renewalDate, 'MMMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Numbers */}
                {document.policyNumber && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200">
                    <Hash className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Policy Number</div>
                      <code className="text-sm font-mono font-semibold">
                        {document.policyNumber}
                      </code>
                    </div>
                  </div>
                )}

                {document.accountNumber && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200">
                    <Hash className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Account Number</div>
                      <code className="text-sm font-mono font-semibold">
                        {document.accountNumber}
                      </code>
                    </div>
                  </div>
                )}

                {/* Amount */}
                {document.amount && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200">
                    <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <div className="text-lg font-bold text-green-600">
                        ${document.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact */}
                {document.email && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="text-sm">{document.email}</div>
                    </div>
                  </div>
                )}

                {document.phone && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Phone</div>
                      <div className="text-sm">{document.phone}</div>
                    </div>
                  </div>
                )}
              </div>

              {!document.policyNumber && !document.accountNumber && !document.amount && 
               !document.email && !document.phone && !document.expirationDate && !document.renewalDate && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No structured data extracted from this document</p>
                  <p className="text-xs mt-1">The full OCR text is available in the "Full Text" tab</p>
                </div>
              )}
            </TabsContent>

            {/* Full Text Tab */}
            <TabsContent value="text" className="space-y-4">
              {document.fullText ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {document.fullText.length} characters extracted
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyText}
                    >
                      {copiedText ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Text
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="rounded-lg border p-4 bg-gray-50 dark:bg-gray-900 max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {document.fullText}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No text extracted from this document</p>
                  <p className="text-xs mt-1">Try uploading a clearer image with visible text</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}






























