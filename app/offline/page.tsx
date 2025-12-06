'use client'

import { WifiOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <WifiOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <CardTitle className="text-2xl">You're Offline</CardTitle>
          <CardDescription>
            It looks like you've lost your internet connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            Don't worry! You can still use LifeHub offline. Any changes you make will be 
            automatically synced when you reconnect.
          </p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

