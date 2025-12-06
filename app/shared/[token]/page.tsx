'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GetSharedContentResponse } from '@/types/share'
import { DOMAIN_CONFIGS } from '@/types/domains'
import { 
  Lock, Mail, Shield, Clock, Eye, Download, 
  CheckCircle, AlertCircle, Loader2 
} from 'lucide-react'
import { format } from 'date-fns'

export default function SharedContentPage() {
  const params = useParams()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState<GetSharedContentResponse | null>(null)

  /**
   * Fetch shared content
   */
  const fetchSharedContent = async (auth?: { password?: string; email?: string }) => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/share/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: auth?.password,
          viewer_email: auth?.email
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to load shared content')
      }

      const data: GetSharedContentResponse = await response.json()
      setContent(data)

      if (!data.has_access) {
        if (data.requires_password) {
          setError('Password required')
        } else if (data.requires_email) {
          setError('Email verification required')
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchSharedContent()
    }
  }, [token])

  /**
   * Handle password submit
   */
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password) {
      fetchSharedContent({ password })
    }
  }

  /**
   * Handle email submit
   */
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      fetchSharedContent({ email })
    }
  }

  /**
   * Loading state
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading shared content...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Error state
   */
  if (error && !content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Unable to Load</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  /**
   * Password required
   */
  if (content && !content.has_access && content.requires_password) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>Password Protected</CardTitle>
            <CardDescription>
              This content is password protected. Please enter the password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={!password}>
                <Shield className="h-4 w-4 mr-2" />
                Unlock Content
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Email verification required
   */
  if (content && !content.has_access && content.requires_email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>Email Verification Required</CardTitle>
            <CardDescription>
              This content is restricted to specific email addresses. Please verify your email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={!email}>
                <Mail className="h-4 w-4 mr-2" />
                Verify Email
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Main content view
   */
  if (content && content.has_access) {
    const domainConfig = content.domain_config
    const entries = content.entries || []

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  {content.link.title || `${domainConfig.name} - Shared Content`}
                </h1>
                {content.link.description && (
                  <p className="text-muted-foreground mt-2">{content.link.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {content.link.view_count + 1} views
                  </Badge>
                  <Badge variant="outline">
                    {entries.length} {entries.length === 1 ? 'item' : 'items'}
                  </Badge>
                  {content.link.expires_at && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires {format(new Date(content.link.expires_at), 'PPP')}
                    </Badge>
                  )}
                </div>
              </div>
              {content.link.allow_download && (
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="space-y-6">
            {entries.map((entry, index) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-muted-foreground font-normal text-base">
                          #{index + 1}
                        </span>
                        {entry.title || 'Untitled Entry'}
                      </CardTitle>
                      {entry.description && (
                        <CardDescription className="mt-2">
                          {entry.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge>{domainConfig.name}</Badge>
                  </div>
                </CardHeader>
                
                {content.link.show_metadata && entry.metadata && (
                  <CardContent>
                    <Separator className="mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(entry.metadata).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="text-sm font-medium text-muted-foreground">
                            {formatFieldName(key)}
                          </div>
                          <div className="text-sm">
                            {formatFieldValue(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {entry.createdAt && (
                      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                        Created: {format(new Date(entry.createdAt), 'PPpp')}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  Shared securely via LifeHub
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This content was shared on {format(new Date(content.link.created_at), 'PPP')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return null
}

/**
 * Format field name for display
 */
function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Format field value for display
 */
function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return '—'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'number') {
    return value.toLocaleString()
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

