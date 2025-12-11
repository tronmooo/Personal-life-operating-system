'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Droplet, Trash2 } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface WaterEntry {
  id: string
  amount: number
  time: string
}

export function WaterView() {
  const { getData, addData, deleteData } = useData()
  const [customAmount, setCustomAmount] = useState('')

  // Get water data from DataProvider (Supabase-backed)
  const nutritionData = getData('nutrition')
  const healthData = getData('health')
  
  // Extract water entries from both nutrition and health domains
  const water = useMemo(() => {
    const entries: WaterEntry[] = []
    const today = new Date().toISOString().split('T')[0]
    
    // Get water from nutrition domain
    nutritionData.forEach(item => {
      // Check multiple possible field names for water type
      const isWaterEntry = item.metadata?.type === 'water' || 
                          item.metadata?.itemType === 'water' || 
                          item.metadata?.logType === 'water'
      
      // Filter for today's entries only
      const itemDate = new Date(item.createdAt).toISOString().split('T')[0]
      
      if (isWaterEntry && itemDate === today) {
        entries.push({
          id: item.id,
          amount: Number(item.metadata.water || item.metadata.value || item.metadata.amount || 0),
          time: new Date(item.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        })
      }
    })
    
    // Get water from health domain (from vitals)
    healthData.forEach(item => {
      if (item.metadata?.type === 'vitals' && item.metadata?.waterIntake && item.metadata?.date === today) {
        // Health domain stores cumulative water in vitals, so we create a single entry
        entries.push({
          id: item.id + '-water',
          amount: Number(item.metadata.waterIntake),
          time: new Date(item.updatedAt || item.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        })
      }
    })
    
    // Also check for individual water entries in health (from AI)
    healthData.forEach(item => {
      const isWaterEntry = item.metadata?.type === 'water' || 
                          item.metadata?.itemType === 'water' || 
                          item.metadata?.logType === 'water'
      
      const itemDate = new Date(item.createdAt).toISOString().split('T')[0]
      
      if (isWaterEntry && itemDate === today) {
        entries.push({
          id: item.id,
          amount: Number(item.metadata.water || item.metadata.value || item.metadata.amount || 0),
          time: new Date(item.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        })
      }
    })
    
    // Sort by most recent first
    return entries.sort((a, b) => b.time.localeCompare(a.time))
  }, [nutritionData, healthData])

  const addWater = (amount: number) => {
    // Save to nutrition domain (can also save to health if preferred)
    addData('nutrition', {
      title: `${amount} oz water`,
      description: `Water intake: ${amount} oz`,
      metadata: {
        type: 'water',
        value: amount,
        unit: 'oz'
      }
    })
  }

  const deleteWater = (id: string) => {
    if (confirm('Delete this entry?')) {
      // Determine which domain the entry is from
      const nutritionEntry = nutritionData.find(item => item.id === id)
      const healthEntry = healthData.find(item => item.id === id || item.id + '-water' === id)
      
      if (nutritionEntry) {
        deleteData('nutrition', id)
      } else if (healthEntry) {
        deleteData('health', healthEntry.id)
      }
    }
  }

  const handleCustomAdd = () => {
    // Only accept pure numeric input (prevent string parsing)
    const numericRegex = /^-?\d*\.?\d+$/
    if (!numericRegex.test(customAmount.trim())) {
      alert('Please enter a valid number only (no letters or special characters)')
      return
    }

    const amount = parseFloat(customAmount)
    
    // Validate positive values only
    if (amount <= 0) {
      alert('Please enter a positive amount')
      return
    }
    
    // Validate realistic water intake (max 200 oz per entry)
    if (amount > 200) {
      alert('Please enter a realistic amount (maximum 200 oz per entry)')
      return
    }
    
    addWater(amount)
    setCustomAmount('')
  }

  const totalWater = water.reduce((sum, w) => sum + w.amount, 0)
  const waterGoal = 64

  return (
    <div className="space-y-6">
      {/* Water Progress Card */}
      <Card className="p-12 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
        <div className="text-center">
          <Droplet className="h-20 w-20 mx-auto mb-4" />
          <h2 className="text-6xl font-bold mb-2">{totalWater} oz</h2>
          <p className="text-2xl text-blue-100 mb-6">of {waterGoal} oz daily goal</p>
          <div className="h-3 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${Math.min((totalWater / waterGoal) * 100, 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Quick Add */}
      <Card className="p-8 bg-white/80 dark:bg-slate-800/80">
        <h3 className="text-2xl font-bold mb-6">Quick Add Water</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Button
            onClick={() => addWater(8)}
            className="h-20 bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-2xl font-bold"
          >
            8 oz
          </Button>
          <Button
            onClick={() => addWater(16)}
            className="h-20 bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-2xl font-bold"
          >
            16 oz
          </Button>
          <Button
            onClick={() => addWater(24)}
            className="h-20 bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-2xl font-bold"
          >
            24 oz
          </Button>
        </div>

        <div className="flex gap-4">
          <Input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Custom amount (oz)"
            className="flex-1 h-14 text-lg"
          />
          <Button
            onClick={handleCustomAdd}
            className="h-14 px-8 bg-blue-600 text-white text-lg font-semibold"
          >
            Add
          </Button>
        </div>
      </Card>

      {/* Today's Log */}
      <Card className="p-8 bg-white/80 dark:bg-slate-800/80">
        <h3 className="text-2xl font-bold mb-6">Today's Log</h3>

        {water.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No water logged yet today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {water.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Droplet className="h-6 w-6 text-blue-600" />
                  <span className="text-xl font-bold">{entry.amount} oz</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">Entry {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteWater(entry.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

