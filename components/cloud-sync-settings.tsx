'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Cloud, CloudOff, RefreshCw, Download, Upload, 
  CheckCircle2, XCircle, AlertCircle, Loader2,
  Database, Shield, Zap
} from 'lucide-react'
import { useSupabaseSync } from '@/lib/providers/supabase-sync-provider'

export function CloudSyncSettings() {
  const { 
    isEnabled, 
    isSyncing, 
    lastSyncTime, 
    syncStatus,
    enableSync,
    disableSync,
    syncNow,
    downloadFromCloud
  } = useSupabaseSync()

  const [autoSync, setAutoSync] = useState(true)
  const [syncInterval, setSyncInterval] = useState(5) // minutes

  const getStatusIcon = () => {
    if (isSyncing) return <Loader2 className="h-4 w-4 animate-spin" />
    if (!isEnabled) return <CloudOff className="h-4 w-4 text-muted-foreground" />
    
    switch (syncStatus) {
      case 'synced':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <Cloud className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = () => {
    if (!isEnabled) return 'Disabled'
    if (isSyncing) return 'Syncing...'
    
    switch (syncStatus) {
      case 'synced':
        return 'Synced'
      case 'error':
        return 'Error'
      case 'syncing':
        return 'Syncing...'
      default:
        return 'Ready'
    }
  }

  const getStatusColor = () => {
    if (!isEnabled) return 'bg-gray-100 text-gray-700'
    if (isSyncing) return 'bg-blue-100 text-blue-700'
    
    switch (syncStatus) {
      case 'synced':
        return 'bg-green-100 text-green-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const handleEnableSync = async () => {
    try {
      await enableSync()
      alert('Cloud sync enabled! Your data will now be backed up to Supabase.')
    } catch (error) {
      alert('Failed to enable cloud sync. Please check your Supabase credentials.')
    }
  }

  const handleDisableSync = () => {
    if (confirm('Are you sure you want to disable cloud sync? Your local data will remain safe.')) {
      disableSync()
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Cloud Sync
              </CardTitle>
              <CardDescription>
                Backup and sync your data across devices
              </CardDescription>
            </div>
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-2">{getStatusText()}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEnabled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cloud sync is currently disabled. Enable it to backup your data to Supabase and access it from any device.
              </AlertDescription>
            </Alert>
          )}

          {isEnabled && lastSyncTime && (
            <div className="text-sm text-muted-foreground">
              Last synced: {new Date(lastSyncTime).toLocaleString()}
            </div>
          )}

          <div className="flex gap-2">
            {!isEnabled ? (
              <Button onClick={handleEnableSync} className="flex-1">
                <Cloud className="h-4 w-4 mr-2" />
                Enable Cloud Sync
              </Button>
            ) : (
              <>
                <Button 
                  onClick={syncNow} 
                  disabled={isSyncing}
                  variant="outline"
                  className="flex-1"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleDisableSync}
                  variant="outline"
                >
                  <CloudOff className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      {isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Settings</CardTitle>
            <CardDescription>Configure how your data syncs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-sync</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically sync changes
                </div>
              </div>
              <Switch
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>

            {autoSync && (
              <div className="space-y-2">
                <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                <Input
                  id="sync-interval"
                  type="number"
                  min="1"
                  max="60"
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(parseInt(e.target.value) || 5)}
                />
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              <Label>Manual Operations</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={downloadFromCloud} 
                  variant="outline"
                  size="sm"
                  disabled={isSyncing}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download from Cloud
                </Button>
                <p className="text-sm text-muted-foreground">
                  Note: Upload happens automatically when you create/update data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Cloud Sync Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <div className="font-medium">Automatic Backup</div>
                <div className="text-sm text-muted-foreground">
                  Your data is automatically backed up to Supabase
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">Encrypted & Secure</div>
                <div className="text-sm text-muted-foreground">
                  All data is encrypted in transit and at rest
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <div className="font-medium">Multi-Device Sync</div>
                <div className="text-sm text-muted-foreground">
                  Access your data from any device
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {!isEnabled && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">Setup Cloud Sync:</div>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Create a free account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                <li>Create a new project</li>
                <li>Copy your Project URL and Anon Key from Settings → API</li>
                <li>Add them to your <code className="bg-muted px-1 rounded">.env.local</code> file</li>
                <li>Run the SQL script from <code className="bg-muted px-1 rounded">supabase-cloud-sync-table.sql</code></li>
                <li>Restart the app and click "Enable Cloud Sync"</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
































