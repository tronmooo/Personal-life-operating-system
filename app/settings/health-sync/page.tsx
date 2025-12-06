'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function HealthSyncSettingsPage() {
  const supabase = createClientComponentClient()
  const [userId, setUserId] = useState<string>('')
  const [lastSync, setLastSync] = useState<string>('Never')
  const [rowsIngested, setRowsIngested] = useState<number>(0)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        // Check if connected
        const { data: conn } = await supabase.from('health_connections').select('*').eq('user_id', user.id).eq('provider', 'google_fit').single()
        if (conn) setConnected(true)
      }
      const { data } = await supabase.from('health_sync_log').select('*').order('started_at', { ascending: false }).limit(1).single()
      if (data) {
        setLastSync(new Date(data.started_at).toLocaleString())
        setRowsIngested(data.rows_ingested || 0)
      }
    }
    init()
  }, [supabase])

  const connectGoogle = async () => {
    setConnecting(true)
    const url = new URL('/api/health-sync/google/authorize', window.location.origin)
    // Include userId as state for server callback upsert convenience
    url.searchParams.set('stateUserId', userId)
    window.location.href = url.toString()
  }

  const manualSync = async () => {
    const res = await fetch('/api/health-sync/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) {
      setLastSync(new Date().toLocaleString())
      // Reload sync log
      const { data } = await supabase.from('health_sync_log').select('*').order('started_at', { ascending: false }).limit(1).single()
      if (data) {
        setLastSync(new Date(data.started_at).toLocaleString())
        setRowsIngested(data.rows_ingested || 0)
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Health & Fitness Sync</h1>
      <Card>
        <CardHeader>
          <CardTitle>Google Fit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <div className="text-sm font-medium">{connected ? 'Connected' : 'Not Connected'}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            Last synced: {lastSync}
            {rowsIngested > 0 && ` (${rowsIngested} items)`}
          </div>
          <div className="flex gap-2">
            {!connected ? (
              <Button onClick={connectGoogle} disabled={!userId || connecting}>Connect Google Fit</Button>
            ) : (
              <Button variant="outline" onClick={manualSync} disabled={!userId}>Manual Sync</Button>
            )}
          </div>
          
          {connected && (
            <div className="border-t pt-3 space-y-2">
              <div className="text-sm font-medium">Synced Metrics:</div>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>✓ Steps</div>
                <div>✓ Weight</div>
                <div>✓ Sleep</div>
                <div>✓ Workouts</div>
                <div>✓ Heart Rate</div>
                <div>✓ Blood Pressure</div>
                <div>✓ Active Calories</div>
              </div>
              <div className="text-xs text-muted-foreground pt-2">
                Data syncs automatically every hour and is stored in your Fitness and Health domains.
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground border-t pt-3">
            Apple Health requires a native wrapper (Capacitor/React Native). Coming soon.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


