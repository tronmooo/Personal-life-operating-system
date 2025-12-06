'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/supabase/auth-provider'
import { Cloud, CloudOff, CheckCircle, Info } from 'lucide-react'
import Link from 'next/link'

export function CloudSyncSettings() {
  const { user } = useAuth()
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)

  useEffect(() => {
    setSupabaseConfigured(
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    )
  }, [])

  if (!supabaseConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CloudOff className="h-5 w-5 mr-2" />
            Cloud Sync
          </CardTitle>
          <CardDescription>
            Configure Supabase credentials to enable cloud sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Supabase is not configured</p>
                <p>
                  Add <code className="text-xs bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and
                  <code className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your
                  <code className="mx-1 text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> file, then restart the dev server.
                </p>
                <p>
                  See <code className="text-xs bg-muted px-1 py-0.5 rounded">env.example</code> for the full list of required variables.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cloud className="h-5 w-5 mr-2" />
            Cloud Sync
          </CardTitle>
          <CardDescription>
            Sign in to keep your data synced across devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Cloud sync is automatic for signed-in users. Authenticate to back up your data to Supabase.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/auth/login" className="flex-1">
              <Button className="w-full">Sign In</Button>
            </Link>
            <Link href="/auth/signup" className="flex-1">
              <Button variant="outline" className="w-full">Create Account</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Cloud className="h-5 w-5 mr-2" />
          Cloud Sync
        </CardTitle>
        <CardDescription>
          Your workspace saves to Supabase automatically – no manual sync required
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-sm space-y-2">
            <p className="font-medium">Automatic backup is active</p>
            <p className="text-muted-foreground">
              Every change you make is written to Supabase immediately. Stay signed in and connected to keep data available across devices.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
