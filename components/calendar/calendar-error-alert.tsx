'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CalendarErrorAlert() {
  const [hasCredentialError, setHasCredentialError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Check calendar sync status
    const checkCalendarStatus = async () => {
      try {
        const response = await fetch('/api/calendar/sync')
        
        // Handle non-JSON responses (e.g., 504 timeout)
        const text = await response.text()
        let data
        try {
          data = JSON.parse(text)
        } catch {
          // Non-JSON response - likely timeout or server error
          if (response.status === 504) {
            console.error('Calendar sync timed out')
            return // Don't show error alert for timeouts
          }
          console.error('Calendar sync non-JSON response:', text.substring(0, 100))
          return
        }
        
        if (response.status === 503) {
          setHasCredentialError(true)
          setErrorMessage(data.error || 'Calendar service is unavailable')
        } else         if (response.status === 401) {
          if (data.needsReauth) {
            setHasCredentialError(true)
            setErrorMessage('Connect your Google account to enable Calendar sync.')
          }
        }
      } catch (error) {
        console.error('Failed to check calendar status:', error)
      }
    }

    checkCalendarStatus()
  }, [])

  if (!hasCredentialError) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Calendar Sync Unavailable</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{errorMessage}</span>
        <Button
          variant="outline"
          size="sm"
          className="ml-4"
          onClick={() => {
            // Always go to settings to connect Google, not force sign-out
            window.location.href = '/settings'
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          Connect Google
        </Button>
      </AlertDescription>
    </Alert>
  )
}




















