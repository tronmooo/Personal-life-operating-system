'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Mail, 
  Calendar, 
  HardDrive,
  Shield,
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error'
  auth: {
    authenticated: boolean
    provider: string | null
    user_email: string | null
    user_id: string | null
  }
  tokens: {
    hasAccessToken: boolean
    hasRefreshToken: boolean
    tokenSource: string
    tokenValid: boolean
    expiresIn: number | null
    lastUpdated: string | null
  }
  scopes: {
    granted: string[]
    missing: {
      gmail: string[]
      calendar: string[]
      drive: string[]
    }
    summary: {
      gmail: boolean
      calendar: boolean
      drive: boolean
      profile: boolean
    }
  }
  environment: {
    hasGoogleClientId: boolean
    hasGoogleClientSecret: boolean
    hasSupabaseUrl: boolean
    hasSupabaseServiceKey: boolean
    nodeEnv: string
    deploymentUrl: string | null
  }
  errors: string[]
  recommendations: string[]
}

interface TestResult {
  success: boolean
  service: string
  message?: string
  error?: string
  data?: any
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case 'unhealthy':
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />
    default:
      return <AlertTriangle className="h-5 w-5 text-gray-500" />
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    healthy: 'default',
    degraded: 'secondary',
    unhealthy: 'destructive',
    error: 'destructive',
  }
  
  return (
    <Badge variant={variants[status] || 'outline'} className="ml-2">
      {status.toUpperCase()}
    </Badge>
  )
}

export default function IntegrationHealthPage() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/integration-health')
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      console.error('Failed to fetch health:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  const testService = async (service: 'drive' | 'gmail' | 'calendar') => {
    setTesting(service)
    try {
      const response = await fetch('/api/debug/integration-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', service }),
      })
      const result = await response.json()
      setTestResults(prev => ({ ...prev, [service]: result }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [service]: {
          success: false,
          service,
          error: error instanceof Error ? error.message : 'Test failed',
        },
      }))
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking integration health...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Integration Health
            {health && <StatusBadge status={health.status} />}
          </h1>
          <p className="text-muted-foreground mt-1">
            Diagnose Google OAuth, Drive, Gmail, and Calendar integrations
          </p>
        </div>
        <Button onClick={fetchHealth} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {health?.errors && health.errors.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Issues Detected</AlertTitle>
          <AlertDescription>
            <ul className="list-disc ml-4 mt-2">
              {health.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {health?.recommendations && health.recommendations.length > 0 && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Recommendations</AlertTitle>
          <AlertDescription>
            <ul className="list-disc ml-4 mt-2">
              {health.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication
            </CardTitle>
            <CardDescription>Current user and auth provider status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="flex items-center gap-2">
                {health?.auth.authenticated ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">Authenticated</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600 font-medium">Not Authenticated</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Provider</span>
              <span className="font-mono text-sm">{health?.auth.provider || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-mono text-sm truncate max-w-[200px]">
                {health?.auth.user_email || 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Token Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              OAuth Tokens
            </CardTitle>
            <CardDescription>Google OAuth token information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Access Token</span>
              {health?.tokens.hasAccessToken ? (
                <Badge variant="default">Present</Badge>
              ) : (
                <Badge variant="destructive">Missing</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Refresh Token</span>
              {health?.tokens.hasRefreshToken ? (
                <Badge variant="default">Present</Badge>
              ) : (
                <Badge variant="secondary">Missing</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Token Source</span>
              <span className="font-mono text-sm">{health?.tokens.tokenSource}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Token Valid</span>
              {health?.tokens.tokenValid ? (
                <Badge variant="default">Valid</Badge>
              ) : (
                <Badge variant="destructive">Invalid/Expired</Badge>
              )}
            </div>
            {health?.tokens.expiresIn && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires In</span>
                <span className="font-mono text-sm">
                  {Math.floor(health.tokens.expiresIn / 60)} min
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Granted Scopes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>OAuth Scopes</CardTitle>
            <CardDescription>
              Permissions granted by Google OAuth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5" />
                  <span className="font-medium">Gmail</span>
                  {health?.scopes.summary.gmail ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {health?.scopes.summary.gmail ? 'Enabled' : 'Not granted'}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Calendar</span>
                  {health?.scopes.summary.calendar ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {health?.scopes.summary.calendar ? 'Enabled' : 'Not granted'}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-5 w-5" />
                  <span className="font-medium">Drive</span>
                  {health?.scopes.summary.drive ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {health?.scopes.summary.drive ? 'Enabled' : 'Not granted'}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Profile</span>
                  {health?.scopes.summary.profile ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {health?.scopes.summary.profile ? 'Enabled' : 'Not granted'}
                </p>
              </div>
            </div>

            {health?.scopes.granted && health.scopes.granted.length > 0 && (
              <details className="mt-4">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                  View all {health.scopes.granted.length} granted scopes
                </summary>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <pre className="text-xs whitespace-pre-wrap break-all">
                    {health.scopes.granted.join('\n')}
                  </pre>
                </div>
              </details>
            )}
          </CardContent>
        </Card>

        {/* Integration Tests */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Integration Tests</CardTitle>
            <CardDescription>
              Test each Google API integration directly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Drive Test */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="h-5 w-5" />
                  <span className="font-medium">Google Drive</span>
                </div>
                <Button
                  onClick={() => testService('drive')}
                  disabled={testing !== null || !health?.auth.authenticated}
                  className="w-full mb-2"
                  variant={testResults.drive?.success ? 'default' : 'outline'}
                >
                  {testing === 'drive' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Test Drive API
                </Button>
                {testResults.drive && (
                  <div className={`text-xs p-2 rounded ${testResults.drive.success ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                    {testResults.drive.message || testResults.drive.error}
                  </div>
                )}
              </div>

              {/* Gmail Test */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-5 w-5" />
                  <span className="font-medium">Gmail</span>
                </div>
                <Button
                  onClick={() => testService('gmail')}
                  disabled={testing !== null || !health?.auth.authenticated}
                  className="w-full mb-2"
                  variant={testResults.gmail?.success ? 'default' : 'outline'}
                >
                  {testing === 'gmail' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Test Gmail API
                </Button>
                {testResults.gmail && (
                  <div className={`text-xs p-2 rounded ${testResults.gmail.success ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                    {testResults.gmail.message || testResults.gmail.error}
                  </div>
                )}
              </div>

              {/* Calendar Test */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Google Calendar</span>
                </div>
                <Button
                  onClick={() => testService('calendar')}
                  disabled={testing !== null || !health?.auth.authenticated}
                  className="w-full mb-2"
                  variant={testResults.calendar?.success ? 'default' : 'outline'}
                >
                  {testing === 'calendar' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Test Calendar API
                </Button>
                {testResults.calendar && (
                  <div className={`text-xs p-2 rounded ${testResults.calendar.success ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                    {testResults.calendar.message || testResults.calendar.error}
                    {testResults.calendar.data && (
                      <div className="mt-1">
                        {testResults.calendar.data.map((event: any, i: number) => (
                          <div key={i} className="truncate">• {event.summary}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
            <CardDescription>Required environment variables status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-sm">GOOGLE_CLIENT_ID</span>
                {health?.environment.hasGoogleClientId ? (
                  <Badge variant="default">Set</Badge>
                ) : (
                  <Badge variant="destructive">Missing</Badge>
                )}
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-sm">GOOGLE_CLIENT_SECRET</span>
                {health?.environment.hasGoogleClientSecret ? (
                  <Badge variant="default">Set</Badge>
                ) : (
                  <Badge variant="destructive">Missing</Badge>
                )}
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-sm">SUPABASE_URL</span>
                {health?.environment.hasSupabaseUrl ? (
                  <Badge variant="default">Set</Badge>
                ) : (
                  <Badge variant="destructive">Missing</Badge>
                )}
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-sm">SUPABASE_SERVICE_ROLE_KEY</span>
                {health?.environment.hasSupabaseServiceKey ? (
                  <Badge variant="default">Set</Badge>
                ) : (
                  <Badge variant="destructive">Missing</Badge>
                )}
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="text-muted-foreground">Environment:</span>{' '}
                <span className="font-mono">{health?.environment.nodeEnv}</span>
              </div>
              {health?.environment.deploymentUrl && (
                <div className="text-sm mt-1">
                  <span className="text-muted-foreground">Deployment URL:</span>{' '}
                  <span className="font-mono">{health.environment.deploymentUrl}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common troubleshooting actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <a href="/auth/signin" target="_blank">
                  Re-authenticate with Google
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a 
                  href="https://myaccount.google.com/permissions" 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Account Permissions
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/debug/auth-diagnosis" target="_blank">
                  Full Auth Diagnosis
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/debug/token-scopes" target="_blank">
                  Token Scopes API
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}








