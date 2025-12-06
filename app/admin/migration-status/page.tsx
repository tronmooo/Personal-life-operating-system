'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMigrationLogs } from '@/lib/utils/migration-logger'
import { Download, RefreshCw, Database, HardDrive, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'

/**
 * Migration Status Dashboard
 * 
 * Admin page to monitor localStorage → Supabase/IndexedDB migrations
 * Accessible at /admin/migration-status
 */
export default function MigrationStatusPage() {
  const { logs, stats, failed } = useMigrationLogs()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      window.location.reload()
    }, 500)
  }

  const handleExport = () => {
    const data = {
      logs,
      stats,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `migration-logs-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">localStorage Migration Status</h1>
          <p className="text-muted-foreground mt-2">
            Monitor migration progress from localStorage to Supabase and IndexedDB
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Migrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.successRate}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.byAction.error}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Skipped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.byAction.skip}</div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Routines (Supabase)
            </CardTitle>
            <CardDescription>User routines migrated to database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-500">{stats.byType.routines}</div>
            <p className="text-sm text-muted-foreground mt-2">migrations logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-purple-500" />
              AI Tools (IndexedDB)
            </CardTitle>
            <CardDescription>AI results cached locally</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-500">{stats.byType['ai-tools']}</div>
            <p className="text-sm text-muted-foreground mt-2">migrations logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Other
            </CardTitle>
            <CardDescription>Other migration types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-500">{stats.byType.other}</div>
            <p className="text-sm text-muted-foreground mt-2">migrations logged</p>
          </CardContent>
        </Card>
      </div>

      {/* Failed Migrations */}
      {failed.length > 0 && (
        <Card className="border-red-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <XCircle className="h-5 w-5" />
              Failed Migrations ({failed.length})
            </CardTitle>
            <CardDescription>Migrations that encountered errors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failed.map((log, index) => (
                <div key={index} className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="destructive" className="mb-2">{log.type}</Badge>
                      <p className="text-sm text-red-500 font-medium">{log.error}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Migration Logs</CardTitle>
          <CardDescription>Last {Math.min(logs.length, 20)} migration events</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No migration logs yet</p>
              <p className="text-sm mt-2">Logs will appear as users migrate their data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.slice(-20).reverse().map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {log.action === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {log.action === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                    {log.action === 'start' && <RefreshCw className="h-4 w-4 text-blue-500" />}
                    {log.action === 'skip' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.type}</Badge>
                        <span className="text-sm font-medium capitalize">{log.action}</span>
                        {log.itemCount && (
                          <span className="text-xs text-muted-foreground">
                            ({log.itemCount} items)
                          </span>
                        )}
                      </div>
                      {log.error && (
                        <p className="text-xs text-red-500 mt-1">{log.error}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Badge */}
      <Card className="bg-green-500/10 border-green-500/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <p className="font-semibold text-green-500">Migration System Active</p>
              <p className="text-sm text-muted-foreground">
                All migrations are running automatically for users with legacy data
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}























