export const dynamic = 'force-dynamic'
'use client'

import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

export default function DebugPage() {
  const { data } = useData()
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [cleared, setCleared] = useState<string[]>([])

  const checkData = () => {
    console.log('=== DATA CHECK ===')
    console.log('DataProvider data:', data)
  }

  const clearDomainEntries = useCallback(async (domain: string) => {
    const { error } = await supabase
      .from('domain_entries')
      .delete()
      .eq('domain', domain)

    if (error) {
      throw new Error(error.message)
    }
  }, [supabase])

  const clearCollectibles = async () => {
    try {
      await clearDomainEntries('collectibles')
      setCleared(prev => [...prev, 'collectibles'])
      window.location.reload()
    } catch (e) {
      console.error('Failed to clear collectibles:', e)
      alert('Failed to clear collectibles')
    }
  }

  const clearAllDomains = async () => {
    try {
      const { error } = await supabase
        .from('domain_entries')
        .delete()
        .neq('domain', '')

      if (error) {
        throw new Error(error.message)
      }

      setCleared(['all'])
      window.location.reload()
    } catch (e) {
      console.error('Failed to clear all domains:', e)
      alert('Failed to clear all domain data')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Debug & Data Management</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Check Current Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click to log all data to browser console (F12)
            </p>
            <Button onClick={checkData}>Check Data in Console</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clear Collectibles Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Remove all collectibles data from localStorage and unified data
            </p>
            <Button variant="destructive" onClick={clearCollectibles}>
              Clear Collectibles
            </Button>
            {cleared.includes('collectibles') && (
              <p className="text-sm text-green-600 mt-2">✓ Cleared!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">⚠️ Clear All Domain Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Warning:</strong> This will delete ALL domain data from localStorage (health, vehicles, etc.)
            </p>
            <Button variant="destructive" onClick={clearAllDomains}>
              Clear ALL Domain Data
            </Button>
            {cleared.includes('all') && (
              <p className="text-sm text-green-600 mt-2">✓ All data cleared!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Counts (from DataProvider)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(data).map(([domain, items]) => (
                <div key={domain} className="p-3 border rounded">
                  <div className="font-semibold capitalize">{domain}</div>
                  <div className="text-2xl text-blue-600">{items?.length || 0}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
