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
        
        if (response.status === 503) {
          const data = await response.json()
          setHasCredentialError(true)
          setErrorMessage(data.error || 'Calendar service is unavailable')
        } else if (response.status === 401) {
          const data = await response.json()
          if (data.needsReauth) {
            setHasCredentialError(true)
            setErrorMessage('Calendar access expired. Please sign in again with Google.')
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
            if (errorMessage.includes('sign in')) {
              window.location.href = '/api/auth/signout?callbackUrl=/api/auth/signin'
            } else {
              window.location.href = '/settings'
            }
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          {errorMessage.includes('sign in') ? 'Re-authenticate' : 'Configure'}
        </Button>
      </AlertDescription>
    </Alert>
  )
}




















