'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Sparkles, Copy } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function EmailAssistant() {
  const { toast } = useToast()
  const [context, setContext] = useState('')
  const [tone, setTone] = useState<'professional' | 'friendly' | 'formal' | 'casual'>('professional')
  const [emailType, setEmailType] = useState<'reply' | 'new' | 'follow-up'>('new')
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [generating, setGenerating] = useState(false)

  const generateEmail = async () => {
    if (!context) {
      toast({
        title: "Context Required",
        description: "Please provide some context for the email.",
        variant: "destructive"
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/ai-tools/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'email',
          prompt: `Generate a ${tone} ${emailType} email about: "${context}". The email should be ready to send with placeholders for names if needed.`,
          format: 'text'
        })
      })

      if (!response.ok) throw new Error('Failed to generate email')

      const result = await response.json()
      setGeneratedEmail(result.analysis || result.result || 'Failed to generate content.')
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to generate email. Please try again.',
        variant: 'destructive' 
      })
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedEmail)
    toast({ title: 'Copied!', description: 'Email copied to clipboard' })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            AI Email Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Generate professional email drafts with AI. Just provide context and choose your tone.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Email Type</Label>
              <Select value={emailType} onValueChange={(value: any) => setEmailType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Email</SelectItem>
                  <SelectItem value="reply">Reply</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={(value: any) => setTone(value)}>
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

            <div className="space-y-2">
              <Label htmlFor="context">Context / Key Points</Label>
              <Textarea
                id="context"
                placeholder="e.g., Following up on project proposal, requesting a meeting..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={generateEmail}
              className="w-full"
              disabled={generating}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? 'Generating...' : 'Generate Email'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedEmail && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Email</CardTitle>
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
              {generatedEmail}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <strong>Tip:</strong> Review and customize the email before sending. Replace [Name] and [Details] with actual information.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
