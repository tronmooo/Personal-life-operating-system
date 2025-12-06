'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Sparkles, CheckCircle } from 'lucide-react'

export function MeetingNotes() {
  const [transcript, setTranscript] = useState('')
  const [processing, setProcessing] = useState(false)
  const [summary, setSummary] = useState<{
    keyPoints: string[]
    actionItems: Array<{ task: string; owner: string; deadline: string }>
    decisions: string[]
    nextSteps: string[]
  } | null>(null)

  const processNotes = () => {
    setProcessing(true)

    setTimeout(() => {
      setSummary({
        keyPoints: [
          'Discussed Q4 marketing strategy and budget allocation',
          'Reviewed current campaign performance metrics',
          'Identified need for additional social media presence',
          'Agreed on new target audience segments'
        ],
        actionItems: [
          { task: 'Prepare Q4 budget proposal', owner: 'Sarah', deadline: 'Oct 15' },
          { task: 'Research social media ad platforms', owner: 'Mike', deadline: 'Oct 18' },
          { task: 'Create audience persona documents', owner: 'Lisa', deadline: 'Oct 20' },
          { task: 'Schedule follow-up meeting', owner: 'John', deadline: 'Oct 12' }
        ],
        decisions: [
          'Increase social media budget by 20%',
          'Focus on Instagram and TikTok platforms',
          'Launch pilot campaign in November'
        ],
        nextSteps: [
          'Review and approve budget proposal',
          'Begin creative development for new campaigns',
          'Set up tracking and analytics infrastructure'
        ]
      })
      setProcessing(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI Meeting Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Paste your meeting transcript or notes, and AI will extract key points, action items, and decisions.
          </p>

          <div className="space-y-2">
            <Label htmlFor="transcript">Meeting Transcript / Notes</Label>
            <Textarea
              id="transcript"
              placeholder="Paste your meeting notes or transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={6}
            />
          </div>

          <Button
            onClick={processNotes}
            className="w-full"
            disabled={!transcript || processing}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {processing ? 'Processing...' : 'Generate Summary'}
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Points</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Action Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.actionItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-semibold text-sm flex-1">{item.task}</p>
                      <Badge variant="outline">{item.deadline}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Assigned to: {item.owner}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Decisions Made</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.decisions.map((decision, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">{decision}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold mt-0.5">{idx + 1}.</span>
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
