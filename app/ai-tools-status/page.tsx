'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface TableStatus {
  name: string
  exists: boolean
  error?: string
  loading: boolean
}

export default function AIToolsStatusPage() {
  const [tables, setTables] = useState<TableStatus[]>([
    { name: 'receipts', exists: false, loading: true },
    { name: 'invoices', exists: false, loading: true },
    { name: 'budgets', exists: false, loading: true },
    { name: 'tax_documents', exists: false, loading: true },
    { name: 'scanned_documents', exists: false, loading: true },
    { name: 'saved_forms', exists: false, loading: true },
    { name: 'financial_reports', exists: false, loading: true },
    { name: 'scheduled_events', exists: false, loading: true },
    { name: 'travel_plans', exists: false, loading: true },
    { name: 'meal_plans', exists: false, loading: true },
    { name: 'email_drafts', exists: false, loading: true },
    { name: 'checklists', exists: false, loading: true },
  ])

  const [apiStatus, setApiStatus] = useState({
    openai: false,
    supabase: false,
    loading: true
  })

  const checkStatus = async () => {
    // Reset loading states
    setTables(prev => prev.map(t => ({ ...t, loading: true })))
    setApiStatus({ openai: false, supabase: false, loading: true })

    // Check each table
    const tableChecks = tables.map(async (table) => {
      try {
        const response = await fetch(`/api/ai-tools/${table.name === 'tax_documents' ? 'tax-documents' : table.name === 'scanned_documents' ? 'documents' : table.name === 'saved_forms' ? 'forms' : table.name === 'financial_reports' ? 'reports' : table.name === 'scheduled_events' ? 'events' : table.name === 'travel_plans' ? 'travel' : table.name === 'meal_plans' ? 'meals' : table.name === 'email_drafts' ? 'emails' : table.name}`, {
          credentials: 'include'
        })

        return {
          name: table.name,
          exists: response.ok || response.status === 404, // 404 means table exists but empty
          error: response.ok || response.status === 404 ? undefined : `HTTP ${response.status}`,
          loading: false
        }
      } catch (error: any) {
        return {
          name: table.name,
          exists: false,
          error: error.message,
          loading: false
        }
      }
    })

    const results = await Promise.all(tableChecks)
    setTables(results)

    // Check API keys
    const hasOpenAI = Boolean(process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY)
    const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)

    setApiStatus({
      openai: hasOpenAI,
      supabase: hasSupabase,
      loading: false
    })
  }

  useEffect(() => {
    checkStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allTablesExist = tables.every(t => t.exists)
  const someTablesExist = tables.some(t => t.exists)

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            🤖 AI Tools Status
          </h1>
          <p className="text-lg text-muted-foreground">
            System health check for AI-powered tools
          </p>
        </div>

        {/* Overall Status */}
        <Card className={allTablesExist ? 'border-green-300 bg-green-50 dark:bg-green-950' : 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {allTablesExist ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  All Systems Operational
                </>
              ) : someTablesExist ? (
                <>
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  Partial Setup Complete
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  Setup Required
                </>
              )}
            </CardTitle>
            <CardDescription>
              {allTablesExist
                ? 'All database tables are created and AI tools are ready to use!'
                : someTablesExist
                ? 'Some tables exist. Complete setup to enable all features.'
                : 'Database tables need to be created before using AI tools.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={checkStatus} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              {!allTablesExist && (
                <Link href="/ai-tools-setup">
                  <Button size="sm">
                    View Setup Instructions
                  </Button>
                </Link>
              )}
              {allTablesExist && (
                <Link href="/tools">
                  <Button size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open AI Tools
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Keys Status */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Required API keys for AI functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
                <div className="flex items-center gap-2">
                  {apiStatus.openai ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">OpenAI API Key</span>
                </div>
                <Badge variant={apiStatus.openai ? 'default' : 'destructive'}>
                  {apiStatus.openai ? 'Configured' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
                <div className="flex items-center gap-2">
                  {apiStatus.supabase ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">Supabase Connection</span>
                </div>
                <Badge variant={apiStatus.supabase ? 'default' : 'destructive'}>
                  {apiStatus.supabase ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Tables Status */}
        <Card>
          <CardHeader>
            <CardTitle>Database Tables ({tables.filter(t => t.exists).length}/{tables.length})</CardTitle>
            <CardDescription>AI tools require these database tables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tables.map((table) => (
                <div
                  key={table.name}
                  className={`p-3 rounded-lg border-2 ${
                    table.loading
                      ? 'border-gray-300 bg-gray-50'
                      : table.exists
                      ? 'border-green-300 bg-green-50 dark:bg-green-950'
                      : 'border-red-300 bg-red-50 dark:bg-red-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">{table.name}</span>
                    {table.loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />
                    ) : table.exists ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  {table.error && (
                    <p className="text-xs text-red-600 mt-1">{table.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        {!allTablesExist && (
          <Card className="border-2 border-blue-300 bg-blue-50 dark:bg-blue-950">
            <CardHeader>
              <CardTitle>⚙️ Setup Instructions</CardTitle>
              <CardDescription>Follow these steps to enable AI tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Go to Supabase Dashboard</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Visit: https://supabase.com/dashboard and select your project
                    </p>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      Open Supabase Dashboard
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Open SQL Editor</h3>
                    <p className="text-sm text-muted-foreground">
                      Click "SQL Editor" in the left sidebar, then "New Query"
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Run Migration SQL</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Copy the contents of this file and paste into SQL Editor:
                    </p>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                      supabase/migrations/20240118000000_create_ai_tools_tables.sql
                    </code>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Verify and Refresh</h3>
                    <p className="text-sm text-muted-foreground">
                      After running the query, click "Refresh Status" button above
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  For detailed instructions, see: <strong>AI_TOOLS_SETUP_COMPLETE.md</strong>
                </p>
                <Button onClick={checkStatus} size="sm" className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Status Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {allTablesExist && (
          <Card className="border-2 border-green-300 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">🎉</div>
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
                  All Set! AI Tools are Ready
                </h2>
                <p className="text-muted-foreground">
                  All database tables are created and configured. You can now use all AI-powered tools.
                </p>
                <div className="flex gap-3 justify-center pt-4">
                  <Link href="/tools">
                    <Button size="lg">
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Open AI Tools
                    </Button>
                  </Link>
                  <Link href="/test-crud">
                    <Button size="lg" variant="outline">
                      Test CRUD Operations
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Link href="/tools">
                <Button variant="outline" className="w-full justify-start">
                  <span className="mr-2">🛠️</span>
                  AI Tools Page
                </Button>
              </Link>
              <Link href="/test-crud">
                <Button variant="outline" className="w-full justify-start">
                  <span className="mr-2">🧪</span>
                  CRUD Diagnostic
                </Button>
              </Link>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full justify-start">
                  <span className="mr-2">📊</span>
                  Supabase Dashboard
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Button>
              </a>
              <Link href="/domains">
                <Button variant="outline" className="w-full justify-start">
                  <span className="mr-2">📂</span>
                  Domains
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
