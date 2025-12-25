'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Share2, MessageSquare, Mail, Copy, Check, 
  Smartphone, Send, ExternalLink 
} from 'lucide-react'
import { toast } from 'sonner'

interface DocumentShareButtonsProps {
  document: {
    id: string
    name: string
    fileUrl?: string
    url?: string
    data?: string
    type?: string
    extractedData?: {
      documentType?: string
      expirationDate?: string
      policyNumber?: string
      amount?: number
    }
  }
  variant?: 'default' | 'compact' | 'icon-only'
  className?: string
}

export function DocumentShareButtons({ 
  document, 
  variant = 'default',
  className = ''
}: DocumentShareButtonsProps) {
  // Compute documentUrl first since helper functions depend on it
  const documentUrl = document.fileUrl || document.url || document.data

  // Generate shareable text content
  function generateShareText(doc: typeof document): string {
    let text = `📄 ${doc.name}\n`
    
    if (doc.extractedData?.documentType) {
      text += `Type: ${doc.extractedData.documentType.replace(/_/g, ' ')}\n`
    }
    if (doc.extractedData?.policyNumber) {
      text += `Policy #: ${doc.extractedData.policyNumber}\n`
    }
    if (doc.extractedData?.expirationDate) {
      text += `Expires: ${new Date(doc.extractedData.expirationDate).toLocaleDateString()}\n`
    }
    if (doc.extractedData?.amount) {
      text += `Amount: $${doc.extractedData.amount.toLocaleString()}\n`
    }
    
    if (documentUrl && !documentUrl.startsWith('data:')) {
      text += `\nView: ${documentUrl}`
    }
    
    return text
  }

  function generateEmailBody(doc: typeof document): string {
    let body = `Hi,\n\nI'm sharing a document with you:\n\n`
    body += `Document: ${doc.name}\n`
    
    if (doc.extractedData?.documentType) {
      body += `Type: ${doc.extractedData.documentType.replace(/_/g, ' ')}\n`
    }
    if (doc.extractedData?.policyNumber) {
      body += `Policy Number: ${doc.extractedData.policyNumber}\n`
    }
    if (doc.extractedData?.expirationDate) {
      body += `Expiration Date: ${new Date(doc.extractedData.expirationDate).toLocaleDateString()}\n`
    }
    if (doc.extractedData?.amount) {
      body += `Amount: $${doc.extractedData.amount.toLocaleString()}\n`
    }
    
    if (documentUrl && !documentUrl.startsWith('data:')) {
      body += `\nView document: ${documentUrl}\n`
    }
    
    body += `\nSent from LifeHub Document Manager`
    
    return body
  }

  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showTextDialog, setShowTextDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const [emailData, setEmailData] = useState({
    to: '',
    subject: `Document: ${document.name}`,
    body: generateEmailBody(document)
  })
  const [phoneNumber, setPhoneNumber] = useState('')

  const handleCopyLink = async () => {
    const textToCopy = documentUrl && !documentUrl.startsWith('data:') 
      ? documentUrl 
      : generateShareText(document)
    
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleShareViaSMS = () => {
    const shareText = encodeURIComponent(generateShareText(document))
    
    if (phoneNumber) {
      // If phone number is provided, use SMS URI
      const smsUrl = `sms:${phoneNumber}?body=${shareText}`
      window.open(smsUrl, '_blank')
      setShowTextDialog(false)
      toast.success('Opening messaging app...')
    } else {
      // Open dialog to get phone number
      setShowTextDialog(true)
    }
  }

  const handleSendSMS = () => {
    const shareText = encodeURIComponent(generateShareText(document))
    const formattedPhone = phoneNumber.replace(/\D/g, '')
    
    if (!formattedPhone) {
      toast.error('Please enter a valid phone number')
      return
    }
    
    // sms: URI scheme works on both iOS and Android
    const smsUrl = `sms:${formattedPhone}?body=${shareText}`
    window.open(smsUrl, '_blank')
    setShowTextDialog(false)
    setPhoneNumber('')
    toast.success('Opening messaging app...')
  }

  const handleShareViaEmail = () => {
    setShowEmailDialog(true)
  }

  const handleSendEmail = () => {
    const { to, subject, body } = emailData
    
    if (!to) {
      toast.error('Please enter a recipient email address')
      return
    }
    
    // Use mailto: URI scheme
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl, '_blank')
    setShowEmailDialog(false)
    setEmailData({
      to: '',
      subject: `Document: ${document.name}`,
      body: generateEmailBody(document)
    })
    toast.success('Opening email client...')
  }

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast.error('Share not supported on this device')
      return
    }

    try {
      await navigator.share({
        title: document.name,
        text: generateShareText(document),
        url: documentUrl && !documentUrl.startsWith('data:') ? documentUrl : undefined
      })
      toast.success('Shared successfully!')
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to share')
      }
    }
  }

  // Compact version - just icons
  if (variant === 'icon-only') {
    return (
      <div className={`flex gap-1 ${className}`}>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleShareViaSMS}
          title="Share via Text"
          className="h-8 w-8"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleShareViaEmail}
          title="Share via Email"
          className="h-8 w-8"
        >
          <Mail className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCopyLink}
          title="Copy"
          className="h-8 w-8"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        
        {/* Dialogs */}
        <SMSDialog 
          open={showTextDialog} 
          onOpenChange={setShowTextDialog}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          onSend={handleSendSMS}
          documentName={document.name}
        />
        <EmailDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          emailData={emailData}
          setEmailData={setEmailData}
          onSend={handleSendEmail}
          documentName={document.name}
        />
      </div>
    )
  }

  // Default dropdown menu version
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant === 'compact' ? 'ghost' : 'outline'} 
            size={variant === 'compact' ? 'icon' : 'sm'}
            className={className}
          >
            <Share2 className="h-4 w-4" />
            {variant !== 'compact' && <span className="ml-2">Share</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleShareViaSMS}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Share via Text (SMS)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareViaEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Share via Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? (
              <Check className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </DropdownMenuItem>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNativeShare}>
                <ExternalLink className="h-4 w-4 mr-2" />
                More sharing options...
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* SMS Dialog */}
      <SMSDialog 
        open={showTextDialog} 
        onOpenChange={setShowTextDialog}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        onSend={handleSendSMS}
        documentName={document.name}
      />

      {/* Email Dialog */}
      <EmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        emailData={emailData}
        setEmailData={setEmailData}
        onSend={handleSendEmail}
        documentName={document.name}
      />
    </>
  )
}

// SMS Dialog Component
function SMSDialog({ 
  open, 
  onOpenChange, 
  phoneNumber, 
  setPhoneNumber, 
  onSend,
  documentName 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  phoneNumber: string
  setPhoneNumber: (value: string) => void
  onSend: () => void
  documentName: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Share via Text Message
          </DialogTitle>
          <DialogDescription>
            Send "{documentName}" to a phone number
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="h-12"
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSend}>
            <Send className="h-4 w-4 mr-2" />
            Send Text
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Email Dialog Component
function EmailDialog({
  open,
  onOpenChange,
  emailData,
  setEmailData,
  onSend,
  documentName
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  emailData: { to: string; subject: string; body: string }
  setEmailData: (data: { to: string; subject: string; body: string }) => void
  onSend: () => void
  documentName: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Share via Email
          </DialogTitle>
          <DialogDescription>
            Send "{documentName}" via email
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email-to">To</Label>
            <Input
              id="email-to"
              type="email"
              placeholder="recipient@example.com"
              value={emailData.to}
              onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              type="text"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-body">Message</Label>
            <Textarea
              id="email-body"
              value={emailData.body}
              onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
              rows={6}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSend}>
            <Send className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Quick Share Bar - horizontal buttons for mobile
export function DocumentQuickShareBar({ 
  document,
  className = '' 
}: { 
  document: DocumentShareButtonsProps['document']
  className?: string 
}) {
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showTextDialog, setShowTextDialog] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [emailData, setEmailData] = useState({
    to: '',
    subject: `Document: ${document.name}`,
    body: ''
  })

  const documentUrl = document.fileUrl || document.url || document.data

  function generateShareText(): string {
    let text = `📄 ${document.name}\n`
    if (document.extractedData?.documentType) {
      text += `Type: ${document.extractedData.documentType.replace(/_/g, ' ')}\n`
    }
    if (documentUrl && !documentUrl.startsWith('data:')) {
      text += `\nView: ${documentUrl}`
    }
    return text
  }

  const handleSendSMS = () => {
    const shareText = encodeURIComponent(generateShareText())
    const formattedPhone = phoneNumber.replace(/\D/g, '')
    const smsUrl = `sms:${formattedPhone}?body=${shareText}`
    window.open(smsUrl, '_blank')
    setShowTextDialog(false)
    setPhoneNumber('')
  }

  const handleSendEmail = () => {
    const { to, subject, body } = emailData
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl, '_blank')
    setShowEmailDialog(false)
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowTextDialog(true)}
        className="flex-1 min-h-[44px]"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Text
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowEmailDialog(true)}
        className="flex-1 min-h-[44px]"
      >
        <Mail className="h-4 w-4 mr-2" />
        Email
      </Button>

      <SMSDialog 
        open={showTextDialog} 
        onOpenChange={setShowTextDialog}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        onSend={handleSendSMS}
        documentName={document.name}
      />
      <EmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        emailData={emailData}
        setEmailData={setEmailData}
        onSend={handleSendEmail}
        documentName={document.name}
      />
    </div>
  )
}


