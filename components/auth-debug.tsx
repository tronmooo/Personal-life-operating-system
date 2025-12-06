'use client'

import { useAuth } from '@/lib/supabase/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle } from 'lucide-react'

export function AuthDebug() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle>Auth Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {user ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              Signed In
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-600" />
              Not Signed In
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {user ? (
          <div className="space-y-2">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
            <p className="text-xs text-muted-foreground">
              Session is active. Your auth is working correctly!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              No active session found. Please sign in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



