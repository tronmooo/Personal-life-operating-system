export const dynamic = 'force-dynamic'
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { Check, X, AlertCircle } from 'lucide-react'

export default function CalendarDebugPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
    setLoading(false)
  }

  const hasProviderToken = !!session?.provider_token
  const hasCalendarScopes = session?.provider_token && 
    (session?.user?.user_metadata?.provider_token || 
     session?.provider_token)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🔍 Calendar Integration Debug</h1>
          <p className="text-muted-foreground mt-2">
            Check your calendar permissions and OAuth status
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              Loading session...
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Session Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {session ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  Authentication Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">Logged In</span>
                    {session ? (
                      <span className="text-green-600 flex items-center gap-2">
                        <Check className="h-4 w-4" /> Yes
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-2">
                        <X className="h-4 w-4" /> No
                      </span>
                    )}
                  </div>

                  {session && (
                    <>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">Email</span>
                        <span className="text-sm">{session.user?.email}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">Provider Token</span>
                        {hasProviderToken ? (
                          <span className="text-green-600 flex items-center gap-2">
                            <Check className="h-4 w-4" /> Exists
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-2">
                            <X className="h-4 w-4" /> Missing
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Calendar Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {hasProviderToken ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  Calendar Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!hasProviderToken ? (
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                      ⚠️ Calendar Write Access Not Granted
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-4">
                      You need to grant calendar permissions before you can create events.
                    </p>
                    <Button
                      onClick={() => window.location.href = '/'}
                      className="w-full"
                    >
                      Go to Dashboard to Grant Access
                    </Button>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                      ✅ Calendar Access Granted
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      You have the necessary permissions to create calendar events!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Debug Info */}
            <Card>
              <CardHeader>
                <CardTitle>🔧 Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(
                    {
                      hasSession: !!session,
                      hasProviderToken,
                      provider: session?.user?.app_metadata?.provider,
                      tokenPreview: session?.provider_token 
                        ? `${session.provider_token.substring(0, 20)}...` 
                        : 'null'
                    },
                    null,
                    2
                  )}
                </pre>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>📝 What To Do</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p className="font-medium">If Provider Token is Missing:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Go to Dashboard</li>
                    <li>Find the Google Calendar card</li>
                    <li>Click "Grant Calendar Access" (blue button)</li>
                    <li>Approve ALL permissions (especially "Edit calendars")</li>
                    <li>Wait for redirect back to app</li>
                    <li>Come back here and refresh to verify</li>
                  </ol>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="font-medium">If Provider Token Exists:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Your calendar is properly connected</li>
                    <li>Go to Dashboard and click "Create with AI"</li>
                    <li>Create a test event</li>
                    <li>Check your Google Calendar for the event</li>
                  </ol>
                </div>

                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  Refresh Status
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}






















