'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  Sparkles, 
  Send, 
  RefreshCw, 
  Copy, 
  Edit2, 
  CheckCircle,
  Loader2,
  Wand2
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface OriginalEmail {
  subject: string
  from: string
  body: string
  messageId?: string
  threadId?: string
}

interface AIEmailComposerProps {
  originalEmail?: OriginalEmail
  onEmailSent?: () => void
  defaultTo?: string
  className?: string
}

export function AIEmailComposer({ 
  originalEmail, 
  onEmailSent, 
  defaultTo,
  className 
}: AIEmailComposerProps) {
  const { toast } = useToast()
  
  // Form state
  const [to, setTo] = useState(defaultTo || '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  
  // AI composition state
  const [context, setContext] = useState('')
  const [tone, setTone] = useState<'professional' | 'friendly' | 'formal' | 'casual'>('professional')
  const [emailType, setEmailType] = useState<'new' | 'reply' | 'follow-up'>(
    originalEmail ? 'reply' : 'new'
  )
  
  // UI state
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose')
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Extract sender email for reply
  const extractEmail = (from: string): string => {
    const match = from.match(/<(.+?)>/)
    return match ? match[1] : from
  }

  // Generate email with AI
  const generateEmail = async () => {
    if (!context.trim()) {
      toast({
        title: "Context Required",
        description: "Please provide some context for the email.",
        variant: "destructive"
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/gmail/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          context,
          tone,
          type: emailType,
          originalEmail: originalEmail ? {
            subject: originalEmail.subject,
            from: originalEmail.from,
            body: originalEmail.body
          } : undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate email')
      }

      const result = await response.json()
      
      // Set generated content
      if (result.subject && !subject) {
        setSubject(emailType === 'reply' && originalEmail 
          ? `Re: ${originalEmail.subject}` 
          : result.subject)
      }
      setBody(result.body)
      setSuggestions(result.suggestions || [])
      
      // Auto-fill recipient for replies
      if (emailType === 'reply' && originalEmail && !to) {
        setTo(extractEmail(originalEmail.from))
      }

      // Switch to preview tab
      setActiveTab('preview')
      
      toast({
        title: "Email Generated",
        description: "Review and edit before sending.",
      })
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate email. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  // Send email via Gmail
  const sendEmail = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields (To, Subject, Body).",
        variant: "destructive"
      })
      return
    }

    setSending(true)
    setSendStatus('idle')
    
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to,
          subject,
          body,
          bodyType: 'text',
          threadId: originalEmail?.threadId,
          replyToMessageId: emailType === 'reply' ? originalEmail?.messageId : undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }

      setSendStatus('success')
      toast({
        title: "Email Sent!",
        description: `Your email has been sent to ${to}`,
      })

      // Reset form
      setTimeout(() => {
        setTo('')
        setSubject('')
        setBody('')
        setContext('')
        setSuggestions([])
        setActiveTab('compose')
        setSendStatus('idle')
        onEmailSent?.()
      }, 2000)
    } catch (error: any) {
      setSendStatus('error')
      toast({
        title: 'Send Failed',
        description: error.message || 'Failed to send email. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  // Quick regenerate with different tone
  const regenerateWithTone = async (newTone: typeof tone) => {
    setTone(newTone)
    await generateEmail()
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-blue-500" />
              AI Email Composer
            </CardTitle>
            <CardDescription>
              Compose and send emails with AI assistance via Gmail
            </CardDescription>
          </div>
          {sendStatus === 'success' && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Sent
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="compose">
              <Wand2 className="h-4 w-4 mr-2" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!body}>
              <Edit2 className="h-4 w-4 mr-2" />
              Preview & Edit
            </TabsTrigger>
          </TabsList>

          {/* Compose Tab - AI Generation */}
          <TabsContent value="compose" className="space-y-4">
            {originalEmail && (
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium text-muted-foreground mb-1">Replying to:</p>
                <p className="font-medium">{originalEmail.subject}</p>
                <p className="text-xs text-muted-foreground">From: {originalEmail.from}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Type</Label>
                <Select value={emailType} onValueChange={(v: any) => setEmailType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Email</SelectItem>
                    <SelectItem value="reply" disabled={!originalEmail}>Reply</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>What do you want to say?</Label>
              <Textarea
                placeholder="Describe what you want to communicate. E.g., 'Thank them for the meeting yesterday, summarize action items, and propose a follow-up call next week'"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <Button
              onClick={generateEmail}
              className="w-full"
              disabled={generating || !context.trim()}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Email
                </>
              )}
            </Button>
          </TabsContent>

          {/* Preview Tab - Edit & Send */}
          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">To *</Label>
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="body">Message *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(body)
                    toast({ title: 'Copied!', description: 'Email body copied to clipboard' })
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea
                id="body"
                placeholder="Email body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="resize-none font-mono text-sm"
              />
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Alternative Phrasings
                </Label>
                <div className="space-y-1">
                  {suggestions.map((suggestion, i) => (
                    <p key={i} className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      • {suggestion}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate with different tone */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground self-center">Regenerate:</span>
              {(['professional', 'friendly', 'formal', 'casual'] as const).map((t) => (
                <Button
                  key={t}
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateWithTone(t)}
                  disabled={generating}
                  className={cn(
                    "text-xs",
                    tone === t && "border-primary"
                  )}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {activeTab === 'preview' && body && (
        <CardFooter className="border-t pt-4">
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveTab('compose')}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Back to Compose
            </Button>
            <Button
              onClick={sendEmail}
              disabled={sending || !to || !subject || !body}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : sendStatus === 'success' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Sent!
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send via Gmail
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

