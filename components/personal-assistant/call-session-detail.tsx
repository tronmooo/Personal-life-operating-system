'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Phone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  DollarSign,
  Calendar,
  User,
  FileText,
  Loader2,
  MessageSquare,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface CallSessionDetailProps {
  sessionId: string
  onBack?: () => void
}

interface CallSession {
  id: string
  status: string
  started_at: string
  ended_at?: string
  duration_seconds?: number
  call_provider_call_id: string
  failure_reason?: string
  call_task: {
    id: string
    title: string
    raw_instruction: string
  }
  transcript?: {
    full_text: string
    segments?: Array<{
      speaker: string
      text: string
      start_time_ms: number
      sentiment?: string
    }>
  }
  extracted_data?: Record<string, any>
}

export function CallSessionDetail({ sessionId, onBack }: CallSessionDetailProps) {
  const [session, setSession] = useState<CallSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    setLoading(true)
    try {
      // Fetch session with transcript and extracted data using the view
      const response = await fetch(`/api/call-sessions/${sessionId}`)
      const data = await response.json()

      if (response.ok) {
        setSession(data.session)
      } else {
        throw new Error(data.error || 'Failed to fetch session')
      }
    } catch (error: any) {
      console.error('Error fetching session:', error)
      toast.error(error.message || 'Failed to load call session')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessCall = async () => {
    if (!session) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/call-sessions/${session.id}/process`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Call processed successfully!')
        fetchSession() // Refresh to show extracted data
      } else {
        throw new Error(data.error || 'Failed to process call')
      }
    } catch (error: any) {
      console.error('Error processing call:', error)
      toast.error(error.message || 'Failed to process call')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Session Not Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The call session you're looking for doesn't exist.
          </p>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const isCompleted = session.status === 'completed'
  const hasTranscript = session.transcript && session.transcript.full_text
  const hasExtractedData = session.extracted_data && Object.keys(session.extracted_data).length > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      {onBack && (
        <Button onClick={onBack} variant="ghost" size="sm">
          ← Back
        </Button>
      )}

      {/* Session Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>Call Session</CardTitle>
              <CardDescription>{session.call_task.title}</CardDescription>
            </div>
            <Badge variant={isCompleted ? 'default' : 'secondary'}>
              {session.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(session.started_at), 'MMM d, yyyy h:mm a')}</span>
            </div>

            {session.duration_seconds && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {Math.floor(session.duration_seconds / 60)}m {session.duration_seconds % 60}s
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs truncate">{session.call_provider_call_id}</span>
            </div>
          </div>

          {session.failure_reason && (
            <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
              <p className="text-sm text-red-600 dark:text-red-400">{session.failure_reason}</p>
            </div>
          )}

          {isCompleted && !hasExtractedData && hasTranscript && (
            <Button 
              onClick={handleProcessCall}
              disabled={processing}
              variant="outline"
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Process Call & Extract Data
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Extracted Data */}
      {hasExtractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Extracted Information</CardTitle>
            <CardDescription>Key data gathered from the call</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Prices */}
              {session.extracted_data!.price && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing
                  </h4>
                  <div className="bg-muted p-3 rounded-md">
                    {typeof session.extracted_data!.price === 'object' ? (
                      <div>
                        <p className="text-lg font-semibold">
                          ${session.extracted_data!.price.value}
                        </p>
                        {session.extracted_data!.price.fragment && (
                          <p className="text-xs text-muted-foreground mt-1">
                            "{session.extracted_data!.price.fragment}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="font-semibold">${session.extracted_data!.price}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Appointments */}
              {session.extracted_data!.appointment && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Appointment
                  </h4>
                  <div className="bg-muted p-3 rounded-md">
                    {typeof session.extracted_data!.appointment === 'object' ? (
                      JSON.parse(session.extracted_data!.appointment.value || '{}')
                    ) : (
                      session.extracted_data!.appointment
                    )}
                  </div>
                </div>
              )}

              {/* Confirmation Numbers */}
              {session.extracted_data!.confirmation_number && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmation
                  </h4>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="font-mono text-sm">
                      {typeof session.extracted_data!.confirmation_number === 'object' 
                        ? session.extracted_data!.confirmation_number.value 
                        : session.extracted_data!.confirmation_number}
                    </p>
                  </div>
                </div>
              )}

              {/* Business/Contact Names */}
              {(session.extracted_data!.business_name || session.extracted_data!.contact_name) && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Information
                  </h4>
                  <div className="bg-muted p-3 rounded-md space-y-1">
                    {session.extracted_data!.business_name && (
                      <p className="text-sm">
                        <span className="font-medium">Business:</span>{' '}
                        {typeof session.extracted_data!.business_name === 'object'
                          ? session.extracted_data!.business_name.value
                          : session.extracted_data!.business_name}
                      </p>
                    )}
                    {session.extracted_data!.contact_name && (
                      <p className="text-sm">
                        <span className="font-medium">Contact:</span>{' '}
                        {typeof session.extracted_data!.contact_name === 'object'
                          ? session.extracted_data!.contact_name.value
                          : session.extracted_data!.contact_name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {session.extracted_data!.instruction && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Instructions
                  </h4>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm">
                      {typeof session.extracted_data!.instruction === 'object'
                        ? session.extracted_data!.instruction.value
                        : session.extracted_data!.instruction}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      {hasTranscript && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Transcript
            </CardTitle>
            <CardDescription>Full conversation recording</CardDescription>
          </CardHeader>
          <CardContent>
            {session.transcript!.segments && session.transcript!.segments.length > 0 ? (
              <div className="space-y-3">
                {session.transcript!.segments.map((segment, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg ${
                      segment.speaker === 'assistant' 
                        ? 'bg-blue-50 dark:bg-blue-950' 
                        : 'bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {segment.speaker === 'assistant' ? 'AI Assistant' : 'Human'}
                      </span>
                      {segment.sentiment && (
                        <Badge variant="outline" className="text-xs">
                          {segment.sentiment}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{segment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{session.transcript!.full_text}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Transcript Available */}
      {!hasTranscript && isCompleted && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Transcript Available</h3>
            <p className="text-sm text-muted-foreground text-center">
              The transcript for this call is not yet available or was not recorded.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
























