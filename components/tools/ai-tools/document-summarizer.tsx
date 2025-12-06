'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Sparkles, Copy, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function DocumentSummarizer() {
  const [text, setText] = useState('')
  const [summary, setSummary] = useState('')
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'detailed'>('medium')
  const [processing, setProcessing] = useState(false)

  const generateSummary = async () => {
    if (!text.trim()) return
    
    setProcessing(true)
    try {
      const lengthInstructions = {
        short: 'Provide a concise 2-3 sentence summary.',
        medium: 'Provide a medium-length summary (1 paragraph, about 100-150 words).',
        detailed: 'Provide a detailed, comprehensive summary with multiple paragraphs and bullet points for key sections.'
      }

      const response = await fetch('/api/ai-tools/analyze', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'document',
          data: { text },
          prompt: `${lengthInstructions[summaryLength]}\n\nAnalyze this document and provide:\n1. A summary of the specified length\n2. Key themes and main ideas\n3. Important dates (if any)\n4. Action items (if any)\n\nDocument:\n${text}`
        })
      })

      if (!response.ok) throw new Error('Failed to generate summary')

      const result = await response.json()
      setSummary(result.analysis || 'No summary generated')
    } catch (error) {
      setSummary('Failed to generate summary. Please try again.')
      console.error('Summarization error:', error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-4xl">📚</span>
          Document Summarizer AI
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered summarization that extracts key points and insights
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Document */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-lg">Input Document</Label>
          </div>
          <Textarea
            placeholder="Paste your document text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="mt-2 text-xs text-muted-foreground">
            {text.length} characters • {Math.ceil(text.split(' ').length)} words
          </div>
        </div>

        {/* Summary Length Selection */}
        <div>
          <Label className="text-lg mb-3 block">Summary Length</Label>
          <div className="flex gap-3">
            {[
              { id: 'short', label: 'Short', desc: '2-3 sentences' },
              { id: 'medium', label: 'Medium', desc: '1 paragraph' },
              { id: 'detailed', label: 'Detailed', desc: 'Multiple paragraphs' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setSummaryLength(option.id as any)}
                className={`flex-1 p-3 border-2 rounded-lg text-center transition-all ${
                  summaryLength === option.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-300 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateSummary}
          disabled={!text || processing}
          className="w-full"
          size="lg"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {processing ? 'Analyzing Document...' : 'Generate AI Summary'}
        </Button>

        {/* Summary Output */}
        {summary && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg">AI-Generated Summary</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <p className="text-sm leading-relaxed whitespace-pre-line">{summary}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                <FileText className="h-3 w-3 mr-1" />
                {summary.split(' ').length} words
              </Badge>
              <Badge variant="secondary">
                {Math.ceil((summary.length / text.length) * 100)}% compression
              </Badge>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">✨ AI Capabilities:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Identifies key themes and main ideas</li>
            <li>• Maintains context and relevance</li>
            <li>• Supports multiple languages</li>
            <li>• Extracts action items and deadlines</li>
            <li>• Customizable summary length and style</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function Label({ className, children, ...props }: any) {
  return <label className={`font-semibold ${className}`} {...props}>{children}</label>
}































