'use client'

/**
 * Realtime Call Monitor Component
 * 
 * Displays live transcripts, agent handoffs, and call statistics
 * for OpenAI Realtime API voice calls
 */

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  User,
  Bot,
  ArrowRight,
  Clock,
  DollarSign,
  Calendar,
  Tag
} from 'lucide-react'

interface CallStatus {
  callSid: string
  businessName: string
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed'
  startTime: Date
  duration?: number
  currentAgent: 'main_concierge' | 'quotes_validator' | 'order_placer' | 'appointment_scheduler'
  transcript: TranscriptEntry[]
  quote?: QuoteData
  appointment?: AppointmentData
  handoffs: HandoffEntry[]
  realtimeEnabled: boolean
}

interface TranscriptEntry {
  speaker: 'ai' | 'human'
  message: string
  timestamp: Date
  agentName?: string
}

interface QuoteData {
  price: string
  details?: string
  availability?: string
}

interface AppointmentData {
  date: string
  time: string
  confirmationNumber?: string
}

interface HandoffEntry {
  fromAgent: string
  toAgent: string
  reason: string
  timestamp: Date
}

interface RealtimeCallMonitorProps {
  callSid: string
  onEndCall?: () => void
}

const agentColors: Record<string, string> = {
  main_concierge: 'bg-blue-500',
  quotes_validator: 'bg-purple-500',
  order_placer: 'bg-green-500',
  appointment_scheduler: 'bg-orange-500'
}

const agentNames: Record<string, string> = {
  main_concierge: 'Main Concierge',
  quotes_validator: 'Quotes Validator',
  order_placer: 'Order Placer',
  appointment_scheduler: 'Appointment Scheduler'
}

export function RealtimeCallMonitor({ callSid, onEndCall }: RealtimeCallMonitorProps) {
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch call status periodically
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/voice/status?callSid=${callSid}`)
        if (response.ok) {
          const data = await response.json()
          setCallStatus(data)
        }
      } catch (error) {
        console.error('Error fetching call status:', error)
      }
    }

    // Initial fetch
    fetchStatus()

    // Poll every 2 seconds
    const interval = setInterval(fetchStatus, 2000)

    return () => clearInterval(interval)
  }, [callSid])

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [callStatus?.transcript])

  // Simulate audio level (in production, get from WebSocket)
  useEffect(() => {
    if (callStatus?.status === 'in-progress') {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [callStatus?.status])

  const handleEndCall = () => {
    if (onEndCall) {
      onEndCall()
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!callStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Call...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const currentAgentName = agentNames[callStatus.currentAgent] || 'Unknown Agent'
  const currentAgentColor = agentColors[callStatus.currentAgent] || 'bg-gray-500'

  return (
    <div className="space-y-4">
      {/* Call Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${currentAgentColor}`}>
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>{callStatus.businessName}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={callStatus.status === 'in-progress' ? 'default' : 'secondary'}>
                    {callStatus.status}
                  </Badge>
                  {callStatus.realtimeEnabled && (
                    <Badge variant="outline" className="border-green-500 text-green-600">
                      Realtime API
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatDuration(callStatus.duration)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Agent: {currentAgentName}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleEndCall}
                  disabled={callStatus.status === 'completed'}
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Audio Visualizer */}
        {callStatus.status === 'in-progress' && (
          <CardContent>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* Transcript */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Live Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {callStatus.transcript.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${entry.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[80%] ${
                        entry.speaker === 'ai'
                          ? 'bg-secondary'
                          : 'bg-primary text-primary-foreground'
                      } rounded-lg p-3`}
                    >
                      <div className="shrink-0">
                        {entry.speaker === 'ai' ? (
                          <Bot className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        {entry.agentName && (
                          <div className="text-xs opacity-70 mb-1">{entry.agentName}</div>
                        )}
                        <p className="text-sm">{entry.message}</p>
                        <div className="text-xs opacity-50 mt-1">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Agent Handoffs & Extracted Data */}
        <div className="col-span-1 space-y-4">
          {/* Agent Handoffs */}
          {callStatus.handoffs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agent Handoffs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {callStatus.handoffs.map((handoff, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Badge className={agentColors[handoff.fromAgent.replace(' ', '_').toLowerCase()]}>
                        {handoff.fromAgent}
                      </Badge>
                      <ArrowRight className="w-4 h-4" />
                      <Badge className={agentColors[handoff.toAgent.replace(' ', '_').toLowerCase()]}>
                        {handoff.toAgent}
                      </Badge>
                      <div className="flex-1 text-xs text-muted-foreground ml-2">
                        {handoff.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extracted Quote */}
          {callStatus.quote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Quote Extracted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">
                    {callStatus.quote.price}
                  </div>
                  {callStatus.quote.details && (
                    <p className="text-sm text-muted-foreground">
                      {callStatus.quote.details}
                    </p>
                  )}
                  {callStatus.quote.availability && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      {callStatus.quote.availability}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extracted Appointment */}
          {callStatus.appointment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Appointment Scheduled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-semibold">
                    {callStatus.appointment.date} at {callStatus.appointment.time}
                  </div>
                  {callStatus.appointment.confirmationNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="w-4 h-4" />
                      Confirmation: {callStatus.appointment.confirmationNumber}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}






