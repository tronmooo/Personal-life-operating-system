'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/lib/providers/data-provider'
import { createClient } from '@supabase/supabase-js'
import { Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import type { Domain } from '@/types/domains'

export default function SyncDataPage() {
  const { getData, addData } = useData()
  const [syncing, setSyncing] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`])
    console.log(message)
  }

  const syncVehicles = async () => {
    try {
      addLog('🚗 Starting vehicle sync...')
      
      // Get all vehicles from legacy table
      const { data: legacyVehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active')
      
      if (error) {
        addLog(`❌ Error fetching vehicles: ${error.message}`)
        return
      }
      
      addLog(`Found ${legacyVehicles?.length || 0} vehicles in legacy table`)
      
      // Get existing vehicles from domains
      const existingVehicles = getData('vehicles')
      const existingIds = new Set(
        existingVehicles
          .filter((v: any) => v.metadata?.supabaseId)
          .map((v: any) => v.metadata.supabaseId)
      )
      
      addLog(`Found ${existingVehicles.length} vehicles in domains table`)
      
      // Sync each vehicle
      let synced = 0
      for (const vehicle of legacyVehicles || []) {
        if (existingIds.has(vehicle.id)) {
          addLog(`⏭️  Skipping ${vehicle.vehicleName} (already synced)`)
          continue
        }
        
        await addData('vehicles', {
          title: vehicle.vehicleName,
          description: `${vehicle.make} ${vehicle.model} - ${vehicle.currentMileage || 0} miles`,
          metadata: {
            type: 'vehicle',
            source: 'vehicle-tracker',
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            vin: vehicle.vin,
            mileage: vehicle.currentMileage || 0,
            value: vehicle.estimatedValue || 0,
            estimatedValue: vehicle.estimatedValue || 0,
            purchasePrice: vehicle.purchasePrice || 0,
            purchaseDate: vehicle.purchaseDate,
            lifeExpectancy: vehicle.lifeExpectancy || 15,
            monthlyInsurance: vehicle.monthlyInsurance || 0,
            supabaseId: vehicle.id
          }
        })
        
        synced++
        addLog(`✅ Synced ${vehicle.vehicleName}`)
      }
      
      addLog(`🎉 Vehicle sync complete! Synced ${synced} vehicles`)
      
    } catch (error: any) {
      addLog(`❌ Sync failed: ${error.message}`)
    }
  }

  const analyzeDomains = async () => {
    try {
      addLog('📊 Analyzing domains...')
      
      const domains: Domain[] = ['health', 'vehicles', 'home', 'miscellaneous', 'fitness', 'nutrition']
      
      for (const domain of domains) {
        const data = getData(domain)
        addLog(`${domain}: ${data.length} items`)
        
        if (data.length > 0) {
          const sample = data[0]
          addLog(`  Sample: ${sample.title || 'Untitled'} - ${JSON.stringify(sample.metadata || {}).substring(0, 100)}`)
        }
      }
      
      addLog('✅ Analysis complete')
      
    } catch (error: any) {
      addLog(`❌ Analysis failed: ${error.message}`)
    }
  }

  const runFullSync = async () => {
    setSyncing(true)
    setLogs([])
    
    addLog('🚀 Starting full database sync...')
    
    await syncVehicles()
    await analyzeDomains()
    
    addLog('✨ Full sync complete!')
    setSyncing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-6 h-6" />
              Admin: Data Sync Utility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This utility syncs data from legacy tables to the new domains table used by DataProvider.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={runFullSync}
                disabled={syncing}
                className="flex items-center gap-2"
              >
                {syncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                Run Full Sync
              </Button>
              
              <Button
                onClick={syncVehicles}
                disabled={syncing}
                variant="outline"
              >
                Sync Vehicles Only
              </Button>
              
              <Button
                onClick={analyzeDomains}
                disabled={syncing}
                variant="outline"
              >
                Analyze Domains
              </Button>
            </div>
          </CardContent>
        </Card>

        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sync Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    {log.includes('✅') && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    {log.includes('❌') && <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />}
                    <span className="flex-1">{log}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

