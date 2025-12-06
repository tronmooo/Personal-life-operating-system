'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useShare } from '@/lib/contexts/share-context'
import { ShareModalProps, ShareFormat, ShareAccessType, ExportOptions, ShareTab } from '@/types/share'
import { DOMAIN_CONFIGS } from '@/types/domains'
import {
  Share2, Link2, Download, Mail, QrCode, Settings2, 
  Copy, Check, Lock, Clock, Eye, Users, Sparkles,
  FileJson, FileText, FileSpreadsheet, FileImage
} from 'lucide-react'
import { format } from 'date-fns'

export function UniversalShareModal({ isOpen, onClose, domain, entries, defaultTab = 'link' }: ShareModalProps) {
  const { shareData, exportData, sendEmail, generateQR, loading } = useShare()
  const domainConfig = DOMAIN_CONFIGS[domain]
  
  // Link tab state
  const [shareUrl, setShareUrl] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [accessType, setAccessType] = useState<ShareAccessType>('public')
  const [password, setPassword] = useState('')
  const [expiresIn, setExpiresIn] = useState('never')
  const [maxViews, setMaxViews] = useState('')
  
  // Export tab state
  const [exportFormat, setExportFormat] = useState<ShareFormat>('json')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({})
  
  // Email tab state
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  
  // QR tab state
  const [qrCode, setQrCode] = useState('')
  
  // Active tab
  const [activeTab, setActiveTab] = useState(defaultTab)

  const entryCount = entries.length
  const domainName = domainConfig?.name || domain

  /**
   * Generate share link
   */
  const handleGenerateLink = async () => {
    try {
      let expires_at: string | undefined
      
      if (expiresIn !== 'never') {
        const now = new Date()
        const hours = parseInt(expiresIn)
        now.setHours(now.getHours() + hours)
        expires_at = now.toISOString()
      }

      const result = await shareData({
        domain,
        entry_ids: entries.map(e => e.id),
        title: `${domainName} - ${entryCount} ${entryCount === 1 ? 'item' : 'items'}`,
        description: `Shared ${format(new Date(), 'PPP')}`,
        access_type: accessType,
        password: accessType === 'password' ? password : undefined,
        expires_at,
        max_views: maxViews ? parseInt(maxViews) : undefined
      })

      setShareUrl(result.share_url)
    } catch (error) {
      console.error('Failed to generate link:', error)
    }
  }

  /**
   * Copy link to clipboard
   */
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  /**
   * Handle export
   */
  const handleExport = async () => {
    try {
      await exportData({
        domain,
        entry_ids: entries.map(e => e.id),
        format: exportFormat,
        options: exportOptions
      })
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  /**
   * Handle email send
   */
  const handleSendEmail = async () => {
    if (!emailTo || !emailSubject) {
      return
    }

    try {
      // Generate link first if we don't have one
      let linkToShare = shareUrl
      if (!linkToShare) {
        const result = await shareData({
          domain,
          entry_ids: entries.map(e => e.id),
          title: emailSubject,
          description: emailMessage,
          access_type: 'public'
        })
        linkToShare = result.share_url
        setShareUrl(linkToShare)
      }

      await sendEmail({
        to: emailTo.split(',').map(e => e.trim()),
        subject: emailSubject,
        message: emailMessage + `\n\nView shared content: ${linkToShare}`
      })

      setEmailTo('')
      setEmailSubject('')
      setEmailMessage('')
    } catch (error) {
      console.error('Failed to send email:', error)
    }
  }

  /**
   * Generate QR code
   */
  const handleGenerateQR = async () => {
    try {
      // Generate link first if we don't have one
      let linkToShare = shareUrl
      if (!linkToShare) {
        const result = await shareData({
          domain,
          entry_ids: entries.map(e => e.id),
          title: `${domainName} - QR Share`,
          access_type: 'public'
        })
        linkToShare = result.share_url
        setShareUrl(linkToShare)
      }

      const result = await generateQR(linkToShare, {
        size: 300,
        format: 'png'
      })

      setQrCode(result.qr_code)
    } catch (error) {
      console.error('Failed to generate QR:', error)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setShareUrl('')
      setLinkCopied(false)
      setQrCode('')
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share {domainName}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Sharing {entryCount} {entryCount === 1 ? 'item' : 'items'}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ShareTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="link" className="text-xs">
              <Link2 className="h-3 w-3 mr-1" />
              Link
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export
            </TabsTrigger>
            <TabsTrigger value="email" className="text-xs">
              <Mail className="h-3 w-3 mr-1" />
              Email
            </TabsTrigger>
            <TabsTrigger value="qr" className="text-xs">
              <QrCode className="h-3 w-3 mr-1" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">
              <Settings2 className="h-3 w-3 mr-1" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Link Tab */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Access Type</Label>
              <Select value={accessType} onValueChange={(v: ShareAccessType) => setAccessType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Public - Anyone with link
                    </div>
                  </SelectItem>
                  <SelectItem value="password">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password Protected
                    </div>
                  </SelectItem>
                  <SelectItem value="email-only">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Email Only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {accessType === 'password' && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Expires In</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="168">7 days</SelectItem>
                    <SelectItem value="720">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Views (Optional)</Label>
                <Input
                  type="number"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
            </div>

            <Button onClick={handleGenerateLink} className="w-full" disabled={loading}>
              <Link2 className="h-4 w-4 mr-2" />
              Generate Share Link
            </Button>

            {shareUrl && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex gap-2">
                    <Input value={shareUrl} readOnly className="font-mono text-sm" />
                    <Button onClick={handleCopyLink} variant="outline" size="icon">
                      {linkCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {expiresIn === 'never' ? 'Never expires' : `Expires in ${expiresIn} hours`}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Export Format</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'json', label: 'JSON', icon: FileJson },
                  { value: 'csv', label: 'CSV', icon: FileText },
                  { value: 'excel', label: 'Excel', icon: FileSpreadsheet },
                  { value: 'pdf', label: 'PDF', icon: FileText },
                  { value: 'markdown', label: 'Markdown', icon: FileText },
                  { value: 'html', label: 'HTML', icon: FileText }
                ] as const).map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={exportFormat === value ? 'default' : 'outline'}
                    onClick={() => setExportFormat(value)}
                    className="justify-start"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Export Options
              </Label>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.include_metadata !== false}
                    onChange={(e) => setExportOptions({ ...exportOptions, include_metadata: e.target.checked })}
                  />
                  Include metadata
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.include_timestamps !== false}
                    onChange={(e) => setExportOptions({ ...exportOptions, include_timestamps: e.target.checked })}
                  />
                  Include timestamps
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.sanitize_data || false}
                    onChange={(e) => setExportOptions({ ...exportOptions, sanitize_data: e.target.checked })}
                  />
                  Remove sensitive data
                </label>
              </div>
            </div>

            <Button onClick={handleExport} className="w-full" disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Export as {exportFormat.toUpperCase()}
            </Button>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>To (comma-separated for multiple)</Label>
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="friend@example.com, colleague@work.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder={`Check out my ${domainName} data`}
              />
            </div>

            <div className="space-y-2">
              <Label>Message (Optional)</Label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Add a personal message..."
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSendEmail} 
              className="w-full" 
              disabled={loading || !emailTo || !emailSubject}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qr" className="space-y-4 mt-4">
            <div className="text-center space-y-4">
              {!qrCode ? (
                <div className="py-8">
                  <div className="mx-auto w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center mb-4">
                    <QrCode className="h-16 w-16 text-muted-foreground/25" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a QR code for quick mobile sharing
                  </p>
                  <Button onClick={handleGenerateQR} disabled={loading}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64 border rounded-lg" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Scan with any QR code reader to access shared content
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = qrCode
                      link.download = `${domainName}-qr-code.png`
                      link.click()
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sharing Statistics</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total items:</span>
                    <Badge>{entryCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domain:</span>
                    <Badge variant="outline">{domainName}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

