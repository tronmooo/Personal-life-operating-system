'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { normalizeMetadata, isEntryType } from '@/lib/utils/normalize-metadata'

interface VitalEntry {
  date: string
  bloodPressure?: { systolic: number; diastolic: number }
  heartRate?: number
  weight?: number
  glucose?: number
}

export function VitalsTab() {
  const { getData, addData, deleteData, reloadDomain } = useData()

  // Get vitals from DataProvider
  const healthData = getData('health')
  console.log('🏥 [VitalsTab] Got', healthData.length, 'health entries from DataProvider')
  console.log('🏥 [VitalsTab] All health items:', healthData.map(i => ({ id: i.id, title: i.title, metadata: i.metadata })))

  // Filter vitals entries (handles both nested and flat metadata)
  // Check for recordType, type, or itemType fields
  const vitalsEntries = healthData.filter(item => {
    const meta = normalizeMetadata(item)
    const recordType = (meta.recordType || '').toLowerCase()
    const type = (meta.type || '').toLowerCase()
    const itemType = (meta.itemType || '').toLowerCase()
    const measurementType = (meta.measurement_type || '').toLowerCase()
    
    // Include if it's a vitals or weight entry, or has vital sign data
    const isVitalsType = ['vitals', 'weight', 'vital', 'vitalsigns', 'blood_pressure', 'lab'].some(t => 
      recordType.includes(t) || type.includes(t) || itemType.includes(t) || measurementType.includes(t)
    )
    
    // Also include if it has any vital sign data fields
    const hasVitalData = Boolean(
      meta.bloodPressure || meta.systolic || meta.diastolic || 
      meta.heartRate || meta.hr || meta.bpm ||
      meta.weight || meta.value ||
      meta.glucose || meta.bloodGlucose
    )
    
    const shouldInclude = isVitalsType || hasVitalData
    console.log(`🏥 [VitalsTab] Checking ${item.id}: type="${type}", isVitalsType=${isVitalsType}, hasVitalData=${hasVitalData}, include=${shouldInclude}`)
    
    return shouldInclude
  })

  console.log('🏥 Health Data:', healthData.length, 'entries')
  console.log('🏥 Vitals entries found:', vitalsEntries.length)

  const vitals = vitalsEntries
    .map(item => {
      const meta = normalizeMetadata(item)

      // Handle blood pressure - either as object or separate fields
      let bloodPressure = meta.bloodPressure
      if (!bloodPressure && meta.systolic && meta.diastolic) {
        const systolic = typeof meta.systolic === 'string' ? parseInt(meta.systolic) : meta.systolic
        const diastolic = typeof meta.diastolic === 'string' ? parseInt(meta.diastolic) : meta.diastolic
        if (systolic && diastolic) {
          bloodPressure = { systolic, diastolic }
        }
      }

      // Handle weight - convert string to number
      let weight = meta.weight || meta.value
      if (typeof weight === 'string') {
        weight = parseFloat(weight)
      }

      // Handle glucose
      let glucose = meta.glucose
      if (typeof glucose === 'string') {
        glucose = parseFloat(glucose)
      }

      const mapped = {
        id: item.id,
        date: meta.date || item.createdAt.split('T')[0],
        bloodPressure,
        heartRate: meta.heartRate,
        weight,
        glucose
      }

      return mapped
    })
    .filter(v => v.bloodPressure || v.heartRate || v.weight || v.glucose)  // Only include entries with actual data
    .sort((a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())

  console.log('📊 Final vitals array:', vitals.length, 'vitals')
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<Partial<VitalEntry>>({
    date: new Date().toISOString().split('T')[0]
  })

  // Sleep tracking state
  const [showSleepForm, setShowSleepForm] = useState(false)
  const [sleepDate, setSleepDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [sleepHours, setSleepHours] = useState<string>('8')
  const [sleepMinutes, setSleepMinutes] = useState<string>('0')
  const [sleepQuality, setSleepQuality] = useState<string>('3') // 1-5

  const handleAdd = async () => {
    const date = formData.date || new Date().toISOString().split('T')[0]
    const entriesToAdd = []
    
    // Create separate entries for each metric with proper logType
    if (formData.bloodPressure && (formData.bloodPressure.systolic > 0 || formData.bloodPressure.diastolic > 0)) {
      entriesToAdd.push({
        title: `Blood Pressure: ${formData.bloodPressure.systolic}/${formData.bloodPressure.diastolic}`,
        description: `BP reading for ${date}`,
        metadata: {
          logType: 'blood_pressure',
          systolic: formData.bloodPressure.systolic,
          diastolic: formData.bloodPressure.diastolic,
          date
        }
      })
    }
    
    if (formData.heartRate && formData.heartRate > 0) {
      entriesToAdd.push({
        title: `Heart Rate: ${formData.heartRate} bpm`,
        description: `HR reading for ${date}`,
        metadata: {
          logType: 'heart_rate',
          heartRate: formData.heartRate,
          bpm: formData.heartRate,
          date
        }
      })
    }
    
    if (formData.weight && formData.weight > 0) {
      entriesToAdd.push({
        title: `Weight: ${formData.weight} lbs`,
        description: `Weight check for ${date}`,
        metadata: {
          logType: 'weight',
          weight: formData.weight,
          date
        }
      })
    }
    
    if (formData.glucose && formData.glucose > 0) {
      entriesToAdd.push({
        title: `Blood Sugar: ${formData.glucose} mg/dL`,
        description: `Glucose reading for ${date}`,
        metadata: {
          logType: 'glucose',
          glucose: formData.glucose,
          date
        }
      })
    }
    
    // Add all entries to DataProvider (auto-syncs to Supabase)
    for (const entry of entriesToAdd) {
      await addData('health', entry)
    }
    
    setFormData({ date: new Date().toISOString().split('T')[0] })
    setShowAddForm(false)
    try { 
      await reloadDomain('health' as any) 
    } catch (error) {
      console.error('Failed to reload health domain after adding vitals:', error)
      // Data was saved, reload failure is non-critical
    }
  }

  const handleAddSleep = async () => {
    const hours = parseInt(sleepHours || '0', 10)
    const minutes = parseInt(sleepMinutes || '0', 10)
    const totalMinutes = Math.max(0, hours * 60 + minutes)
    const quality = Math.min(5, Math.max(1, parseInt(sleepQuality || '3', 10)))

    await addData('health', {
      title: `Sleep ${hours}h ${minutes}m`,
      description: `Sleep for ${sleepDate}`,
      metadata: {
        type: 'sleep',
        date: sleepDate,
        durationMinutes: totalMinutes,
        quality,
      }
    })

    setSleepDate(new Date().toISOString().split('T')[0])
    setSleepHours('8')
    setSleepMinutes('0')
    setSleepQuality('3')
    setShowSleepForm(false)
    try {
      await reloadDomain('health' as any)
    } catch (e) {
      console.error('Failed to reload health domain after adding sleep:', e)
    }
  }

  // Derive recent sleep logs
  const sleepEntries = (healthData || [])
    .filter((item: any) => {
      const m = normalizeMetadata(item) as any
      return (m.type || '').toLowerCase() === 'sleep'
    })
    .map((item: any) => {
      const m = normalizeMetadata(item) as any
      const minutes: number = parseInt(String(m.durationMinutes || 0), 10) || 0
      return {
        id: item.id,
        date: (m.date as string) || item.createdAt.split('T')[0],
        minutes,
        quality: parseInt(String(m.quality || 0), 10) || 0,
      }
    })
    .sort((a: any, b: any) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vitals entry?')) {
      console.log('❌ Delete cancelled by user')
      return
    }
    
    console.log('🗑️ [VitalsTab] Starting delete for ID:', id)
    
    try {
      console.log('🗑️ [VitalsTab] Calling deleteData...')
      await deleteData('health', id)
      console.log('✅ [VitalsTab] deleteData completed successfully')
      
      console.log('🔄 [VitalsTab] Reloading health domain...')
      await reloadDomain('health' as any)
      console.log('✅ [VitalsTab] Domain reloaded successfully')
    } catch (error) {
      console.error('❌ [VitalsTab] Error during delete:', error)
      alert(`Failed to delete entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Recent Vitals</h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sleep</h2>
        <Button
          onClick={() => setShowSleepForm(!showSleepForm)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Sleep
        </Button>
      </div>

      {showSleepForm && (
        <Card className="bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={sleepDate} onChange={(e) => setSleepDate(e.target.value)} />
              </div>
              <div>
                <Label>Hours</Label>
                <Input type="number" min="0" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} />
              </div>
              <div>
                <Label>Minutes</Label>
                <Input type="number" min="0" max="59" value={sleepMinutes} onChange={(e) => setSleepMinutes(e.target.value)} />
              </div>
              <div>
                <Label>Quality (1-5)</Label>
                <Input type="number" min="1" max="5" value={sleepQuality} onChange={(e) => setSleepQuality(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddSleep} className="bg-purple-600 hover:bg-purple-700">Save</Button>
              <Button variant="outline" onClick={() => setShowSleepForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddForm && (
        <Card className="bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Add Vital Signs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Blood Pressure (Systolic/Diastolic)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="120"
                    min="0"
                    value={formData.bloodPressure?.systolic || ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined
                      setFormData({
                        ...formData,
                        bloodPressure: val ? {
                          systolic: val,
                          diastolic: formData.bloodPressure?.diastolic || 0
                        } : undefined
                      })
                    }}
                  />
                  <span className="flex items-center">/</span>
                  <Input
                    type="number"
                    placeholder="80"
                    min="0"
                    value={formData.bloodPressure?.diastolic || ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined
                      setFormData({
                        ...formData,
                        bloodPressure: val ? {
                          systolic: formData.bloodPressure?.systolic || 0,
                          diastolic: val
                        } : undefined
                      })
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Heart Rate (bpm)</Label>
                <Input
                  type="number"
                  placeholder="72"
                  min="0"
                  value={formData.heartRate || ''}
                  onChange={(e) => setFormData({ ...formData, heartRate: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label>Weight (lbs)</Label>
                <Input
                  type="number"
                  placeholder="165"
                  min="0"
                  step="0.1"
                  value={formData.weight || ''}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label>Glucose (mg/dL)</Label>
                <Input
                  type="number"
                  placeholder="95"
                  value={formData.glucose || ''}
                  onChange={(e) => setFormData({ ...formData, glucose: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
                Add Entry
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vitals Table */}
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          {vitals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No vitals recorded yet. Add your first entry!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">DATE</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">BLOOD PRESSURE</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">HEART RATE</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">WEIGHT</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">GLUCOSE</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400"></th>
                  </tr>
                </thead>
                <tbody>
                  {vitals.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">{String(entry.date)}</td>
                      <td className="p-3">
                        {entry.bloodPressure && typeof entry.bloodPressure === 'object' && 'systolic' in entry.bloodPressure && 'diastolic' in entry.bloodPressure
                          ? `${entry.bloodPressure.systolic}/${entry.bloodPressure.diastolic}`
                          : '-'}
                      </td>
                      <td className="p-3">{entry.heartRate ? `${entry.heartRate} bpm` : '-'}</td>
                      <td className="p-3">{entry.weight ? `${entry.weight} lbs` : '-'}</td>
                      <td className="p-3">{entry.glucose ? `${entry.glucose} mg/dL` : '-'}</td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sleep Table */}
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          {sleepEntries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No sleep logs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">DATE</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">DURATION</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-600 dark:text-gray-400">QUALITY</th>
                  </tr>
                </thead>
                <tbody>
                  {sleepEntries.map((entry: any) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">{String(entry.date)}</td>
                      <td className="p-3">{`${Math.floor(entry.minutes / 60)}h ${entry.minutes % 60}m`}</td>
                      <td className="p-3">{entry.quality || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

