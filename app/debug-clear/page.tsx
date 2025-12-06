'use client'

export const dynamic = 'force-dynamic'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trash2, RefreshCw } from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'

export default function DebugClearPage() {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [cleared, setCleared] = useState<string[]>([])

  const clearAllCloudData = async () => {
    try {
      const { error } = await supabase
        .from('domain_entries')
        .delete()
        .neq('domain', '')

      if (error) {
        throw new Error(error.message)
      }

      setCleared(['all'])
      alert('✅ All LifeHub domain data cleared in Supabase!')
    } catch (e) {
      console.error('Clear failed', e)
      alert('Failed to clear data')
    }
  }

  const clearSpecificDomain = async (domain: string) => {
    try {
      const { error } = await supabase
        .from('domain_entries')
        .delete()
        .eq('domain', domain)

      if (error) {
        throw new Error(error.message)
      }

      setCleared(prev => [...prev, `${domain} domain`])
      alert(`✅ Cleared ${domain} domain in Supabase!`)
    } catch (e) {
      console.error('Failed to clear', domain, e)
      alert(`Failed to clear ${domain}`)
    }
  }

  const viewCurrentData = async () => {
    const { data, error } = await supabase
      .from('domain_entries_view')
      .select('*')
      .order('domain', { ascending: true })

    if (error) {
      console.error('Failed to load domain entries:', error)
      alert('Failed to load domain data')
      return
    }

    console.log('📊 Current Data (Supabase):', data)
    alert('Check console for current data (Supabase)')
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🔧 Debug & Clear Data</h1>
      
      <Card className="p-6 mb-6 bg-red-50 border-red-200">
        <h2 className="text-xl font-bold text-red-900 mb-4">⚠️ Nuclear Option</h2>
        <p className="text-sm text-red-700 mb-4">
          This will clear ALL LifeHub data from Supabase for the selected scope. Use only when you want a completely fresh cloud state.
        </p>
        <Button 
          onClick={clearAllCloudData}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All Cloud Data
        </Button>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Clear Individual Domains</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['collectibles', 'miscellaneous', 'home', 'vehicles', 'nutrition', 'health', 'mindfulness'].map(domain => (
            <Button
              key={domain}
              onClick={() => clearSpecificDomain(domain)}
              variant="outline"
              className="capitalize"
            >
              Clear {domain}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">View Current Data</h2>
        <Button onClick={viewCurrentData} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          View Data in Console
        </Button>
      </Card>

      {cleared.length > 0 && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="font-bold text-green-900 mb-2">✅ Cleared:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            {cleared.map((key, i) => (
              <li key={i}>• {key}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-900 mb-2">🔍 How to Fix Phantom Data:</h3>
        <ol className="text-sm text-blue-700 space-y-2">
          <li>1. Click "Clear All Cloud Data" above</li>
          <li>2. (Optional) Double-check the Supabase dashboard for the affected tables</li>
          <li>3. Refresh this page</li>
          <li>4. Go back to Command Center and add fresh data</li>
        </ol>
      </div>
    </div>
  )
}
