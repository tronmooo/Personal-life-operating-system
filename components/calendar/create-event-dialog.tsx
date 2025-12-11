'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Loader2, Sparkles } from 'lucide-react'

interface CreateEventDialogProps {
  trigger?: React.ReactNode
}

export function CreateEventDialog({ trigger }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!message.trim()) {
      setError('Please describe the event you want to create')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🤖 Creating calendar event via AI:', message)
      
      const response = await fetch('/api/ai/create-calendar-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message })
      })

      const data = await response.json()

      console.log('📡 Calendar API Response:', { status: response.status, data })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please sign in.')
        } else if (data.requiresAuth) {
          setError('⚠️ Calendar not connected. Please click "Grant Calendar Access" on the dashboard first, then try again.')
        } else {
          setError(data.error || 'Failed to create event')
        }
        console.error('❌ Calendar event creation failed:', data)
        return
      }

      setResult(data)
      console.log('✅ Event created successfully:', data.event)
      console.log('🔗 View in Google Calendar:', data.event?.htmlLink)
      
      // Close dialog after success
      setTimeout(() => {
        setOpen(false)
        setMessage('')
        setResult(null)
        
        // Refresh calendar events
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('calendar-updated'))
        }
      }, 3000)
    } catch (err: any) {
      console.error('❌ Error creating event:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const examples = [
    'Meeting with Sarah tomorrow at 3pm',
    'Dentist appointment next Tuesday at 10am for 1 hour',
    'Team standup every Monday at 9am',
    'Lunch at The Ivy on Friday at 12:30pm'
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Sparkles className="mr-2 h-4 w-4" />
            Create with AI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Create Calendar Event with AI
          </DialogTitle>
          <DialogDescription>
            Describe your event in natural language, and AI will create it for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Describe your event:
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., 'Meeting with John tomorrow at 2pm for 1 hour'"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Examples */}
          {!result && !error && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Examples:</p>
              <div className="space-y-1">
                {examples.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setMessage(example)}
                    className="block w-full text-left text-xs px-2 py-1 rounded hover:bg-accent transition-colors"
                    disabled={loading}
                  >
                    • {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Success */}
          {result && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                ✅ Event Created!
              </p>
              <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <p><strong>Title:</strong> {result.event.summary}</p>
                <p><strong>When:</strong> {new Date(result.event.start).toLocaleString()}</p>
                {result.event.description && (
                  <p><strong>Note:</strong> {result.event.description}</p>
                )}
              </div>
              <a
                href={result.event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline inline-block mt-2"
              >
                View in Google Calendar →
              </a>
            </div>
          )}

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={loading || !message.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Event...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Event
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

